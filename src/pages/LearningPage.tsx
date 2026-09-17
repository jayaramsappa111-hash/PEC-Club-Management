import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Plus,
  Filter,
  FileText,
  Video,
  Layers,
  Code,
  Building2,
  X,
  FileDown,
  BookMarked,
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';
import { Resource, Club } from '../types';
import { useAuth } from '../context/AuthContext';

interface LearningPageProps {
  onNavigate: (tab: string, param?: string) => void;
  onOpenAuth: () => void;
}

export const LearningPage: React.FC<LearningPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'notes' | 'tutorial' | 'video' | 'presentation' | 'link' | 'document'>('document');
  const [domain, setDomain] = useState('Computer Science');
  const [technology, setTechnology] = useState('Python / Data Structures');
  const [difficulty, setDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [semester, setSemester] = useState('Semester 3');
  const [uploadClubId, setUploadClubId] = useState('');
  const [tags, setTags] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClubs = async () => {
    try {
      const res = await api.clubs.list();
      setClubs(res.clubs || []);
      if (res.clubs && res.clubs.length > 0 && !uploadClubId) {
        setUploadClubId(res.clubs[0].id);
      }
    } catch (err) {
      console.error('Failed to load clubs', err);
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await api.resources.list({
        type: selectedType || undefined,
        difficulty: selectedDifficulty || undefined,
        club_id: selectedClub || undefined,
        semester: selectedSemester || undefined,
        search: search || undefined,
      });
      setResources(res.resources || []);
    } catch (err) {
      console.error('Failed to load resources', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    fetchResources();
  }, [selectedClub, selectedType, selectedSemester, selectedDifficulty, search]);

  const handleToggleBookmark = async (id: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      const res = await api.resources.toggleBookmark(id);
      setResources(prev =>
        prev.map(r => (r.id === id ? { ...r, isBookmarked: res.isBookmarked } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleProgress = async (id: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      const res = await api.resources.toggleProgress(id);
      setResources(prev =>
        prev.map(r => (r.id === id ? { ...r, isCompleted: res.isCompleted } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    setSubmitting(true);
    try {
      await api.resources.create({
        title,
        description,
        type,
        domain,
        technology,
        difficulty,
        semester,
        club_id: uploadClubId || undefined,
        tags,
        file_url: fileUrl || 'https://developer.mozilla.org',
      });
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setFileUrl('');
      setTags('');
      fetchResources();
    } catch (err) {
      console.error('Failed to upload resource', err);
      alert('Failed to upload document. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const canUpload = user?.roles.some(r =>
    ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN', 'CLUB_MEMBER'].includes(r)
  );

  const semestersList = [
    '',
    'Semester 1',
    'Semester 2',
    'Semester 3',
    'Semester 4',
    'Semester 5',
    'Semester 6',
    'Semester 7',
    'Semester 8',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-blue-900" /> Structured Document &amp; Study Material Repository &bull; Pragati University
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Club Library &amp; Study Materials
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            Browse, categorize, bookmark, and download faculty notes, lab manuals, question papers, and club reference textbooks.
          </p>
        </div>

        {canUpload ? (
          <button
            onClick={() => setShowUploadModal(true)}
            className="self-start md:self-auto px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Upload Study Material / PDF
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="self-start md:self-auto px-4 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition flex items-center gap-2"
          >
            Sign in to Upload Materials
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PDFs, topics, tags..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-900"
            />
          </div>

          {/* Club Filter */}
          <div>
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
            >
              <option value="">All Publishing Clubs</option>
              {clubs.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
            >
              <option value="">All Semesters</option>
              {semestersList.filter(Boolean).map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
            >
              <option value="">All Difficulties</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 mr-2 uppercase tracking-wide">Category:</span>
          {[
            { id: '', label: 'All Materials' },
            { id: 'document', label: 'PDFs & Docs' },
            { id: 'notes', label: 'Lecture Notes' },
            { id: 'tutorial', label: 'Tutorials' },
            { id: 'presentation', label: 'Slide Decks' },
            { id: 'video', label: 'Video Lectures' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedType === t.id
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading structured library assets...</div>
      ) : resources.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">No documents or study materials found.</p>
          <p className="text-slate-500 text-[11px]">Try adjusting your search filters or upload a new material.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map(res => (
            <div
              key={res.id}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-900 transition flex flex-col justify-between group shadow-xs relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-900 to-indigo-600 opacity-80" />

              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-950 border border-blue-200">
                      {res.type.toUpperCase()}
                    </span>
                    {res.semester && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                        {res.semester}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleBookmark(res.id)}
                    className={`p-1 rounded-md transition ${
                      res.isBookmarked ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Bookmark material"
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{res.club_name || 'University Academic Cell'}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition mb-1 line-clamp-2">
                  {res.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed font-normal">
                  {res.description}
                </p>

                {res.tags && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {res.tags.split(',').map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleToggleProgress(res.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition ${
                    res.isCompleted ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${res.isCompleted ? 'fill-emerald-100 text-emerald-700' : ''}`} />
                  <span>{res.isCompleted ? 'Completed' : 'Mark Read'}</span>
                </button>

                <a
                  href={res.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold flex items-center gap-1 shadow-xs text-xs"
                >
                  <span>Open PDF</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-blue-900" />
              <h3 className="text-lg font-bold text-slate-900">Publish Study Material or PDF</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">Categorize and share curriculum notes, lab manuals, or slide decks</p>

            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Operating Systems Lab Manual & Lecture Notes"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Publishing Club *</label>
                  <select
                    value={uploadClubId}
                    onChange={e => setUploadClubId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  >
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Document Category *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  >
                    <option value="document">PDF Document / Study Material</option>
                    <option value="notes">Lecture Notes</option>
                    <option value="tutorial">Tutorial Guide</option>
                    <option value="presentation">Slide Deck / Presentation</option>
                    <option value="video">Video Lecture</option>
                    <option value="link">Reference Link</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Semester *</label>
                  <select
                    value={semester}
                    onChange={e => setSemester(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  >
                    {semestersList.filter(Boolean).map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Difficulty *</label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Domain / Dept *</label>
                  <input
                    type="text"
                    required
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">PDF / File URL *</label>
                <input
                  type="url"
                  required
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                  placeholder="https://example.com/materials/os-lab-manual.pdf"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="algorithms, notes, exam-prep, python"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Summary / Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explain learning objectives, topics covered, and prerequisites..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold"
                >
                  {submitting ? 'Publishing...' : 'Publish Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
