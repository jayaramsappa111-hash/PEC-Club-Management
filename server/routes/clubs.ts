import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../db/database';
import { authenticate, optionalAuthenticate, AuthenticatedUser } from '../security/auth';
import { requireRole } from '../security/permissions';
import { logAudit } from '../services/audit_service';
import { createNotification } from '../services/notification_service';

const router = express.Router();

// List clubs
router.get('/', optionalAuthenticate, (req: Request, res: Response) => {
  const { department_id, department, category, search, status } = req.query;

  let sql = `
    SELECT c.*,
           inst.name as institution_name,
           inst.short_name as institution_short_name,
           COALESCE(c.institution_logo_url, inst.logo_url, '/assets/institutions/pragati-engineering-college/logo.png') as institution_logo_url,
           COALESCE(c.department, d.code, 'Interdisciplinary') as department,
           COALESCE(d.name, c.department, 'Interdisciplinary') as department_name,
           COALESCE(d.code, c.department, 'Interdisciplinary') as department_code,
           COALESCE(c.faculty_coordinator, fp.name, 'Faculty Coordinator') as faculty_coordinator,
           COALESCE(c.faculty_coordinator, fp.name, 'Faculty Coordinator') as faculty_name,
           fp.user_id as faculty_user_id,
           (SELECT COUNT(*) FROM memberships m WHERE m.club_id = c.id AND m.status = 'ACTIVE') as active_members_count,
           (SELECT COUNT(*) FROM events e WHERE e.club_id = c.id) as events_count,
           (SELECT COUNT(*) FROM projects p WHERE p.department_id = c.department_id) as projects_count
    FROM clubs c
    LEFT JOIN institutions inst ON inst.id = COALESCE(c.institution_id, 'pec')
    LEFT JOIN departments d ON d.id = c.department_id
    LEFT JOIN profiles fp ON fp.user_id = c.faculty_coordinator_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }

  if (category) {
    sql += ' AND c.category = ?';
    params.push(category);
  }

  if (department) {
    sql += ' AND (c.department = ? OR d.code = ? OR c.department_id = ?)';
    params.push(department, department, department);
  }

  if (department_id) {
    sql += ' AND (c.department_id = ? OR c.department = ?)';
    params.push(department_id, department_id);
  }

  if (search) {
    sql += ' AND (c.name LIKE ? OR c.description LIKE ? OR c.domains LIKE ? OR c.category LIKE ? OR c.department LIKE ? OR c.faculty_coordinator LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  sql += ' ORDER BY c.name ASC';

  const clubs = queryAll(sql, params);
  res.json({ clubs });
});

// Club details
router.get('/:id', optionalAuthenticate, (req: Request, res: Response): void => {
  const clubId = req.params.id;

  const club = queryOne<any>(
    `SELECT c.*,
            inst.name as institution_name,
            inst.short_name as institution_short_name,
            COALESCE(c.institution_logo_url, inst.logo_url, '/assets/institutions/pragati-engineering-college/logo.png') as institution_logo_url,
            COALESCE(c.department, d.code, 'Interdisciplinary') as department,
            COALESCE(d.name, c.department, 'Interdisciplinary') as department_name,
            COALESCE(d.code, c.department, 'Interdisciplinary') as department_code,
            COALESCE(c.faculty_coordinator, fp.name, 'Faculty Coordinator') as faculty_coordinator,
            COALESCE(c.faculty_coordinator, fp.name, 'Faculty Coordinator') as faculty_name,
            fp.user_id as faculty_user_id, fp.phone as faculty_phone
     FROM clubs c
     LEFT JOIN institutions inst ON inst.id = COALESCE(c.institution_id, 'pec')
     LEFT JOIN departments d ON d.id = c.department_id
     LEFT JOIN profiles fp ON fp.user_id = c.faculty_coordinator_id
     WHERE c.id = ? OR c.slug = ?`,
    [clubId, clubId]
  );

  if (!club) {
    res.status(404).json({ error: 'Club not found' });
    return;
  }

  // Fetch executive teams and team members
  const teams = queryAll<any>(
    `SELECT t.*, ay.name as academic_year_name, p.name as approver_name
     FROM club_teams t
     LEFT JOIN academic_years ay ON ay.id = t.academic_year_id
     LEFT JOIN profiles p ON p.user_id = t.approved_by
     WHERE t.club_id = ?
     ORDER BY t.created_at DESC`,
    [club.id]
  );

  for (const team of teams) {
    team.members = queryAll(
      `SELECT tm.*, p.name as member_name, p.student_id, p.photograph, p.course
       FROM club_team_members tm
       JOIN profiles p ON p.user_id = tm.user_id
       WHERE tm.team_id = ?`,
      [team.id]
    );
  }

  // Fetch active coordinators
  const coordinators = queryAll(
    `SELECT cc.*, p.name as coordinator_name, p.phone, u.email
     FROM club_coordinators cc
     JOIN profiles p ON p.user_id = cc.user_id
     JOIN users u ON u.id = cc.user_id
     WHERE cc.club_id = ?`,
    [club.id]
  );

  // Recent events
  const events = queryAll(
    `SELECT e.*, (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as registrations_count
     FROM events e
     WHERE e.club_id = ?
     ORDER BY e.start_datetime DESC LIMIT 10`,
    [club.id]
  );

  // Recent announcements
  const announcements = queryAll(
    `SELECT a.*, p.name as author_name
     FROM announcements a
     LEFT JOIN profiles p ON p.user_id = a.created_by
     WHERE a.club_id = ?
     ORDER BY a.created_at DESC LIMIT 5`,
    [club.id]
  );

  // Active projects for this club or department
  const projects = queryAll(
    `SELECT p.*, prof.name as owner_name
     FROM projects p
     LEFT JOIN profiles prof ON prof.user_id = p.created_by
     WHERE p.department_id = ?
     ORDER BY p.created_at DESC LIMIT 10`,
    [club.department_id || '']
  );

  // Learning resources
  const resources = queryAll(
    `SELECT r.*, prof.name as author_name
     FROM resources r
     LEFT JOIN profiles prof ON prof.user_id = r.author_id
     WHERE r.club_id = ? OR r.domain LIKE '%' || ? || '%'
     ORDER BY r.created_at DESC LIMIT 10`,
    [club.id, club.department || '']
  );

  // Members
  const members = queryAll(
    `SELECT m.*, prof.name as student_name, prof.student_id, prof.course, prof.photograph
     FROM memberships m
     JOIN profiles prof ON prof.user_id = m.user_id
     WHERE m.club_id = ? AND m.status = 'ACTIVE'
     ORDER BY m.joined_at DESC LIMIT 20`,
    [club.id]
  );

  // User's membership status if logged in
  let userMembership = null;
  const user = (req as any).user;
  if (user) {
    userMembership = queryOne(
      'SELECT * FROM memberships WHERE club_id = ? AND user_id = ?',
      [club.id, user.id]
    );
  }

  res.json({
    club,
    teams,
    coordinators,
    events,
    announcements,
    projects,
    resources,
    members,
    userMembership
  });
});

// Create club
router.post('/', authenticate, requireRole(['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'FACULTY_COORDINATOR']), (req: Request, res: Response): void => {
  const { name, slug, description, objectives, domains, department_id, faculty_coordinator_id, logo } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'Name and slug are required' });
    return;
  }

  const existing = queryOne('SELECT id FROM clubs WHERE slug = ?', [slug]);
  if (existing) {
    res.status(409).json({ error: 'A club with this slug already exists' });
    return;
  }

  const id = `club-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  execute(
    `INSERT INTO clubs (id, name, slug, description, objectives, domains, department_id, faculty_coordinator_id, logo, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
    [id, name, slug, description, objectives, domains, department_id || null, faculty_coordinator_id || (req as any).user.id, logo || null]
  );

  logAudit((req as any).user.id, 'CLUB_CREATED', 'CLUB', id, { name, slug });

  res.status(201).json({ message: 'Club created successfully', clubId: id });
});

// Update club status
router.patch('/:id/status', authenticate, requireRole(['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'FACULTY_COORDINATOR']), (req: Request, res: Response): void => {
  const { status } = req.body;
  const clubId = req.params.id;

  const validStatuses = ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'ARCHIVED'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status value' });
    return;
  }

  execute('UPDATE clubs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, clubId]);
  logAudit((req as any).user.id, 'CLUB_STATUS_CHANGED', 'CLUB', clubId, { status });

  res.json({ message: `Club status updated to ${status}` });
});

// Create new Team for Club (e.g. Executive Board)
router.post('/:id/teams', authenticate, requireRole(['SUPER_ADMIN', 'CLUB_ADMIN', 'FACULTY_COORDINATOR']), (req: Request, res: Response): void => {
  const clubId = req.params.id;
  const { name, academic_year_id, members } = req.body;

  if (!name || !academic_year_id) {
    res.status(400).json({ error: 'Team name and academic year are required' });
    return;
  }

  const teamId = `team-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const isFacultyOrSuper = (req as any).user.roles.includes('SUPER_ADMIN') || (req as any).user.roles.includes('FACULTY_COORDINATOR');

  execute(
    `INSERT INTO club_teams (id, club_id, academic_year_id, name, status, approved_by, approved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      teamId,
      clubId,
      academic_year_id,
      name,
      isFacultyOrSuper ? 'ACTIVE' : 'PENDING_APPROVAL',
      isFacultyOrSuper ? (req as any).user.id : null,
      isFacultyOrSuper ? new Date().toISOString() : null
    ]
  );

  if (Array.isArray(members)) {
    for (const m of members) {
      const tmId = `tm-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      execute(
        `INSERT INTO club_team_members (id, team_id, user_id, position, responsibilities)
         VALUES (?, ?, ?, ?, ?)`,
        [tmId, teamId, m.user_id, m.position || 'Member', m.responsibilities || '']
      );
    }
  }

  logAudit((req as any).user.id, 'CLUB_TEAM_CREATED', 'CLUB_TEAM', teamId, { clubId, name });

  res.status(201).json({ message: 'Team created successfully', teamId });
});

// Faculty approve team
router.patch('/:id/teams/:teamId/approve', authenticate, requireRole(['SUPER_ADMIN', 'FACULTY_COORDINATOR']), (req: Request, res: Response): void => {
  const { teamId } = req.params;
  execute(
    "UPDATE club_teams SET status = 'ACTIVE', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?",
    [(req as any).user.id, teamId]
  );
  logAudit((req as any).user.id, 'CLUB_TEAM_APPROVED', 'CLUB_TEAM', teamId);
  res.json({ message: 'Club team approved and set to ACTIVE' });
});

export default router;
