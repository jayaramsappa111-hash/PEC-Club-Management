import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { queryAll, execute } from '../db/database';
import { authenticate, optionalAuthenticate, AuthenticatedUser } from '../security/auth';
import { requireRole } from '../security/permissions';

const router = express.Router();

router.get('/', optionalAuthenticate, (req: Request, res: Response) => {
  const { club_id, event_id } = req.query;

  let sql = `
    SELECT g.*, c.name as club_name, e.title as event_title, p.name as uploader_name
    FROM gallery g
    LEFT JOIN clubs c ON c.id = g.club_id
    LEFT JOIN events e ON e.id = g.event_id
    LEFT JOIN profiles p ON p.user_id = g.uploaded_by
    WHERE 1=1
  `;
  const params: any[] = [];

  if (club_id) {
    sql += ' AND g.club_id = ?';
    params.push(club_id);
  }

  if (event_id) {
    sql += ' AND g.event_id = ?';
    params.push(event_id);
  }

  sql += ' ORDER BY g.created_at DESC';

  const items = queryAll(sql, params);
  res.json({ gallery: items });
});

router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'CLUB_ADMIN', 'FACULTY_COORDINATOR']), (req: Request, res: Response): void => {
  const user = (req as any).user as AuthenticatedUser;
  const { title, url, media_type, club_id, event_id, caption } = req.body;

  if (!title || !url) {
    res.status(400).json({ error: 'Title and URL are required' });
    return;
  }

  const id = `gal-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  execute(
    `INSERT INTO gallery (id, club_id, event_id, title, media_type, url, caption, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, club_id || null, event_id || null, title, media_type || 'image', url, caption || '', user.id]
  );

  res.status(201).json({ message: 'Media added to gallery', mediaId: id });
});

export default router;
