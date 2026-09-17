import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle, AlertCircle, Camera, Sparkles, RefreshCw, Clipboard } from 'lucide-react';
import { api } from '../services/api';

interface SelfQRScannerModalProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SelfQRScannerModal: React.FC<SelfQRScannerModalProps> = ({
  eventId,
  eventTitle,
  onClose,
  onSuccess,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<{ success: boolean; message: string; checkInTime?: string } | null>(null);

  // official check-in code for this event
  const officialCode = `PU-EVENT-CHECKIN-${eventId}`;

  const triggerCheckIn = async (scannedCode: string) => {
    setLoading(true);
    setResult(null);
    setScanning(false);

    try {
      const res = await api.events.selfCheckInAttendance(eventId, scannedCode);
      setResult({
        success: true,
        message: res.message || 'Your attendance has been successfully verified & recorded.',
        checkInTime: res.checkInTime,
      });
      onSuccess();
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Self-check-in failed. Please verify the QR code is correct.',
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateSuccessScan = () => {
    triggerCheckIn(officialCode);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    triggerCheckIn(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Student Attendance Scan</h3>
            <p className="text-[11px] text-slate-500 line-clamp-1">{eventTitle} &bull; Pragati Campus</p>
          </div>
        </div>

        {/* Scanning Window / Laser Frame */}
        {scanning && (
          <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex flex-col items-center justify-center p-4 mb-6">
            
            {/* Live simulation backdrop */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-slate-900 to-slate-950 animate-pulse"></div>
            
            {/* Moving Laser Sweep Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_10px_#f97316] animate-bounce z-10"></div>

            {/* Simulated Camera Viewfinder Grid Corner Accents */}
            <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-orange-500 rounded-tl-sm"></div>
            <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-orange-500 rounded-tr-sm"></div>
            <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-orange-500 rounded-bl-sm"></div>
            <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-orange-500 rounded-br-sm"></div>

            {/* Centered QR Frame */}
            <div className="w-32 h-32 border border-slate-700/60 flex items-center justify-center rounded-lg bg-slate-900/40 relative">
              <Camera className="w-8 h-8 text-slate-600 animate-pulse" />
              <div className="absolute -inset-1 border border-dashed border-orange-500/40 rounded-lg animate-spin-slow"></div>
            </div>

            {/* Frame Helper Text */}
            <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-slate-400 tracking-wide px-3 select-none">
              Position college event check-in QR within frame
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="py-10 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-600 font-medium">Validating QR token with Pragati databases...</p>
          </div>
        )}

        {/* Result Alerts */}
        {result && (
          <div className={`p-4 rounded-xl mb-6 border flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-250 ${
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
              <div className="font-bold text-[13px]">{result.success ? 'Attendance Verified!' : 'Check-In Refused'}</div>
              <p className="leading-relaxed text-slate-700">{result.message}</p>
              {result.checkInTime && (
                <div className="text-[10px] text-slate-500 pt-1 font-mono">
                  Checked-in At: {new Date(result.checkInTime).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Simulator controls for seamless demonstration in development */}
        {scanning && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>Camera Simulation Helper</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                To test check-in without an actual camera hardware interface in the emulator, click below to trigger a simulated successful QR scan:
              </p>
              
              <button
                onClick={simulateSuccessScan}
                className="w-full py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                Simulate Successful QR Scan
              </button>
            </div>

            {/* Manual input form */}
            <form onSubmit={handleManualSubmit} className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                  Fallback Manual Entry
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setManualCode(officialCode);
                  }}
                  className="text-[10px] text-orange-600 hover:text-orange-700 font-medium flex items-center gap-0.5"
                >
                  <Clipboard className="w-3 h-3" /> Insert Code
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="Enter QR token text e.g., PU-EVENT-CHECKIN-..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition whitespace-nowrap"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Retry / Dismiss button */}
        {!scanning && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => {
                setScanning(true);
                setResult(null);
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition text-center border border-slate-300"
            >
              Scan Again
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition text-center"
            >
              Done &amp; Exit
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
