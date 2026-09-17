import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Search,
  Bell,
  AlertTriangle,
  Building2,
  Layers,
  Plus,
  Send,
  Loader2,
  Trash2,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Announcement, Club } from '../types';

export const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Filtering states
  // 'all' | 'important' | 'club' | 'academic'
  const [activeFilter, setActiveFilter] = useState<'all' | 'important' | 'club' | 'academic'>('all');

  // Announcement Creator form states (For faculty/club admins)
  const [showCreator, setShowCreator] = useState<boolean>(false);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formCategory, setFormCategory] = useState<'GENERAL' | 'EVENT' | 'RECRUITMENT' | 'ACADEMIC' | 'CLUB_SPECIFIC'>('GENERAL');
  const [formClubId, setFormClubId] = useState<string>('');
  const [formIsImportant, setFormIsImportant] = useState<boolean>(false);
  
  // Action state feedbacks
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAnnouncementsAndClubs = async () => {
    setLoading(true);
    try {
      const [annRes, clubsRes] = await Promise.all([
        api.announcements.list(),
        api.clubs.list()
      ]);
      setAnnouncements(annRes.announcements || []);
      setClubs(clubsRes.clubs || []);
    } catch (err) {
      console.error('Failed to load announcements feed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncementsAndClubs();
  }, []);

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // Determine backend parameters based on category selection
      const data = {
        title: formTitle,
        content: formContent,
        category: formCategory,
        club_id: formCategory === 'CLUB_SPECIFIC' && formClubId ? formClubId : undefined,
        department_id: formCategory === 'ACADEMIC' ? (user?.department_id || 'dept-cse') : undefined,
        is_important: formIsImportant ? 1 : 0,
        target_audience: 'ALL'
      };

      await api.announcements.create(data);
      setSuccessMsg('Circular published successfully and dispatched to target subscriber nodes!');
      
      // Reset Form
      setFormTitle('');
      setFormContent('');
      setFormCategory('GENERAL');
      setFormClubId('');
      setFormIsImportant(false);
      setShowCreator(false);
      
      // Reload feed
      loadAnnouncementsAndClubs();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish circular. Verify admin access.');
    } finally {
      setActionLoading(false);
    }
  };

  // Determine which user roles can publish announcements
  const canPublish = user?.roles.some(role =>
    ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN', 'DEPARTMENT_ADMIN'].includes(role)
  );

  // Client-side filtration logic based on user's selected category tag
  const filteredAnnouncements = announcements.filter(ann => {
    // 1. Tag filtering
    if (activeFilter === 'important') {
      if (!ann.is_important && ann.category !== 'URGENT') return false;
    } else if (activeFilter === 'club') {
      // Must be marked as CLUB_SPECIFIC or have an associated club_id
      if (ann.category !== 'CLUB_SPECIFIC' && !ann.club_id) return false;
    } else if (activeFilter === 'academic') {
      if (ann.category !== 'ACADEMIC' && !ann.department_id) return false;
    }

    // 2. Global Search query match
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const matchTitle = ann.title?.toLowerCase().includes(query);
      const matchContent = ann.content?.toLowerCase().includes(query);
      const matchClubName = ann.club_name?.toLowerCase().includes(query);
      const matchDeptName = ann.department_name?.toLowerCase().includes(query);
      return matchTitle || matchContent || matchClubName || matchDeptName;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in min-h-screen">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold mb-2">
            <Megaphone className="w-3.5 h-3.5 text-amber-900" />
            Official Pragati Engineering College Notice Board
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Circulars &amp; Announcements
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            Stay up to date with official academic circulars, recruitment updates, upcoming coding workshops, and club activities.
          </p>
        </div>

        {canPublish && (
          <button
            onClick={() => setShowCreator(!showCreator)}
            className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer md:self-end"
          >
            <Plus className="w-4 h-4" />
            Publish New Circular
          </button>
        )}
      </div>

      {/* Action Notification Feedbacks */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2 font-medium shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-center gap-2 font-medium shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Publish Announcement Creator Section (Authorized HODs/Presidents) */}
      {showCreator && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4 animate-in slide-in-from-top duration-200">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
            Publish New Academic or Student Chapter Announcement
          </h3>
          <form onSubmit={handlePublishAnnouncement} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Circular Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. ACM Chapter Recrutiment Drive 2026"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Notice Type / Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-navy-900"
                >
                  <option value="GENERAL">GENERAL (General updates)</option>
                  <option value="ACADEMIC">ACADEMIC (Department specific notice)</option>
                  <option value="CLUB_SPECIFIC">CLUB SPECIFIC (Society / Chapter notice)</option>
                  <option value="EVENT">EVENT (Upcoming bootcamps/competitions)</option>
                  <option value="RECRUITMENT">RECRUITMENT (New committee registrations)</option>
                </select>
              </div>
            </div>

            {formCategory === 'CLUB_SPECIFIC' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Affiliated Chapter *</label>
                <select
                  required
                  value={formClubId}
                  onChange={(e) => setFormClubId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-navy-900"
                >
                  <option value="">-- Choose Student Club --</option>
                  {clubs.map(club => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Circular Content Details *</label>
              <textarea
                required
                rows={4}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Write the complete announcement content, links, timing details, or location instructions here..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900 font-sans"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isImportant"
                checked={formIsImportant}
                onChange={(e) => setFormIsImportant(e.target.checked)}
                className="w-4 h-4 border border-slate-300 rounded text-navy-900 focus:ring-navy-950"
              />
              <label htmlFor="isImportant" className="text-xs font-bold text-rose-700 cursor-pointer flex items-center gap-1 select-none">
                <AlertTriangle className="w-3.5 h-3.5" />
                Mark as URGENT (Generates portal-wide priority banner alerts)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreator(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Publish Announcement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTERING & CATEGORY SELECTOR UI PANEL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-xs">
        {/* Dynamic Filter Tags Selection UI */}
        <div className="flex overflow-x-auto gap-1.5 pb-2 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            All Updates
          </button>
          
          <button
            onClick={() => setActiveFilter('important')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'important'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
            Important Notice
          </button>

          <button
            onClick={() => setActiveFilter('club')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'club'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            Club-specific
          </button>

          <button
            onClick={() => setActiveFilter('academic')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'academic'
                ? 'bg-emerald-900 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            Academic Notice
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circular content..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
          />
        </div>
      </div>

      {/* FEED LIST RENDER BODY */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-navy-900 mb-2" />
          Syncing and downloading official circular ledgers...
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          No announcements match your filter or search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredAnnouncements.map((ann) => {
            const isUrgent = ann.is_important === 1 || ann.category === 'URGENT';
            return (
              <div
                key={ann.id}
                className={`p-6 rounded-2xl bg-white border transition flex flex-col justify-between space-y-4 hover:shadow-xs ${
                  isUrgent
                    ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isUrgent && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-rose-700 text-white animate-pulse">
                          Urgent
                        </span>
                      )}
                      
                      <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-slate-100 text-slate-800 border border-slate-300">
                        {ann.category}
                      </span>

                      {ann.club_name && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-blue-50 text-blue-900 border border-blue-200">
                          {ann.club_name}
                        </span>
                      )}

                      {ann.department_name && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-950 border border-emerald-200">
                          {ann.department_name}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 font-record-code shrink-0">
                      ID: {ann.id}
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-snug tracking-tight">
                    {ann.title}
                  </h3>

                  <p className="text-xs text-slate-600 font-normal leading-relaxed whitespace-pre-line font-sans">
                    {ann.content}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-[10px] uppercase shrink-0">
                      {ann.author_name ? ann.author_name[0] : 'U'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block">{ann.author_name || 'Department Admin'}</span>
                      <span className="text-[9px] text-slate-400 font-medium">Authorized Publisher</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-record-code text-[10px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
