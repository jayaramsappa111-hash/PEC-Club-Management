import { db } from './database';

export function initSchema() {
  db.exec(`
    -- Departments
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Academic Years
    CREATE TABLE IF NOT EXISTS academic_years (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      start_date DATE,
      end_date DATE,
      is_current INTEGER DEFAULT 0
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      is_verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Profiles
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      student_id TEXT UNIQUE,
      name TEXT NOT NULL,
      photograph TEXT,
      department_id TEXT,
      course TEXT,
      academic_year TEXT,
      phone TEXT,
      bio TEXT,
      skills TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    );

    -- Roles
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );

    -- Permissions
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );

    -- Role Permissions
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );

    -- User Roles
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );

    -- Institutions
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      logo_url TEXT NOT NULL,
      website TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Clubs
    CREATE TABLE IF NOT EXISTS clubs (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'pec',
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo TEXT,
      logo_url TEXT,
      institution_logo_url TEXT DEFAULT '/assets/institutions/pragati-engineering-college/logo.png',
      description TEXT,
      category TEXT,
      department TEXT,
      faculty_coordinator TEXT,
      objectives TEXT,
      domains TEXT,
      department_id TEXT,
      faculty_coordinator_id TEXT,
      status TEXT DEFAULT 'ACTIVE', -- DRAFT, PENDING_APPROVAL, ACTIVE, SUSPENDED, ARCHIVED
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
      FOREIGN KEY (faculty_coordinator_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Club Coordinators
    CREATE TABLE IF NOT EXISTS club_coordinators (
      club_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role_title TEXT DEFAULT 'Coordinator',
      PRIMARY KEY (club_id, user_id),
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Club Teams
    CREATE TABLE IF NOT EXISTS club_teams (
      id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL,
      academic_year_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE', -- DRAFT, PENDING_APPROVAL, ACTIVE, HISTORICAL
      approved_by TEXT,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Club Team Members
    CREATE TABLE IF NOT EXISTS club_team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      position TEXT NOT NULL,
      responsibilities TEXT,
      FOREIGN KEY (team_id) REFERENCES club_teams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Memberships
    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      membership_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      club_id TEXT NOT NULL,
      academic_year_id TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE', -- PENDING, ACTIVE, EXPIRED, SUSPENDED, REJECTED
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      valid_until DATE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT
    );

    -- Events
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      club_id TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      event_type TEXT DEFAULT 'WORKSHOP', -- WORKSHOP, HACKATHON, SEMINAR, COMPETITION, WEBINAR
      start_datetime DATETIME NOT NULL,
      end_datetime DATETIME NOT NULL,
      venue TEXT NOT NULL,
      eligibility TEXT DEFAULT 'Open to all students',
      capacity INTEGER DEFAULT 100,
      registration_deadline DATETIME,
      poster TEXT,
      circular TEXT,
      status TEXT DEFAULT 'PUBLISHED', -- DRAFT, PENDING_APPROVAL, PUBLISHED, REGISTRATION_OPEN, REGISTRATION_CLOSED, ONGOING, COMPLETED, CANCELLED
      created_by TEXT,
      approved_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Event Registrations
    CREATE TABLE IF NOT EXISTS event_registrations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'CONFIRMED', -- CONFIRMED, WAITLISTED, CANCELLED
      qr_code_token TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Event Attendance
    CREATE TABLE IF NOT EXISTS event_attendance (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      registration_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      check_out_time DATETIME,
      status TEXT DEFAULT 'PRESENT', -- PRESENT, LATE, EXCUSED
      recorded_by TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Event Feedback
    CREATE TABLE IF NOT EXISTS event_feedback (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comments TEXT,
      suggestions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Certificates
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      certificate_id TEXT NOT NULL UNIQUE,
      student_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      certificate_type TEXT DEFAULT 'PARTICIPATION', -- PARTICIPATION, MERIT, WINNER, COORDINATOR
      verification_token TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'VALID', -- VALID, REVOKED
      file_url TEXT,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    -- Projects
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      domain TEXT NOT NULL,
      technologies TEXT NOT NULL,
      department_id TEXT,
      academic_year_id TEXT,
      github_url TEXT,
      demo_url TEXT,
      documentation_url TEXT,
      status TEXT DEFAULT 'PUBLISHED', -- DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, PUBLISHED
      created_by TEXT NOT NULL,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Project Members
    CREATE TABLE IF NOT EXISTS project_members (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'Contributor',
      UNIQUE(project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Project Reviews
    CREATE TABLE IF NOT EXISTS project_reviews (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      rating INTEGER CHECK (rating >= 1 AND rating <= 10),
      remarks TEXT,
      decision TEXT DEFAULT 'APPROVED', -- APPROVED, REJECTED, REVISE
      reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Resources
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL, -- notes, tutorial, video, presentation, link, document
      domain TEXT NOT NULL,
      technology TEXT,
      difficulty TEXT DEFAULT 'BEGINNER', -- BEGINNER, INTERMEDIATE, ADVANCED
      semester TEXT,
      author_id TEXT,
      club_id TEXT,
      tags TEXT,
      file_url TEXT NOT NULL,
      status TEXT DEFAULT 'PUBLISHED', -- DRAFT, PUBLISHED
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL
    );

    -- Resource Bookmarks
    CREATE TABLE IF NOT EXISTS resource_bookmarks (
      user_id TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, resource_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
    );

    -- Resource Progress
    CREATE TABLE IF NOT EXISTS resource_progress (
      user_id TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      status TEXT DEFAULT 'COMPLETED', -- STARTED, COMPLETED
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, resource_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
    );

    -- Roadmaps
    CREATE TABLE IF NOT EXISTS roadmaps (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      level TEXT DEFAULT 'BEGINNER', -- BEGINNER, INTERMEDIATE, ADVANCED
      domain TEXT NOT NULL,
      prerequisites TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Roadmap Modules
    CREATE TABLE IF NOT EXISTS roadmap_modules (
      id TEXT PRIMARY KEY,
      roadmap_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL,
      resources_json TEXT, -- array of linked resources/topics
      FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
    );

    -- Student Roadmap Progress
    CREATE TABLE IF NOT EXISTS student_roadmap_progress (
      user_id TEXT NOT NULL,
      roadmap_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, roadmap_id, module_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES roadmap_modules(id) ON DELETE CASCADE
    );

    -- Skill Badges
    CREATE TABLE IF NOT EXISTS skill_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      badge_icon TEXT,
      criteria TEXT,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Software Tools Directory
    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      purpose TEXT NOT NULL,
      platform TEXT,
      license TEXT,
      official_url TEXT NOT NULL,
      description TEXT
    );

    -- Announcements
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'GENERAL', -- GENERAL, EVENT, WORKSHOP, RECRUITMENT, URGENT
      target_audience TEXT DEFAULT 'ALL', -- ALL, CLUB_MEMBERS, FACULTY
      club_id TEXT,
      department_id TEXT,
      publish_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      is_important INTEGER DEFAULT 0,
      status TEXT DEFAULT 'PUBLISHED', -- DRAFT, SCHEDULED, PUBLISHED, EXPIRED
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data_json TEXT,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Gallery
    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      club_id TEXT,
      event_id TEXT,
      title TEXT NOT NULL,
      media_type TEXT DEFAULT 'image', -- image, video
      url TEXT NOT NULL,
      caption TEXT,
      uploaded_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata_json TEXT,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- System Settings
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Indexes for high-performance querying
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_memberships_user_club ON memberships(user_id, club_id);
    CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_datetime);
    CREATE INDEX IF NOT EXISTS idx_events_club ON events(club_id);
    CREATE INDEX IF NOT EXISTS idx_registrations_event_user ON event_registrations(event_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_event ON event_attendance(event_id);
    CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
  `);

  // Migrate existing tables if new columns were added
  try {
    const clubCols = db.prepare("PRAGMA table_info(clubs)").all() as any[];
    const colNames = clubCols.map(c => c.name);
    const neededCols: [string, string][] = [
      ['institution_id', "TEXT DEFAULT 'pec'"],
      ['institution_logo_url', "TEXT DEFAULT '/assets/institutions/pragati-engineering-college/logo.png'"],
      ['logo_url', 'TEXT'],
      ['banner_url', 'TEXT'],
      ['category', 'TEXT'],
      ['department', 'TEXT'],
      ['faculty_coordinator', 'TEXT'],
    ];

    for (const [colName, colDef] of neededCols) {
      if (!colNames.includes(colName)) {
        try {
          db.exec(`ALTER TABLE clubs ADD COLUMN ${colName} ${colDef};`);
        } catch {
          // ignore if column already exists
        }
      }
    }

    // Ensure Pragati University exists in institutions table
    db.exec(`
      INSERT OR REPLACE INTO institutions (id, name, short_name, logo_url, website)
      VALUES (
        'pec',
        'Pragati University',
        'PU',
        '/assets/institutions/pragati-engineering-college/logo.png',
        'https://pragati.ac.in/'
      );
    `);
  } catch (err) {
    console.error('[Schema Migration Notice]', err);
  }
}
