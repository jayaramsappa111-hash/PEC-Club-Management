import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Search,
  Award,
  Users,
  Calendar,
  Lock,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

interface VerifyPageProps {
  initialCode?: string;
  onNavigate: (tab: string, param?: string) => void;
}

export const VerifyPage: React.FC<VerifyPageProps> = ({ initialCode, onNavigate }) => {
  const [code, setCode] = useState(initialCode || '');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performVerification = async (queryCode: string) => {
    if (!queryCode.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.verify(queryCode.trim());
      setResult(res);
    } catch (err) {
      console.error('Verification error', err);
      setResult({ valid: false, message: 'Institutional verification server could not be reached.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      performVerification(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(code);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-xs font-semibold">
          <Lock className="w-3.5 h-3.5" /> Institutional Trust & Verification Authority
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Cryptographic Credential Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Public verification portal for validating student technical society memberships, event access QR tokens, and tamper-proof certificates.
        </p>
      </div>

      {/* Lookup Bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex items-center gap-2">
        <Search className="w-5 h-5 text-slate-500 ml-3 shrink-0" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste Certificate ID, Membership Pass ID, or QR Token..."
          className="w-full px-3 py-2 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-md transition whitespace-nowrap"
        >
          {loading ? 'Validating...' : 'Verify Authenticity'}
        </button>
      </form>

      {/* Quick Test Samples */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Try Demo Pass:</span>
        <button
          onClick={() => {
            setCode('MEM-GDSC-2026-001');
            performVerification('MEM-GDSC-2026-001');
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 hover:border-blue-500 font-mono text-[11px]"
        >
          MEM-GDSC-2026-001
        </button>
        <button
          onClick={() => {
            setCode('CERT-2026-8801');
            performVerification('CERT-2026-8801');
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 hover:border-amber-500 font-mono text-[11px]"
        >
          CERT-2026-8801
        </button>
      </div>

      {/* Results Box */}
      {searched && (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 rounded-3xl border border-slate-800">
              Querying distributed database ledger...
            </div>
          ) : result?.valid ? (
            /* VALID VERIFIED RESULT */
            <div className="p-8 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-emerald-400 font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                      <img
                        src="/assets/institutions/pragati-engineering-college/logo.png"
                        alt="PEC"
                        className="h-4 w-auto object-contain"
                      />
                      Cryptographically Valid & Verified
                    </div>
                    <div className="text-xs text-slate-400">
                      Record officially registered in Pragati Engineering College (PEC) Technical Society Ledger
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  {result.type}
                </span>
              </div>

              {/* Specific Content Type Display */}
              {result.type === 'CERTIFICATE' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-500 uppercase font-semibold">Award Title</div>
                      <div className="text-sm font-bold text-white">{result.record.title}</div>
                      <div className="text-slate-400">Honors Level: {result.record.type}</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-500 uppercase font-semibold">Recipient Identity</div>
                      <div className="text-sm font-bold text-white">{result.record.recipient_name}</div>
                      <div className="text-slate-400 font-mono">Student ID: {result.record.recipient_roll}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Certificate Number</span>
                      <span className="font-mono text-amber-400 font-bold">{result.record.certificate_number}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Sponsoring Society</span>
                      <span className="text-white font-semibold">{result.record.club_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Date of Issuance</span>
                      <span className="text-slate-300">{new Date(result.record.issue_date).toLocaleDateString()}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">SHA-256 Ledger Hash</div>
                      <div className="font-mono text-[11px] text-emerald-400 break-all bg-slate-900 p-2 rounded-lg border border-slate-800">
                        {result.record.verification_hash}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {result.type === 'MEMBERSHIP' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-500 uppercase font-semibold">Member Name</div>
                      <div className="text-sm font-bold text-white">{result.record.user_name}</div>
                      <div className="text-slate-400 font-mono">{result.record.student_id} &bull; {result.record.course}</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-500 uppercase font-semibold">Affiliated Club</div>
                      <div className="text-sm font-bold text-white">{result.record.club_name}</div>
                      <div className="text-emerald-400 font-semibold">Status: {result.record.status}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Digital Pass Number</span>
                      <span className="font-mono text-blue-400 font-bold">{result.record.membership_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Academic Cycle</span>
                      <span className="text-white font-mono">{result.record.academic_year || '2025-2026'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Verified Join Date</span>
                      <span className="text-slate-300">{new Date(result.record.joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {result.type === 'EVENT_PASS' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">Event Title</div>
                    <div className="text-base font-bold text-white">{result.record.event_title}</div>
                    <div className="text-slate-400">Attendee: <strong className="text-white">{result.record.user_name}</strong></div>
                    <div className="text-slate-400">Venue: {result.record.venue}</div>
                    <div className="text-emerald-400 font-semibold">Registration Status: {result.record.status}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* INVALID RESULT */
            <div className="p-8 rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Record Verification Failed</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {result?.message || 'No official institutional credential was found with the specified token or identifier.'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-500 font-mono">
                Identifier: {code}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
