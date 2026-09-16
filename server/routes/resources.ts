import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../db/database';
import { authenticate, optionalAuthenticate, AuthenticatedUser } from '../security/auth';
import { requireRole } from '../security/permissions';
import { logAudit } from '../services/audit_service';

const router = express.Router();

// List resources
router.get('/', optionalAuthenticate, (req: Request, res: Response) => {
  const { type, difficulty, domain, club_id, search, bookmarked, completed } = req.query;
  const user = (req as any).user;

  let sql = `
    SELECT r.*, c.name as club_name, p.name as author_name,
           (SELECT COUNT(*) FROM resource_bookmarks rb WHERE rb.resource_id = r.id) as bookmarks_count
    FROM resources r
    LEFT JOIN clubs c ON c.id = r.club_id
    LEFT JOIN profiles p ON p.user_id = r.author_id
    WHERE r.status = 'PUBLISHED'
  `;
  const params: any[] = [];

  if (type) {
    sql += ' AND r.type = ?';
    params.push(type);
  }

  if (difficulty) {
    sql += ' AND r.difficulty = ?';
    params.push(difficulty);
  }

  if (domain) {
    sql += ' AND r.domain LIKE ?';
    params.push(`%${domain}%`);
  }

  if (club_id) {
    sql += ' AND r.club_id = ?';
    params.push(club_id);
  }

  if (search) {
    sql += ' AND (r.title LIKE ? OR r.description LIKE ? OR r.technology LIKE ? OR r.tags LIKE ?)';
    const sp = `%${search}%`;
    params.push(sp, sp, sp, sp);
  }

  if (user && bookmarked === 'true') {
    sql += ' AND EXISTS (SELECT 1 FROM resource_bookmarks rb WHERE rb.resource_id = r.id AND rb.user_id = ?)';
    params.push(user.id);
  }

  if (user && completed === 'true') {
    sql += " AND EXISTS (SELECT 1 FROM resource_progress rp WHERE rp.resource_id = r.id AND rp.user_id = ? AND rp.status = 'COMPLETED')";
    params.push(user.id);
  }

  sql += ' ORDER BY r.created_at DESC';

  const resources = queryAll<any>(sql, params);

  // If user logged in, attach isBookmarked and isCompleted
  if (user) {
    const userBookmarks = new Set(
      queryAll<{ resource_id: string }>('SELECT resource_id FROM resource_bookmarks WHERE user_id = ?', [user.id]).map(b => b.resource_id)
    );
    const userCompleted = new Set(
      queryAll<{ resource_id: string }>("SELECT resource_id FROM resource_progress WHERE user_id = ? AND status = 'COMPLETED'", [user.id]).map(p => p.resource_id)
    );

    for (const r of resources) {
      r.isBookmarked = userBookmarks.has(r.id);
      r.isCompleted = userCompleted.has(r.id);
    }
  }

  res.json({ resources });
});

// Create resource
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN']), (req: Request, res: Response): void => {
  const user = (req as any).user as AuthenticatedUser;
  const { title, description, type, domain, technology, difficulty, semester, club_id, tags, file_url } = req.body;

  if (!title || !type || !domain || !file_url) {
    res.status(400).json({ error: 'Title, type, domain, and file_url are required' });
    return;
  }

  const id = `res-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  execute(
    `INSERT INTO resources (id, title, description, type, domain, technology, difficulty, semester, author_id, club_id, tags, file_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')`,
    [id, title, description || '', type, domain, technology || '', difficulty || 'BEGINNER', semester || '', user.id, club_id || null, tags || '', file_url]
  );

  logAudit(user.id, 'RESOURCE_CREATED', 'RESOURCE', id, { title, type });

  res.status(201).json({ message: 'Resource created successfully', resourceId: id });
});

// Toggle Bookmark
router.post('/:id/bookmark', authenticate, (req: Request, res: Response): void => {
  const user = (req as any).user as AuthenticatedUser;
  const { id } = req.params;

  const existing = queryOne('SELECT 1 FROM resource_bookmarks WHERE user_id = ? AND resource_id = ?', [user.id, id]);
  if (existing) {
    execute('DELETE FROM resource_bookmarks WHERE user_id = ? AND resource_id = ?', [user.id, id]);
    res.json({ message: 'Bookmark removed', isBookmarked: false });
  } else {
    execute('INSERT INTO resource_bookmarks (user_id, resource_id) VALUES (?, ?)', [user.id, id]);
    res.json({ message: 'Bookmarked successfully', isBookmarked: true });
  }
});

// Toggle Complete
router.post('/:id/progress', authenticate, (req: Request, res: Response): void => {
  const user = (req as any).user as AuthenticatedUser;
  const { id } = req.params;

  const existing = queryOne('SELECT 1 FROM resource_progress WHERE user_id = ? AND resource_id = ?', [user.id, id]);
  if (existing) {
    execute('DELETE FROM resource_progress WHERE user_id = ? AND resource_id = ?', [user.id, id]);
    res.json({ message: 'Marked as incomplete', isCompleted: false });
  } else {
    execute("INSERT INTO resource_progress (user_id, resource_id, status) VALUES (?, ?, 'COMPLETED')", [user.id, id]);
    res.json({ message: 'Marked as completed', isCompleted: true });
  }
});

export default router;
