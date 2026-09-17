import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle,
  ArrowLeft,
  QrCode,
  Star,
  MessageSquare,
  AlertCircle,
  UserCheck,
  Building2,
  GraduationCap
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { Event, EventRegistration } from '../types';
import { useAuth } from '../context/AuthContext';
import { QRScannerModal } from '../components/QRScannerModal';
import { SelfQRScannerModal } from '../components/SelfQRScannerModal';

interface EventDetailPageProps {
  eventId: string;
  onNavigate: (tab: string, param?: string) => void;
  onOpenAuth: () => void;
}

export const EventDetailPage: React.FC<EventDetailPageProps> = ({
  eventId,
  onNavigate,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [userRegistration, setUserRegistration] = useState<EventRegistration | null>(null);
  const [userAttendance, setUserAttendance] = useState<any>(null);
  const [userFeedback, setUserFeedback] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration & Feedback action states
  const [registering, setRegistering] = useState(false);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Official dynamic Event QR state (generated client-side)
  const [eventCheckInQrUrl, setEventCheckInQrUrl] = useState<string>('');

  // Scanner modal for organizers
  const [showScanner, setShowScanner] = useState(false);

  // Scanner modal for students
  const [showSelfScanner, setShowSelfScanner] = useState(false);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const eRes = await api.events.get(eventId);
      setEvent(eRes.event);
      setUserRegistration(eRes.userRegistration || null);
      setUserAttendance(eRes.userAttendance || null);
      setUserFeedback(eRes.userFeedback || null);

      try {
        const fRes = await api.events.getFeedback(eventId);
        setFeedbacks(fRes.feedbacks || []);
      } catch {
        setFeedbacks([]);
      }
    } catch (err) {
      console.error('Failed to load event details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId, user]);

  // Generate official real-time check-in QR code
  useEffect(() => {
    if (event) {
      QRCode.toDataURL(`PU-EVENT-CHECKIN-${event.id}`, {
        width: 350,
        margin: 2,
        color: {
          dark: '#0f172a', // slate-900
          light: '#f8fafc', // slate-50
        }
      })
        .then((url) => {
          setEventCheckInQrUrl(url);
        })
        .catch((err) => {
          console.error('Failed to generate event check-in QR code', err);
        });
    }
  }, [event]);

  const handleRegister = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    setRegistering(true);
    setStatusMsg(null);
    try {
      const res = await api.events.register(eventId);
      setStatusMsg({
        type: 'success',
        text: `Registration confirmed! Your entry pass token is ${res.qrToken}`,
      });
      await fetchEvent();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Registration failed' });
    } finally {
      setRegistering(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await api.events.submitFeedback(eventId, { rating, comments });
      setStatusMsg({ type: 'success', text: 'Thank you! Your feedback has been recorded.' });
      await fetchEvent();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to submit feedback' });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-500">Loading event schedule...</div>;
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-sm font-bold text-slate-800">Event record not found.</div>
        <button
          onClick={() => onNavigate('events')}
          className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold cursor-pointer"
        >
          Back to Events Directory
        </button>
      </div>
    );
  }

  const isOrganizerOrAdmin = user?.roles.some(r =>
    ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN'].includes(r)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('events')}
          className="text-xs text-slate-600 hover:text-blue-900 font-medium flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events Directory
        </button>
        <span className="text-xs text-slate-500">Pragati University</span>
      </div>

      {/* Main Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                {event.event_type}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                {event.status.replace(/_/g, ' ')}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                Organized by {event.club_name}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {event.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {event.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-900" />
                <span>{new Date(event.start_datetime).toLocaleString()} &ndash; {new Date(event.end_datetime).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>{event.venue} (PEC Campus)</span>
              </div>
            </div>
          </div>

          {/* Action Box */}
          <div className="shrink-0 flex flex-col items-start md:items-end gap-3 w-full md:w-64">
            {userRegistration ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 w-full text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle className="w-4 h-4 text-emerald-700" /> Registration Confirmed
                </div>
                <div className="text-[11px] text-slate-600 font-mono">
                  Pass Token: <span className="font-bold text-slate-900">{userRegistration.qr_code_token || 'VALID-PASS'}</span>
                </div>
                {userAttendance ? (
                  <div className="text-[10px] font-bold text-emerald-800 bg-emerald-100 py-1 rounded">
                    Attendance Validated &bull; Checked In
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-emerald-200/50">
                    <div className="text-[10px] text-slate-500">
                      You are ready to scan physical attendance check-in:
                    </div>
                    <button
                      onClick={() => setShowSelfScanner(true)}
                      className="w-full px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer animate-pulse"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Scan Attendance (Self Check-In)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full space-y-2">
                <button
                  onClick={handleRegister}
                  disabled={registering || event.status !== 'REGISTRATION_OPEN'}
                  className="w-full px-5 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  {registering ? 'Registering...' : 'Register for Event'}
                </button>

                {user && (
                  <button
                    onClick={() => {
                      setStatusMsg({
                        type: 'error',
                        text: 'You must register for this event first before checking in!'
                      });
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold border border-slate-300 border-dashed transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-slate-400" />
                    Scan Attendance
                  </button>
                )}
              </div>
            )}

            {isOrganizerOrAdmin && (
              <button
                onClick={() => setShowScanner(true)}
                className="w-full px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-blue-900" />
                Open Attendance QR Scanner
              </button>
            )}
          </div>
        </div>

        {/* Status Msg */}
        {statusMsg && (
          <div className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* Attendance & Feedback Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Feedback Form */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">Event Feedback &amp; Evaluation</h3>
          </div>

          {userFeedback ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-1 font-bold text-slate-900">
                <span>Your Rating: {userFeedback.rating} / 5</span>
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              </div>
              <p className="text-slate-600 italic">&ldquo;{userFeedback.comments}&rdquo;</p>
            </div>
          ) : userRegistration ? (
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Rating (1 to 5 stars)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      className="p-1 text-slate-300 hover:text-amber-500 transition cursor-pointer"
                    >
                      <Star className={`w-5 h-5 ${s <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Feedback Comments</label>
                <textarea
                  rows={2}
                  required
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share insights regarding the workshop contents, mentors, and lab hands-on..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <button
                type="submit"
                disabled={submittingFeedback}
                className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition cursor-pointer"
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-500 leading-relaxed">
              Only registered participants may submit post-session feedback. Please register first.
            </p>
          )}
        </div>

        {/* Panel 2: Real-time Event check-in QR displayer */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-between text-center space-y-4">
          <div className="flex items-center gap-2 self-start w-full border-b border-slate-100 pb-3">
            <QrCode className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900 text-left">Official Check-In QR</h3>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            {eventCheckInQrUrl ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center space-y-1.5 shadow-inner">
                <img
                  src={eventCheckInQrUrl}
                  alt="Official Check-In QR"
                  className="w-40 h-40 border border-slate-200 bg-white p-1.5 rounded-lg"
                />
                <span className="text-[9px] text-slate-500 font-mono select-all">
                  PU-EVENT-CHECKIN-{event.id}
                </span>
              </div>
            ) : (
              <div className="w-40 h-40 bg-slate-100 rounded-lg animate-pulse border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
            <p className="text-[11px] text-slate-500 leading-normal max-w-xs">
              Present this code for scanning. Scanning this QR code with the **Scan Attendance** button checks you in instantly!
            </p>
          </div>
        </div>

        {/* Panel 3: Recent Participant Reviews */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Participant Reviews ({feedbacks.length})
          </h3>
          {feedbacks.length === 0 ? (
            <p className="text-xs text-slate-500">No participant reviews published yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {feedbacks.map((f, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{f.student_name || 'PEC Student'}</span>
                    <span className="flex items-center gap-0.5 text-amber-600 font-bold text-[11px]">
                      {f.rating} <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{f.comments}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal for Organizers */}
      {showScanner && (
        <QRScannerModal
          eventId={event.id}
          onClose={() => {
            setShowScanner(false);
            fetchEvent();
          }}
        />
      )}

      {/* QR Scanner Modal for Students Self-Check-In */}
      {showSelfScanner && (
        <SelfQRScannerModal
          eventId={event.id}
          eventTitle={event.title}
          onClose={() => {
            setShowSelfScanner(false);
            fetchEvent();
          }}
          onSuccess={() => {
            fetchEvent();
          }}
        />
      )}
    </div>
  );
};
