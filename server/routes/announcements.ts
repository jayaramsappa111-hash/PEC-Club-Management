import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../db/database';
import { authenticate, optionalAuthenticate, AuthenticatedUser } from '../security/auth';
import { requireRole } from '../security/permissions';
import { logAudit } from '../services/audit_service';
import { createNotification } from '../services/notification_service';

const router = express.Router();

router.get('/', optionalAuthenticate, (req: Request, res: Response) => {
  const { club_id, department_id, category, important_only } = req.query;

  let sql = `
    SELECT a.*, c.name as club_name, c.logo as club_logo, d.name as department_name,
           p.name as author_name
    FROM announcements a
    LEFT JOIN clubs c ON c.id = a.club_id
    LEFT JOIN departments d ON d.id = a.department_id
    LEFT JOIN profiles p ON p.user_id = a.created_by
    WHERE a.status = 'PUBLISHED'
  `;
  const params: any[] = [];

  if (club_id) {
    sql += ' AND a.club_id = ?';
    params.push(club_id);
  }

  if (department_id) {
    sql += ' AND a.department_id = ?';
    params.push(department_id);
  }

  if (category) {
    sql += ' AND a.category = ?';
    params.push(category);
  }

  if (important_only === 'true') {
    sql += ' AND a.is_important = 1';
  }

  sql += ' ORDER BY a.is_important DESC, a.created_at DESC';

  const announcements = queryAll(sql, params);
  res.json({ announcements });
});

router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN', 'DEPARTMENT_ADMIN']), async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user as AuthenticatedUser;
  const { title, content, category, target_audience, club_id, department_id, is_important } = req.body;

  if (!title || !content) {
    res.status(400).json({ error: 'Title and content are required' });
    return;
  }

  const id = `ann-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  execute(
    `INSERT INTO announcements (
      id, title, content, category, target_audience,
      club_id, department_id, is_important, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?)`,
    [
      id, title, content, category || 'GENERAL', target_audience || 'ALL',
      club_id || null, department_id || null, is_important ? 1 : 0, user.id
    ]
  );

  logAudit(user.id, 'ANNOUNCEMENT_PUBLISHED', 'ANNOUNCEMENT', id, { title, clubId: club_id });

  // If marked important, dispatch notifications to relevant users
  if (is_important) {
    let targetUsers: { id: string }[] = [];
    if (club_id) {
      targetUsers = queryAll<{ id: string }>(
        "SELECT user_id as id FROM memberships WHERE club_id = ? AND status = 'ACTIVE'",
        [club_id]
      );
    } else {
      targetUsers = queryAll<{ id: string }>('SELECT id FROM users WHERE is_active = 1 LIMIT 50');
    }

    for (const tu of targetUsers) {
      if (tu.id !== user.id) {
        await createNotification(
          tu.id,
          'IMPORTANT_ANNOUNCEMENT',
          `Urgent: ${title}`,
          content.slice(0, 160),
          { announcementId: id }
        );
      }
    }
  }

  res.status(201).json({ message: 'Announcement published successfully', announcementId: id });
});

export default router;
