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
  FileText,
  Clock,
  MapPin
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
      setTeams(res.teams || []);
      setEvents(res.events || []);
      setAnnouncements(res.announcements || []);
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
        text: `Enrollment confirmed! Official Pragati University digital membership pass ${res.membershipCode} generated.`,
      });
      await fetchDetails();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Membership application failed' });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
        Loading club records from Pragati University database...
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-sm font-bold text-slate-800">Club record not found.</div>
        <button
          onClick={() => onNavigate('clubs')}
          className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold"
        >
          Back to Clubs Directory
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      {/* Back button and Institutional Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => onNavigate('clubs')}
          className="text-xs text-slate-600 hover:text-blue-900 font-medium flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Clubs Directory
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Pragati University</span>
          <span>&bull;</span>
          <span className="text-blue-900 font-bold">{club.category || 'Student Club'}</span>
        </div>
      </div>

      {/* Header Banner with Institutional Branding */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center font-bold text-lg shrink-0 font-mono">
              {club.code || club.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {club.status}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                  {club.category || 'Student Club'}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold">
                  Dept: {club.department || club.department_code || 'Interdisciplinary'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {club.name}
              </h1>

              {/* Institution Identity Line */}
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-900" />
                <span>Pragati University &bull; Student Life &amp; Club Management</span>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed pt-1 font-normal">
                {club.description}
              </p>

              {/* Faculty Coordinator Highlight */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <GraduationCap className="w-4 h-4 text-blue-900" />
                  <span className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">Faculty Coordinator:</span>
                  <span className="text-slate-900 font-bold">{club.faculty_coordinator || club.faculty_name || 'Designated Faculty Member'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Membership Status Action Box */}
          <div className="shrink-0 flex flex-col items-start md:items-end gap-3">
            {userMembership ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 w-full md:w-56">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle className="w-4 h-4 text-emerald-700" /> Enrolled Member
                </div>
                <div className="text-[11px] text-emerald-800 font-mono">
                  Pass ID: {userMembership.membership_id}
                </div>
                <button
                  onClick={() => setShowCardModal(true)}
                  className="w-full px-3 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <QrCode className="w-4 h-4" />
                  Digital Card &amp; QR
                </button>
              </div>
            ) : (
              <button
                onClick={handleApplyMembership}
                disabled={applying}
                className="px-5 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-xs"
              >
                <UserCheck className="w-4 h-4" />
                {applying ? 'Registering...' : 'Join Technical Chapter'}
              </button>
            )}
          </div>
        </div>

        {/* Status alert */}
        {statusMsg && (
          <div className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}>
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Domains Bar */}
        {club.domains && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider mr-2">
              Focus Domains:
            </span>
            {club.domains.split(',').map((d, i) => (
              <span key={i} className="px-3 py-1 rounded-md bg-slate-100 text-blue-950 text-xs font-semibold border border-slate-200">
                {d.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-bold pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition ${
            activeTab === 'overview'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Overview &amp; Leadership
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'events'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Events ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'members'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'projects'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'resources'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Resources ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-3 px-3 border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'announcements'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Circulars ({announcements.length})
        </button>
      </div>

      {/* Tab: Overview & Leadership */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Objectives */}
          {club.objectives && (
            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-900" />
                Charter &amp; Core Objectives
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {club.objectives}
              </p>
            </div>
          )}

          {/* Department & Faculty Advisory Box */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-900" />
                Affiliated Department
              </div>
              <div className="text-sm font-bold text-slate-900">{club.department || club.department_code || 'Interdisciplinary'}</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pragati University academic department administering technical chapter guidelines and laboratory facilities.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-900" />
                Designated Faculty Coordinator
              </div>
              <div className="text-sm font-bold text-slate-900">{club.faculty_coordinator || club.faculty_name || 'Designated Faculty Member'}</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Faculty advisor supervising chapter operations, event compliance, student memberships, and project reviews.
              </p>
            </div>
          </div>

          {/* Executive Leadership Team */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Executive Student Committee</h3>
                <p className="text-xs text-slate-500">Office bearers and technical domain leads</p>
              </div>
            </div>

            {teams.length === 0 || teams[0]?.members?.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                <p className="text-slate-800 font-semibold">No committee members listed for the current academic session.</p>
                <p className="text-slate-500 mt-1">The faculty coordinator updates committee rosters following annual chapter appointments.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teams[0].members.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 flex items-center gap-3 shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      {member.member_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{member.member_name}</div>
                      <div className="text-[11px] font-bold text-blue-900">{member.position}</div>
                      <div className="text-[10px] text-slate-500">
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Scheduled Chapter Events &amp; Workshops</h3>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              No events currently scheduled for this chapter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((evt) => (
                <div key={evt.id} className="p-5 rounded-xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                      {evt.event_type || (evt as any).type || 'WORKSHOP'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {evt.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{evt.description}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-900" />
                      <span>{new Date(evt.start_datetime || (evt as any).start_time || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => onNavigate('event-detail', evt.id)}
                      className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
                    >
                      View Details <ChevronRight className="w-3.5 h-3.5" />
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Enrolled Student Members ({members.length})</h3>
          </div>

          {members.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              No student members enrolled yet. Click "Join Technical Chapter" above to get verified!
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Roll Number</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Pass Code</th>
                      <th className="p-3">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((m: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-semibold text-slate-900">{m.student_name || m.user_name || 'PEC Student'}</td>
                        <td className="p-3 font-mono text-slate-600">{m.roll_number || m.student_id || '23A31A0501'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold">
                            {m.role || 'MEMBER'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-500 text-[11px]">{m.membership_code || `PEC-${club.id}-${idx + 101}`}</td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : 'Current Session'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Chapter Projects &amp; Hardware Builds ({projects.length})</h3>
          </div>

          {projects.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              No projects archived under this chapter yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj: any, idx: number) => (
                <div key={idx} className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                      {proj.domain || 'Technical'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {proj.status || 'ACTIVE'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{proj.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{proj.description}</p>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    Lead: <span className="font-semibold text-slate-800">{proj.creator_name || proj.owner_name || 'PEC Student Lead'}</span>
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Curated Learning Resources &amp; Lab Notes</h3>
          </div>

          {resources.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              Faculty and club leads regularly upload session slide decks, starter code repositories, and cheat sheets.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {resources.map((res: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-900 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{res.title}</div>
                      <div className="text-[10px] text-slate-500">{res.type || res.category || 'Study Material'} &bull; {res.difficulty || 'Intermediate'}</div>
                    </div>
                  </div>
                  {(res.file_url || res.url) && (
                    <a
                      href={res.file_url || res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 shrink-0"
                    >
                      <span>Access</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Official Chapter Circulars ({announcements.length})</h3>
          </div>

          {announcements.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              No recent announcements posted for this chapter.
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{ann.title}</span>
                    <span className="text-[10px] text-slate-400">{new Date(ann.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600">{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Digital Card Modal */}
      {showCardModal && userMembership && (
        <DigitalCardModal
          card={userMembership}
          onClose={() => setShowCardModal(false)}
          onNavigateToVerify={(mId) => onNavigate('verify', mId)}
        />
      )}
    </div>
  );
};
