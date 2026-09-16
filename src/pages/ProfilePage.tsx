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
  BookOpen
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

  useEffect(() => {
    if (!user) return;

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

    fetchAllData();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Student Authentication Required</h2>
        <p className="text-xs text-slate-400">Please sign in to access your digital membership passes, event tickets, and certified credentials.</p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition"
        >
          Open Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading personal credential ledger...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Identity Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-3xl shadow-lg">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-500/40">
                  {user.roles.join(', ')}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {user.email} &bull; <strong className="text-slate-300 font-mono">{user.student_id || '23BCE1001'}</strong>
              </div>
              <div className="text-xs text-slate-400">
                {user.course || 'B.Tech Computer Science and Engineering'} &bull; Cycle 2025-2026
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('verify')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Public Verification
            </button>
          </div>
        </div>

        {/* Quick KPI count */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">Affiliated Clubs</div>
            <div className="text-xl font-bold text-blue-400 font-mono mt-0.5">{memberships.length}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">Event Registrations</div>
            <div className="text-xl font-bold text-indigo-400 font-mono mt-0.5">{registrations.length}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">Accredited Certs</div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">{certificates.length}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[10px] uppercase font-semibold">Specialist Badges</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{badges.length}</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Digital Membership Passes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> Digital Membership Passes & QR ID
            </h3>
            <p className="text-xs text-slate-400">Institutional smart ID passes for club activities and voting</p>
          </div>
        </div>

        {memberships.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 text-xs text-slate-400">
            You are not currently enrolled in any technical club chapters.{' '}
            <button onClick={() => onNavigate('clubs')} className="text-blue-400 underline font-semibold">
              Browse Clubs Directory
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberships.map(card => (
              <div
                key={card.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      {card.status}
                    </span>
                    <span className="font-mono text-xs text-blue-400 font-semibold">
                      {card.membership_id}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition">
                    {card.club_name}
                  </h4>
                  <div className="text-xs text-slate-400 mb-3">
                    Joined: {new Date(card.joined_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">Academic Pass</span>
                  <button
                    onClick={() => setSelectedCard(card)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <QrCode className="w-3.5 h-3.5" /> View Digital Card
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
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" /> Event Access Passes & Check-Ins
            </h3>
            <p className="text-xs text-slate-400">QR entry passes for upcoming campus workshops and competitions</p>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 text-xs text-slate-400">
            No active event registrations found.{' '}
            <button onClick={() => onNavigate('events')} className="text-indigo-400 underline font-semibold">
              Explore Upcoming Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registrations.map(reg => (
              <div
                key={reg.id}
                onClick={() => onNavigate('event-detail', reg.event_id)}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                      PASS CONFIRMED
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Token: {reg.qr_code_token.slice(0, 16)}...
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition mb-1">
                    {reg.event_title}
                  </h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Venue: {reg.venue} &bull; {new Date(reg.start_datetime).toLocaleString()}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Validated QR Entry Pass
                  </span>
                  <span className="text-indigo-400 font-semibold group-hover:underline">
                    View Pass &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Certificates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" /> Earned Certificates
            </h3>
            <p className="text-xs text-slate-400">Faculty-minted credentials with tamper-proof validation hashes</p>
          </div>
        </div>

        {certificates.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 rounded-3xl border border-slate-800 text-xs text-slate-400">
            No certificates minted yet. Complete workshops and hackathons to receive accredited credentials.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map(cert => (
              <div
                key={cert.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-500/40">
                      {cert.type}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {cert.certificate_number}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition mb-1">
                    {cert.title}
                  </h4>
                  <div className="text-xs text-slate-400 mb-3">
                    Issued: {new Date(cert.issue_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-mono text-[11px]">Validated</span>
                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <FileCheck className="w-3.5 h-3.5" /> View Certificate
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
          onNavigateToVerify={(cNum) => onNavigate('verify', cNum)}
        />
      )}
    </div>
  );
};
