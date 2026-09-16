import express, { Request, Response } from 'express';
import { queryAll, queryOne, execute } from '../db/database';
import { authenticate, AuthenticatedUser } from '../security/auth';

const router = express.Router();

router.get('/', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as AuthenticatedUser;

  const notifications = queryAll<any>(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [user.id]
  );

  for (const n of notifications) {
    if (n.data_json) {
      try {
        n.data = JSON.parse(n.data_json);
      } catch {
        n.data = null;
      }
    }
  }

  res.json({ notifications });
});

router.get('/unread-count', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as AuthenticatedUser;

  const row = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL',
    [user.id]
  );

  res.json({ count: row?.count || 0 });
});

router.patch('/:id/read', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as AuthenticatedUser;
  const { id } = req.params;

  execute(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [id, user.id]
  );

  res.json({ message: 'Notification marked as read' });
});

router.post('/read-all', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as AuthenticatedUser;

  execute(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL',
    [user.id]
  );

  res.json({ message: 'All notifications marked as read' });
});

export default router;
