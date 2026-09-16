import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../db/database';
import { authenticate, optionalAuthenticate, AuthenticatedUser } from '../security/auth';
import { createNotification } from '../services/notification_service';

const router = express.Router();

// List roadmaps with user progress %
router.get('/', optionalAuthenticate, (req: Request, res: Response) => {
  const user = (req as any).user;

  const roadmaps = queryAll<any>(
    `SELECT r.*,
            (SELECT COUNT(*) FROM roadmap_modules rm WHERE rm.roadmap_id = r.id) as total_modules
     FROM roadmaps r
     ORDER BY r.title ASC`
  );

  for (const r of roadmaps) {
    if (user && r.total_modules > 0) {
      const completedRow = queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM student_roadmap_progress srp
         WHERE srp.roadmap_id = r.id AND srp.user_id = ?`,
        [user.id]
      );
      r.completed_modules = completedRow?.count || 0;
      r.progress_percentage = Math.round((r.completed_modules / r.total_modules) * 100);
    } else {
      r.completed_modules = 0;
      r.progress_percentage = 0;
    }
  }

  // Also include student's earned badges if logged in
  let badges: any[] = [];
  if (user) {
    badges = queryAll('SELECT * FROM skill_badges WHERE user_id = ? ORDER BY issued_at DESC', [user.id]);
  }

  res.json({ roadmaps, badges });
});

// Single Roadmap with modules
router.get('/:id', optionalAuthenticate, (req: Request, res: Response): void => {
  const { id } = req.params;
  const user = (req as any).user;

  const roadmap = queryOne<any>(
    'SELECT * FROM roadmaps WHERE id = ? OR slug = ?',
    [id, id]
  );

  if (!roadmap) {
    res.status(404).json({ error: 'Roadmap not found' });
    return;
  }

  const modules = queryAll<any>(
    'SELECT * FROM roadmap_modules WHERE roadmap_id = ? ORDER BY order_index ASC',
    [roadmap.id]
  );

  const completedModuleIds = new Set<string>();
  if (user) {
    const rows = queryAll<{ module_id: string }>(
      'SELECT module_id FROM student_roadmap_progress WHERE roadmap_id = ? AND user_id = ?',
      [roadmap.id, user.id]
    );
    rows.forEach(r => completedModuleIds.add(r.module_id));
  }

  for (const m of modules) {
    m.isCompleted = completedModuleIds.has(m.id);
    m.resources = m.resources_json ? JSON.parse(m.resources_json) : [];
  }

  const total = modules.length;
  const completed = completedModuleIds.size;
  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  res.json({
    roadmap: {
      ...roadmap,
      total_modules: total,
      completed_modules: completed,
      progress_percentage: progressPercentage,
      modules
    }
  });
});

// Toggle Module Completion
router.post('/:id/modules/:moduleId/complete', authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user as AuthenticatedUser;
  const { id: roadmapId, moduleId } = req.params;

  const existing = queryOne(
    'SELECT 1 FROM student_roadmap_progress WHERE user_id = ? AND roadmap_id = ? AND module_id = ?',
    [user.id, roadmapId, moduleId]
  );

  if (existing) {
    execute(
      'DELETE FROM student_roadmap_progress WHERE user_id = ? AND roadmap_id = ? AND module_id = ?',
      [user.id, roadmapId, moduleId]
    );
    res.json({ message: 'Module marked incomplete', isCompleted: false });
    return;
  }

  execute(
    'INSERT INTO student_roadmap_progress (user_id, roadmap_id, module_id) VALUES (?, ?, ?)',
    [user.id, roadmapId, moduleId]
  );

  // Check if all modules of this roadmap are completed
  const totalRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM roadmap_modules WHERE roadmap_id = ?', [roadmapId]);
  const completedRow = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM student_roadmap_progress WHERE roadmap_id = ? AND user_id = ?',
    [roadmapId, user.id]
  );

  let badgeAwarded = false;
  if (totalRow && completedRow && completedRow.count >= totalRow.count) {
    // Award skill badge if not already awarded
    const roadmap = queryOne<{ title: string }>('SELECT title FROM roadmaps WHERE id = ?', [roadmapId]);
    const existingBadge = queryOne('SELECT id FROM skill_badges WHERE user_id = ? AND criteria LIKE ?', [user.id, `%${roadmapId}%`]);
    if (!existingBadge) {
      const badgeId = `bdg-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      execute(
        `INSERT INTO skill_badges (id, user_id, title, description, badge_icon, criteria)
         VALUES (?, ?, ?, ?, 'award', ?)`,
        [badgeId, user.id, `${roadmap?.title || 'Mastery'} Certified Specialist`, `Completed all learning milestones in ${roadmap?.title}`, `Roadmap:${roadmapId}`]
      );
      badgeAwarded = true;

      await createNotification(
        user.id,
        'BADGE_AWARDED',
        `New Skill Badge Unlocked: ${roadmap?.title}`,
        `Congratulations! You completed 100% of the ${roadmap?.title} track.`,
        { badgeId }
      );
    }
  }

  res.json({
    message: 'Module marked as completed',
    isCompleted: true,
    badgeAwarded
  });
});

export default router;
