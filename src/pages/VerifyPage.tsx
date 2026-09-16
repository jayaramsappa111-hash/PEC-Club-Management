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
  ArrowRight,
  Building2,
  FileCheck
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold">
          <Building2 className="w-3.5 h-3.5 text-blue-900" /> Pragati University &bull; Verification Authority
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Cryptographic Credential &amp; Pass Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Public verification portal for validating student technical chapter memberships, event access QR tokens, and tamper-proof certificate records.
        </p>
      </div>

      {/* Lookup Bar */}
      <form onSubmit={handleSubmit} className="p-2 bg-white border border-slate-300 rounded-2xl shadow-xs flex items-center gap-2">
        <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter Certificate Number, Membership ID, or QR Token..."
          className="w-full px-3 py-2.5 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden font-mono"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition whitespace-nowrap shadow-xs"
        >
          {loading ? 'Validating...' : 'Verify Authenticity'}
        </button>
      </form>

      {/* Quick Test Samples */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Sample Pass IDs:</span>
        <button
          onClick={() => {
            setCode('PU-2026-000101');
            performVerification('PU-2026-000101');
          }}
          className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-blue-900 hover:border-blue-900 font-mono text-[11px] font-bold"
        >
          PU-2026-000101
        </button>
        <button
          onClick={() => {
            setCode('PU-CERT-2026-00142');
            performVerification('PU-CERT-2026-00142');
          }}
          className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-blue-900 hover:border-blue-900 font-mono text-[11px] font-bold"
        >
          PU-CERT-2026-00142
        </button>
        <button
          onClick={() => {
            setCode('pu-vtoken-99824a7bc1d2e3f4a5b6c7d8e9f01122');
            performVerification('pu-vtoken-99824a7bc1d2e3f4a5b6c7d8e9f01122');
          }}
          className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-blue-900 hover:border-blue-900 font-mono text-[11px] font-bold"
        >
          pu-vtoken-99824a7bc...
        </button>
      </div>

      {/* Results Box */}
      {searched && (
        <div className="animate-in fade-in">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              Querying institutional database for hash record...
            </div>
          ) : result?.valid ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-emerald-300 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-emerald-100 pb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Official Verification Successful
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Authentic Pragati University Record
                  </h2>
                </div>
              </div>

              {/* Data Detail based on verified type */}
              {result.type === 'MEMBERSHIP' && result.data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Student Name</span>
                    <div className="font-bold text-slate-900 text-sm">{result.data.student_name}</div>
                    <div className="text-slate-600 font-mono">Roll: {result.data.roll_number || '23A31A0501'}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Accredited Society</span>
                    <div className="font-bold text-slate-900 text-sm">{result.data.club_name}</div>
                    <div className="text-slate-600">Category: {result.data.category || 'Industry 4.0'}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Membership Identifier</span>
                    <div className="font-mono font-bold text-blue-900">{result.data.membership_id}</div>
                    <div className="text-slate-600">Status: {result.data.status}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Faculty Coordinator</span>
                    <div className="font-bold text-slate-900">{result.data.faculty_coordinator || 'Assigned Faculty Member'}</div>
                    <div className="text-slate-600">PU Chapter Governance</div>
                  </div>
                </div>
              )}

              {result.type === 'CERTIFICATE' && result.data && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Recipient</span>
                    <div className="font-bold text-slate-900 text-sm">{result.data.recipient_name}</div>
                    <div className="text-slate-600 font-mono">Roll: {result.data.recipient_roll}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Certificate Title</span>
                    <div className="font-bold text-slate-900 text-sm">{result.data.title}</div>
                    <div className="text-slate-600 font-mono">Serial: {result.data.certificate_number}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 sm:col-span-2">
                    <span className="text-slate-500 font-medium">Issuing Authority</span>
                    <div className="font-bold text-slate-900">Pragati University &bull; {result.data.issuing_club_name || 'Technical Chapters Division'}</div>
                    <div className="text-slate-600">Cryptographically signed &amp; verified.</div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Verified by Pragati University Institutional Registry Engine</span>
                <span className="font-mono text-emerald-800 font-bold">STATUS: AUTHENTICATED</span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white border border-rose-300 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Verification Unsuccessful</span>
              </div>
              <p className="text-xs text-slate-600">
                {result?.message || 'No official record matches the provided token or serial number. Please confirm the characters on the card or certificate.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
