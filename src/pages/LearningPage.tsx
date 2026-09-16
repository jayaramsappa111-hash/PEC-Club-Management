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
  Code
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

  const types = ['All', 'tutorial', 'notes', 'video', 'document', 'link'];
  const difficulties = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" /> Technical Society Resource Repository
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Learning Library & Toolkits
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Curated study guides, research papers, workshop decks, and lab manuals organized by domain.
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload Club Resource
          </button>
        )}
      </div>

      {/* Filters Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topic, stack, notes..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t === 'All' ? '' : t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition ${
                (t === 'All' && selectedType === '') || selectedType === t
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 text-xs">
          No resources matched the filter query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(res => (
            <div
              key={res.id}
              className={`p-6 rounded-3xl bg-slate-900 border transition flex flex-col justify-between group shadow-sm ${
                res.isCompleted
                  ? 'border-emerald-500/40 bg-slate-900/60'
                  : 'border-slate-800 hover:border-amber-500/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-500/40">
                      {res.type}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">
                      {res.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleBookmark(res.id)}
                      className={`p-1.5 rounded-lg transition ${
                        res.isBookmarked
                          ? 'text-amber-400 bg-amber-950/60'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={res.isBookmarked ? 'Bookmarked' : 'Bookmark resource'}
                    >
                      <Bookmark className={`w-4 h-4 ${res.isBookmarked ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition mb-1">
                  {res.title}
                </h3>
                <div className="text-xs text-slate-400 mb-3">
                  Domain: <span className="text-slate-300">{res.domain}</span>
                  {res.club_name && ` &bull; By ${res.club_name}`}
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                  {res.description}
                </p>
              </div>

              <div>
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  {/* Complete Toggle */}
                  <button
                    onClick={() => handleToggleProgress(res.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      res.isCompleted
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {res.isCompleted ? 'Completed' : 'Mark Done'}
                  </button>

                  {/* External Resource Link */}
                  <a
                    href={res.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-amber-400 hover:underline font-semibold"
                  >
                    Open Resource <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Resource Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-1">Add Technical Resource</h3>
            <p className="text-xs text-slate-400 mb-4">Publish workshop materials, reference architectures, or video links</p>

            <form onSubmit={handleCreateResource} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus in Raft: Comprehensive Lab Guide"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Resource Type</label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="tutorial">Tutorial</option>
                    <option value="notes">Lecture Notes</option>
                    <option value="video">Video Recording</option>
                    <option value="presentation">Presentation Deck</option>
                    <option value="document">PDF / Doc</option>
                    <option value="link">Official Doc Link</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e: any) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Technical Domain</label>
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. Distributed Systems"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Resource / Document URL</label>
                <input
                  type="url"
                  required
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or https://..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Brief Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Overview of contents and key takeaways..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  {submitting ? 'Uploading...' : 'Publish to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
