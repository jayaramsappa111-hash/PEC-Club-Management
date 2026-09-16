import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle, AlertCircle, Search, UserCheck, Building2 } from 'lucide-react';
import { api } from '../services/api';

interface QRScannerModalProps {
  eventId: string;
  eventTitle?: string;
  isOpen?: boolean;
  onClose: () => void;
  onCheckInSuccess?: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  eventId,
  eventTitle = 'Campus Workshop',
  isOpen = true,
  onClose,
  onCheckInSuccess,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; student?: any } | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && eventId) {
      api.events.getRegistrations(eventId)
        .then(res => setRegistrations(res.registrations || []))
        .catch(() => {});
    }
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  const handleScanSubmit = async (tokenToUse?: string) => {
    const token = tokenToUse || tokenInput.trim();
    if (!token) return;

    setLoading(true);
    setResult(null);

    try {
      const payload = token.startsWith('REG-') || token.length > 20
        ? { qrToken: token }
        : { registrationId: token };

      const res = await api.events.checkInAttendance(eventId, payload);
      setResult({
        success: true,
        message: res.message || 'Attendance verified & logged successfully.',
        student: res.student,
      });
      setTokenInput('');
      if (onCheckInSuccess) onCheckInSuccess();

      // Refresh registrations list
      api.events.getRegistrations(eventId).then(r => setRegistrations(r.registrations || [])).catch(() => {});
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Check-in validation failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Event Attendance Check-In</h3>
            <p className="text-xs text-slate-500 line-clamp-1">{eventTitle} &bull; PEC</p>
          </div>
        </div>

        {/* Status Message */}
        {result && (
          <div className={`p-4 rounded-xl mb-4 border flex items-start gap-3 ${
            result.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-bold">{result.message}</div>
              {result.student && (
                <div className="text-slate-700 font-mono">
                  {result.student.name} ({result.student.student_id || result.student.roll_number || '23A31A0501'})
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Token or Scanner input */}
        <form onSubmit={(e) => { e.preventDefault(); handleScanSubmit(); }} className="space-y-3 mb-6">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Scan Pass QR or Enter Token / Roll ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Scan pass token or enter registration code..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-900 font-mono"
              />
              <button
                type="submit"
                disabled={loading || !tokenInput.trim()}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition whitespace-nowrap shadow-xs"
              >
                {loading ? 'Checking...' : 'Check In'}
              </button>
            </div>
          </div>
        </form>

        {/* Registered Participants Roster */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Registered Attendee Roster ({registrations.length})
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">One-Click Validation</span>
          </div>

          {registrations.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">No registrations for this event yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{reg.student_name || 'PEC Student'}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{reg.student_roll || reg.qr_code_token}</div>
                  </div>

                  {reg.attended_at ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Checked In
                    </span>
                  ) : (
                    <button
                      onClick={() => handleScanSubmit(reg.qr_code_token || reg.id)}
                      className="px-2.5 py-1 rounded bg-blue-900 hover:bg-blue-800 text-white font-bold text-[10px] shadow-xs"
                    >
                      Check In
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
