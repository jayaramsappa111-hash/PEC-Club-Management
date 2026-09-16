import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { queryAll, queryOne } from '../db/database';

export const JWT_SECRET = process.env.JWT_SECRET || 'tc_platform_super_secret_jwt_key_min_32_chars';
export const TOKEN_EXPIRY = '7d';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  department_id?: string;
}

export function generateToken(payload: { id: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): { id: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch {
    return null;
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing or malformed Bearer token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
    return;
  }

  // Load user from database
  const user = queryOne<{ id: string; email: string; is_active: number }>(
    'SELECT id, email, is_active FROM users WHERE id = ?',
    [decoded.id]
  );

  if (!user || !user.is_active) {
    res.status(401).json({ error: 'User account is inactive or no longer exists.' });
    return;
  }

  // Load profile
  const profile = queryOne<{ name: string; department_id: string }>(
    'SELECT name, department_id FROM profiles WHERE user_id = ?',
    [user.id]
  );

  // Load roles
  const userRoles = queryAll<{ name: string }>(
    `SELECT r.name FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = ?`,
    [user.id]
  );
  const roles = userRoles.map(r => r.name);

  // Load permissions
  const userPerms = queryAll<{ name: string }>(
    `SELECT DISTINCT p.name FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN user_roles ur ON ur.role_id = rp.role_id
     WHERE ur.user_id = ?`,
    [user.id]
  );
  const permissions = userPerms.map(p => p.name);

  // Attach to request
  (req as any).user = {
    id: user.id,
    email: user.email,
    name: profile?.name || user.email.split('@')[0],
    roles,
    permissions,
    department_id: profile?.department_id
  };

  next();
}

export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      const user = queryOne<{ id: string; email: string; is_active: number }>(
        'SELECT id, email, is_active FROM users WHERE id = ?',
        [decoded.id]
      );
      if (user && user.is_active) {
        const profile = queryOne<{ name: string; department_id: string }>(
          'SELECT name, department_id FROM profiles WHERE user_id = ?',
          [user.id]
        );
        const userRoles = queryAll<{ name: string }>(
          `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`,
          [user.id]
        );
        const userPerms = queryAll<{ name: string }>(
          `SELECT DISTINCT p.name FROM permissions p JOIN role_permissions rp ON rp.permission_id = p.id JOIN user_roles ur ON ur.role_id = rp.role_id WHERE ur.user_id = ?`,
          [user.id]
        );
        (req as any).user = {
          id: user.id,
          email: user.email,
          name: profile?.name || user.email.split('@')[0],
          roles: userRoles.map(r => r.name),
          permissions: userPerms.map(p => p.name),
          department_id: profile?.department_id
        };
      }
    }
  }
  next();
}
