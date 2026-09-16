import React from 'react';
import { X, Download, Award, CheckCircle, ExternalLink, ShieldCheck, Building2 } from 'lucide-react';
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
    link.download = `pec-certificate-${certificate.certificate_number || certificate.certificate_id}.pdf`;
    link.click();
  };

  const certNum = certificate.certificate_number || certificate.certificate_id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-amber-800" /> Pragati University
          </div>
          <h3 className="text-lg font-bold text-slate-900">Official Credential Record</h3>
          <p className="text-xs text-slate-500">Tamper-proof verifiable credential signed by Institutional Faculty Leadership</p>
        </div>

        {/* Certificate Display Card */}
        <div className="border-4 border-double border-amber-400/80 rounded-xl bg-amber-50/20 p-6 md:p-8 relative text-center shadow-xs">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img
              src="/assets/institutions/pragati-engineering-college/logo.png"
              alt="PU"
              className="h-8 w-auto object-contain"
            />
          </div>

          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-1">
            PRAGATI UNIVERSITY &bull; STUDENT CLUBS
          </div>

          <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 tracking-wide mt-2 mb-1">
            CERTIFICATE OF {certificate.type || certificate.certificate_type || 'TECHNICAL EXCELLENCE'}
          </h2>

          <p className="text-xs text-slate-500 italic mt-2">This is to certify that</p>

          <div className="text-xl md:text-2xl font-serif font-bold text-blue-950 tracking-wide my-2">
            {certificate.recipient_name || certificate.student_name}
          </div>

          <div className="text-xs text-slate-600 font-mono mb-2">
            Roll No: {certificate.recipient_roll || '23A31A0501'}
          </div>

          <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed">
            {certificate.description ||
              `has demonstrated exceptional technical engagement, technical problem-solving, and active contribution toward institutional workshops and hackathons organized by ${certificate.club_name || 'PEC Chapters'}.`}
          </p>

          <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 items-end text-left text-xs">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Date Issued</div>
              <div className="font-mono text-slate-800 text-[11px] font-bold">
                {new Date(certificate.issued_at).toLocaleDateString()}
              </div>
            </div>

            <div className="flex flex-col items-center">
              {certificate.qrDataUrl ? (
                <img src={certificate.qrDataUrl} alt="Certificate QR" className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 shadow-xs" />
              ) : (
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[9px] text-slate-400 font-mono">
                  [QR]
                </div>
              )}
              <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase font-bold">Scan to Verify</span>
            </div>

            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Certificate Serial</div>
              <div className="font-mono text-blue-900 font-bold text-[11px]">
                {certNum}
              </div>
              <div className="text-[9px] text-emerald-800 flex items-center justify-end gap-1 mt-0.5 font-bold">
                <CheckCircle className="w-3 h-3 text-emerald-700" /> Authentic
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={downloadPdf}
            className="w-full sm:w-1/2 px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" /> Download Printable PDF
          </button>

          <button
            onClick={() => {
              onClose();
              if (onNavigateToVerify) {
                onNavigateToVerify(certNum);
              }
            }}
            className="w-full sm:w-1/2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4 text-blue-900" /> Validate On Central Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
