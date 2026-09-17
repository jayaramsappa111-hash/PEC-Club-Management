import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Award,
  Calendar,
  Layers,
  FileCheck,
  QrCode,
  CheckCircle,
  ExternalLink,
  BookOpen,
  Building2,
  GraduationCap,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Membership, EventRegistration, Certificate, SkillBadge } from '../types';
import { DigitalCardModal } from '../components/DigitalCardModal';
import { CertificateModal } from '../components/CertificateModal';

interface ProfilePageProps {
  onNavigate: (tab: string, param?: string) => void;
  onOpenAuth: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate, onOpenAuth }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [badges, setBadges] = useState<SkillBadge[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedCard, setSelectedCard] = useState<Membership | null>(null);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [profRes, membRes, regRes, certRes, roadRes] = await Promise.all([
        api.users.getProfile(),
        api.memberships.getMyCards(),
        api.events.getMyRegistrations(),
        api.certificates.list(),
        api.roadmaps.list(),
      ]);
      setProfile(profRes.user);
      setMemberships(membRes.cards || []);
      setRegistrations(regRes.registrations || []);
      setCertificates(certRes.certificates || []);
      setBadges(roadRes.badges || []);
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAllData();
  }, [user]);

  const handleClaimAttendance = async (eventId: string) => {
    try {
      await api.events.claimAttendance(eventId);
      const regRes = await api.events.getMyRegistrations();
      setRegistrations(regRes.registrations || []);
    } catch (err) {
      console.error('Failed to claim attendance & certificate', err);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4 bg-slate-50 min-h-screen">
        <h2 className="text-xl font-bold text-slate-900">Student / Faculty Authentication Required</h2>
        <p className="text-xs text-slate-600">Please sign in to access your digital membership passes, event tickets, and certified credentials.</p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition"
        >
          Open Institutional Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-500 bg-slate-50 min-h-screen">
        Loading personal credential ledger...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      {/* Identity Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-2xl shadow-xs font-mono">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                  {user.roles.join(', ')}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                {user.email} &bull; <strong className="text-slate-900 font-mono">{user.student_id || user.roll_number || '23A31A0501'}</strong>
              </div>
              <div className="text-xs text-slate-500">
                {user.department || user.course || 'B.Tech Computer Science and Engineering'} &bull; Pragati University
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('verify')}
              className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Public Verification
            </button>
          </div>
        </div>

        {/* Quick KPI count */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Affiliated Chapters</div>
            <div className="text-2xl font-extrabold text-blue-900 font-mono mt-0.5">{memberships.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Event Registrations</div>
            <div className="text-2xl font-extrabold text-blue-900 font-mono mt-0.5">{registrations.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Accredited Certs</div>
            <div className="text-2xl font-extrabold text-amber-700 font-mono mt-0.5">{certificates.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Specialist Badges</div>
            <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-0.5">{badges.length}</div>
          </div>
        </div>
      </div>

      {/* Role-Based Academic Workspace Console */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-900" />
              Institutional Role-Based Workspace Console
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Custom administrative privileges, workspace actions, and auditing active for your account</p>
          </div>
          <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 font-mono font-bold text-[10px] uppercase rounded">
            Authorized Node Status: Verified
          </span>
        </div>

        {/* Dynamic Display based on active primary role */}
        {user.roles.includes('SUPER_ADMIN') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                Super Administrator Controls Active
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                You have unrestricted access to govern all 35 accredited student clubs, override system properties, check complete platform audit trails, and manage user identity registries for Pragati University.
              </p>
              <div className="flex flex-wrap gap-2 pt-1.5">
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Complete Audit Logs
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; User Directory Control
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Global Certificate Minting
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-purple-950">Administrative Shortcuts</h4>
                <p className="text-[11px] text-purple-800 mt-1 leading-normal font-normal">Launch complete administrative tables to verify attendance claims, charter new clubs, or view live audit metrics.</p>
              </div>
              <button
                onClick={() => onNavigate('admin-portal')}
                className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg transition"
              >
                Go to Administrative Portal &rarr;
              </button>
            </div>
          </div>
        )}

        {user.roles.includes('DEPARTMENT_ADMIN') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
                Department Admin / HOD Console Active
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Overseeing department chapters, accredited student portfolios, and endorsing official certifications. Monitor the development rate of student innovation projects and approve credentials.
              </p>
              <div className="flex flex-wrap gap-2 pt-1.5">
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Department Chapters
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Endorse Certifications
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Project Portfolios
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-orange-950">HOD Workspace Desk</h4>
                <p className="text-[11px] text-orange-800 mt-1 leading-normal font-normal">Review performance trends across CSE / ECE / ME student chapters and authorize certificate mints.</p>
              </div>
              <button
                onClick={() => onNavigate('admin-portal')}
                className="w-full py-2 bg-orange-950 hover:bg-orange-900 text-white text-[11px] font-bold rounded-lg transition"
              >
                Open Admin Portal &rarr;
              </button>
            </div>
          </div>
        )}

        {user.roles.includes('FACULTY_COORDINATOR') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                Faculty Chapter Advisor Console Active
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                You are responsible for mentoring technical clubs, approving student project registrations, authorizing executive team composition changes, and stamping attendance logs.
              </p>
              <div className="flex flex-wrap gap-2 pt-1.5">
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Project Review Desk
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Stamp Attendance Logs
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Charter Authorizations
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-950">Advisor Desk</h4>
                <p className="text-[11px] text-emerald-800 mt-1 leading-normal font-normal">Approve pending project registries, verify attendance check-ins, or review committee lists.</p>
              </div>
              <button
                onClick={() => onNavigate('admin-portal')}
                className="w-full py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg transition"
              >
                Open Administrative Portal &rarr;
              </button>
            </div>
          </div>
        )}

        {user.roles.includes('CLUB_ADMIN') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                Club Coordinator / Admin Workspace Active
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Manage your student executive team, plan technical bootcamps, and submit circulars to notify members about upcoming event guidelines.
              </p>
              <div className="flex flex-wrap gap-2 pt-1.5">
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Publish Official Circulars
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Manage Executive Committee
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Draft Activity Budgets
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-950">Coordinator Workspace</h4>
                <p className="text-[11px] text-indigo-800 mt-1 leading-normal font-normal">Verify club registration requests and create announcements for your tech chapter members.</p>
              </div>
              <button
                onClick={() => onNavigate('admin-portal')}
                className="w-full py-2 bg-indigo-900 hover:bg-indigo-800 text-white text-[11px] font-bold rounded-lg transition"
              >
                Open Admin Portal &rarr;
              </button>
            </div>
          </div>
        )}

        {user.roles.includes('CLUB_MEMBER') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                Technical Club Member Desk Active
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Access exclusive student chapter documents, technical e-resources, step-by-step roadmap guides, and download your verified digital membership card for student chapter voting.
              </p>
              <div className="flex flex-wrap gap-2 pt-1.5">
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Download Verified Digital Card
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Access Members-Only Resources
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Exclusive Hackathon Entry
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-sky-950">Technical Resources Desk</h4>
                <p className="text-[11px] text-sky-800 mt-1 leading-normal font-normal">Explore detailed coding guides, specialized AI &amp; ECE roadmaps, or preview your dynamic entry credentials.</p>
              </div>
              <button
                onClick={() => onNavigate('learning')}
                className="w-full py-2 bg-sky-900 hover:bg-sky-800 text-white text-[11px] font-bold rounded-lg transition"
              >
                Access E-Resources &rarr;
              </button>
            </div>
          </div>
        )}

        {/* If user is a general student or has no other specific elevated role */}
        {!user.roles.some(r => ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN', 'DEPARTMENT_ADMIN', 'CLUB_MEMBER'].includes(r)) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Student Workspace Console Active
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Explore the 35 official technical chapters at Pragati University, register for upcoming hackathons, submit your innovative project portfolios for faculty advisory feedback, and view your verified digital ID pass.
              </p>
              <div className="flex flex-wrap gap-2 pt-1.5">
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Register for Active Workshops
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Join Accredited Technical Chapters
                </span>
                <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold">
                  &bull; Archive Engineering Projects
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-blue-950">Student Shortcuts</h4>
                <p className="text-[11px] text-blue-800 mt-1 leading-normal font-normal">Enroll in technical club chapters, view active events, or publish your student software projects.</p>
              </div>
              <button
                onClick={() => onNavigate('clubs')}
                className="w-full py-2 bg-blue-950 hover:bg-blue-900 text-white text-[11px] font-bold rounded-lg transition"
              >
                Browse Clubs &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: Digital Membership Passes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-900" /> Digital Membership Passes &amp; QR ID
            </h3>
            <p className="text-xs text-slate-500">Institutional smart ID passes for club activities and chapter voting</p>
          </div>
        </div>

        {memberships.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            You are not currently enrolled in any technical club chapters.{' '}
            <button onClick={() => onNavigate('clubs')} className="text-blue-900 underline font-bold">
              Browse 35 Accredited Chapters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberships.map(card => (
              <div
                key={card.id}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-900 transition flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {card.status}
                    </span>
                    <span className="font-mono text-xs text-blue-900 font-bold">
                      {card.membership_id}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-900 transition">
                    {card.club_name}
                  </h4>
                  <div className="text-xs text-slate-500 mb-3">
                    Joined: {new Date(card.joined_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">PEC Academic Pass</span>
                  <button
                    onClick={() => setSelectedCard(card)}
                    className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <QrCode className="w-3.5 h-3.5" /> View Digital Pass
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Event Registrations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-900" /> Event Access Passes &amp; Check-Ins
            </h3>
            <p className="text-xs text-slate-500">QR entry passes for upcoming campus workshops and competitions</p>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            No active event registrations found.{' '}
            <button onClick={() => onNavigate('events')} className="text-blue-900 underline font-bold">
              Explore Upcoming Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {registrations.map(reg => (
              <div
                key={reg.id}
                className="p-5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                      {reg.event_type || 'WORKSHOP'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {reg.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1">{reg.event_title}</h4>
                  <div className="text-xs text-slate-500 mb-3">Host: {reg.club_name}</div>

                  {/* Attendance & Certificate Claim Section */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[10px] font-bold uppercase">QR Entry Token</span>
                      <span className="font-mono text-slate-900 font-bold text-[11px]">{reg.qr_code_token || 'VALID-PASS'}</span>
                    </div>

                    <div className="border-t border-slate-200/60 pt-2 space-y-1.5">
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Attendance &amp; Certificate Claim</div>
                      
                      {reg.attendance_claim_status === 'PENDING' ? (
                        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded text-[10px] font-bold animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Pending Faculty Approval</span>
                        </div>
                      ) : reg.attendance_claim_status === 'APPROVED' ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded text-[10px] font-bold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Attendance Verified &amp; Issued!</span>
                        </div>
                      ) : reg.attendance_claim_status === 'REJECTED' ? (
                        <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded text-[10px] font-bold">
                          <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Claim Disapproved</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaimAttendance(reg.event_id)}
                          className="w-full py-1.5 px-2 bg-blue-900 hover:bg-blue-800 text-white rounded text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Award className="w-3 h-3 text-white" />
                          <span>Claim Attendance &amp; Cert</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">{new Date(reg.registered_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => onNavigate('event-detail', reg.event_id)}
                    className="text-xs font-bold text-blue-900 hover:underline"
                  >
                    Event Page &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCard && (
        <DigitalCardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onNavigateToVerify={(mId) => onNavigate('verify', mId)}
        />
      )}

      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          onNavigateToVerify={(code) => onNavigate('verify', code)}
        />
      )}
    </div>
  );
};
