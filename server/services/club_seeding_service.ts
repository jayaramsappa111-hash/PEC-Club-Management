import { db, execute, queryOne, queryAll } from '../db/database';
import { PEC_CLUBS, PEC_DEPARTMENTS } from '../db/pec_clubs_data';

export async function seedAllClubsAndData(): Promise<void> {
  console.log('[ClubSeedingService] Ensuring all 35 clubs, project showcases, and upcoming events are fully populated...');

  // 1. Ensure departments exist (FK-safe idempotent insert + update)
  for (const dept of PEC_DEPARTMENTS) {
    const existing = queryOne('SELECT id FROM departments WHERE id = ? OR code = ?', [dept.id, dept.code]);
    if (!existing) {
      console.log(`[Seeder] Inserting department: ${dept.id} (${dept.name})`);
      execute(
        `INSERT INTO departments (id, name, code, description) VALUES (?, ?, ?, ?)`,
        [dept.id, dept.name, dept.code, dept.description]
      );
    } else {
      execute(
        `UPDATE departments SET name = ?, code = ?, description = ? WHERE id = ?`,
        [dept.name, dept.code, dept.description, existing.id]
      );
    }
  }

  // 2. Ensure institution exists (FK-safe idempotent insert + update)
  const instId = 'pec';
  const existingInst = queryOne('SELECT id FROM institutions WHERE id = ?', [instId]);
  if (!existingInst) {
    console.log(`[Seeder] Inserting institution: ${instId}`);
    execute(
      `INSERT INTO institutions (id, name, short_name, logo_url, website) VALUES (?, ?, ?, ?, ?)`,
      [instId, 'Pragati University', 'PU', '/assets/institutions/pragati-engineering-college/logo.png', 'https://pragati.ac.in/']
    );
  } else {
    execute(
      `UPDATE institutions SET name = ?, short_name = ?, logo_url = ?, website = ? WHERE id = ?`,
      ['Pragati University', 'PU', '/assets/institutions/pragati-engineering-college/logo.png', 'https://pragati.ac.in/', instId]
    );
  }

  // 3. Ensure academic year 'ay-2025-26' exists (parent for projects)
  const ayId = 'ay-2025-26';
  const existingAy = queryOne('SELECT id FROM academic_years WHERE id = ?', [ayId]);
  if (!existingAy) {
    console.log(`[Seeder] Inserting academic year: ${ayId}`);
    execute(
      `INSERT INTO academic_years (id, name, start_date, end_date, is_current) VALUES (?, '2025-2026', '2025-07-01', '2026-06-30', 1)`,
      [ayId]
    );
  }

  // Helper to ensure a user exists for created_by foreign keys
  const ensureUserExists = (userId: string, email: string, name: string, deptId: string) => {
    const u = queryOne('SELECT id FROM users WHERE id = ?', [userId]);
    if (!u) {
      try {
        console.log(`[Seeder] Ensuring fallback user exists: ${userId}`);
        execute(
          `INSERT INTO users (id, email, password_hash, is_active, is_verified) VALUES (?, ?, '$2a$10$dummyhash', 1, 1)`,
          [userId, email]
        );
        execute(
          `INSERT INTO profiles (user_id, name, department_id) VALUES (?, ?, ?)`,
          [userId, name, deptId]
        );
      } catch (err) {
        console.warn(`[Seeder Warning] Could not ensure user ${userId}:`, err);
      }
    }
  };

  // 4. Ensure all 35 clubs are seeded
  for (const club of PEC_CLUBS) {
    const existing = queryOne('SELECT id FROM clubs WHERE id = ? OR slug = ?', [club.id, club.slug]);
    if (!existing) {
      console.log(`[Seeder] Inserting club: ${club.id}`);
      execute(
        `INSERT INTO clubs (
          id, institution_id, name, slug, description, category, department,
          faculty_coordinator, institution_logo_url, logo_url, banner_url, status, domains, objectives, department_id
        ) VALUES (?, 'pec', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)`,
        [
          club.id,
          club.name,
          club.slug,
          club.description,
          club.category,
          club.department,
          club.faculty_coordinator,
          '/assets/institutions/pragati-engineering-college/logo.png',
          club.logo_url || 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=300&auto=format&fit=crop&q=80',
          club.banner_url || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
          club.domains,
          club.objectives,
          club.department_id,
        ]
      );
    } else {
      execute(
        `UPDATE clubs SET description = COALESCE(?, description), domains = COALESCE(?, domains), objectives = COALESCE(?, objectives), category = COALESCE(?, category) WHERE id = ?`,
        [club.description, club.domains, club.objectives, club.category, club.id]
      );
    }
  }

  // 5. Ensure sample project showcases for clubs
  const sampleProjects = [
    {
      id: 'proj-aerotelemetry',
      title: 'AeroTelemetry - UAV Flight Data Recorder',
      description: 'Real-time telemetry streaming system for autonomous quadcopters using ESP32, MQTT, and a React telemetry dashboard.',
      domain: 'Robotics & Embedded Systems',
      technologies: 'ESP32, MQTT, React, Node.js, WebSockets',
      department_id: 'dept-me',
      created_by: 'usr-pec-student-ece',
      is_featured: 1,
    },
    {
      id: 'proj-pragedullm',
      title: 'PragEduLLM - Campus Knowledge Assistant',
      description: 'RAG-powered AI assistant trained on Pragati University curriculum, lab manuals, and timetable datasets.',
      domain: 'Artificial Intelligence & NLP',
      technologies: 'Python, LangChain, FAISS, FastAPI, React',
      department_id: 'dept-cse',
      created_by: 'usr-pec-president-cse',
      is_featured: 1,
    },
    {
      id: 'proj-smartgrid',
      title: 'SmartGrid BMS - EV Battery Management',
      description: 'Advanced Battery Management System prototype monitoring cell voltage, temperature balancing, and state of charge.',
      domain: 'Electric Vehicles & Power Systems',
      technologies: 'Arduino, MATLAB/Simulink, CAN Bus, C++',
      department_id: 'dept-eee',
      created_by: 'usr-pec-student-eee',
      is_featured: 1,
    },
    {
      id: 'proj-zerowastegis',
      title: 'ZeroWaste-GIS Campus Mapping',
      description: 'Spatial mapping application for tracking campus waste segregation bins, recycling schedules, and carbon footprint reduction.',
      domain: 'Sustainable Infrastructure',
      technologies: 'Leaflet.js, PostGIS, Node.js, Tailwind CSS',
      department_id: 'dept-ce',
      created_by: 'usr-pec-student-ce',
      is_featured: 1,
    },
    {
      id: 'proj-cyberctf',
      title: 'PragatiSec VulnLab & CTF Range',
      description: 'Interactive cybersecurity training platform with vulnerable virtual machines and automated flag verification.',
      domain: 'Cyber Security & Ethical Hacking',
      technologies: 'Docker, Flask, React, Linux Kernel Security',
      department_id: 'dept-csecs',
      created_by: 'usr-pec-student-csecs',
      is_featured: 1,
    },
  ];

  for (const p of sampleProjects) {
    ensureUserExists(p.created_by, `${p.created_by}@pragati.ac.in`, 'Sample Student', p.department_id);
    const existing = queryOne('SELECT id FROM projects WHERE id = ?', [p.id]);
    if (!existing) {
      console.log(`[Seeder] Inserting project: ${p.id}`);
      try {
        execute(
          `INSERT INTO projects (id, title, description, domain, technologies, department_id, academic_year_id, created_by, is_featured, status)
           VALUES (?, ?, ?, ?, ?, ?, 'ay-2025-26', ?, ?, 'PUBLISHED')`,
          [p.id, p.title, p.description, p.domain, p.technologies, p.department_id, p.created_by, p.is_featured]
        );
      } catch (err) {
        console.error(`[Seeder Error] Failed to insert project ${p.id}:`, err);
        throw err;
      }
    }
  }

  // 6. Ensure upcoming events for clubs
  const sampleEvents = [
    {
      id: 'evt-techfest-2026',
      club_id: 'robotics-club',
      title: 'Pragati Annual TechFest & RoboWar 2026',
      slug: 'pragati-annual-techfest-robowar-2026',
      description: 'Flagship annual technical festival featuring combat robotics, hackathons, paper presentations, and industry keynote talks.',
      event_type: 'COMPETITION',
      start_datetime: '2026-10-15 09:00:00',
      end_datetime: '2026-10-17 18:00:00',
      venue: 'Main Auditorium & Open Air Theatre',
      eligibility: 'Open to all engineering students',
      capacity: 500,
      status: 'PUBLISHED',
      created_by: 'usr-pec-superadmin',
    },
    {
      id: 'evt-ai-symposium',
      club_id: 'aiml-turing-club',
      title: 'Generative AI & LLM Fine-Tuning Masterclass',
      slug: 'generative-ai-llm-fine-tuning-masterclass',
      description: 'Hands-on workshop exploring LoRA fine-tuning, HuggingFace transformers, and deploying open-weights models.',
      event_type: 'WORKSHOP',
      start_datetime: '2026-10-22 10:00:00',
      end_datetime: '2026-10-22 16:00:00',
      venue: 'CSE Seminar Hall 2',
      eligibility: 'CSE, IT, AI&DS Students (Year III & IV)',
      capacity: 120,
      status: 'PUBLISHED',
      created_by: 'usr-pec-hod-cse',
    },
    {
      id: 'evt-cloud-summit',
      club_id: 'gdsc-pec',
      title: 'Google Cloud Study Jam & Hackathon',
      slug: 'google-cloud-study-jam-hackathon',
      description: 'Learn serverless architecture, Kubernetes containerization, and build cloud-native applications for social impact.',
      event_type: 'HACKATHON',
      start_datetime: '2026-11-05 09:00:00',
      end_datetime: '2026-11-06 17:00:00',
      venue: 'IT Computer Labs 1 & 2',
      eligibility: 'All Registered Club Members',
      capacity: 150,
      status: 'PUBLISHED',
      created_by: 'usr-pec-faculty-it',
    },
  ];

  for (const evt of sampleEvents) {
    ensureUserExists(evt.created_by, `${evt.created_by}@pragati.ac.in`, 'Sample Admin', 'dept-cse');
    const clubExists = queryOne('SELECT id FROM clubs WHERE id = ?', [evt.club_id]);
    if (!clubExists) {
      console.warn(`[Seeder Warning] Club ${evt.club_id} for event ${evt.id} does not exist.`);
      continue;
    }
    const existing = queryOne('SELECT id FROM events WHERE id = ?', [evt.id]);
    if (!existing) {
      console.log(`[Seeder] Inserting event: ${evt.id}`);
      try {
        execute(
          `INSERT INTO events (id, club_id, title, slug, description, event_type, start_datetime, end_datetime, venue, eligibility, capacity, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            evt.id,
            evt.club_id,
            evt.title,
            evt.slug,
            evt.description,
            evt.event_type,
            evt.start_datetime,
            evt.end_datetime,
            evt.venue,
            evt.eligibility,
            evt.capacity,
            evt.status,
            evt.created_by,
          ]
        );
      } catch (err) {
        console.error(`[Seeder Error] Failed to insert event ${evt.id}:`, err);
        throw err;
      }
    }
  }

  console.log('[ClubSeedingService] Successfully populated all clubs, projects, and upcoming events.');
}

