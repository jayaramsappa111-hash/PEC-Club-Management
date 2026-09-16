import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle, AlertCircle, Search, UserCheck } from 'lucide-react';
import { api } from '../services/api';

interface QRScannerModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onCheckInSuccess: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  eventId,
  eventTitle,
  isOpen,
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
        .then(res => setRegistrations(res.registrations))
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
      // Determine if token is qrToken or registrationId
      const payload = token.startsWith('REG-') || token.length > 25
        ? { qrToken: token }
        : { registrationId: token };

      const res = await api.events.checkInAttendance(eventId, payload);
      setResult({
        success: true,
        message: res.message,
        student: res.student,
      });
      setTokenInput('');
      onCheckInSuccess();

      // Refresh registrations list
      api.events.getRegistrations(eventId).then(r => setRegistrations(r.registrations)).catch(() => {});
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Event Attendance Check-in</h3>
            <p className="text-xs text-slate-400 line-clamp-1">{eventTitle}</p>
          </div>
        </div>

        {/* Status Message */}
        {result && (
          <div className={`p-4 rounded-xl mb-4 border flex items-start gap-3 ${
            result.success
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <div className="font-bold">{result.success ? 'Attendance Verified!' : 'Verification Failed'}</div>
              <div>{result.message}</div>
              {result.student && (
                <div className="mt-1 font-mono text-[11px] text-emerald-200">
                  Student: {result.student.name} ({result.student.student_id || 'ID Verified'})
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Token / Pass Code Entry */}
        <div className="space-y-2 mb-5">
          <label className="text-xs font-semibold text-slate-300">
            Scan / Enter Attendee Pass Token
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. REG-QR-..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={() => handleScanSubmit()}
              disabled={loading || !tokenInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shrink-0 transition flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              Check In
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Attendees present their registration pass QR from their Student Portal.
          </p>
        </div>

        {/* Quick Check-in Roster */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Confirmed Registrations ({registrations.length})
            </span>
            <span className="text-[11px] text-slate-500">Click to quick-checkin</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {registrations.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No confirmed registrations for this event yet.
              </div>
            ) : (
              registrations.map(r => (
                <div
                  key={r.id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition"
                >
                  <div>
                    <div className="font-semibold text-white">{r.student_name}</div>
                    <div className="text-[11px] text-slate-400">
                      Roll: {r.student_id || 'N/A'} &bull; {r.course || 'B.Tech'}
                    </div>
                  </div>

                  {r.attendance_status ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      Attended
                    </span>
                  ) : (
                    <button
                      onClick={() => handleScanSubmit(r.qr_code_token)}
                      className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-medium transition"
                    >
                      Check-In
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
