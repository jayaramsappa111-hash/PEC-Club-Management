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
  QrCode
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
    <div className="space-y-12 pb-12 animate-in fade-in">
      {/* Urgent Announcements Banner */}
      {announcements.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Notice
              </span>
              <span className="font-semibold text-white">{announcements[0].title}:</span>
              <span className="text-amber-200 line-clamp-1">{announcements[0].content}</span>
            </div>
            <button
              onClick={() => onNavigate('announcements')}
              className="text-amber-400 hover:text-white font-medium flex items-center gap-1 transition"
            >
              View Notices <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-6 md:pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold mb-4">
            <img
              src="/assets/institutions/pragati-engineering-college/logo.png"
              alt="PEC"
              className="h-4 w-auto object-contain"
            />
            <span>Pragati Engineering College (Autonomous) &bull; Surampalem</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            Student Clubs &amp; Technical Societies Portal
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-normal">
            Official institutional registry for the 35 accredited student clubs, Industry 4.0 centers, and departmental societies at Pragati Engineering College (PEC). Centralizes faculty-supervised club operations, verified memberships, student projects, and event attendance.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('clubs')}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-sm"
            >
              Explore Clubs Directory
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('events')}
              className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-800 transition flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-blue-400" />
              Scheduled Events
            </button>

            {user ? (
              <button
                onClick={() => onNavigate('student-portal')}
                className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs sm:text-sm font-semibold border border-slate-800 transition flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Student Portal &amp; Pass
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-semibold border border-slate-800 transition"
              >
                Portal Login
              </button>
            )}
          </div>
        </div>

        {/* Institutional Overview Metrics */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Accredited Clubs</span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1.5">
              {metrics ? metrics.activeClubs : '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">35 Verified PEC Clubs</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Enrolled Members</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1.5">
              {metrics ? metrics.totalMemberships : '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Verified Student Passes</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Event Attendance</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1.5">
              {metrics ? `${metrics.totalAttendance}` : '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {metrics ? `${metrics.attendanceRate}% QR Check-in Rate` : 'QR Validated'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Credentials Issued</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1.5">
              {metrics ? metrics.totalCertificates : '—'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Institutional Records</div>
          </div>
        </div>
      </section>

      {/* Featured Clubs Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Accredited Student Clubs</h2>
            <p className="text-xs text-slate-400">Departmental technical societies and Industry 4.0 specializations</p>
          </div>
          <button
            onClick={() => onNavigate('clubs')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            View All 35 Clubs <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredClubs.map(club => (
            <div
              key={club.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-semibold text-blue-300 bg-blue-950/80 border border-blue-800/80 px-1.5 py-0.5 rounded">
                    {club.department || club.department_code || 'PEC'}
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                    {club.status || 'ACTIVE'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1.5 line-clamp-1 leading-snug">
                  {club.name}
                </h3>

                <p className="text-xs text-slate-300 line-clamp-2 mb-3 font-normal">
                  {club.description}
                </p>

                <div className="space-y-1 py-2 border-t border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-400">Category: </span>
                    <span className="text-slate-200 font-medium">{club.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Coordinator: </span>
                    <span className="text-slate-200 font-medium truncate block">
                      {club.faculty_coordinator || club.faculty_name || 'Designated Faculty Member'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 mt-2">
                <button
                  onClick={() => onNavigate('club-detail', club.id)}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1"
                >
                  <span>View Club</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flagship Events & Hackathons */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Upcoming Events &amp; Workshops</h2>
            <p className="text-xs text-slate-400">Technical symposiums, coding competitions, and guest lectures</p>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            All Events ({metrics?.totalEvents || 0}) <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="py-8 px-4 text-center text-slate-400 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <p className="text-slate-300 font-medium">No upcoming events or workshops are currently open for registration.</p>
            <p className="text-slate-500 mt-1">Club coordinators publish official schedules prior to activity dates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map(event => (
              <div
                key={event.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {event.event_type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(event.start_datetime).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">
                    {event.title}
                  </h3>
                  <div className="text-xs text-slate-400 mb-2">
                    Organized by: <span className="text-slate-200">{event.club_name}</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                    {event.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span>Quota: {event.confirmed_registrations_count || 0} / {event.capacity} registered</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                    <span className="text-slate-400 truncate max-w-[150px]">{event.venue}</span>
                    <button
                      onClick={() => onNavigate('event-detail', event.id)}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Peer-Reviewed Student Projects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Peer-Reviewed Projects Repository</h2>
            <p className="text-xs text-slate-400">Faculty-reviewed technical solutions and prototypes developed by students</p>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            All Projects <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {featuredProjects.length === 0 ? (
          <div className="py-8 px-4 text-center text-slate-400 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <p className="text-slate-300 font-medium">No projects are currently featured in the repository.</p>
            <p className="text-slate-500 mt-1">Student submissions undergo faculty review prior to publication.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredProjects.map(proj => (
              <div
                key={proj.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {proj.domain}
                    </span>
                    <span className="text-xs text-slate-400">By {proj.creator_name}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1.5">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                    {proj.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {proj.technologies.split(',').map((tech, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                        {tech.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Faculty Reviewed
                  </span>
                  <button
                    onClick={() => onNavigate('projects', proj.id)}
                    className="text-blue-400 hover:text-blue-300 font-semibold text-xs"
                  >
                    View Project &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Institutional Learning Resources & Verification Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-400" /> Academic &amp; Technical Roadmaps
            </div>
            <h3 className="text-base font-bold text-white">
              Curated Technical Learning Frameworks
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Domain curricula organized by departmental clubs covering Software Engineering, Embedded Systems, Machine Learning, and Cybersecurity, aligned with institutional engineering criteria.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('roadmaps')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Map className="w-3.5 h-3.5" />
              Learning Roadmaps
            </button>
            <button
              onClick={() => onNavigate('verify-hub')}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              Verify Credentials
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
