import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { execute, queryOne, queryAll } from '../db/database';
import { generateToken, authenticate, AuthenticatedUser } from '../security/auth';
import { logAudit } from '../services/audit_service';

const router = express.Router();

// Register new student user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, student_id, department_id, course, phone } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    // Configurable college domain validation if set
    const collegeDomain = process.env.COLLEGE_EMAIL_DOMAIN;
    if (collegeDomain && !email.toLowerCase().endsWith(`@${collegeDomain.toLowerCase()}`)) {
      res.status(400).json({ error: `Registration requires a valid @${collegeDomain} institutional email address` });
      return;
    }

    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists' });
      return;
    }

    const userId = `usr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const passwordHash = await bcrypt.hash(password, 10);

    execute(
      'INSERT INTO users (id, email, password_hash, is_active, is_verified) VALUES (?, ?, ?, 1, 1)',
      [userId, email.toLowerCase(), passwordHash]
    );

    execute(
      `INSERT INTO profiles (user_id, student_id, name, department_id, course, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, student_id || `STU-${Date.now().toString().slice(-6)}`, name, department_id || 'dept-cse', course || 'B.Tech', phone || null]
    );

    // Default role: STUDENT
    execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, 'role-student']);

    logAudit(userId, 'USER_REGISTERED', 'USER', userId, { email, name });

    const token = generateToken({ id: userId, email: email.toLowerCase() });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        name,
        roles: ['STUDENT'],
        permissions: ['clubs.read', 'events.read', 'certificates.read', 'projects.read', 'resources.read']
      }
    });
  } catch (err: any) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ error: 'Internal server error during registration', details: err.message });
  }
});

// Login with Email or Roll / Staff ID
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, identifier, password } = req.body;
    const loginId = (email || identifier || '').trim().toLowerCase();

    if (!loginId || !password) {
      res.status(400).json({ error: 'Institutional Email/Roll Number and Password are required' });
      return;
    }

    // Lookup user by email OR by profiles.student_id (Roll Number / Staff ID)
    let user = queryOne<{ id: string; email: string; password_hash: string; is_active: number }>(
      'SELECT id, email, password_hash, is_active FROM users WHERE LOWER(email) = ?',
      [loginId]
    );

    if (!user) {
      // Try matching profile student_id / staff ID
      const userFromProfile = queryOne<{ user_id: string }>(
        'SELECT user_id FROM profiles WHERE LOWER(student_id) = ?',
        [loginId]
      );
      if (userFromProfile) {
        user = queryOne<{ id: string; email: string; password_hash: string; is_active: number }>(
          'SELECT id, email, password_hash, is_active FROM users WHERE id = ?',
          [userFromProfile.user_id]
        );
      }
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid institutional credentials. Please check your email/roll number and password.' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'Account is deactivated. Please contact the Pragati University IT Administrator.' });
      return;
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
      return;
    }

    const profile = queryOne<{ name: string; student_id: string; department_id: string; course: string }>(
      'SELECT name, student_id, department_id, course FROM profiles WHERE user_id = ?',
      [user.id]
    );

    const userRoles = queryAll<{ name: string }>(
      `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [user.id]
    );
    const roles = userRoles.map(r => r.name);

    const userPerms = queryAll<{ name: string }>(
      `SELECT DISTINCT p.name FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = ?`,
      [user.id]
    );
    const permissions = userPerms.map(p => p.name);

    const token = generateToken({ id: user.id, email: user.email });

    logAudit(user.id, 'USER_LOGIN', 'USER', user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || user.email.split('@')[0],
        student_id: profile?.student_id,
        roles,
        permissions,
        department_id: profile?.department_id,
        course: profile?.course
      }
    });
  } catch (err: any) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Current User profile & permissions
router.get('/me', authenticate, (req: Request, res: Response): void => {
  const reqUser = (req as any).user as AuthenticatedUser;
  const profile = queryOne<any>(
    `SELECT p.*, d.name as department_name, d.code as department_code
     FROM profiles p
     LEFT JOIN departments d ON d.id = p.department_id
     WHERE p.user_id = ?`,
    [reqUser.id]
  );

  res.json({
    user: {
      ...reqUser,
      profile
    }
  });
});

// Update Profile
router.patch('/profile', authenticate, (req: Request, res: Response): void => {
  const reqUser = (req as any).user as AuthenticatedUser;
  const { name, phone, bio, skills, photograph, course } = req.body;

  execute(
    `UPDATE profiles SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      bio = COALESCE(?, bio),
      skills = COALESCE(?, skills),
      photograph = COALESCE(?, photograph),
      course = COALESCE(?, course)
     WHERE user_id = ?`,
    [name, phone, bio, skills, photograph, course, reqUser.id]
  );

  res.json({ message: 'Profile updated successfully' });
});

export default router;
