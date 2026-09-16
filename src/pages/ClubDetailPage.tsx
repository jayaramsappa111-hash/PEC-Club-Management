import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Calendar,
  Award,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  UserCheck,
  QrCode,
  AlertCircle,
  GraduationCap,
  Building2,
  FolderGit2,
  BookOpen,
  Bell,
  Layers,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { Club, ClubTeam, Event, Announcement, Membership } from '../types';
import { useAuth } from '../context/AuthContext';
import { DigitalCardModal } from '../components/DigitalCardModal';

interface ClubDetailPageProps {
  clubId: string;
  onNavigate: (tab: string, param?: string) => void;
  onOpenAuth: () => void;
}

export const ClubDetailPage: React.FC<ClubDetailPageProps> = ({ clubId, onNavigate, onOpenAuth }) => {
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<ClubTeam[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [userMembership, setUserMembership] = useState<Membership | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'members' | 'projects' | 'resources' | 'announcements'>('overview');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.clubs.get(clubId);
      setClub(res.club);
      setTeams(res.teams);
      setEvents(res.events);
      setAnnouncements(res.announcements);
      setProjects(res.projects || []);
      setResources(res.resources || []);
      setMembers(res.members || []);
      if (res.userMembership) {
        setUserMembership(res.userMembership);
      }
    } catch (err) {
      console.error('Failed to load club details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [clubId, user]);

  const handleApplyMembership = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setApplying(true);
    setStatusMsg(null);
    try {
      const res = await api.memberships.apply(clubId);
      setStatusMsg({
        type: 'success',
        text: `Enrollment confirmed! Official Pragati Engineering College digital membership pass ${res.membershipCode} generated.`,
      });
      // Refresh to load new membership
      await fetchDetails();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Membership application failed' });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading club records from Pragati Engineering College database...
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-sm font-bold text-white">Club record not found.</div>
        <button
          onClick={() => onNavigate('clubs')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Back to Clubs Directory
        </button>
      </div>
    );
  }

  const categoryBadgeStyle =
    club.category === 'Industry 4.0'
      ? 'bg-amber-950/80 text-amber-300 border-amber-600/40'
      : club.category === 'Co-Curricular Activities'
      ? 'bg-blue-950/80 text-blue-300 border-blue-600/40'
      : 'bg-purple-950/80 text-purple-300 border-purple-600/40';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Back button and Institutional Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => onNavigate('clubs')}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Clubs Directory
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Pragati Engineering College (PEC)</span>
          <span>&bull;</span>
          <span className="text-blue-400 font-semibold">{club.category || 'Student Club'}</span>
        </div>
      </div>

      {/* Header Banner with Institutional Branding */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Club Logo or Academic Department Monogram */}
            {club.logo_url ? (
              <div className="w-14 h-14 rounded-lg bg-white p-1.5 border border-slate-700 flex items-center justify-center shrink-0">
                <img
                  src={club.logo_url}
                  alt={club.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0 font-mono">
                {club.code || club.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  {club.status}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${categoryBadgeStyle}`}>
                  {club.category || 'Student Club'}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold">
                  Dept: {club.department || club.department_code || 'PEC Interdisciplinary'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {club.name}
              </h1>

              {/* Institution Identity Line */}
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Pragati Engineering College (Autonomous) &bull; Surampalem</span>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed pt-1 font-normal">
                {club.description}
              </p>

              {/* Faculty Coordinator Highlight */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider">Faculty Coordinator:</span>
                  <span className="text-white font-semibold">{club.faculty_coordinator || club.faculty_name || 'Designated Faculty Member'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Membership Status Action Box */}
          <div className="shrink-0 flex flex-col items-start md:items-end gap-3">
            {userMembership ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2 w-full md:w-56">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle className="w-4 h-4" /> Enrolled Member
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Pass ID: {userMembership.membership_id}
                </div>
                <button
                  onClick={() => setShowCardModal(true)}
                  className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <QrCode className="w-4 h-4" />
                  Digital Card &amp; QR
                </button>
              </div>
            ) : (
              <button
                onClick={handleApplyMembership}
                disabled={applying}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition flex items-center gap-2 shadow-sm"
              >
                <UserCheck className="w-4 h-4" />
                {applying ? 'Registering...' : 'Join Technical Society'}
              </button>
            )}
          </div>
        </div>

        {/* Status alert */}
        {statusMsg && (
          <div className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
          }`}>
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Domains Bar */}
        {club.domains && (
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mr-2">
              Focus Domains:
            </span>
            {club.domains.split(',').map((d, i) => (
              <span key={i} className="px-3 py-1 rounded-lg bg-slate-800/80 text-blue-300 text-xs font-medium">
                {d.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs covering all required entities */}
      <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-semibold pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview & Leadership
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'events'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Events ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'members'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'projects'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'resources'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Resources ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'announcements'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Announcements ({announcements.length})
        </button>
      </div>

      {/* Tab: Overview & Leadership */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Objectives */}
          {club.objectives && (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Charter &amp; Core Objectives
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {club.objectives}
              </p>
            </div>
          )}

          {/* Department & Faculty Advisory Box */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Affiliated Department
              </div>
              <div className="text-sm font-bold text-white">{club.department || club.department_code || 'Interdisciplinary'}</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pragati Engineering College (PEC) academic department administering technical chapter guidelines and laboratory facilities.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                Designated Faculty Coordinator
              </div>
              <div className="text-sm font-bold text-white">{club.faculty_coordinator || club.faculty_name || 'Designated Faculty Member'}</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Faculty advisor supervising chapter operations, event compliance, student memberships, and project reviews.
              </p>
            </div>
          </div>

          {/* Executive Leadership Team */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Executive Student Committee</h3>
                <p className="text-xs text-slate-400">Office bearers and technical domain leads</p>
              </div>
            </div>

            {teams.length === 0 || teams[0]?.members?.length === 0 ? (
              <div className="p-6 text-center bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400">
                <p className="text-slate-300 font-medium">No committee members listed for the current academic session.</p>
                <p className="text-slate-500 mt-1">The faculty coordinator updates committee rosters following annual elections.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teams[0].members.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-800 text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      {member.member_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{member.member_name}</div>
                      <div className="text-[11px] font-medium text-blue-400">{member.position}</div>
                      <div className="text-[10px] text-slate-400">
                        {member.course || 'B.Tech'} &bull; {member.student_id || 'PEC Student'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Events */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="py-10 px-4 text-center text-xs text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
              <p className="text-slate-300 font-medium">No events or workshops are currently scheduled for this club.</p>
              <p className="text-slate-500 mt-1">Official event notifications are published here upon department approval.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {ev.event_type}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(ev.start_datetime).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">
                      {ev.title}
                    </h4>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                      {ev.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[160px]">{ev.venue}</span>
                    <button
                      onClick={() => onNavigate('event-detail', ev.id)}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Members */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {members.length === 0 ? (
            <div className="py-10 px-4 text-center text-xs text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
              <p className="text-slate-300 font-medium">No student members currently recorded in the registry.</p>
              <p className="text-slate-500 mt-1">Students can enroll using the &lsquo;Join Technical Society&rsquo; button above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center font-bold text-xs font-mono">
                      {(m.student_name || 'Student').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{m.student_name || 'Enrolled Student'}</div>
                      <div className="text-[11px] text-slate-400">{m.student_id || 'PEC Student'} &bull; {m.course || 'B.Tech'}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="py-10 px-4 text-center text-xs text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
              <p className="text-slate-300 font-medium">No projects are currently registered under this club.</p>
              <p className="text-slate-500 mt-1">Student submissions undergo faculty review before being listed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {proj.status}
                      </span>
                      <span className="text-[11px] text-slate-400">{proj.domain || 'Engineering'}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">
                      {proj.title}
                    </h4>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                      {proj.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Lead: {proj.owner_name || 'Student Lead'}</span>
                    <button
                      onClick={() => onNavigate('projects', proj.id)}
                      className="text-blue-400 hover:text-blue-300 font-semibold text-xs flex items-center gap-1"
                    >
                      View Project <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          {resources.length === 0 ? (
            <div className="py-10 px-4 text-center text-xs text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
              <p className="text-slate-300 font-medium">No learning guides or technical blueprints uploaded for this club yet.</p>
              <p className="text-slate-500 mt-1">Faculty advisors and student leads publish materials prior to hands-on sessions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((res) => (
                <div
                  key={res.id}
                  className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {res.type || 'GUIDE'}
                      </span>
                      <span className="text-[10px] text-slate-400">{res.difficulty || 'All Levels'}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">
                      {res.title}
                    </h4>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                      {res.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Domain: {res.technology || 'Engineering'}</span>
                    <span className="text-slate-300">{res.semester || 'All Semesters'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="py-10 px-4 text-center text-xs text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
              <p className="text-slate-300 font-medium">No circulars or notices published for this club.</p>
              <p className="text-slate-500 mt-1">Department notifications will appear here when issued.</p>
            </div>
          ) : (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">{ann.title}</div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Digital Card Modal */}
      {showCardModal && userMembership && (
        <DigitalCardModal
          card={userMembership}
          onClose={() => setShowCardModal(false)}
          onNavigateToVerify={(mId) => onNavigate('verify-membership', mId)}
        />
      )}
    </div>
  );
};
