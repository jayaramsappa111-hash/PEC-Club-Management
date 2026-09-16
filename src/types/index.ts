export type RoleName =
  | 'STUDENT'
  | 'CLUB_MEMBER'
  | 'CLUB_ADMIN'
  | 'FACULTY_COORDINATOR'
  | 'DEPARTMENT_ADMIN'
  | 'SUPER_ADMIN';

export interface UserProfile {
  user_id: string;
  student_id: string;
  name: string;
  photograph?: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  course?: string;
  academic_year?: string;
  phone?: string;
  bio?: string;
  skills?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  roles: RoleName[];
  permissions: string[];
  department_id?: string;
  profile?: UserProfile;
}

export interface Club {
  id: string;
  institution_id?: string;
  institution_name?: string;
  institution_short_name?: string;
  institution_logo_url?: string;
  name: string;
  slug: string;
  logo?: string;
  logo_url?: string;
  description: string;
  category?: 'Industry 4.0' | 'Co-Curricular Activities' | 'Extra-Curricular Activities' | string;
  department?: string;
  faculty_coordinator?: string;
  objectives: string;
  domains: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  faculty_coordinator_id?: string;
  faculty_name?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  active_members_count?: number;
  events_count?: number;
  projects_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface ClubTeam {
  id: string;
  club_id: string;
  academic_year_id: string;
  academic_year_name?: string;
  name: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'HISTORICAL';
  approved_by?: string;
  approver_name?: string;
  approved_at?: string;
  members: ClubTeamMember[];
}

export interface ClubTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  position: string;
  responsibilities?: string;
  member_name: string;
  student_id?: string;
  photograph?: string;
  course?: string;
}

export interface Membership {
  id: string;
  membership_id: string;
  user_id: string;
  club_id: string;
  club_name: string;
  club_slug?: string;
  club_logo?: string;
  academic_year_id: string;
  academic_year_name?: string;
  student_name: string;
  student_roll?: string;
  department_name?: string;
  department_code?: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REJECTED';
  joined_at: string;
  valid_until: string;
  qrDataUrl?: string;
  verificationUrl?: string;
}

export interface Event {
  id: string;
  club_id: string;
  club_name: string;
  club_slug?: string;
  club_logo?: string;
  title: string;
  slug: string;
  description: string;
  event_type: 'WORKSHOP' | 'HACKATHON' | 'SEMINAR' | 'COMPETITION' | 'WEBINAR';
  start_datetime: string;
  end_datetime: string;
  venue: string;
  eligibility: string;
  capacity: number;
  registration_deadline?: string;
  poster?: string;
  circular?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  confirmed_registrations_count?: number;
  waitlisted_count?: number;
  attended_count?: number;
  avg_rating?: number;
  feedback_count?: number;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED';
  qr_code_token: string;
  qrDataUrl?: string;
  created_at: string;
}

export interface EventAttendance {
  id: string;
  event_id: string;
  registration_id: string;
  user_id: string;
  check_in_time: string;
  status: 'PRESENT' | 'LATE' | 'EXCUSED';
}

export interface Certificate {
  id: string;
  certificate_id: string;
  student_id: string;
  student_name: string;
  student_roll?: string;
  event_id: string;
  event_title: string;
  event_date: string;
  club_name: string;
  issued_at: string;
  certificate_type: 'PARTICIPATION' | 'MERIT' | 'WINNER' | 'COORDINATOR';
  verification_token: string;
  status: 'VALID' | 'REVOKED';
  verificationUrl?: string;
  qrDataUrl?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  domain: string;
  technologies: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  academic_year_id?: string;
  academic_year_name?: string;
  github_url?: string;
  demo_url?: string;
  documentation_url?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  created_by: string;
  creator_name: string;
  creator_roll?: string;
  is_featured: number;
  avg_rating?: number;
  team_size?: number;
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'notes' | 'tutorial' | 'video' | 'presentation' | 'link' | 'document';
  domain: string;
  technology?: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  semester?: string;
  author_id?: string;
  author_name?: string;
  club_id?: string;
  club_name?: string;
  tags?: string;
  file_url: string;
  isBookmarked?: boolean;
  isCompleted?: boolean;
  created_at: string;
}

export interface Roadmap {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  domain: string;
  prerequisites: string;
  total_modules: number;
  completed_modules: number;
  progress_percentage: number;
  modules?: RoadmapModule[];
}

export interface RoadmapModule {
  id: string;
  roadmap_id: string;
  title: string;
  description: string;
  order_index: number;
  isCompleted?: boolean;
  resources: string[];
}

export interface SkillBadge {
  id: string;
  user_id: string;
  title: string;
  description: string;
  badge_icon: string;
  criteria: string;
  issued_at: string;
}

export interface ToolItem {
  id: string;
  name: string;
  category: string;
  purpose: string;
  platform?: string;
  license?: string;
  official_url?: string;
  documentation_url?: string;
  description?: string;
}

export type Tool = ToolItem;

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'GENERAL' | 'EVENT' | 'WORKSHOP' | 'RECRUITMENT' | 'URGENT';
  target_audience: string;
  club_id?: string;
  club_name?: string;
  department_id?: string;
  department_name?: string;
  is_important: number;
  author_name?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read_at?: string;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  actor_id?: string;
  actor_name?: string;
  actor_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PlatformMetrics {
  totalClubs: number;
  activeClubs: number;
  inactiveClubs: number;
  totalStudents: number;
  totalMemberships: number;
  totalEvents: number;
  completedEvents: number;
  totalRegistrations: number;
  totalAttendance: number;
  attendanceRate: number;
  totalCertificates: number;
  totalProjects: number;
  totalResources: number;
}
