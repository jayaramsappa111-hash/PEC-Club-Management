import React, { useState, useEffect } from 'react';
import {
  Award,
  Search,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Plus,
  QrCode,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Certificate } from '../types';
import { useAuth } from '../context/AuthContext';
import { CertificateModal } from '../components/CertificateModal';

interface CertificatesPageProps {
  onNavigate: (tab: string, param?: string) => void;
  onOpenAuth: () => void;
}

export const CertificatesPage: React.FC<CertificatesPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Active Certificate Modal
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  // Public Verify search box
  const [verifyCode, setVerifyCode] = useState('');

  // Issue modal for Faculty
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueRecipientId, setIssueRecipientId] = useState('');
  const [issueTitle, setIssueTitle] = useState('Certificate of Technical Excellence');
  const [issueType, setIssueType] = useState<'PARTICIPATION' | 'MERIT' | 'EXCELLENCE' | 'LEADERSHIP'>('MERIT');
  const [issueClubId, setIssueClubId] = useState('club-1');
  const [issueDesc, setIssueDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const res = await api.certificates.list();
      setCertificates(res.certificates);
    } catch (err) {
      console.error('Failed to load certificates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, [user]);

  const handleIssueCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await api.certificates.issue({
        recipient_id: issueRecipientId,
        title: issueTitle,
        type: issueType,
        club_id: issueClubId,
        description: issueDesc,
      });
      setStatusMsg({
        type: 'success',
        text: `Certificate successfully minted with Hash: ${res.certificate.verification_hash.slice(0, 16)}...`,
      });
      setShowIssueModal(false);
      fetchCerts();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Minting failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.trim()) {
      onNavigate('verify', verifyCode.trim());
    }
  };

  const canIssue = user?.roles.some(r =>
    ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'DEPARTMENT_ADMIN'].includes(r)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5" /> Cryptographically Validated Credentials
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Institutional Certificates & Credentials
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Tamper-proof verifiable certificates issued by faculty coordinators and technical club leadership.
          </p>
        </div>

        {canIssue && (
          <button
            onClick={() => setShowIssueModal(true)}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Mint & Issue Certificate
          </button>
        )}
      </div>

      {/* Verification Lookup Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Public Credential Verifier
          </h3>
          <p className="text-xs text-slate-400">
            Enter any Certificate ID or QR Hash to verify authenticity against institutional database
          </p>
        </div>

        <form onSubmit={handleVerifyLookup} className="flex items-center gap-2 w-full sm:w-80">
          <input
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            placeholder="e.g. CERT-..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl whitespace-nowrap transition"
          >
            Verify
          </button>
        </form>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
          statusMsg.type === 'success'
            ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Certificates Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading verified credentials...</div>
      ) : certificates.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 text-xs">
          No certificates found for this account. Attend events or complete roadmaps to earn credentials.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(cert => (
            <div
              key={cert.id}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-500/40">
                    {cert.type}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition mb-1">
                  {cert.title}
                </h3>
                <div className="text-xs text-slate-400 mb-2">
                  Awarded to: <strong className="text-slate-200">{cert.recipient_name}</strong>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                  {cert.description || 'Awarded for active participation, technical problem-solving, and workshop attendance.'}
                </p>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1 mb-4">
                  <div>ID: <span className="text-indigo-300">{cert.certificate_number}</span></div>
                  <div className="truncate">Hash: {cert.verification_hash?.slice(0, 24)}...</div>
                </div>
              </div>

              <div>
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[10px]">
                    Issued: {new Date(cert.issue_date).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition shadow-sm"
                  >
                    <FileCheck className="w-3.5 h-3.5" /> View Official Certificate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          onNavigateToVerify={(code) => onNavigate('verify', code)}
        />
      )}

      {/* Mint Certificate Modal (Faculty / Super Admin) */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-1">Mint Official Credential</h3>
            <p className="text-xs text-slate-400 mb-4">Signs and issues a tamper-proof credential with SHA256 integrity hash</p>

            <form onSubmit={handleIssueCert} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Recipient Student</label>
                <select
                  value={issueRecipientId}
                  onChange={(e) => setIssueRecipientId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Student Recipient...</option>
                  <option value="usr-student-1">Aarav Sharma (23BCE1001)</option>
                  <option value="usr-student-2">Rohan Varma (23BCE1002)</option>
                  <option value="usr-student-3">Ananya Iyer (23BCE1003)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Certificate Title</label>
                <input
                  type="text"
                  required
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  placeholder="e.g. Certificate of Hackathon Excellence"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Award Type</label>
                  <select
                    value={issueType}
                    onChange={(e: any) => setIssueType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="MERIT">Merit</option>
                    <option value="PARTICIPATION">Participation</option>
                    <option value="EXCELLENCE">Excellence</option>
                    <option value="LEADERSHIP">Leadership</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Hosting Club</label>
                  <select
                    value={issueClubId}
                    onChange={(e) => setIssueClubId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="club-1">Google Developer Student Club</option>
                    <option value="club-2">ACM Student Chapter</option>
                    <option value="club-3">Robotics & Autonomous Systems</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Citation / Description</label>
                <textarea
                  rows={2}
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="For demonstrated technical mastery in autonomous systems..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !issueRecipientId}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  {submitting ? 'Minting...' : 'Sign & Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
