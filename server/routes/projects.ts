import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../db/database';
import { authenticate, optionalAuthenticate, AuthenticatedUser } from '../security/auth';
import { requireRole } from '../security/permissions';
import { logAudit } from '../services/audit_service';
import { createNotification } from '../services/notification_service';

const router = express.Router();

// Get projects list
router.get('/', optionalAuthenticate, (req: Request, res: Response, next) => {
  try {
    const { domain, department_id, status, is_featured, search, my } = req.query;

    let sql = `
      SELECT p.*, d.name as department_name, d.code as department_code,
             ay.name as academic_year_name,
             cp.name as creator_name, cp.student_id as creator_roll,
             (SELECT AVG(rating) FROM project_reviews pr WHERE pr.project_id = p.id) as avg_rating,
             (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as team_size
      FROM projects p
      LEFT JOIN departments d ON d.id = p.department_id
      LEFT JOIN academic_years ay ON ay.id = p.academic_year_id
      LEFT JOIN profiles cp ON cp.user_id = p.created_by
      WHERE 1=1
    `;
    const params: any[] = [];

    const user = (req as any).user;
    if (my && user) {
      sql += ' AND (p.created_by = ? OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ?))';
      params.push(user.id, user.id);
    } else if (!user || !user.roles.some((r: string) => ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'DEPARTMENT_ADMIN'].includes(r))) {
      // Public/student only sees approved and published unless viewing own
      sql += " AND p.status IN ('APPROVED', 'PUBLISHED')";
    } else if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    if (domain) {
      sql += ' AND p.domain LIKE ?';
      params.push(`%${domain}%`);
    }

    if (department_id) {
      sql += ' AND p.department_id = ?';
      params.push(department_id);
    }

    if (is_featured !== undefined && is_featured !== '') {
      sql += ' AND p.is_featured = ?';
      params.push(Number(is_featured));
    }

    if (search) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.technologies LIKE ?)';
      const sp = `%${search}%`;
      params.push(sp, sp, sp);
    }

    sql += ' ORDER BY p.is_featured DESC, p.created_at DESC';

    const projects = queryAll(sql, params);
    res.json({ projects });
  } catch (err) {
    next(err);
  }
});

// Single project
router.get('/:id', optionalAuthenticate, (req: Request, res: Response): void => {
  const { id } = req.params;

  const project = queryOne<any>(
    `SELECT p.*, d.name as department_name, d.code as department_code,
            ay.name as academic_year_name,
            cp.name as creator_name, cp.student_id as creator_roll
     FROM projects p
     LEFT JOIN departments d ON d.id = p.department_id
     LEFT JOIN academic_years ay ON ay.id = p.academic_year_id
     JOIN profiles cp ON cp.user_id = p.created_by
     WHERE p.id = ?`,
    [id]
  );

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  // Members
  const members = queryAll(
    `SELECT pm.*, p.name as member_name, p.student_id, p.course
     FROM project_members pm
     JOIN profiles p ON p.user_id = pm.user_id
     WHERE pm.project_id = ?`,
    [id]
  );

  // Reviews
  const reviews = queryAll(
    `SELECT pr.*, p.name as reviewer_name
     FROM project_reviews pr
     JOIN profiles p ON p.user_id = pr.reviewer_id
     WHERE pr.project_id = ?
     ORDER BY pr.reviewed_at DESC`,
    [id]
  );

  res.json({
    project,
    members,
    reviews
  });
});

// Submit project
router.post('/', authenticate, (req: Request, res: Response): void => {
  const user = (req as any).user as AuthenticatedUser;
  const {
    title, description, domain, technologies,
    department_id, academic_year_id, github_url,
    demo_url, documentation_url, members
  } = req.body;

  if (!title || !description || !domain || !technologies) {
    res.status(400).json({ error: 'Title, description, domain, and technologies are required' });
    return;
  }

  const id = `proj-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  execute(
    `INSERT INTO projects (
      id, title, description, domain, technologies,
      department_id, academic_year_id, github_url, demo_url,
      documentation_url, status, created_by, is_featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, 0)`,
    [
      id, title, description, domain, technologies,
      department_id || user.department_id || null,
      academic_year_id || 'ay-2025-26',
      github_url || null, demo_url || null, documentation_url || null,
      user.id
    ]
  );

  // Add creator as lead
  execute(
    `INSERT INTO project_members (id, project_id, user_id, role)
     VALUES (?, ?, ?, 'Lead Architect')`,
    [`pm-${Date.now()}-lead`, id, user.id]
  );

  // Add additional members if provided
  if (Array.isArray(members)) {
    for (const m of members) {
      if (m.user_id && m.user_id !== user.id) {
        execute(
          `INSERT OR IGNORE INTO project_members (id, project_id, user_id, role)
           VALUES (?, ?, ?, ?)`,
          [`pm-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`, id, m.user_id, m.role || 'Contributor']
        );
      }
    }
  }

  logAudit(user.id, 'PROJECT_SUBMITTED', 'PROJECT', id, { title, domain });

  res.status(201).json({ message: 'Project submitted for faculty review successfully', projectId: id });
});

// Faculty review & decision
router.post('/:id/review', authenticate, requireRole(['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'DEPARTMENT_ADMIN']), async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user as AuthenticatedUser;
  const { id: projectId } = req.params;
  const { rating, remarks, decision } = req.body;

  if (!decision || !['APPROVED', 'REJECTED', 'REVISE'].includes(decision)) {
    res.status(400).json({ error: 'Valid decision (APPROVED, REJECTED, REVISE) is required' });
    return;
  }

  const project = queryOne<any>('SELECT * FROM projects WHERE id = ?', [projectId]);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const revId = `prv-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  execute(
    `INSERT INTO project_reviews (id, project_id, reviewer_id, rating, remarks, decision)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [revId, projectId, user.id, rating ? Number(rating) : 8, remarks || '', decision]
  );

  const newStatus = decision === 'APPROVED' ? 'PUBLISHED' : (decision === 'REJECTED' ? 'REJECTED' : 'UNDER_REVIEW');
  execute('UPDATE projects SET status = ? WHERE id = ?', [newStatus, projectId]);

  logAudit(user.id, 'PROJECT_REVIEWED', 'PROJECT', projectId, { decision, rating });

  await createNotification(
    project.created_by,
    'PROJECT_DECISION',
    `Project ${decision}: ${project.title}`,
    remarks ? `Review remarks: ${remarks}` : `Your project submission has been marked as ${decision}.`,
    { projectId, decision }
  );

  res.status(201).json({ message: `Project review recorded (${decision})`, newStatus });
});

// Toggle Featured
router.patch('/:id/featured', authenticate, requireRole(['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const { is_featured } = req.body;

  execute('UPDATE projects SET is_featured = ? WHERE id = ?', [is_featured ? 1 : 0, id]);
  res.json({ message: `Project featured status updated to ${is_featured ? 'true' : 'false'}` });
});

export default router;
