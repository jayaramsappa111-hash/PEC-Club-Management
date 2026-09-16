import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  Layers,
  Award,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Map,
  BookOpen,
  QrCode,
  School,
  GraduationCap,
  Building2,
  Search
} from 'lucide-react';
import { api } from '../services/api';
import { Club, Event, Project, Announcement, PlatformMetrics } from '../types';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  onNavigate: (tab: string, param?: string) => void;
  onOpenAuth: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenAuth }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [featuredClubs, setFeaturedClubs] = useState<Club[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [analyticsRes, eventsRes, clubsRes, projectsRes, annRes] = await Promise.all([
          api.analytics.getPlatform(),
          api.events.list({ status: 'REGISTRATION_OPEN' }),
          api.clubs.list(),
          api.projects.list({ is_featured: 1 }),
          api.announcements.list({ important_only: true }),
        ]);

        setMetrics(analyticsRes.metrics);
        setUpcomingEvents(eventsRes.events.slice(0, 3));
        setFeaturedClubs(clubsRes.clubs.slice(0, 4));
        setFeaturedProjects(projectsRes.projects.slice(0, 3));
        setAnnouncements(annRes.announcements.slice(0, 2));
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  return (
    <div className="space-y-10 pb-16 bg-slate-50 text-slate-900 animate-in fade-in min-h-screen">
      {/* Official Circulars / Notice Strip */}
      {announcements.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                Official Circular
              </span>
              <span className="font-bold text-slate-900">{announcements[0].title}:</span>
              <span className="text-slate-700 line-clamp-1">{announcements[0].content}</span>
            </div>
            <button
              onClick={() => onNavigate('announcements')}
              className="text-blue-900 font-bold hover:underline flex items-center gap-1 transition"
            >
              View Circulars <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Institutional Hero Banner */}
      <section className="pt-6 md:pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-4">
              <Building2 className="w-3.5 h-3.5 text-blue-800" />
              <span>Pragati University &bull; Official Student Life Platform</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Student Club Management Platform
            </h1>

            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-normal">
              Official institutional platform governing all 35 accredited student clubs, professional societies, and departmental technical chapters at Pragati University. Facilitating verified memberships, faculty-governed event scheduling, project archiving, and QR certificate generation.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('clubs')}
                className="px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-xs"
              >
                <Layers className="w-4 h-4" />
                Explore 35 Official Clubs
              </button>

              <button
                onClick={() => onNavigate('events')}
                className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold border border-slate-300 transition flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-blue-900" />
                Scheduled Events
              </button>

              {user ? (
                <button
                  onClick={() => onNavigate('student-portal')}
                  className="px-4 py-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs sm:text-sm font-semibold border border-emerald-300 transition flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  My Student Portal &amp; Pass
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold border border-slate-300 transition"
                >
                  Portal Sign In
                </button>
              )}
            </div>
          </div>

          {/* Institutional Overview Metrics Strip */}
          <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Accredited Clubs</span>
                <Layers className="w-4 h-4 text-blue-900" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {metrics ? metrics.activeClubs : '35'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">35 Verified PEC Clubs</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Student Members</span>
                <Users className="w-4 h-4 text-blue-900" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {metrics ? metrics.totalMemberships : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Active Enrollments</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Event Attendance</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {metrics ? `${metrics.totalAttendance}` : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {metrics ? `${metrics.attendanceRate}% Validated Check-ins` : 'QR Checked'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Certificates Issued</span>
                <Award className="w-4 h-4 text-amber-700" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {metrics ? metrics.totalCertificates : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Verifiable QR Credentials</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Clubs Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Accredited Student Chapters</h2>
            <p className="text-xs text-slate-500">Departmental technical societies and Industry 4.0 specializations</p>
          </div>
          <button
            onClick={() => onNavigate('clubs')}
            className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
          >
            View All 35 Clubs <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredClubs.map(club => (
            <div
              key={club.id}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-900 hover:shadow-sm transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {club.department || club.department_code || 'PEC'}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    {club.status || 'ACTIVE'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-1 leading-snug">
                  {club.name}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 mb-3 font-normal leading-relaxed">
                  {club.description}
                </p>

                <div className="space-y-1.5 py-2.5 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="text-slate-800 font-semibold">{club.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Coordinator:</span>
                    <span className="text-slate-800 font-medium truncate max-w-[140px]">
                      {club.faculty_coordinator || club.faculty_name || 'Designated Faculty'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-2">
                <button
                  onClick={() => onNavigate('club-detail', club.id)}
                  className="w-full py-2 px-3 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                >
                  <span>View Chapter</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flagship Events & Workshops */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Upcoming Events &amp; Workshops</h2>
            <p className="text-xs text-slate-500">Technical symposiums, coding competitions, and guest lectures</p>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
          >
            All Events ({metrics?.totalEvents || 0}) <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="py-8 px-4 text-center text-slate-600 bg-white rounded-xl border border-slate-200 text-xs">
            <p className="text-slate-800 font-medium">No upcoming events or workshops are currently open for registration.</p>
            <p className="text-slate-500 mt-1">Club coordinators publish official schedules prior to activity dates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map(event => (
              <div
                key={event.id}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                      {event.type}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {event.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">{event.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">{event.description}</p>

                  <div className="space-y-1.5 py-2.5 border-t border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-900" />
                      <span>{new Date(event.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Map className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{event.venue || 'PEC Main Auditorium'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => onNavigate('event-detail', event.id)}
                    className="w-full py-2 px-3 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <span>View Event Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Student Projects Registry */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Student Innovation &amp; Project Repository</h2>
            <p className="text-xs text-slate-500">Peer-reviewed software, IoT hardware, and robotics builds</p>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
          >
            Explore Registry <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredProjects.map(project => (
            <div
              key={project.id}
              className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {project.domain}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {project.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{project.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">{project.description}</p>

                <div className="text-[11px] text-slate-500 py-2 border-t border-slate-100">
                  <div>Lead: <span className="text-slate-800 font-semibold">{project.creator_name || 'PEC Student'}</span> ({project.creator_roll || '23A31A0501'})</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-2">
                <button
                  onClick={() => onNavigate('projects')}
                  className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition border border-slate-300 flex items-center justify-center gap-1"
                >
                  <span>Inspect Project</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verification Ledger Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
              <QrCode className="w-3.5 h-3.5" />
              Public Verification Hub
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Verify Digital Membership Cards &amp; Completion Certificates
            </h3>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              Employers, evaluators, and faculty coordinators can instantly authenticate cryptographic QR codes and certificate serial numbers issued by Pragati University student clubs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('verify')}
              className="px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <QrCode className="w-4 h-4" />
              Open Verification Portal
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
