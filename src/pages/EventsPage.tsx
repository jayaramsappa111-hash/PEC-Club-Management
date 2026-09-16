import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  MapPin,
  Clock,
  Users,
  Plus,
  ArrowRight,
  Filter,
  CheckCircle,
  AlertCircle,
  Building2,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Event, Club } from '../types';
import { useAuth } from '../context/AuthContext';

interface EventsPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [clubId, setClubId] = useState('');
  const [eventType, setEventType] = useState<'WORKSHOP' | 'HACKATHON' | 'SEMINAR' | 'COMPETITION'>('WORKSHOP');
  const [venue, setVenue] = useState('Auditorium Hall B');
  const [capacity, setCapacity] = useState('80');
  const [startDateTime, setStartDateTime] = useState('2026-04-10T10:00');
  const [endDateTime, setEndDateTime] = useState('2026-04-10T17:00');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const [eRes, cRes] = await Promise.all([
        api.events.list({ event_type: selectedType || undefined, search: search || undefined }),
        api.clubs.list(),
      ]);
      setEvents(eRes.events);
      setClubs(cRes.clubs);
      if (cRes.clubs.length > 0 && !clubId) {
        setClubId(cRes.clubs[0].id);
      }
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedType, search]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.events.create({
        title,
        club_id: clubId,
        event_type: eventType,
        venue,
        capacity: Number(capacity),
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        description,
        status: 'REGISTRATION_OPEN',
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      fetchEvents();
    } catch (err) {
      console.error('Event creation error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = user?.roles.some(r =>
    ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN'].includes(r)
  );

  const eventTypes = ['WORKSHOP', 'HACKATHON', 'SEMINAR', 'COMPETITION', 'WEBINAR'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-blue-900" /> Academic &amp; Technical Schedule &bull; Pragati University
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Events &amp; Workshops Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            Faculty-supervised workshops, hackathons, coding contests, and guest lectures at Pragati University.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start md:self-auto px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Schedule Event
          </button>
        )}
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event title or description..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-900"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedType('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedType === ''
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Types
          </button>
          {eventTypes.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedType === t
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading scheduled events...</div>
      ) : events.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white rounded-xl border border-slate-200 text-xs">
          <p className="text-slate-800 font-bold text-sm">No events found matching the specified criteria.</p>
          <p className="text-slate-500 mt-1">Check back for upcoming department-scheduled symposiums, or reset your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map(event => {
            const confirmed = event.confirmed_registrations_count || 0;
            const pct = Math.min(100, Math.round((confirmed / event.capacity) * 100));

            return (
              <div
                key={event.id}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-900 hover:shadow-xs transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                      {event.event_type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      event.status === 'REGISTRATION_OPEN'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : event.status === 'COMPLETED'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {event.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    {event.title}
                  </h3>
                  <div className="text-xs text-slate-500 mb-2">
                    Host Chapter: <span className="text-slate-800 font-semibold">{event.club_name}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed font-normal">
                    {event.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 py-2.5 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                      <span>{new Date(event.start_datetime).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {/* Seats Allocation */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Registrations</span>
                      <span className="font-mono text-slate-800 font-semibold">
                        {confirmed} / {event.capacity} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 90 ? 'bg-rose-600' : pct >= 70 ? 'bg-amber-600' : 'bg-blue-900'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">{event.capacity} total seats</span>
                    <button
                      onClick={() => onNavigate('event-detail', event.id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Schedule New Institutional Event</h3>
            <p className="text-xs text-slate-500 mb-4">Official club workshops, competitions, and technical symposiums</p>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. AI Prompt Engineering Bootcamp"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Host Club *</label>
                  <select
                    value={clubId}
                    onChange={e => setClubId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  >
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Event Type *</label>
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  >
                    <option value="WORKSHOP">WORKSHOP</option>
                    <option value="HACKATHON">HACKATHON</option>
                    <option value="SEMINAR">SEMINAR</option>
                    <option value="COMPETITION">COMPETITION</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Venue *</label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Seat Capacity *</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={e => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Start Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDateTime}
                    onChange={e => setStartDateTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">End Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDateTime}
                    onChange={e => setEndDateTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Outline syllabus, prerequisites, and resource requirements..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold"
                >
                  {submitting ? 'Saving...' : 'Publish Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
