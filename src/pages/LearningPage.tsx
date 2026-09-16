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
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Resource } from '../types';
import { useAuth } from '../context/AuthContext';

interface LearningPageProps {
  onNavigate: (tab: string, param?: string) => void;
  onOpenAuth: () => void;
}

export const LearningPage: React.FC<LearningPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // New Resource modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'notes' | 'tutorial' | 'video' | 'presentation' | 'link' | 'document'>('tutorial');
  const [domain, setDomain] = useState('Web Architecture');
  const [difficulty, setDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [fileUrl, setFileUrl] = useState('https://developer.mozilla.org');
  const [submitting, setSubmitting] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await api.resources.list({
        type: selectedType || undefined,
        difficulty: selectedDifficulty || undefined,
        search: search || undefined,
      });
      setResources(res.resources);
    } catch (err) {
      console.error('Failed to load resources', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedType, selectedDifficulty, search]);

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
    setSubmitting(true);
    try {
      await api.resources.create({
        title,
        description,
        type,
        domain,
        difficulty,
        file_url: fileUrl,
      });
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      fetchResources();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const canUpload = user?.roles.some(r =>
    ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN'].includes(r)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-blue-900" /> Academic Repositories &amp; Tutorials &bull; PEC
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Learning Library &amp; Technical Assets
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            Faculty notes, workshop slide decks, coding repositories, and architectural references across all engineering departments.
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="self-start md:self-auto px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Upload Learning Resource
          </button>
        )}
      </div>

      {/* Filter strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tutorials, slides, domain..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-900"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['', 'tutorial', 'notes', 'video', 'document'].map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedType === t
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t === '' ? 'All Media' : t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading learning assets...</div>
      ) : resources.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-xs">
          No learning materials found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map(res => (
            <div
              key={res.id}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-900 transition flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                    {res.domain || 'Engineering'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleBookmark(res.id)}
                      className={`p-1 rounded-md transition ${
                        res.isBookmarked ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition mb-1">
                  {res.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed font-normal">
                  {res.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleToggleProgress(res.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition ${
                    res.isCompleted ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${res.isCompleted ? 'fill-emerald-100 text-emerald-700' : ''}`} />
                  <span>{res.isCompleted ? 'Completed' : 'Mark Done'}</span>
                </button>

                <a
                  href={res.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold flex items-center gap-1 shadow-xs"
                >
                  <span>Open</span>
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
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Publish Technical Asset</h3>
            <p className="text-xs text-slate-500 mb-4">Add curriculum references, lab guides, or video lectures</p>

            <form onSubmit={handleCreateResource} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems & Consensus Lab Guide"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Media Type *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  >
                    <option value="tutorial">Tutorial</option>
                    <option value="notes">Notes / PDF</option>
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Domain *</label>
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
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">External Resource URL / PDF link *</label>
                <input
                  type="url"
                  required
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Summary *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explain learning objectives, prerequisites, and contents..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold"
                >
                  {submitting ? 'Publishing...' : 'Publish to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
