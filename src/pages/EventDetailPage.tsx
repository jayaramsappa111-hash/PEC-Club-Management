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
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Event, EventRegistration } from '../types';
import { useAuth } from '../context/AuthContext';
import { QRScannerModal } from '../components/QRScannerModal';

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

  // Scanner modal for organizers
  const [showScanner, setShowScanner] = useState(false);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const [eRes, fRes] = await Promise.all([
        api.events.get(eventId),
        api.events.getFeedback(eventId),
      ]);
      setEvent(eRes.event);
      setUserRegistration(eRes.userRegistration || null);
      setUserAttendance(eRes.userAttendance || null);
      setUserFeedback(eRes.userFeedback || null);
      setFeedbacks(fRes.feedbacks || []);
    } catch (err) {
      console.error('Failed to load event details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId, user]);

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
      setStatusMsg({ type: 'error', text: err.message || 'Feedback submission failed' });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const isOrganizer = user?.roles.some(r =>
    ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN'].includes(r)
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading event details from database...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="text-sm font-bold text-white">Event not found.</div>
        <button
          onClick={() => onNavigate('events')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const confirmed = event.confirmed_registrations_count || 0;
  const pct = Math.min(100, Math.round((confirmed / event.capacity) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Back button */}
      <button
        onClick={() => onNavigate('events')}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </button>

      {/* Main Event Header */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                {event.event_type}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                {event.status.replace(/_/g, ' ')}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {event.title}
            </h1>

            <div className="text-xs text-slate-400 font-medium">
              Host Technical Club:{' '}
              <button
                onClick={() => onNavigate('club-detail', event.club_id)}
                className="text-blue-400 hover:underline font-semibold"
              >
                {event.club_name}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl font-normal">
              {event.description}
            </p>
          </div>

          {/* Organizer Controls */}
          {isOrganizer && (
            <div className="shrink-0 flex flex-col gap-2">
              <button
                onClick={() => setShowScanner(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm"
              >
                <QrCode className="w-4 h-4" />
                Live Attendance Scanner
              </button>
              <div className="text-[10px] text-slate-500 text-center">
                Coordinator Privileges Active
              </div>
            </div>
          )}
        </div>

        {/* Schedule & Venue Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Date &amp; Time</div>
              <div>{new Date(event.start_datetime).toLocaleString()}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-300">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Campus Venue</div>
              <div>{event.venue}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-300">
            <Users className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Enrollment Quota</div>
              <div className="font-mono">{confirmed} / {event.capacity} seats ({pct}%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
          statusMsg.type === 'success'
            ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Registration / Entry Pass Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Agenda / Requirements */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Event Guidelines &amp; Academic Participation
            </h3>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed font-normal">
              <p>
                <strong>Eligibility:</strong> {event.eligibility || 'Open to all enrolled students across all engineering branches at Pragati Engineering College.'}
              </p>
              <p>
                <strong>Attendance Policy:</strong> Attendance is registered at the venue door via digital pass verification. Participation records contribute toward semester extracurricular credentials.
              </p>
              <p>
                <strong>Requirements:</strong> Please carry your college ID card and laptop with required technical environments pre-configured.
              </p>
            </div>
          </div>

          {/* Attendee Feedback Section (if completed or attended) */}
          {(userAttendance || event.status === 'COMPLETED') && (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Post-Event Feedback &amp; Review
                  </h3>
                  <p className="text-xs text-slate-400">Participant evaluations are shared with the department faculty advisory board.</p>
                </div>
                {event.avg_rating && (
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {event.avg_rating} / 5.0
                  </div>
                )}
              </div>

              {userFeedback ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-1 text-amber-400 font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mr-1" />
                    You rated this event {userFeedback.rating} / 5 Stars
                  </div>
                  {userFeedback.comments && (
                    <div className="text-slate-400 italic">&ldquo;{userFeedback.comments}&rdquo;</div>
                  )}
                </div>
              ) : user ? (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Your Rating</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition"
                        >
                          <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-400' : 'text-slate-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Remarks &amp; Recommendations</label>
                    <textarea
                      rows={2}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Share constructive feedback for event mentors and technical leads..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Evaluation'}
                  </button>
                </form>
              ) : null}

              {/* Recent Community Feedback list */}
              {feedbacks.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Student Evaluations ({feedbacks.length})
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {feedbacks.map(f => (
                      <div key={f.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-200">{f.student_name}</span>
                          <span className="text-amber-400 font-bold flex items-center gap-1 text-[10px]">
                            <Star className="w-3 h-3 fill-amber-400" /> {f.rating}/5
                          </span>
                        </div>
                        {f.comments && <div className="text-slate-400 text-[11px]">{f.comments}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Registration Card or Pass */}
        <div className="space-y-6">
          {userRegistration ? (
            /* Student's Verified Entry Pass Card */
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Registration Confirmed
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">Digital Entry Pass</h4>
                <p className="text-[11px] text-slate-400">Present this QR code for verification at the event entrance</p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-3 rounded-lg w-40 h-40 mx-auto flex flex-col items-center justify-center border border-slate-300">
                {userRegistration.qrDataUrl ? (
                  <img src={userRegistration.qrDataUrl} alt="Pass QR" className="w-32 h-32 object-contain" />
                ) : (
                  <div className="text-slate-500 text-xs font-mono">
                    <QrCode className="w-16 h-16 text-slate-800 mb-1" />
                    PASS CODE
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Pass Token
                </div>
                <div className="font-mono text-xs font-semibold text-blue-300 bg-slate-950 py-1 px-3 rounded border border-slate-800 break-all">
                  {userRegistration.qr_code_token}
                </div>
              </div>

              {/* Attendance Verification Indicator */}
              <div className="pt-3 border-t border-slate-800">
                {userAttendance ? (
                  <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Attendance Verified ({new Date(userAttendance.check_in_time).toLocaleTimeString()})
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Awaiting Door Check-in
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Open Registration Card */
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-white">Event Registration</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Register to receive an official digital entry pass and have attendance logged for academic credits.
              </p>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Available Seats:</span>
                  <span className="font-semibold text-emerald-400">
                    {Math.max(0, event.capacity - confirmed)} Seats
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Fee:</span>
                  <span className="font-semibold text-white">Free (Autonomous Campus Quota)</span>
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={registering || (event.capacity - confirmed <= 0 && event.status !== 'REGISTRATION_OPEN')}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <UserCheck className="w-4 h-4" />
                {registering ? 'Processing Registration...' : 'Register for Event'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal for Organizer Check-ins */}
      {showScanner && (
        <QRScannerModal
          eventId={event.id}
          eventTitle={event.title}
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onCheckInSuccess={() => fetchEvent()}
        />
      )}
    </div>
  );
};
