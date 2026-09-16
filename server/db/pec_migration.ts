import { db, queryAll, queryOne, execute } from './database';
import { PEC_DEPARTMENTS, PEC_CLUBS } from './pec_clubs_data';

export async function migratePECClubs(): Promise<void> {
  try {
    // 1. Ensure institutions record exists
    execute(`
      INSERT OR REPLACE INTO institutions (id, name, short_name, logo_url, website)
      VALUES (
        'pec',
        'Pragati Engineering College',
        'PEC',
        '/assets/institutions/pragati-engineering-college/logo.png',
        'https://pragati.ac.in/'
      )
    `);

    // 2. Ensure all 11 PEC departments exist
    for (const dept of PEC_DEPARTMENTS) {
      execute(
        `INSERT OR REPLACE INTO departments (id, name, code, description)
         VALUES (?, ?, ?, ?)`,
        [dept.id, dept.name, dept.code, dept.description]
      );
    }

    // 3. Migrate any legacy mock clubs so foreign keys don't break
    // club-acm -> club-pragsoft
    // club-gdg -> club-cloud-computing
    // club-cybersec -> club-cyber-security
    const legacyMigrations: [string, string][] = [
      ['club-acm', 'club-pragsoft'],
      ['club-gdg', 'club-cloud-computing'],
      ['club-cybersec', 'club-cyber-security'],
    ];

    for (const [oldId, newId] of legacyMigrations) {
      const oldExists = queryOne('SELECT id FROM clubs WHERE id = ?', [oldId]);
      if (oldExists) {
        // Ensure new club exists first before re-pointing references
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

        // Remove old mock club
        execute('DELETE FROM clubs WHERE id = ?', [oldId]);
      }
    }

    // 4. Upsert all 35 PEC Clubs idempotently
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
      execute(
        'INSERT OR IGNORE INTO club_coordinators (club_id, user_id, role_title) VALUES (?, ?, ?)',
        [club.id, 'usr-clubadmin', 'Club President']
      );
    }

    // 5. Cleanup any other clubs not in the 35 PEC clubs list
    const validIds = PEC_CLUBS.map(c => `'${c.id}'`).join(',');
    const invalidClubs = queryAll<any>(`SELECT id, name FROM clubs WHERE id NOT IN (${validIds})`);
    for (const extra of invalidClubs) {
      console.log(`[PEC Migration] Cleaning up unverified club: ${extra.name} (${extra.id})`);
      try { execute('UPDATE events SET club_id = ? WHERE club_id = ?', ['club-pragsoft', extra.id]); } catch {}
      try { execute('UPDATE memberships SET club_id = ? WHERE club_id = ?', ['club-pragsoft', extra.id]); } catch {}
      try { execute('DELETE FROM club_coordinators WHERE club_id = ?', [extra.id]); } catch {}
      try { execute('DELETE FROM club_teams WHERE club_id = ?', [extra.id]); } catch {}
      try { execute('DELETE FROM clubs WHERE id = ?', [extra.id]); } catch {}
    }

    const totalClubs = queryOne<any>('SELECT COUNT(*) as cnt FROM clubs');
    console.log(`[PEC Migration] Verified: Exactly ${totalClubs?.cnt} official Pragati Engineering College clubs present in database.`);
  } catch (err) {
    console.error('[PEC Migration Error]', err);
  }
}
