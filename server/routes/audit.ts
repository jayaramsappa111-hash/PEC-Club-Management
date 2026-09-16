import express, { Request, Response } from 'express';
import { queryAll } from '../db/database';
import { authenticate } from '../security/auth';
import { requireRole } from '../security/permissions';

const router = express.Router();

router.get('/', authenticate, requireRole(['SUPER_ADMIN']), (req: Request, res: Response) => {
  const { action, entity_type, limit } = req.query;

  let sql = `
    SELECT al.*, p.name as actor_name, u.email as actor_email
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.actor_id
    LEFT JOIN profiles p ON p.user_id = al.actor_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (action) {
    sql += ' AND al.action = ?';
    params.push(action);
  }

  if (entity_type) {
    sql += ' AND al.entity_type = ?';
    params.push(entity_type);
  }

  sql += ' ORDER BY al.timestamp DESC LIMIT ?';
  params.push(limit ? Number(limit) : 100);

  const logs = queryAll<any>(sql, params);

  for (const l of logs) {
    if (l.metadata_json) {
      try {
        l.metadata = JSON.parse(l.metadata_json);
      } catch {
        l.metadata = null;
      }
    }
  }

  res.json({ logs });
});

export default router;
