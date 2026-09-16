import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { queryAll, execute } from '../db/database';
import { authenticate } from '../security/auth';
import { requireRole } from '../security/permissions';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  const { category, search } = req.query;

  let sql = 'SELECT * FROM tools WHERE 1=1';
  const params: any[] = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    sql += ' AND (name LIKE ? OR purpose LIKE ? OR description LIKE ?)';
    const sp = `%${search}%`;
    params.push(sp, sp, sp);
  }

  sql += ' ORDER BY name ASC';

  const tools = queryAll(sql, params);
  res.json({ tools });
});

router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'CLUB_ADMIN', 'FACULTY_COORDINATOR']), (req: Request, res: Response): void => {
  const { name, category, purpose, platform, license, official_url, description } = req.body;

  if (!name || !category || !purpose || !official_url) {
    res.status(400).json({ error: 'Name, category, purpose, and official_url are required' });
    return;
  }

  const id = `tool-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  execute(
    `INSERT INTO tools (id, name, category, purpose, platform, license, official_url, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, category, purpose, platform || 'Cross-platform', license || 'Open Source', official_url, description || '']
  );

  res.status(201).json({ message: 'Tool added to directory', toolId: id });
});

export default router;
