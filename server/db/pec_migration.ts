import { db, queryAll, queryOne, execute } from './database';
import { PEC_DEPARTMENTS, PEC_CLUBS } from './pec_clubs_data';

export async function migratePECClubs(): Promise<void> {
  try {
    const bcrypt = await import('bcryptjs');
    const pwdHash = await bcrypt.default.hash('Password123!', 10);

    // 0. Ensure all prerequisite parent tables & records exist to prevent foreign key errors
    execute(`
      INSERT OR REPLACE INTO institutions (id, name, short_name, logo_url, website)
      VALUES (
        'pec',
        'Pragati University',
        'PU',
        '/assets/institutions/pragati-engineering-college/logo.png',
        'https://pragati.ac.in/'
      )
    `);

    const academicYears = [
      { id: 'ay-2025-26', name: '2025-2026', start_date: '2025-07-01', end_date: '2026-06-30', is_current: 1 },
      { id: 'ay-2024-25', name: '2024-2025', start_date: '2024-07-01', end_date: '2025-06-30', is_current: 0 },
    ];
    for (const ay of academicYears) {
      execute(
        'INSERT OR IGNORE INTO academic_years (id, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)',
        [ay.id, ay.name, ay.start_date, ay.end_date, ay.is_current]
      );
    }

    const roles = [
      { id: 'role-super-admin', name: 'SUPER_ADMIN', description: 'Complete system-wide administrative control' },
      { id: 'role-dept-admin', name: 'DEPARTMENT_ADMIN', description: 'Department-level supervisor and analytics manager' },
      { id: 'role-faculty', name: 'FACULTY_COORDINATOR', description: 'Faculty advisor approving teams, events, and reviewing projects' },
      { id: 'role-club-admin', name: 'CLUB_ADMIN', description: 'Club leader managing events, members, attendance, and resources' },
      { id: 'role-club-member', name: 'CLUB_MEMBER', description: 'Enrolled club member participating in activities' },
      { id: 'role-student', name: 'STUDENT', description: 'Registered college student' },
    ];
    for (const r of roles) {
      execute('INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)', [r.id, r.name, r.description]);
    }

    for (const dept of PEC_DEPARTMENTS) {
      execute(
        `INSERT OR REPLACE INTO departments (id, name, code, description)
         VALUES (?, ?, ?, ?)`,
        [dept.id, dept.name, dept.code, dept.description]
      );
    }

    const baseUsers = [
      { id: 'usr-clubadmin', email: 'alex.clubadmin@techclubs.edu', name: 'Alex Rivera', role: 'role-club-admin', dept: 'dept-cse' },
      { id: 'usr-superadmin', email: 'superadmin@techclubs.edu', name: 'Dr. Evelyn Vance', role: 'role-super-admin', dept: 'dept-cse' },
      { id: 'usr-deptadmin', email: 'deptadmin.cse@techclubs.edu', name: 'Prof. Marcus Brody', role: 'role-dept-admin', dept: 'dept-cse' },
      { id: 'usr-faculty', email: 'dr.sharma@techclubs.edu', name: 'Dr. Anand Sharma', role: 'role-faculty', dept: 'dept-cse' },
      { id: 'usr-pec-admin', email: 'admin@pragati.ac.in', name: 'Dr. S. Sambhu Prasad', role: 'role-super-admin', dept: 'dept-cse' },
      { id: 'usr-pec-hod-cse', email: 'deptadmin.cse@pragati.ac.in', name: 'Dr. M. Radhika Mani', role: 'role-dept-admin', dept: 'dept-cse' },
      { id: 'usr-pec-faculty-ece', email: 'faculty.ece@pragati.ac.in', name: 'Dr. V. Sailaja', role: 'role-faculty', dept: 'dept-ece' },
      { id: 'usr-pec-president-cse', email: 'president.cse@pragati.ac.in', name: 'K. Sai Varun', role: 'role-club-admin', dept: 'dept-cse' },
      { id: 'usr-pec-student-cse', email: 'student.cse@pragati.ac.in', name: 'M. Ananya', role: 'role-club-member', dept: 'dept-cse' },
      { id: 'usr-pec-student-ece', email: 'student.ece@pragati.ac.in', name: 'P. Rohit Kumar', role: 'role-club-member', dept: 'dept-ece' },
    ];

    for (const u of baseUsers) {
      const existing = queryOne('SELECT id FROM users WHERE id = ? OR email = ?', [u.id, u.email]);
      if (!existing) {
        execute('INSERT INTO users (id, email, password_hash, is_active, is_verified) VALUES (?, ?, ?, 1, 1)', [u.id, u.email, pwdHash]);
        execute('INSERT INTO profiles (user_id, name, department_id) VALUES (?, ?, ?)', [u.id, u.name, u.dept]);
        execute('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [u.id, u.role]);
      } else {
        execute('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [existing.id, u.role]);
      }
    }

    // 3. Migrate any legacy mock clubs so foreign keys don't break
    const legacyMigrations: [string, string][] = [
      ['club-acm', 'pragsoft-club'],
      ['club-gdg', 'cloud-computing-club'],
      ['club-cybersec', 'cyber-security-club'],
      ['club-green-building', 'green-building-club'],
      ['club-gaming', 'gaming-club'],
      ['club-robotics', 'robotics-club'],
      ['club-ar-vr', 'ar-vr-club'],
      ['club-additive-mfg', 'additive-manufacturing-club'],
      ['club-aiml-turing', 'aiml-turing-club'],
      ['club-iot', 'iot-club'],
      ['club-ev', 'electric-vehicle-club'],
      ['club-data-analytics', 'data-analytics-club'],
      ['club-energy-mgmt', 'energy-management-club'],
      ['club-water-mgmt', 'water-management-club'],
      ['club-waste-mgmt', 'waste-management-club'],
      ['club-sanitation-hygiene', 'sanitation-hygiene-club'],
      ['club-rotaract', 'rotaract-club'],
      ['club-hope-for-change', 'hope-for-change-club'],
      ['club-sports-and-game', 'sports-and-game-club'],
      ['club-cultural', 'cultural-club'],
      ['club-greenary', 'greenary-club'],
      ['club-press', 'press-club'],
      ['club-toast-masters', 'toast-masters-club'],
      ['club-metaverse', 'metaverse-club'],
      ['club-pragsoft', 'pragsoft-club'],
      ['iei-me', 'iei-mechanical'],
      ['club-go-kart', 'go-kart-club'],
      ['club-spark-wit', 'spark-wit-club'],
      ['club-maths', 'maths-club'],
      ['iei-ce', 'iei-civil'],
      ['club-english', 'english-club'],
      ['club-acce-i', 'acce-i'],
    ];

    for (const [oldId, newId] of legacyMigrations) {
      if (oldId === newId) continue;
      const oldExists = queryOne('SELECT id FROM clubs WHERE id = ?', [oldId]);
      if (oldExists) {
        const clubDef = PEC_CLUBS.find(c => c.id === newId);
        if (clubDef) {
          execute(
            `INSERT OR IGNORE INTO clubs (
              id, institution_id, name, slug, description, category, department,
              faculty_coordinator, institution_logo_url, status, domains, objectives, department_id
            ) VALUES (?, 'pec', ?, ?, ?, ?, ?, ?, '/assets/institutions/pragati-engineering-college/logo.png', 'ACTIVE', ?, ?, ?)`,
            [
              clubDef.id,
              clubDef.name,
              clubDef.slug,
              clubDef.description,
              clubDef.category,
              clubDef.department,
              clubDef.faculty_coordinator,
              clubDef.domains,
              clubDef.objectives,
              clubDef.department_id,
            ]
          );
        }

        // Reassign foreign references
        try { execute('UPDATE events SET club_id = ? WHERE club_id = ?', [newId, oldId]); } catch {}
        try { execute('UPDATE memberships SET club_id = ? WHERE club_id = ?', [newId, oldId]); } catch {}
        try { execute('UPDATE club_teams SET club_id = ? WHERE club_id = ?', [newId, oldId]); } catch {}
        try { execute('UPDATE club_coordinators SET club_id = ? WHERE club_id = ?', [newId, oldId]); } catch {}
        try { execute('UPDATE announcements SET club_id = ? WHERE club_id = ?', [newId, oldId]); } catch {}
        try { execute('UPDATE resources SET club_id = ? WHERE club_id = ?', [newId, oldId]); } catch {}
        try { execute('UPDATE gallery SET club_id = ? WHERE club_id = ?', [newId, oldId]); } catch {}

        // Remove old mock club safely
        try { execute('DELETE FROM clubs WHERE id = ?', [oldId]); } catch {}
      }
    }

    // 4. Upsert all 35 Pragati University Clubs idempotently
    for (const club of PEC_CLUBS) {
      const existing = queryOne<any>('SELECT id FROM clubs WHERE id = ? OR slug = ?', [club.id, club.slug]);

      if (existing) {
        execute(
          `UPDATE clubs
           SET name = ?,
               slug = ?,
               institution_id = 'pec',
               category = ?,
               department = ?,
               department_id = ?,
               faculty_coordinator = ?,
               description = ?,
               domains = ?,
               objectives = ?,
               institution_logo_url = '/assets/institutions/pragati-engineering-college/logo.png',
               status = 'ACTIVE',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            club.name,
            club.slug,
            club.category,
            club.department,
            club.department_id,
            club.faculty_coordinator,
            club.description,
            club.domains,
            club.objectives,
            existing.id,
          ]
        );
      } else {
        execute(
          `INSERT INTO clubs (
            id, institution_id, name, slug, description, category, department,
            faculty_coordinator, institution_logo_url, status, domains, objectives, department_id
          ) VALUES (?, 'pec', ?, ?, ?, ?, ?, ?, '/assets/institutions/pragati-engineering-college/logo.png', 'ACTIVE', ?, ?, ?)`,
          [
            club.id,
            club.name,
            club.slug,
            club.description,
            club.category,
            club.department,
            club.faculty_coordinator,
            club.domains,
            club.objectives,
            club.department_id,
          ]
        );
      }

      // Ensure at least one coordinator mapping for admin actions
      try {
        execute(
          'INSERT OR IGNORE INTO club_coordinators (club_id, user_id, role_title) VALUES (?, ?, ?)',
          [club.id, 'usr-clubadmin', 'Club President']
        );
      } catch {}
    }

    // 5. Cleanup any other clubs not in the 35 list
    const validIds = PEC_CLUBS.map(c => `'${c.id}'`).join(',');
    const invalidClubs = queryAll<any>(`SELECT id, name FROM clubs WHERE id NOT IN (${validIds})`);
    for (const extra of invalidClubs) {
      console.log(`[Migration] Cleaning up unverified club: ${extra.name} (${extra.id})`);
      try { execute('UPDATE events SET club_id = ? WHERE club_id = ?', ['pragsoft-club', extra.id]); } catch {}
      try { execute('UPDATE memberships SET club_id = ? WHERE club_id = ?', ['pragsoft-club', extra.id]); } catch {}
      try { execute('DELETE FROM club_coordinators WHERE club_id = ?', [extra.id]); } catch {}
      try { execute('DELETE FROM club_teams WHERE club_id = ?', [extra.id]); } catch {}
      try { execute('DELETE FROM clubs WHERE id = ?', [extra.id]); } catch {}
    }

    const totalClubs = queryOne<any>('SELECT COUNT(*) as cnt FROM clubs');
    console.log(`[Migration] Verified: Exactly ${totalClubs?.cnt} official Pragati University clubs present in database.`);

    // 6. Ensure official Pragati University sample accounts exist with bcrypt password
    const institutionalUsers = [
      {
        id: 'usr-pec-admin',
        email: 'admin@pragati.ac.in',
        name: 'Dr. S. Sambhu Prasad',
        student_id: 'PRAG-ADMIN-01',
        dept_id: 'dept-cse',
        course: 'Principal & Chief Patron',
        phone: '+91 884 2383333',
        bio: 'Principal & Head of Institution, Pragati University',
        skills: 'Institutional Governance, Academic Accreditation, Autonomous Administration',
        role_id: 'role-super-admin',
      },
      {
        id: 'usr-pec-faculty-ece',
        email: 'faculty.ece@pragati.ac.in',
        name: 'Dr. V. Sailaja',
        student_id: 'PRAG-FAC-042',
        dept_id: 'dept-ece',
        course: 'Professor & Faculty Advisor',
        phone: '+91 884 2383334',
        bio: 'Professor & Student Chapter Coordinator, Dept. of Electronics & Communication Engineering',
        skills: 'Embedded Systems, IoT & Telecommunications, Student Guidance',
        role_id: 'role-faculty',
      },
      {
        id: 'usr-pec-student-cse',
        email: 'student.cse@pragati.ac.in',
        name: 'K. Sai Varun',
        student_id: '23A31A0501',
        dept_id: 'dept-cse',
        course: 'B.Tech Computer Science & Engineering',
        phone: '+91 98480 12345',
        bio: 'Undergraduate student and Technical Lead in PragSoft Chapter',
        skills: 'Full Stack Web Development, Python, Cloud Computing',
        role_id: 'role-club-member',
      },
    ];

    for (const u of institutionalUsers) {
      const uExists = queryOne('SELECT id FROM users WHERE email = ?', [u.email]);
      if (!uExists) {
        execute(
          'INSERT INTO users (id, email, password_hash, is_active, is_verified) VALUES (?, ?, ?, 1, 1)',
          [u.id, u.email, pwdHash]
        );
        execute(
          `INSERT INTO profiles (user_id, student_id, name, photograph, department_id, course, academic_year, phone, bio, skills)
           VALUES (?, ?, ?, ?, ?, ?, '2025-2026', ?, ?, ?)`,
          [
            u.id,
            u.student_id,
            u.name,
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            u.dept_id,
            u.course,
            u.phone,
            u.bio,
            u.skills
          ]
        );
        execute('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [u.id, u.role_id]);
      }
    }
    // 7. Run real data enrichment
    const { enrichPECDatabase } = await import('./pec_enrichment');
    await enrichPECDatabase();
  } catch (err) {
    console.error('[PEC Migration Error]', err);
  }
}
