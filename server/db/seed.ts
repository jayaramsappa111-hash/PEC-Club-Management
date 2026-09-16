import bcrypt from 'bcryptjs';
import { db, queryOne, execute } from './database';
import { initSchema } from './schema';
import { migratePECClubs } from './pec_migration';

export async function seedDatabase() {
  initSchema();

  // Guarantee Pragati Engineering College official data is present and migrated
  await migratePECClubs();

  // Check if already seeded
  const existingUser = queryOne('SELECT id FROM users LIMIT 1');
  if (existingUser) {
    return;
  }

  console.log('[Seed] Seeding database with production-grade relational records...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Roles
  const roles = [
    { id: 'role-super-admin', name: 'SUPER_ADMIN', description: 'Complete system-wide administrative control' },
    { id: 'role-dept-admin', name: 'DEPARTMENT_ADMIN', description: 'Department-level supervisor and analytics manager' },
    { id: 'role-faculty', name: 'FACULTY_COORDINATOR', description: 'Faculty advisor approving teams, events, and reviewing projects' },
    { id: 'role-club-admin', name: 'CLUB_ADMIN', description: 'Club leader managing events, members, attendance, and resources' },
    { id: 'role-club-member', name: 'CLUB_MEMBER', description: 'Enrolled club member participating in activities' },
    { id: 'role-student', name: 'STUDENT', description: 'Registered college student' },
  ];

  for (const r of roles) {
    execute('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)', [r.id, r.name, r.description]);
  }

  // 2. Permissions
  const permissions = [
    'users.read', 'users.create', 'users.update', 'users.delete',
    'clubs.read', 'clubs.create', 'clubs.update', 'clubs.approve',
    'events.read', 'events.create', 'events.update', 'events.approve',
    'attendance.read', 'attendance.manage',
    'certificates.read', 'certificates.issue', 'certificates.revoke',
    'projects.read', 'projects.review', 'projects.approve',
    'resources.read', 'resources.manage',
    'reports.read', 'reports.generate',
    'audit.read'
  ];

  for (const p of permissions) {
    execute('INSERT INTO permissions (id, name, description) VALUES (?, ?, ?)', [p, p, `Permission for ${p}`]);
  }

  // Map permissions to roles
  // Super Admin gets all
  for (const p of permissions) {
    execute('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', ['role-super-admin', p]);
  }

  // Dept Admin
  const deptPermissions = ['users.read', 'clubs.read', 'clubs.create', 'events.read', 'projects.read', 'resources.read', 'reports.read', 'reports.generate'];
  for (const p of deptPermissions) {
    execute('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', ['role-dept-admin', p]);
  }

  // Faculty
  const facultyPermissions = ['clubs.read', 'clubs.approve', 'events.read', 'events.approve', 'projects.read', 'projects.review', 'projects.approve', 'certificates.read', 'reports.read'];
  for (const p of facultyPermissions) {
    execute('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', ['role-faculty', p]);
  }

  // Club Admin
  const clubAdminPermissions = ['clubs.read', 'clubs.update', 'events.read', 'events.create', 'events.update', 'attendance.read', 'attendance.manage', 'certificates.read', 'certificates.issue', 'projects.read', 'resources.read', 'resources.manage', 'reports.read'];
  for (const p of clubAdminPermissions) {
    execute('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', ['role-club-admin', p]);
  }

  // Club Member
  const memberPermissions = ['clubs.read', 'events.read', 'certificates.read', 'projects.read', 'resources.read'];
  for (const p of memberPermissions) {
    execute('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', ['role-club-member', p]);
  }

  // Student
  const studentPermissions = ['clubs.read', 'events.read', 'certificates.read', 'projects.read', 'resources.read'];
  for (const p of studentPermissions) {
    execute('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', ['role-student', p]);
  }

  // 3. Departments
  const departments = [
    { id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science and Systems Engineering' },
    { id: 'dept-aids', name: 'Artificial Intelligence & Data Science', code: 'AI&DS', description: 'Department of Intelligent Computing, ML and Big Data Analytics' },
    { id: 'dept-ece', name: 'Electronics & Communication', code: 'ECE', description: 'Department of Embedded Systems, VLSI and Wireless Networks' },
    { id: 'dept-it', name: 'Information Technology', code: 'IT', description: 'Department of Cloud Computing, DevOps and Web Systems' },
  ];

  for (const d of departments) {
    execute('INSERT INTO departments (id, name, code, description) VALUES (?, ?, ?, ?)', [d.id, d.name, d.code, d.description]);
  }

  // 4. Academic Years
  const academicYears = [
    { id: 'ay-2025-26', name: '2025-2026', start_date: '2025-07-01', end_date: '2026-06-30', is_current: 1 },
    { id: 'ay-2024-25', name: '2024-2025', start_date: '2024-07-01', end_date: '2025-06-30', is_current: 0 },
  ];

  for (const ay of academicYears) {
    execute('INSERT INTO academic_years (id, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)', [ay.id, ay.name, ay.start_date, ay.end_date, ay.is_current]);
  }

  // 5. Users and Profiles
  const usersToSeed = [
    {
      id: 'usr-superadmin',
      email: 'superadmin@techclubs.edu',
      name: 'Dr. Evelyn Vance',
      student_id: 'FAC-SA-01',
      dept_id: 'dept-cse',
      course: 'Faculty / Administration',
      academic_year: '2025-2026',
      phone: '+1 555 019 9001',
      bio: 'Dean of Student Affairs and Super Administrator for Technical Clubs',
      skills: 'System Governance, Academic Accreditation, Policy',
      role: 'role-super-admin',
    },
    {
      id: 'usr-deptadmin',
      email: 'deptadmin.cse@techclubs.edu',
      name: 'Prof. Marcus Brody',
      student_id: 'FAC-DA-02',
      dept_id: 'dept-cse',
      course: 'Faculty / HOD Office',
      academic_year: '2025-2026',
      phone: '+1 555 019 9002',
      bio: 'Department Coordinator and Head of Department Delegate for Technical Societal Clubs',
      skills: 'Curriculum Alignment, Lab Allocations, Project Oversight',
      role: 'role-dept-admin',
    },
    {
      id: 'usr-faculty',
      email: 'dr.sharma@techclubs.edu',
      name: 'Dr. Anand Sharma',
      student_id: 'FAC-FC-03',
      dept_id: 'dept-cse',
      course: 'Associate Professor',
      academic_year: '2025-2026',
      phone: '+1 555 019 9003',
      bio: 'Faculty Advisor for ACM & Open Source Societies with 14 years research experience in Distributed Systems',
      skills: 'Distributed Systems, Cloud Architecture, Peer Mentoring',
      role: 'role-faculty',
    },
    {
      id: 'usr-clubadmin',
      email: 'alex.clubadmin@techclubs.edu',
      name: 'Alex Rivera',
      student_id: 'STU-2023-CS-041',
      dept_id: 'dept-cse',
      course: 'B.Tech Computer Science',
      academic_year: '2025-2026',
      phone: '+1 555 019 9004',
      bio: 'President of ACM Student Chapter, avid open-source maintainer and systems programmer',
      skills: 'Go, Rust, Kubernetes, React, Event Operations',
      role: 'role-club-admin',
    },
    {
      id: 'usr-priya',
      email: 'student.priya@techclubs.edu',
      name: 'Priya Narayanan',
      student_id: 'STU-2024-AI-108',
      dept_id: 'dept-aids',
      course: 'B.Tech AI & Data Science',
      academic_year: '2025-2026',
      phone: '+1 555 019 9005',
      bio: 'Technical Core Team Member and Machine Learning enthusiast participating in Hackathons',
      skills: 'Python, PyTorch, FastAPI, Next.js, Computer Vision',
      role: 'role-club-member',
    },
    {
      id: 'usr-rahul',
      email: 'student.rahul@techclubs.edu',
      name: 'Rahul Deshmukh',
      student_id: 'STU-2024-CS-215',
      dept_id: 'dept-cse',
      course: 'B.Tech Computer Science',
      academic_year: '2025-2026',
      phone: '+1 555 019 9006',
      bio: 'Sophomore student exploring cloud infrastructure, web development, and robotics',
      skills: 'JavaScript, TypeScript, Docker, Linux, C++',
      role: 'role-student',
    },
  ];

  for (const u of usersToSeed) {
    execute(
      'INSERT INTO users (id, email, password_hash, is_active, is_verified) VALUES (?, ?, ?, 1, 1)',
      [u.id, u.email, passwordHash]
    );

    execute(
      `INSERT INTO profiles (user_id, student_id, name, photograph, department_id, course, academic_year, phone, bio, skills)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        u.id,
        u.student_id,
        u.name,
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`,
        u.dept_id,
        u.course,
        u.academic_year,
        u.phone,
        u.bio,
        u.skills
      ]
    );

    execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [u.id, u.role]);
  }

  // 6. Clubs
  const clubs = [
    {
      id: 'club-acm',
      name: 'ACM Student Chapter',
      slug: 'acm-student-chapter',
      logo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop&q=80',
      description: 'The premier student chapter affiliated with ACM Global, driving computing algorithms, competitive programming, and research.',
      objectives: 'Advance algorithmic competence, foster technical research papers, conduct flagship annual hackathons, and provide mentorship.',
      domains: 'Algorithms, High-Performance Systems, Web Platforms, Cloud',
      department_id: 'dept-cse',
      faculty_coordinator_id: 'usr-faculty',
      status: 'ACTIVE'
    },
    {
      id: 'club-gdg',
      name: 'Google Developer Student Club',
      slug: 'gdsc-campus',
      logo: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=200&auto=format&fit=crop&q=80',
      description: 'University-based community group for students interested in Google developer technologies, mobile app dev, and cloud computing.',
      objectives: 'Bridge the gap between theory and industry application through Google technologies, Android, Cloud, and Gemini AI solutions.',
      domains: 'Mobile (Flutter/Android), Cloud & DevOps, AI/ML, Firebase',
      department_id: 'dept-it',
      faculty_coordinator_id: 'usr-faculty',
      status: 'ACTIVE'
    },
    {
      id: 'club-robotics',
      name: 'Robotics & Embedded Systems Club',
      slug: 'robotics-embedded-club',
      logo: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&auto=format&fit=crop&q=80',
      description: 'Hardware engineering and robotics collective designing autonomous ground vehicles, drone swarms, and edge IoT nodes.',
      objectives: 'Equip engineering students with PCB design, ROS2 simulation, mechanical prototyping, and micro-controller programming skills.',
      domains: 'Robotics, IoT, Embedded C/C++, ROS2, PCB Design',
      department_id: 'dept-ece',
      faculty_coordinator_id: 'usr-faculty',
      status: 'ACTIVE'
    },
    {
      id: 'club-cybersec',
      name: 'Cyber Security & Offensive Research Club',
      slug: 'cybersec-offensive-research',
      logo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&auto=format&fit=crop&q=80',
      description: 'Offensive and defensive security lab focusing on CTF competitions, binary exploitation, secure code audit, and digital forensics.',
      objectives: 'Conduct weekly capture-the-flag drills, audit campus technical projects for OWASP Top 10 vulnerabilities, and promote ethical hacking.',
      domains: 'Web Security, Cryptography, Reverse Engineering, Forensics',
      department_id: 'dept-cse',
      faculty_coordinator_id: 'usr-faculty',
      status: 'ACTIVE'
    }
  ];

  for (const c of clubs) {
    execute(
      `INSERT INTO clubs (id, name, slug, logo, description, objectives, domains, department_id, faculty_coordinator_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.slug, c.logo, c.description, c.objectives, c.domains, c.department_id, c.faculty_coordinator_id, c.status]
    );

    // Add coordinator mapping
    execute(
      'INSERT OR IGNORE INTO club_coordinators (club_id, user_id, role_title) VALUES (?, ?, ?)',
      [c.id, 'usr-clubadmin', 'Club President']
    );
  }

  // 7. Club Teams
  const teamId = 'team-acm-2025-26';
  execute(
    `INSERT INTO club_teams (id, club_id, academic_year_id, name, status, approved_by, approved_at)
     VALUES (?, ?, ?, ?, 'ACTIVE', 'usr-faculty', CURRENT_TIMESTAMP)`,
    [teamId, 'club-acm', 'ay-2025-26', 'Executive Board 2025-2026']
  );

  execute(
    `INSERT INTO club_team_members (id, team_id, user_id, position, responsibilities)
     VALUES (?, ?, ?, ?, ?)`,
    ['tm-01', teamId, 'usr-clubadmin', 'President', 'General governance, institutional liaison, and annual roadmap planning']
  );

  execute(
    `INSERT INTO club_team_members (id, team_id, user_id, position, responsibilities)
     VALUES (?, ?, ?, ?, ?)`,
    ['tm-02', teamId, 'usr-priya', 'Technical Lead', 'Technical workshops, hackathon platform management, code reviews']
  );

  // 8. Memberships with digital card verification
  const memberships = [
    {
      id: 'mem-001',
      membership_id: 'TC-2026-000001',
      user_id: 'usr-clubadmin',
      club_id: 'club-acm',
      ay_id: 'ay-2025-26',
      status: 'ACTIVE',
      valid_until: '2026-06-30'
    },
    {
      id: 'mem-002',
      membership_id: 'TC-2026-000002',
      user_id: 'usr-priya',
      club_id: 'club-acm',
      ay_id: 'ay-2025-26',
      status: 'ACTIVE',
      valid_until: '2026-06-30'
    },
    {
      id: 'mem-003',
      membership_id: 'TC-2026-000003',
      user_id: 'usr-rahul',
      club_id: 'club-acm',
      ay_id: 'ay-2025-26',
      status: 'ACTIVE',
      valid_until: '2026-06-30'
    },
    {
      id: 'mem-004',
      membership_id: 'TC-2026-000004',
      user_id: 'usr-priya',
      club_id: 'club-gdg',
      ay_id: 'ay-2025-26',
      status: 'ACTIVE',
      valid_until: '2026-06-30'
    }
  ];

  for (const m of memberships) {
    execute(
      `INSERT INTO memberships (id, membership_id, user_id, club_id, academic_year_id, status, valid_until)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [m.id, m.membership_id, m.user_id, m.club_id, m.ay_id, m.status, m.valid_until]
    );
  }

  // 9. Events
  const events = [
    {
      id: 'evt-ai-hackathon',
      club_id: 'club-acm',
      title: 'Full-Stack AI & Cloud Hackathon 2026',
      slug: 'full-stack-ai-cloud-hackathon-2026',
      description: 'A 24-hour campus hackathon challenging teams to architect production web applications using modern Cloud, Vector Databases, and generative models.',
      event_type: 'HACKATHON',
      start_datetime: '2026-09-20 09:00:00',
      end_datetime: '2026-09-21 17:00:00',
      venue: 'Main Auditorium & Innovation Lab Complex',
      eligibility: 'All 2nd, 3rd, and 4th year Engineering students',
      capacity: 120,
      registration_deadline: '2026-09-19 23:59:00',
      poster: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
      circular: 'CIRC-2026-ACM-01',
      status: 'REGISTRATION_OPEN',
      created_by: 'usr-clubadmin',
      approved_by: 'usr-faculty'
    },
    {
      id: 'evt-rust-microservices',
      club_id: 'club-acm',
      title: 'Deep Dive: High-Performance Systems with Rust',
      slug: 'deep-dive-rust-systems',
      description: 'Hands-on intensive masterclass on memory safety, concurrency, async Tokio runtime, and building sub-millisecond REST/gRPC microservices.',
      event_type: 'WORKSHOP',
      start_datetime: '2026-09-10 14:00:00',
      end_datetime: '2026-09-10 18:00:00',
      venue: 'Computing Lab 4, CSE Block',
      eligibility: 'Open to all students with basic C/C++/Java background',
      capacity: 60,
      registration_deadline: '2026-09-09 18:00:00',
      poster: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      circular: 'CIRC-2026-ACM-02',
      status: 'COMPLETED',
      created_by: 'usr-clubadmin',
      approved_by: 'usr-faculty'
    },
    {
      id: 'evt-robotics-bootcamp',
      club_id: 'club-robotics',
      title: 'Autonomous Drone & Edge Computing Workshop',
      slug: 'drone-edge-computing-workshop',
      description: 'Physical build workshop integrating Raspberry Pi 5 with PX4 flight controllers, ROS2 nodes, and live camera feed object detection.',
      event_type: 'WORKSHOP',
      start_datetime: '2026-09-25 10:00:00',
      end_datetime: '2026-09-25 16:30:00',
      venue: 'Mechatronics Tinkering Studio',
      eligibility: 'Open to all branches',
      capacity: 45,
      registration_deadline: '2026-09-24 17:00:00',
      poster: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop&q=80',
      circular: 'CIRC-2026-ROB-03',
      status: 'PUBLISHED',
      created_by: 'usr-clubadmin',
      approved_by: 'usr-faculty'
    }
  ];

  for (const e of events) {
    execute(
      `INSERT INTO events (id, club_id, title, slug, description, event_type, start_datetime, end_datetime, venue, eligibility, capacity, registration_deadline, poster, circular, status, created_by, approved_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.id, e.club_id, e.title, e.slug, e.description, e.event_type, e.start_datetime, e.end_datetime, e.venue, e.eligibility, e.capacity, e.registration_deadline, e.poster, e.circular, e.status, e.created_by, e.approved_by]
    );
  }

  // 10. Registrations & Attendance for the completed event
  // Priya registered and attended
  const regPriya = 'reg-priya-rust';
  execute(
    `INSERT INTO event_registrations (id, event_id, user_id, status, qr_code_token)
     VALUES (?, ?, ?, 'CONFIRMED', ?)`,
    [regPriya, 'evt-rust-microservices', 'usr-priya', 'QR-EVT-RUST-PRIYA-001']
  );

  execute(
    `INSERT INTO event_attendance (id, event_id, registration_id, user_id, check_in_time, status, recorded_by)
     VALUES (?, ?, ?, ?, '2026-09-10 13:52:10', 'PRESENT', 'usr-clubadmin')`,
    ['att-001', 'evt-rust-microservices', regPriya, 'usr-priya']
  );

  // Feedback from Priya
  execute(
    `INSERT INTO event_feedback (id, event_id, user_id, rating, comments, suggestions)
     VALUES (?, ?, ?, 5, 'Exceptional hands-on clarity regarding borrow checker and Tokio threads!', 'More time on gRPC streaming in the next workshop.')`,
    ['fb-001', 'evt-rust-microservices', 'usr-priya']
  );

  // Rahul registered and attended
  const regRahul = 'reg-rahul-rust';
  execute(
    `INSERT INTO event_registrations (id, event_id, user_id, status, qr_code_token)
     VALUES (?, ?, ?, 'CONFIRMED', ?)`,
    [regRahul, 'evt-rust-microservices', 'usr-rahul', 'QR-EVT-RUST-RAHUL-002']
  );

  execute(
    `INSERT INTO event_attendance (id, event_id, registration_id, user_id, check_in_time, status, recorded_by)
     VALUES (?, ?, ?, ?, '2026-09-10 14:02:40', 'PRESENT', 'usr-clubadmin')`,
    ['att-002', 'evt-rust-microservices', regRahul, 'usr-rahul']
  );

  // Priya also registered for the upcoming Hackathon
  execute(
    `INSERT INTO event_registrations (id, event_id, user_id, status, qr_code_token)
     VALUES (?, ?, ?, 'CONFIRMED', ?)`,
    ['reg-priya-hackathon', 'evt-ai-hackathon', 'usr-priya', 'QR-EVT-HACK-PRIYA-003']
  );

  // 11. Certificates for completed event
  const certId = 'CERT-2026-08149';
  execute(
    `INSERT INTO certificates (id, certificate_id, student_id, event_id, certificate_type, verification_token, status)
     VALUES (?, ?, ?, ?, 'MERIT', ?, 'VALID')`,
    ['cert-priya-01', certId, 'usr-priya', 'evt-rust-microservices', 'VERIFY-TOKEN-RUST-PRIYA-9821']
  );

  const certRahul = 'CERT-2026-08150';
  execute(
    `INSERT INTO certificates (id, certificate_id, student_id, event_id, certificate_type, verification_token, status)
     VALUES (?, ?, ?, ?, 'PARTICIPATION', ?, 'VALID')`,
    ['cert-rahul-02', certRahul, 'usr-rahul', 'evt-rust-microservices', 'VERIFY-TOKEN-RUST-RAHUL-3312']
  );

  // 12. Projects
  const projects = [
    {
      id: 'proj-rover',
      title: 'Autonomous Campus Navigation Rover',
      description: 'LIDAR-guided autonomous ground robot utilizing SLAM navigation, ROS2, and local obstacle avoidance for inter-department parcel dispatch.',
      domain: 'Robotics & Embedded Systems',
      technologies: 'C++, ROS2, Nav2, Raspberry Pi, Python, OpenCV',
      department_id: 'dept-ece',
      academic_year_id: 'ay-2025-26',
      github_url: 'https://github.com/techclubs/campus-autonomous-rover',
      demo_url: 'https://rover-telemetry.techclubs.edu',
      documentation_url: 'https://docs.techclubs.edu/projects/rover',
      status: 'PUBLISHED',
      created_by: 'usr-priya',
      is_featured: 1
    },
    {
      id: 'proj-smart-rfid',
      title: 'Edge RFID & Biometric Gate Pass System',
      description: 'High-throughput hardware gate terminal authenticating student digital membership credentials in under 200ms using encrypted NFC and local SQLite cache.',
      domain: 'IoT & Security',
      technologies: 'ESP32, MicroPython, SQLite, WebSockets, Tailwind',
      department_id: 'dept-cse',
      academic_year_id: 'ay-2025-26',
      github_url: 'https://github.com/techclubs/edge-gate-pass',
      demo_url: 'https://gate.techclubs.edu',
      documentation_url: 'https://docs.techclubs.edu/projects/gate-pass',
      status: 'PUBLISHED',
      created_by: 'usr-rahul',
      is_featured: 1
    },
    {
      id: 'proj-cert-verifier',
      title: 'Cryptographic Certificate Verification Ledger',
      description: 'Tamper-resistant digital credentials issuing engine with QR verification, cryptographic checksums, and zero-knowledge student privacy checks.',
      domain: 'Web & Distributed Systems',
      technologies: 'TypeScript, Node.js, WebCrypto, PDFKit, PostgreSQL',
      department_id: 'dept-cse',
      academic_year_id: 'ay-2025-26',
      github_url: 'https://github.com/techclubs/crypto-credential-ledger',
      demo_url: 'https://verify.techclubs.edu',
      documentation_url: 'https://docs.techclubs.edu/projects/credentials',
      status: 'APPROVED',
      created_by: 'usr-clubadmin',
      is_featured: 0
    }
  ];

  for (const pr of projects) {
    execute(
      `INSERT INTO projects (id, title, description, domain, technologies, department_id, academic_year_id, github_url, demo_url, documentation_url, status, created_by, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pr.id, pr.title, pr.description, pr.domain, pr.technologies, pr.department_id, pr.academic_year_id, pr.github_url, pr.demo_url, pr.documentation_url, pr.status, pr.created_by, pr.is_featured]
    );

    // Add project member
    execute(
      `INSERT INTO project_members (id, project_id, user_id, role)
       VALUES (?, ?, ?, 'Lead Architect')`,
      [`pm-${pr.id}`, pr.id, pr.created_by]
    );

    // Add faculty review
    execute(
      `INSERT INTO project_reviews (id, project_id, reviewer_id, rating, remarks, decision)
       VALUES (?, ?, ?, 9, 'Outstanding engineering documentation, clean commit history, and genuine hardware safety fail-safes verified in lab.', 'APPROVED')`,
      [`prv-${pr.id}`, pr.id, 'usr-faculty']
    );
  }

  // 13. Learning Resources
  const resources = [
    {
      id: 'res-01',
      title: 'Modern Distributed Systems Architecture Blueprint',
      description: 'Comprehensive guide covering consensus algorithms, event-driven streaming, idempotency patterns, and partition tolerance in cloud environments.',
      type: 'document',
      domain: 'Systems Engineering',
      technology: 'Distributed Systems, Kafka, Go',
      difficulty: 'INTERMEDIATE',
      semester: 'Semester 5-6',
      author_id: 'usr-faculty',
      club_id: 'club-acm',
      tags: 'distributed, kafka, systems, cloud',
      file_url: 'https://raw.githubusercontent.com/donnemartin/system-design-primer/master/README.md',
      status: 'PUBLISHED'
    },
    {
      id: 'res-02',
      title: 'FastAPI Production Microservices with SQLAlchemy',
      description: 'Production patterns for building type-safe APIs, connection pooling, background worker queues, and automated OpenAPI documentation.',
      type: 'tutorial',
      domain: 'Backend Development',
      technology: 'Python, FastAPI, PostgreSQL',
      difficulty: 'BEGINNER',
      semester: 'Semester 3-4',
      author_id: 'usr-clubadmin',
      club_id: 'club-acm',
      tags: 'python, fastapi, backend, api',
      file_url: 'https://fastapi.tiangolo.com/tutorial/',
      status: 'PUBLISHED'
    },
    {
      id: 'res-03',
      title: 'Embedded ROS2 Robotics & Navigation Stack Hands-on',
      description: 'Step-by-step laboratory tutorial on setting up ROS2 Humble nodes, sensor fusion with robot_localization, and autonomous path planning.',
      type: 'presentation',
      domain: 'Robotics',
      technology: 'ROS2, C++, Linux',
      difficulty: 'ADVANCED',
      semester: 'Semester 6-7',
      author_id: 'usr-faculty',
      club_id: 'club-robotics',
      tags: 'robotics, ros2, lidar, navigation',
      file_url: 'https://docs.ros.org/en/humble/Tutorials.html',
      status: 'PUBLISHED'
    },
    {
      id: 'res-04',
      title: 'OWASP Top 10 Web Application Security Audit Checklist',
      description: 'Methodical testing guide for identifying injection vulnerabilities, broken object level authorization, and SSRF in student-built portals.',
      type: 'notes',
      domain: 'Cybersecurity',
      technology: 'Burp Suite, OWASP, Security',
      difficulty: 'INTERMEDIATE',
      semester: 'Semester 4-6',
      author_id: 'usr-clubadmin',
      club_id: 'club-cybersec',
      tags: 'security, owasp, penetration-testing',
      file_url: 'https://owasp.org/www-project-top-ten/',
      status: 'PUBLISHED'
    }
  ];

  for (const res of resources) {
    execute(
      `INSERT INTO resources (id, title, description, type, domain, technology, difficulty, semester, author_id, club_id, tags, file_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [res.id, res.title, res.description, res.type, res.domain, res.technology, res.difficulty, res.semester, res.author_id, res.club_id, res.tags, res.file_url, res.status]
    );
  }

  // Bookmark for Priya
  execute('INSERT INTO resource_bookmarks (user_id, resource_id) VALUES (?, ?)', ['usr-priya', 'res-01']);
  execute('INSERT INTO resource_progress (user_id, resource_id, status) VALUES (?, ?, ?)', ['usr-priya', 'res-01', 'COMPLETED']);

  // 14. Roadmaps & Modules
  const roadmaps = [
    {
      id: 'rdm-fullstack',
      title: 'Full-Stack Cloud & Systems Architect',
      slug: 'fullstack-cloud-systems',
      description: 'From modern frontend ergonomics to highly resilient backend services, relational databases, and containerized deployment.',
      level: 'INTERMEDIATE',
      domain: 'Software Engineering',
      prerequisites: 'Basic programming in Python or JavaScript, Git version control basics',
      modules: [
        {
          id: 'mod-fs-01',
          title: 'TypeScript & Modern Component Architectures',
          description: 'Type safety, functional composition, state lifecycle, and clean interface segregation.',
          order_index: 1,
          resources: ['res-02']
        },
        {
          id: 'mod-fs-02',
          title: 'Relational Database Schema Design & Normalization',
          description: 'Primary keys, foreign keys, indexing strategies, transactions, and migration scripts.',
          order_index: 2,
          resources: ['res-01']
        },
        {
          id: 'mod-fs-03',
          title: 'Containerization, Linux Networking & Reverse Proxies',
          description: 'Docker multi-stage builds, ingress routing, port binding, and health probes.',
          order_index: 3,
          resources: ['res-01']
        }
      ]
    },
    {
      id: 'rdm-ai-ml',
      title: 'Machine Learning & Applied Intelligent Systems',
      slug: 'ml-applied-intelligence',
      description: 'Statistical foundations, deep learning pipelines, vector retrieval, and deploying inference servers on GPUs.',
      level: 'ADVANCED',
      domain: 'Artificial Intelligence',
      prerequisites: 'Linear algebra, Multivariable calculus, Python proficiency',
      modules: [
        {
          id: 'mod-ai-01',
          title: 'Data Ingestion & Feature Engineering Pipelines',
          description: 'Pandas, NumPy matrix operations, outlier imputation, and dataset sharding.',
          order_index: 1,
          resources: ['res-02']
        },
        {
          id: 'mod-ai-02',
          title: 'Deep Learning Architectures & Transformer Attention',
          description: 'PyTorch tensors, autograd, backpropagation, and self-attention heads.',
          order_index: 2,
          resources: ['res-01']
        }
      ]
    }
  ];

  for (const rd of roadmaps) {
    execute(
      `INSERT INTO roadmaps (id, title, slug, description, level, domain, prerequisites)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [rd.id, rd.title, rd.slug, rd.description, rd.level, rd.domain, rd.prerequisites]
    );

    for (const m of rd.modules) {
      execute(
        `INSERT INTO roadmap_modules (id, roadmap_id, title, description, order_index, resources_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [m.id, rd.id, m.title, m.description, m.order_index, JSON.stringify(m.resources)]
      );
    }
  }

  // Student progress
  execute(
    'INSERT INTO student_roadmap_progress (user_id, roadmap_id, module_id) VALUES (?, ?, ?)',
    ['usr-priya', 'rdm-fullstack', 'mod-fs-01']
  );

  // Skill Badges
  execute(
    `INSERT INTO skill_badges (id, user_id, title, description, badge_icon, criteria)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['bdg-01', 'usr-priya', 'Full-Stack Foundations Scholar', 'Successfully mastered TypeScript, React components, and relational API design.', 'code-2', 'Roadmap Module Completion']
  );

  // 15. Software Tools Directory
  const tools = [
    {
      id: 'tool-docker',
      name: 'Docker Engine & Compose',
      category: 'DevOps & Containers',
      purpose: 'Building, packaging, and orchestrating reproducible multi-container software environments.',
      platform: 'Linux, macOS, Windows',
      license: 'Apache 2.0',
      official_url: 'https://www.docker.com',
      description: 'Standard container runtime utilized in campus lab servers and cloud staging deployments.'
    },
    {
      id: 'tool-postman',
      name: 'Postman API Platform',
      category: 'API Development & Testing',
      purpose: 'Designing, testing, mocking, and documenting REST and GraphQL endpoints.',
      platform: 'Web, Desktop',
      license: 'Freemium',
      official_url: 'https://www.postman.com',
      description: 'Universal API client for verifying club management endpoints, tokens, and schemas.'
    },
    {
      id: 'tool-ros2',
      name: 'Robot Operating System (ROS2)',
      category: 'Robotics & Hardware',
      purpose: 'Middleware framework providing hardware abstraction, device drivers, and publish-subscribe message passing.',
      platform: 'Ubuntu Linux',
      license: 'Apache 2.0',
      official_url: 'https://www.ros.org',
      description: 'Core software stack powering the robotics club rover and autonomous flight controllers.'
    },
    {
      id: 'tool-wireshark',
      name: 'Wireshark Packet Analyzer',
      category: 'Cybersecurity & Networking',
      purpose: 'Deep inspection of hundreds of network protocols, packet capture analysis, and vulnerability triage.',
      platform: 'Cross-platform',
      license: 'GPLv2',
      official_url: 'https://www.wireshark.org',
      description: 'Essential tool for network auditing and cyber security capture-the-flag competitions.'
    }
  ];

  for (const t of tools) {
    execute(
      `INSERT INTO tools (id, name, category, purpose, platform, license, official_url, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.name, t.category, t.purpose, t.platform, t.license, t.official_url, t.description]
    );
  }

  // 16. Announcements
  const announcements = [
    {
      id: 'ann-01',
      title: 'Annual Technical Society Enrollment & Flagship Hackathon Registration Open',
      content: 'All engineering students across departments are invited to renew their memberships, access the 2026 digital membership cards, and register for the Full-Stack AI & Cloud Hackathon.',
      category: 'EVENT',
      target_audience: 'ALL',
      club_id: 'club-acm',
      department_id: 'dept-cse',
      is_important: 1,
      status: 'PUBLISHED',
      created_by: 'usr-clubadmin'
    },
    {
      id: 'ann-02',
      title: 'Lab Allocation for Robotics & Drone Swarm Testing',
      content: 'Mechatronics Tinkering Lab is now reserved for club members from 4:30 PM to 8:00 PM on weekdays. Please carry your digital membership card QR for biometric verification.',
      category: 'WORKSHOP',
      target_audience: 'CLUB_MEMBERS',
      club_id: 'club-robotics',
      department_id: 'dept-ece',
      is_important: 0,
      status: 'PUBLISHED',
      created_by: 'usr-faculty'
    }
  ];

  for (const a of announcements) {
    execute(
      `INSERT INTO announcements (id, title, content, category, target_audience, club_id, department_id, is_important, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.title, a.content, a.category, a.target_audience, a.club_id, a.department_id, a.is_important, a.status, a.created_by]
    );
  }

  // 17. Notifications
  execute(
    `INSERT INTO notifications (id, user_id, type, title, message, data_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'notif-01',
      'usr-priya',
      'EVENT_CONFIRMATION',
      'Registration Confirmed: AI & Cloud Hackathon',
      'Your seat is secured. Your entry pass QR is available under My Events.',
      JSON.stringify({ eventId: 'evt-ai-hackathon', registrationId: 'reg-priya-hackathon' })
    ]
  );

  execute(
    `INSERT INTO notifications (id, user_id, type, title, message, data_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      'notif-02',
      'usr-priya',
      'CERTIFICATE_AVAILABLE',
      'Certificate of Merit Issued: Rust Systems Workshop',
      'Your verified certificate has been issued by Dr. Anand Sharma. You can verify and download it now.',
      JSON.stringify({ certificateId: certId, eventId: 'evt-rust-microservices' })
    ]
  );

  // 18. Audit Logs
  const auditLogs = [
    {
      id: 'audit-01',
      actor_id: 'usr-superadmin',
      action: 'SYSTEM_INITIALIZED',
      entity_type: 'SYSTEM',
      entity_id: 'sys-core',
      metadata_json: JSON.stringify({ version: '1.0.0', status: 'ready' })
    },
    {
      id: 'audit-02',
      actor_id: 'usr-faculty',
      action: 'EVENT_APPROVED',
      entity_type: 'EVENT',
      entity_id: 'evt-ai-hackathon',
      metadata_json: JSON.stringify({ approved_by: 'usr-faculty', capacity: 120 })
    },
    {
      id: 'audit-03',
      actor_id: 'usr-clubadmin',
      action: 'ATTENDANCE_RECORDED',
      entity_type: 'ATTENDANCE',
      entity_id: 'evt-rust-microservices',
      metadata_json: JSON.stringify({ totalPresent: 2, method: 'QR_SCAN' })
    },
    {
      id: 'audit-04',
      actor_id: 'usr-faculty',
      action: 'CERTIFICATE_ISSUED',
      entity_type: 'CERTIFICATE',
      entity_id: certId,
      metadata_json: JSON.stringify({ student: 'usr-priya', type: 'MERIT' })
    }
  ];

  for (const al of auditLogs) {
    execute(
      `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [al.id, al.actor_id, al.action, al.entity_type, al.entity_id, al.metadata_json]
    );
  }

  console.log('[Seed] Database successfully populated with relational entities!');
}
