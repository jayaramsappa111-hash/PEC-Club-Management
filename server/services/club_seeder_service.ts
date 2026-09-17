import { execute, queryOne, queryAll } from '../db/database';
import { PEC_CLUBS, PEC_DEPARTMENTS } from '../db/pec_clubs_data';

export interface ClubSeedResult {
  success: boolean;
  clubsCount: number;
  projectsCount: number;
  eventsCount: number;
  message: string;
}

/**
 * Service to seed and populate all 35 Pragati University clubs with realistic data,
 * sample project showcases, upcoming events, and comprehensive descriptions.
 */
export async function seedAllClubsAndShowcases(): Promise<ClubSeedResult> {
  console.log('[ClubSeederService] Starting comprehensive seeding for all 35 Pragati University clubs...');

  try {
    let clubsSeeded = 0;
    let projectsSeeded = 0;
    let eventsSeeded = 0;

    // 1. Ensure Departments exist
    for (const dept of PEC_DEPARTMENTS) {
      const existing = queryOne('SELECT id FROM departments WHERE id = ?', [dept.id]);
      if (!existing) {
        execute(
          'INSERT INTO departments (id, name, code, description) VALUES (?, ?, ?, ?)',
          [dept.id, dept.name, dept.code, dept.description]
        );
      }
    }

    // 2. Iterate and seed all 35 clubs from PEC_CLUBS
    for (const club of PEC_CLUBS) {
      const existingClub = queryOne('SELECT id FROM clubs WHERE id = ?', [club.id]);
      if (!existingClub) {
        execute(
          `INSERT INTO clubs (id, name, slug, category, department, department_id, faculty_coordinator, description, domains, objectives, logo_url, banner_url, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
          [
            club.id,
            club.name,
            club.slug,
            club.category,
            club.department,
            club.department_id,
            club.faculty_coordinator,
            club.description,
            club.domains,
            club.objectives,
            club.logo_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&auto=format&fit=crop&q=80',
            club.banner_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
          ]
        );
      } else {
        execute(
          `UPDATE clubs SET name = ?, slug = ?, category = ?, department = ?, department_id = ?, faculty_coordinator = ?, description = ?, domains = ?, objectives = ?, logo_url = ?, banner_url = ? WHERE id = ?`,
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
            club.logo_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&auto=format&fit=crop&q=80',
            club.banner_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
            club.id,
          ]
        );
      }
      clubsSeeded++;

      // 3. Ensure sample project showcases for each club
      const existingProjects = queryAll('SELECT id FROM projects WHERE club_id = ?', [club.id]);
      if (existingProjects.length === 0) {
        const projId1 = `proj-${club.id}-01`;
        const projId2 = `proj-${club.id}-02`;

        execute(
          `INSERT INTO projects (id, club_id, title, description, category, tech_stack, github_url, demo_url, status, lead_student)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS', 'K. Sai Varun')`,
          [
            projId1,
            club.id,
            `${club.name} Flagship System v2.0`,
            `An advanced enterprise solution engineered by members of ${club.name} focusing on real-time telemetry, modular architecture, and automated scalability.`,
            club.category,
            'TypeScript, React, Python, PostgreSQL',
            'https://github.com/pragati-univ/sample-project',
            'https://pragati.ac.in/projects',
          ]
        );

        execute(
          `INSERT INTO projects (id, club_id, title, description, category, tech_stack, github_url, demo_url, status, lead_student)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', 'M. Ananya')`,
          [
            projId2,
            club.id,
            `${club.name} Autonomous Research Suite`,
            `Research prototype developed under Pragati University Industry 4.0 initiative for low-latency edge computing and sensor integration.`,
            'Research & Innovation',
            'C++, Rust, PyTorch, Docker',
            'https://github.com/pragati-univ/research-suite',
            'https://pragati.ac.in/research',
          ]
        );
        projectsSeeded += 2;
      }

      // 4. Ensure upcoming events for each club
      const existingEvents = queryAll('SELECT id FROM events WHERE club_id = ?', [club.id]);
      if (existingEvents.length === 0) {
        const evtId = `evt-${club.id}-2026`;
        const eventDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        execute(
          `INSERT INTO events (id, title, description, club_id, department_id, venue, date, time, capacity, status, category, organizer, speaker)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'UPCOMING', 'Workshop', ?, ?)`,
          [
            evtId,
            `${club.name} Annual National Symposium & Hands-on Hackathon 2026`,
            `Join industry experts and student researchers for a 2-day immersive deep-dive into ${club.domains}. Includes live mentoring, project pitching, and certification.`,
            club.id,
            club.department_id,
            'Pragati Main Auditorium & Innovation Hub',
            eventDate,
            '10:00 AM - 4:00 PM',
            150,
            club.faculty_coordinator,
            'Dr. S. Sambhu Prasad & Industry Experts',
          ]
        );
        eventsSeeded++;
      }
    }

    console.log(`[ClubSeederService] Successfully seeded ${clubsSeeded} clubs, ${projectsSeeded} projects, and ${eventsSeeded} events.`);
    return {
      success: true,
      clubsCount: clubsSeeded,
      projectsCount: projectsSeeded,
      eventsCount: eventsSeeded,
      message: `Successfully populated ${clubsSeeded} clubs with realistic project showcases and upcoming events.`,
    };
  } catch (error: any) {
    console.error('[ClubSeederService] Error seeding clubs:', error);
    return {
      success: false,
      clubsCount: 0,
      projectsCount: 0,
      eventsCount: 0,
      message: `Failed to seed clubs: ${error.message}`,
    };
  }
}
