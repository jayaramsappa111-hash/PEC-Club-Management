import React from 'react';
import { X, Download, ExternalLink, ShieldCheck, CheckCircle2, Calendar, Award } from 'lucide-react';
import { Membership } from '../types';
import { api } from '../services/api';

interface DigitalCardModalProps {
  card: (Membership & { qrDataUrl?: string; verificationUrl?: string }) | null;
  onClose: () => void;
  onNavigateToVerify?: (membershipId: string) => void;
}

export const DigitalCardModal: React.FC<DigitalCardModalProps> = ({ card, onClose, onNavigateToVerify }) => {
  if (!card) return null;

  const downloadPdf = () => {
    const url = api.memberships.getCardPdfUrl(card.id);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digital-card-${card.membership_id}.pdf`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-800 text-blue-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Official Digital Credential
          </div>
          <h3 className="text-lg font-bold text-white">Student Membership Pass</h3>
          <p className="text-xs text-slate-400">Cryptographically verifiable CR80 technical society badge</p>
        </div>

        {/* Digital Card Preview (CR80 standard aspect ratio ~85.6mm x 54mm) */}
        <div className="w-full rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 border border-blue-500/30 p-5 shadow-2xl relative overflow-hidden text-white">
          {/* Subtle watermark background circles */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-blue-500/10 blur-xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-indigo-500/10 blur-xl pointer-events-none"></div>

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 px-2 py-0.5 bg-white rounded-lg flex items-center justify-center shadow-md">
                <img
                  src="/assets/institutions/pragati-engineering-college/logo.png"
                  alt="PEC"
                  className="h-6 w-auto object-contain"
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-300">
                  Pragati Engineering College (PEC)
                </div>
                <div className="text-xs font-semibold text-blue-300">
                  {card.club_name} &bull; Member
                </div>
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
              card.status === 'ACTIVE'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
            }`}>
              {card.status}
            </span>
          </div>

          {/* Card Body with Student Info & QR */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="col-span-2 space-y-2">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Student Name</div>
                <div className="text-sm font-bold text-white tracking-wide">{card.student_name}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Roll Number</div>
                  <div className="font-mono text-slate-200 text-[11px]">{card.student_roll || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Department</div>
                  <div className="text-slate-200 text-[11px] truncate">{card.department_name || 'Engineering'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Member ID</div>
                  <div className="font-mono text-blue-300 text-[11px] font-semibold">{card.membership_id}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Valid Thru</div>
                  <div className="text-slate-300 text-[11px] font-mono">
                    {card.valid_until ? new Date(card.valid_until).toLocaleDateString() : 'Active Term'}
                  </div>
                </div>
              </div>
            </div>

            {/* Live QR Code Box */}
            <div className="flex flex-col items-center justify-center bg-white p-2 rounded-xl shadow-md border border-slate-200">
              {card.qrDataUrl ? (
                <img src={card.qrDataUrl} alt="Membership QR" className="w-24 h-24 object-contain" />
              ) : (
                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-slate-400 text-[10px]">
                  QR Code
                </div>
              )}
              <span className="text-[8px] font-bold text-slate-600 mt-1 uppercase tracking-tight font-mono">
                Scan to Verify
              </span>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
            <span>Academic Term: {card.academic_year_name || '2025-2026'}</span>
            <span className="font-mono text-[9px] text-blue-300">ID: {card.id.slice(0, 10)}</span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={downloadPdf}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition"
          >
            <Download className="w-4 h-4" />
            Download Official Card PDF
          </button>

          {onNavigateToVerify && (
            <button
              onClick={() => {
                onClose();
                onNavigateToVerify(card.membership_id);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700"
            >
              <ExternalLink className="w-4 h-4" />
              Public Verification Ledger
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
