import express, { Request, Response } from 'express';
import { queryAll, queryOne, execute } from '../db/database';
import { authenticate } from '../security/auth';
import { requireRole } from '../security/permissions';
import { logAudit } from '../services/audit_service';

const router = express.Router();

router.get('/departments', (req: Request, res: Response) => {
  const depts = queryAll('SELECT * FROM departments ORDER BY name ASC');
  res.json({ departments: depts });
});

router.get('/academic-years', (req: Request, res: Response) => {
  const ays = queryAll('SELECT * FROM academic_years ORDER BY start_date DESC');
  res.json({ academicYears: ays });
});

router.get('/users', authenticate, requireRole(['SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN']), (req: Request, res: Response) => {
  const { role, department_id, search } = req.query;

  let sql = `
    SELECT u.id, u.email, u.is_active, u.created_at,
           p.name, p.student_id, p.course, p.phone, p.skills,
           d.name as department_name, d.code as department_code,
           GROUP_CONCAT(r.name) as roles
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    LEFT JOIN departments d ON d.id = p.department_id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (department_id) {
    sql += ' AND p.department_id = ?';
    params.push(department_id);
  }

  if (search) {
    sql += ' AND (p.name LIKE ? OR u.email LIKE ? OR p.student_id LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  sql += ' GROUP BY u.id ORDER BY p.name ASC';

  const rows = queryAll<any>(sql, params);
  const result = rows.map(row => ({
    ...row,
    roles: row.roles ? row.roles.split(',') : []
  }));

  res.json({ users: result });
});

router.patch('/users/:id/role', authenticate, requireRole(['SUPER_ADMIN']), (req: Request, res: Response) => {
  const { roleName } = req.body;
  const targetUserId = req.params.id;

  const role = queryOne<{ id: string }>('SELECT id FROM roles WHERE name = ?', [roleName]);
  if (!role) {
    res.status(400).json({ error: 'Role not found' });
    return;
  }

  // Remove existing and assign new
  execute('DELETE FROM user_roles WHERE user_id = ?', [targetUserId]);
  execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [targetUserId, role.id]);

  logAudit((req as any).user.id, 'ROLE_CHANGED', 'USER', targetUserId, { roleName });

  res.json({ message: `Assigned role ${roleName} successfully` });
});

export default router;
