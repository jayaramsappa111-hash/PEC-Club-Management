import React from 'react';
import { X, Download, Award, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { Certificate } from '../types';
import { api } from '../services/api';

interface CertificateModalProps {
  certificate: (Certificate & { qrDataUrl?: string; verificationUrl?: string }) | null;
  onClose: () => void;
  onNavigateToVerify?: (certId: string) => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  onClose,
  onNavigateToVerify,
}) => {
  if (!certificate) return null;

  const downloadPdf = () => {
    const url = api.certificates.getPdfUrl(certificate.id);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificate-${certificate.certificate_id}.pdf`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5" /> Institutional Credential Record
          </div>
          <h3 className="text-lg font-bold text-white">Certificate of Achievement</h3>
          <p className="text-xs text-slate-400">Issued and verified by the Central Technical Council</p>
        </div>

        {/* Certificate Display Card */}
        <div className="border-4 border-double border-amber-500/40 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 md:p-8 relative text-center shadow-inner">
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">
            {certificate.club_name} &bull; COLLEGE OF ENGINEERING
          </div>

          <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide mt-2 mb-1">
            CERTIFICATE OF {certificate.certificate_type || 'PARTICIPATION'}
          </h2>

          <p className="text-xs text-slate-400 italic">This is proudly presented to</p>

          <div className="text-xl md:text-2xl font-serif font-bold text-amber-300 tracking-wider my-3">
            {certificate.student_name}
          </div>

          <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
            for meritorious engagement and successful attendance in{' '}
            <span className="font-semibold text-white">"{certificate.event_title}"</span> organized by{' '}
            <span className="font-semibold text-blue-400">{certificate.club_name}</span>.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-3 gap-4 items-end text-left text-xs">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Date Issued</div>
              <div className="font-mono text-slate-200 text-[11px]">
                {new Date(certificate.issued_at).toLocaleDateString()}
              </div>
            </div>

            <div className="flex flex-col items-center">
              {certificate.qrDataUrl ? (
                <img src={certificate.qrDataUrl} alt="Certificate QR" className="w-16 h-16 bg-white p-1 rounded-lg" />
              ) : (
                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-[9px] text-slate-400">
                  QR
                </div>
              )}
              <span className="text-[8px] font-mono text-slate-400 mt-1">Scan to Verify</span>
            </div>

            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Certificate ID</div>
              <div className="font-mono text-amber-300 font-bold text-[11px]">
                {certificate.certificate_id}
              </div>
              <div className="text-[9px] text-emerald-400 flex items-center justify-end gap-1 mt-0.5">
                <CheckCircle className="w-3 h-3" /> Ledger Valid
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={downloadPdf}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/30 transition"
          >
            <Download className="w-4 h-4" />
            Download High-Res PDF Certificate
          </button>

          {onNavigateToVerify && (
            <button
              onClick={() => {
                onClose();
                onNavigateToVerify(certificate.certificate_id);
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
