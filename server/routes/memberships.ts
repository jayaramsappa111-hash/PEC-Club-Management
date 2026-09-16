import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../db/database';
import { authenticate, AuthenticatedUser } from '../security/auth';
import { requireRole } from '../security/permissions';
import { logAudit } from '../services/audit_service';
import { createNotification } from '../services/notification_service';
import { generateMembershipCardPDF } from '../services/pdf_service';
import { generateQRCodeDataURL } from '../services/qr_service';

const router = express.Router();

// Get current user's memberships
router.get('/my', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as AuthenticatedUser;

  const memberships = queryAll<any>(
    `SELECT m.*, c.name as club_name, c.slug as club_slug, c.logo as club_logo,
            ay.name as academic_year_name, d.name as department_name, d.code as department_code,
            p.name as student_name, p.student_id as student_roll
     FROM memberships m
     JOIN clubs c ON c.id = m.club_id
     JOIN academic_years ay ON ay.id = m.academic_year_id
     LEFT JOIN departments d ON d.id = c.department_id
     LEFT JOIN profiles p ON p.user_id = m.user_id
     WHERE m.user_id = ?
     ORDER BY m.joined_at DESC`,
    [user.id]
  );

  res.json({ memberships });
});

// Club Admin / Faculty / Super Admin view all memberships for a club
router.get('/club/:clubId', authenticate, requireRole(['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN', 'DEPARTMENT_ADMIN']), (req: Request, res: Response) => {
  const { clubId } = req.params;
  const { status } = req.query;

  let sql = `
    SELECT m.*, p.name as student_name, p.student_id as student_roll, p.course, p.phone, u.email,
           c.name as club_name, ay.name as academic_year_name
    FROM memberships m
    JOIN users u ON u.id = m.user_id
    JOIN profiles p ON p.user_id = m.user_id
    JOIN clubs c ON c.id = m.club_id
    JOIN academic_years ay ON ay.id = m.academic_year_id
    WHERE m.club_id = ?
  `;
  const params: any[] = [clubId];

  if (status) {
    sql += ' AND m.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY m.joined_at DESC';

  const members = queryAll(sql, params);
  res.json({ members });
});

// Apply for membership
router.post('/apply', authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user as AuthenticatedUser;
  const { club_id } = req.body;

  if (!club_id) {
    res.status(400).json({ error: 'Club ID is required' });
    return;
  }

  const existing = queryOne('SELECT id, status FROM memberships WHERE user_id = ? AND club_id = ?', [user.id, club_id]);
  if (existing) {
    res.status(409).json({ error: `You already have an existing membership record for this club (Status: ${existing.status})` });
    return;
  }

  const currentAy = queryOne<{ id: string }>('SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1');
  const ayId = currentAy?.id || 'ay-2025-26';

  // Count existing to form sequential/formatted code
  const countRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM memberships');
  const nextSeq = (countRow?.count || 0) + 1;
  const membershipIdCode = `TC-2026-${String(nextSeq).padStart(6, '0')}`;
  const id = `mem-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  // If student applies, auto-set to ACTIVE (or PENDING if club requires manual vetting; we default to ACTIVE to let students participate immediately, with status controllable by admin)
  execute(
    `INSERT INTO memberships (id, membership_id, user_id, club_id, academic_year_id, status, valid_until)
     VALUES (?, ?, ?, ?, ?, 'ACTIVE', '2026-06-30')`,
    [id, membershipIdCode, user.id, club_id, ayId]
  );

  // Add role CLUB_MEMBER if not already present
  const memberRole = queryOne<{ id: string }>("SELECT id FROM roles WHERE name = 'CLUB_MEMBER'");
  if (memberRole) {
    execute('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [user.id, memberRole.id]);
  }

  const club = queryOne<{ name: string }>('SELECT name FROM clubs WHERE id = ?', [club_id]);

  logAudit(user.id, 'MEMBERSHIP_ENROLLED', 'MEMBERSHIP', id, { clubId: club_id, membershipId: membershipIdCode });

  await createNotification(
    user.id,
    'MEMBERSHIP_APPROVED',
    `Welcome to ${club?.name || 'Club'}!`,
    `Your digital membership card (${membershipIdCode}) has been generated and is ready for use.`,
    { membershipId: id }
  );

  res.status(201).json({
    message: 'Membership activated successfully',
    membershipId: id,
    membershipCode: membershipIdCode
  });
});

// Update membership status (Approve / Suspend / Revoke)
router.patch('/:id/status', authenticate, requireRole(['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'REJECTED'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  execute('UPDATE memberships SET status = ? WHERE id = ?', [status, id]);
  logAudit((req as any).user.id, 'MEMBERSHIP_STATUS_CHANGED', 'MEMBERSHIP', id, { status });

  res.json({ message: `Membership status updated to ${status}` });
});

// Get digital card details with QR
router.get('/:id/card', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const mem = queryOne<any>(
    `SELECT m.*, c.name as club_name, c.logo as club_logo,
            p.name as student_name, p.student_id as student_roll, p.photograph,
            d.name as department_name, d.code as department_code,
            ay.name as academic_year_name
     FROM memberships m
     JOIN clubs c ON c.id = m.club_id
     JOIN academic_years ay ON ay.id = m.academic_year_id
     JOIN profiles p ON p.user_id = m.user_id
     LEFT JOIN departments d ON d.id = p.department_id
     WHERE m.id = ? OR m.membership_id = ?`,
    [id, id]
  );

  if (!mem) {
    res.status(404).json({ error: 'Membership record not found' });
    return;
  }

  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const verificationUrl = `${appUrl}/verify/membership/${mem.membership_id}`;
  const qrDataUrl = await generateQRCodeDataURL(verificationUrl);

  res.json({
    card: {
      ...mem,
      verificationUrl,
      qrDataUrl
    }
  });
});

// Download digital card PDF
router.get('/:id/card/pdf', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const mem = queryOne<any>(
    `SELECT m.*, c.name as club_name,
            p.name as student_name, p.student_id as student_roll,
            d.name as department_name, d.code as department_code,
            ay.name as academic_year_name
     FROM memberships m
     JOIN clubs c ON c.id = m.club_id
     JOIN academic_years ay ON ay.id = m.academic_year_id
     JOIN profiles p ON p.user_id = m.user_id
     LEFT JOIN departments d ON d.id = p.department_id
     WHERE m.id = ? OR m.membership_id = ?`,
    [id, id]
  );

  if (!mem) {
    res.status(404).json({ error: 'Membership record not found' });
    return;
  }

  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const verificationUrl = `${appUrl}/verify/membership/${mem.membership_id}`;

  const pdfBuffer = await generateMembershipCardPDF({
    membershipId: mem.membership_id,
    studentName: mem.student_name,
    studentId: mem.student_roll || 'N/A',
    clubName: mem.club_name,
    department: mem.department_code || mem.department_name || 'Engineering',
    academicYear: mem.academic_year_name,
    validUntil: mem.valid_until || '2026-06-30',
    verificationUrl
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=membership-card-${mem.membership_id}.pdf`);
  res.send(pdfBuffer);
});

export default router;
