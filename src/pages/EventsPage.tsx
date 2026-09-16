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
  X,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  CalendarDays
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

  // Calendar States
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'grid' | 'list'>('month');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

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

  // Premium feature: automatically focus calendar date on the nearest event's month
  useEffect(() => {
    if (events.length > 0) {
      const now = new Date();
      const hasEventsThisMonth = events.some(e => {
        const d = new Date(e.start_datetime);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      if (!hasEventsThisMonth) {
        // Find nearest future event, or simply focus on the first event
        const sortedEvents = [...events].sort(
          (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
        );
        const nearestDate = new Date(sortedEvents[0].start_datetime);
        setCalendarDate(nearestDate);
      }
    }
  }, [events]);

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

  // Calendar Math & Helpers
  const currentMonth = calendarDate.getMonth();
  const currentYear = calendarDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Trailing days from previous month
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const prevDaysToRender = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevDaysToRender.push(prevMonthDays - i);
  }

  // Active month days
  const currentDaysToRender = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentDaysToRender.push(i);
  }

  // Leading days to balance calendar grid cells
  const totalCells = prevDaysToRender.length + currentDaysToRender.length;
  const nextDaysToRender = [];
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remainingCells; i++) {
    nextDaysToRender.push(i);
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const typeColors: Record<string, { bg: string; text: string; border: string; accent: string }> = {
    WORKSHOP: {
      bg: 'bg-blue-50/90',
      text: 'text-blue-900',
      border: 'border-blue-200',
      accent: 'bg-blue-600',
    },
    HACKATHON: {
      bg: 'bg-purple-50/90',
      text: 'text-purple-900',
      border: 'border-purple-200',
      accent: 'bg-purple-600',
    },
    SEMINAR: {
      bg: 'bg-emerald-50/90',
      text: 'text-emerald-900',
      border: 'border-emerald-200',
      accent: 'bg-emerald-600',
    },
    COMPETITION: {
      bg: 'bg-amber-50/90',
      text: 'text-amber-900',
      border: 'border-amber-200',
      accent: 'bg-amber-600',
    },
    WEBINAR: {
      bg: 'bg-rose-50/90',
      text: 'text-rose-900',
      border: 'border-rose-200',
      accent: 'bg-rose-600',
    },
  };

  const getTypeColors = (type: string) => {
    return typeColors[type] || {
      bg: 'bg-slate-50/90',
      text: 'text-slate-900',
      border: 'border-slate-200',
      accent: 'bg-slate-600',
    };
  };

  const isToday = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return false;
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === currentMonth &&
           today.getFullYear() === currentYear;
  };

  const handlePrevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCalendarDate(new Date());
  };

  // Week view calculation
  const startOfWeek = (() => {
    const d = new Date(calendarDate);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  })();

  const getDayOfActiveWeek = (idx: number) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + idx);
    return d;
  };

  const handlePrevWeek = () => {
    const d = new Date(calendarDate);
    d.setDate(d.getDate() - 7);
    setCalendarDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(calendarDate);
    d.setDate(d.getDate() + 7);
    setCalendarDate(d);
  };

  const getWeekRangeString = () => {
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startStr = startOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric' });
    const endStr = endOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  };

  const getDayEventsForDate = (dateObj: Date) => {
    return events.filter(evt => {
      const eDate = new Date(evt.start_datetime);
      return eDate.getDate() === dateObj.getDate() &&
             eDate.getMonth() === dateObj.getMonth() &&
             eDate.getFullYear() === dateObj.getFullYear();
    });
  };

  const handleDayDoubleClick = (day: number) => {
    if (!canCreate) return;
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    setStartDateTime(`${currentYear}-${formattedMonth}-${formattedDay}T10:00`);
    setEndDateTime(`${currentYear}-${formattedMonth}-${formattedDay}T17:00`);
    setShowCreateModal(true);
  };

  // Month View Day Cell Render
  const renderMonthDays = () => {
    const grid = [];

    // Preceding Month Days
    prevDaysToRender.forEach(dayNum => {
      grid.push(
        <div
          key={`prev-${dayNum}`}
          onClick={() => setCalendarDate(new Date(currentYear, currentMonth - 1, dayNum))}
          className="min-h-[110px] p-2 bg-slate-50/30 border border-slate-100 text-slate-300 text-xs font-semibold cursor-pointer transition hover:bg-slate-50/80 flex flex-col justify-start"
        >
          <span>{dayNum}</span>
        </div>
      );
    });

    // Current Month Days
    currentDaysToRender.forEach(dayNum => {
      const isTodayCell = isToday(dayNum, true);
      const dayEvents = events.filter(evt => {
        const eDate = new Date(evt.start_datetime);
        return eDate.getDate() === dayNum &&
               eDate.getMonth() === currentMonth &&
               eDate.getFullYear() === currentYear;
      });

      grid.push(
        <div
          key={`curr-${dayNum}`}
          onDoubleClick={() => handleDayDoubleClick(dayNum)}
          className={`min-h-[110px] p-2 border border-slate-200 flex flex-col justify-between transition relative group/cell ${
            isTodayCell ? 'bg-blue-50/10' : 'bg-white hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                isTodayCell
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              {dayNum}
            </span>
            {canCreate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDayDoubleClick(dayNum);
                }}
                className="opacity-0 group-hover/cell:opacity-100 p-0.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition"
                title="Schedule Event on this date"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto max-h-[75px] scrollbar-thin">
            {dayEvents.map(evt => {
              const colors = getTypeColors(evt.event_type);
              return (
                <div
                  key={evt.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('event-detail', evt.id);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border truncate transition cursor-pointer flex items-center gap-1 ${colors.bg} ${colors.text} ${colors.border} hover:opacity-85`}
                  title={`${evt.title} - ${evt.club_name}`}
                >
                  <span className={`w-1 h-1 rounded-full shrink-0 ${colors.accent}`}></span>
                  <span className="truncate">{evt.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    });

    // Succeeding Month Days
    nextDaysToRender.forEach(dayNum => {
      grid.push(
        <div
          key={`next-${dayNum}`}
          onClick={() => setCalendarDate(new Date(currentYear, currentMonth + 1, dayNum))}
          className="min-h-[110px] p-2 bg-slate-50/30 border border-slate-100 text-slate-300 text-xs font-semibold cursor-pointer transition hover:bg-slate-50/80 flex flex-col justify-start"
        >
          <span>{dayNum}</span>
        </div>
      );
    });

    return grid;
  };

  // Week view grid render
  const renderWeekDays = () => {
    const columns = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = getDayOfActiveWeek(i);
      const isTodayCell =
        dayDate.getDate() === new Date().getDate() &&
        dayDate.getMonth() === new Date().getMonth() &&
        dayDate.getFullYear() === new Date().getFullYear();

      const dayEvents = getDayEventsForDate(dayDate);

      columns.push(
        <div
          key={`week-col-${i}`}
          className={`flex-1 min-w-[150px] p-3 rounded-xl border flex flex-col gap-3 min-h-[420px] transition ${
            isTodayCell
              ? 'bg-blue-50/20 border-blue-200 shadow-xs'
              : 'bg-white border-slate-200'
          }`}
        >
          {/* Column Header */}
          <div className="pb-2 border-b border-slate-100 flex flex-col items-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {weekdays[i]}
            </span>
            <span
              className={`text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${
                isTodayCell ? 'bg-blue-900 text-white' : 'text-slate-800'
              }`}
            >
              {dayDate.getDate()}
            </span>
          </div>

          {/* Events Stack */}
          <div className="flex-1 space-y-2.5 overflow-y-auto">
            {dayEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-center text-slate-300">
                <Clock className="w-5 h-5 opacity-40 mb-1" />
                <span className="text-[10px] font-medium tracking-wide">No activities</span>
              </div>
            ) : (
              dayEvents.map(evt => {
                const colors = getTypeColors(evt.event_type);
                const startHour = new Date(evt.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div
                    key={evt.id}
                    onClick={() => onNavigate('event-detail', evt.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition hover:shadow-xs hover:border-slate-300 ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${colors.text} bg-white/60 border border-slate-100`}>
                        {evt.event_type}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 font-semibold flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {startHour}
                      </span>
                    </div>
                    <h4 className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-tight">
                      {evt.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate mt-1">
                      {evt.club_name}
                    </p>
                    <p className="text-[10px] text-slate-600 truncate mt-0.5 font-semibold flex items-center gap-0.5">
                      📍 {evt.venue}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }
    return columns;
  };

  // Timeline list render
  const renderListView = () => {
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );

    const groupedEvents: Record<string, Event[]> = {};
    sortedEvents.forEach(evt => {
      const monthStr = new Date(evt.start_datetime).toLocaleDateString('default', {
        month: 'long',
        year: 'numeric',
      });
      if (!groupedEvents[monthStr]) {
        groupedEvents[monthStr] = [];
      }
      groupedEvents[monthStr].push(evt);
    });

    const months = Object.keys(groupedEvents);

    if (months.length === 0) {
      return (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-800 font-bold text-sm">No events found matching the filter criteria.</p>
          <p className="text-slate-500 text-xs mt-1">Try resetting your search or selected types.</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {months.map(month => (
          <div key={month} className="space-y-4">
            <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest border-b border-blue-100 pb-1.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-900" />
              {month}
            </h3>
            <div className="space-y-3.5">
              {groupedEvents[month].map(evt => {
                const confirmed = evt.confirmed_registrations_count || 0;
                const pct = Math.min(100, Math.round((confirmed / evt.capacity) * 100));
                const colors = getTypeColors(evt.event_type);
                const dateObj = new Date(evt.start_datetime);

                return (
                  <div
                    key={evt.id}
                    onClick={() => onNavigate('event-detail', evt.id)}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition cursor-pointer hover:shadow-xs gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Date Badge */}
                      <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-extrabold text-blue-950 uppercase tracking-wider">
                          {dateObj.toLocaleDateString('default', { month: 'short' })}
                        </span>
                        <span className="text-base font-bold text-blue-900 leading-none mt-0.5">
                          {dateObj.getDate()}
                        </span>
                      </div>

                      {/* Info Block */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border} border`}>
                            {evt.event_type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-0.5">
                          {evt.title}
                        </h4>
                        <div className="text-xs text-slate-500">
                          Host Club: <span className="text-slate-800 font-semibold">{evt.club_name}</span> &bull; Venue: <span className="text-slate-700 font-medium">{evt.venue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress / Actions */}
                    <div className="flex items-center gap-6 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
                      <div className="w-32 hidden md:block">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-slate-400">Registrations</span>
                          <span className="font-mono text-slate-700 font-semibold">{confirmed}/{evt.capacity}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div className={`h-full rounded-full ${pct >= 90 ? 'bg-rose-600' : pct >= 70 ? 'bg-amber-600' : 'bg-blue-900'}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('event-detail', evt.id);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
                      >
                        Details <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

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

      {/* View Switcher Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-3 gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {search || selectedType ? 'Filtered Search Schedule' : 'Complete Academic Schedule'}
        </span>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start md:self-auto">
          <button
            onClick={() => setCurrentView('month')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
              currentView === 'month'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-900" />
            Month View
          </button>
          <button
            onClick={() => setCurrentView('week')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
              currentView === 'week'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-900" />
            Week View
          </button>
          <button
            onClick={() => setCurrentView('grid')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
              currentView === 'grid'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-blue-900" />
            Grid View
          </button>
          <button
            onClick={() => setCurrentView('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
              currentView === 'list'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5 text-blue-900" />
            List View
          </button>
        </div>
      </div>

      {/* Main presentation views container */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading scheduled events...</div>
      ) : (
        <div className="space-y-6">
          {/* Calendar Month Controls (Only visible when monthly view is active) */}
          {currentView === 'month' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Today
                </button>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="text-sm font-bold text-slate-900 min-w-[120px]">
                  {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                💡 Double-click any day cell to schedule an event instantly
              </p>
            </div>
          )}

          {/* Calendar Week Controls (Only visible when weekly view is active) */}
          {currentView === 'week' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Today
                </button>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handlePrevWeek}
                    className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextWeek}
                    className="p-1 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  {getWeekRangeString()}
                </h2>
              </div>
            </div>
          )}

          {/* MONTH CALENDAR DISPLAY */}
          {currentView === 'month' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
                {weekdays.map(d => (
                  <div key={d} className="py-2.5 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 bg-slate-100/30 gap-[1px]">
                {renderMonthDays()}
              </div>
            </div>
          )}

          {/* WEEK CALENDAR DISPLAY */}
          {currentView === 'week' && (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-[1000px] md:min-w-0">
                {renderWeekDays()}
              </div>
            </div>
          )}

          {/* GRID PRESENTATION */}
          {currentView === 'grid' && (
            events.length === 0 ? (
              <div className="py-16 px-4 text-center bg-white rounded-xl border border-slate-200 text-xs">
                <p className="text-slate-800 font-bold text-sm">No events found matching the specified criteria.</p>
                <p className="text-slate-500 mt-1">Check back for upcoming department-scheduled symposiums, or reset your search filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in">
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
            )
          )}

          {/* TIMELINE LIST PRESENTATION */}
          {currentView === 'list' && (
            <div className="animate-in fade-in">
              {renderListView()}
            </div>
          )}
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

