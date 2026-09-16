import express, { Request, Response } from 'express';
import { queryAll, queryOne } from '../db/database';
import { optionalAuthenticate } from '../security/auth';

const router = express.Router();

router.get('/platform', optionalAuthenticate, (req: Request, res: Response, next) => {
  try {
    // Real dynamic SQL aggregations
    const totalClubs = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM clubs')?.count || 0;
    const activeClubs = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM clubs WHERE status = \'ACTIVE\'')?.count || 0;
    const totalStudents = queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT u.id) as count FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE r.name IN ('STUDENT', 'CLUB_MEMBER')`
    )?.count || 0;
    const totalMemberships = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM memberships WHERE status = \'ACTIVE\'')?.count || 0;
    const totalEvents = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM events')?.count || 0;
    const completedEvents = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM events WHERE status = \'COMPLETED\'')?.count || 0;
    const totalRegistrations = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM event_registrations')?.count || 0;
    const totalAttendance = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM event_attendance')?.count || 0;
    const totalCertificates = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM certificates WHERE status = \'VALID\'')?.count || 0;
    const totalProjects = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM projects WHERE status = \'PUBLISHED\'')?.count || 0;
    const totalResources = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM resources WHERE status = \'PUBLISHED\'')?.count || 0;

    // Department distribution
    const departmentBreakdown = queryAll(
      `SELECT d.name, d.code,
              COUNT(DISTINCT c.id) as clubs_count,
              COUNT(DISTINCT p.user_id) as students_count,
              COUNT(DISTINCT pr.id) as projects_count
       FROM departments d
       LEFT JOIN clubs c ON c.department_id = d.id
       LEFT JOIN profiles p ON p.department_id = d.id
       LEFT JOIN projects pr ON pr.department_id = d.id
       GROUP BY d.id`
    );

    // Club membership ranking
    const clubRankings = queryAll(
      `SELECT c.id, c.name, COALESCE(c.logo_url, c.logo) as logo,
              (SELECT COUNT(*) FROM memberships m WHERE m.club_id = c.id AND m.status = 'ACTIVE') as active_members,
              (SELECT COUNT(*) FROM events e WHERE e.club_id = c.id) as events_held,
              (SELECT COUNT(*) FROM event_attendance ea JOIN events e ON e.id = ea.event_id WHERE e.club_id = c.id) as total_attendance
       FROM clubs c
       WHERE c.status = 'ACTIVE'
       ORDER BY active_members DESC`
    );

    // Overall Attendance Rate
    const attendanceRate = totalRegistrations > 0
      ? Math.round((totalAttendance / totalRegistrations) * 100)
      : 0;

    res.json({
      metrics: {
        totalClubs,
        activeClubs,
        inactiveClubs: totalClubs - activeClubs,
        totalStudents,
        totalMemberships,
        totalEvents,
        completedEvents,
        totalRegistrations,
        totalAttendance,
        attendanceRate,
        totalCertificates,
        totalProjects,
        totalResources
      },
      departmentBreakdown,
      clubRankings
    });
  } catch (err) {
    next(err);
  }
});

router.get('/club/:id', optionalAuthenticate, (req: Request, res: Response): void => {
  const { id } = req.params;

  const club = queryOne('SELECT id, name FROM clubs WHERE id = ?', [id]);
  if (!club) {
    res.status(404).json({ error: 'Club not found' });
    return;
  }

  const membersCount = queryOne<{ count: number }>("SELECT COUNT(*) as count FROM memberships WHERE club_id = ? AND status = 'ACTIVE'", [id])?.count || 0;
  const eventsCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM events WHERE club_id = ?', [id])?.count || 0;
  const registrationsCount = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM event_registrations er JOIN events e ON e.id = er.event_id WHERE e.club_id = ?',
    [id]
  )?.count || 0;
  const attendanceCount = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM event_attendance ea JOIN events e ON e.id = ea.event_id WHERE e.club_id = ?',
    [id]
  )?.count || 0;
  const certificatesCount = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM certificates cert JOIN events e ON e.id = cert.event_id WHERE e.club_id = ?',
    [id]
  )?.count || 0;
  const resourcesCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM resources WHERE club_id = ?', [id])?.count || 0;

  // Event feedback average for this club
  const avgFeedback = queryOne<{ avg: number }>(
    'SELECT AVG(rating) as avg FROM event_feedback ef JOIN events e ON e.id = ef.event_id WHERE e.club_id = ?',
    [id]
  )?.avg || 0;

  res.json({
    club,
    metrics: {
      membersCount,
      eventsCount,
      registrationsCount,
      attendanceCount,
      certificatesCount,
      resourcesCount,
      avgFeedback: Number(avgFeedback.toFixed(1))
    }
  });
});

export default router;
