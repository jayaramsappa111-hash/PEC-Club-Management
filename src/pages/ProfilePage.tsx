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
