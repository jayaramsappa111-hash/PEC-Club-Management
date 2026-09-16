import React from 'react';
import { X, Download, ExternalLink, ShieldCheck, CheckCircle2, Calendar, Award, Building2 } from 'lucide-react';
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
    link.download = `pu-membership-pass-${card.membership_id}.pdf`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-blue-900" /> Pragati University
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-display">Student Club Membership Smart Pass</h3>
          <p className="text-xs text-slate-500">Cryptographically verifiable institutional technical society pass</p>
        </div>

        {/* Digital Card Preview (CR80 standard aspect ratio ~85.6mm x 54mm) */}
        <div className="w-full rounded-2xl bg-gradient-to-br from-[#0b2239] via-[#0e2c4c] to-[#123860] border border-blue-800 p-5 shadow-lg relative overflow-hidden text-white">
          {/* Subtle watermark background circles */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-blue-400/10 blur-xl pointer-events-none"></div>

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 px-2 py-0.5 bg-white rounded-md flex items-center justify-center shadow-xs">
                <img
                  src="/assets/institutions/pragati-engineering-college/logo.png"
                  alt="PU"
                  className="h-6 w-auto object-contain"
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-200 tracking-wide">
                  PRAGATI UNIVERSITY
                </div>
                <div className="text-xs font-bold text-blue-200">
                  {card.club_name}
                </div>
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
              card.status === 'ACTIVE'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-950 text-amber-300 border-amber-500/40'
            }`}>
              {card.status}
            </span>
          </div>

          {/* Card Body with Student Info & QR */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="col-span-2 space-y-2">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Student Name</div>
                <div className="text-sm font-bold text-white tracking-wide">{card.student_name}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Roll Number</div>
                  <div className="font-mono text-slate-200 text-[11px] font-bold">{card.student_roll || '23A31A0501'}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Department</div>
                  <div className="text-slate-200 text-[11px] truncate">{card.department_name || 'CSE'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Member Pass ID</div>
                  <div className="font-mono text-blue-300 text-[11px] font-bold">{card.membership_id}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Valid Academic Year</div>
                  <div className="text-slate-200 text-[11px]">2025&ndash;2026</div>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-xs">
              {card.qrDataUrl ? (
                <img src={card.qrDataUrl} alt="Membership QR" className="w-20 h-20" />
              ) : (
                <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-slate-400 font-mono text-[10px]">
                  [QR PASS]
                </div>
              )}
              <span className="text-[8px] font-mono text-slate-800 font-bold mt-1 uppercase">Scan for Entry</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-300">
            <span>Faculty Coordinator Supervised Chapter</span>
            <span className="font-mono">AUTONOMOUS &bull; NBA ACCREDITED</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={downloadPdf}
            className="w-full sm:w-1/2 px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" /> Download Official PDF
          </button>

          <button
            onClick={() => {
              onClose();
              if (onNavigateToVerify) {
                onNavigateToVerify(card.membership_id);
              }
            }}
            className="w-full sm:w-1/2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4 text-blue-900" /> Verify on Public Registry
          </button>
        </div>
      </div>
    </div>
  );
};
