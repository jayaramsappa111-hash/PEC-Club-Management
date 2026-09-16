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
  AlertCircle,
  Building2,
  X
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-blue-900" /> Cryptographically Validated Credentials &bull; PEC
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Institutional Certificates &amp; Credentials
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            Tamper-proof verifiable certificates issued by faculty coordinators and technical club leadership.
          </p>
        </div>

        {canIssue && (
          <button
            onClick={() => setShowIssueModal(true)}
            className="self-start md:self-auto px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Mint &amp; Issue Certificate
          </button>
        )}
      </div>

      {/* Verification Lookup Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" /> Public Credential Verifier
          </h3>
          <p className="text-xs text-slate-500">
            Enter any Certificate ID or QR Hash to verify authenticity against institutional database
          </p>
        </div>

        <form onSubmit={handleVerifyLookup} className="flex items-center gap-2 w-full sm:w-80">
          <input
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            placeholder="e.g. CERT-PEC-..."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-900 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg whitespace-nowrap transition"
          >
            Verify
          </button>
        </form>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div className={`p-3.5 rounded-lg text-xs flex items-center gap-2 ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Certificates Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading verified credentials...</div>
      ) : certificates.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-xs">
          No certificates found for this account. Attend events or complete certified milestones to earn credentials.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificates.map(cert => (
            <div
              key={cert.id}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-900 transition flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                    {cert.type}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" /> VERIFIED
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition mb-1">
                  {cert.title}
                </h3>
                <div className="text-xs text-slate-500 mb-2">
                  Awarded to: <strong className="text-slate-800 font-semibold">{cert.recipient_name}</strong>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed font-normal">
                  {cert.description || 'Awarded for active participation, technical problem-solving, and workshop attendance.'}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1 mb-4">
                  <div>ID: <span className="text-blue-900 font-bold">{cert.certificate_number}</span></div>
                  <div className="truncate text-slate-400 text-[10px]">Hash: {cert.verification_hash || 'SHA256-AUTHENTIC'}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  {new Date(cert.issued_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Award className="w-3.5 h-3.5" /> View Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue Certificate Modal for Faculty */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowIssueModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Mint Verified Institutional Certificate</h3>
            <p className="text-xs text-slate-500 mb-4">Signs an immutable certificate hash linked to the student ledger</p>

            <form onSubmit={handleIssueCert} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Recipient Student ID / User ID *</label>
                <input
                  type="text"
                  required
                  value={issueRecipientId}
                  onChange={e => setIssueRecipientId(e.target.value)}
                  placeholder="e.g. usr-student-1 or student email"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Certificate Title *</label>
                <input
                  type="text"
                  required
                  value={issueTitle}
                  onChange={e => setIssueTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Type *</label>
                  <select
                    value={issueType}
                    onChange={e => setIssueType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  >
                    <option value="MERIT">MERIT</option>
                    <option value="EXCELLENCE">EXCELLENCE</option>
                    <option value="PARTICIPATION">PARTICIPATION</option>
                    <option value="LEADERSHIP">LEADERSHIP</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Issuing Club ID *</label>
                  <input
                    type="text"
                    required
                    value={issueClubId}
                    onChange={e => setIssueClubId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Citation / Description *</label>
                <textarea
                  rows={3}
                  required
                  value={issueDesc}
                  onChange={e => setIssueDesc(e.target.value)}
                  placeholder="In recognition of outstanding technical contributions during the 2026 Academic Hackathon..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold"
                >
                  {submitting ? 'Minting...' : 'Mint & Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Certificate View Modal */}
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
