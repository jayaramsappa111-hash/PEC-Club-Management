import React, { useState, useEffect } from 'react';
import { Search, X, Layers, Calendar, ShieldCheck, BookOpen, Megaphone, Wrench, ArrowRight, Building2 } from 'lucide-react';
import { api } from '../services/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, param?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search.query(query);
        setResults(res.results);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search PEC technical societies, workshops, circulars, roadmaps, project registry..."
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-700 mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 bg-white border border-slate-200 rounded font-mono">
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="p-4 overflow-y-auto space-y-4">
          {loading && (
            <div className="text-center py-8 text-xs text-slate-500">
              Querying institutional records...
            </div>
          )}

          {!loading && results && (
            <>
              {/* Clubs */}
              {results.clubs?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-900" />
                    Technical Clubs &amp; Chapters ({results.clubs.length})
                  </div>
                  <div className="space-y-1">
                    {results.clubs.map((c: any) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onNavigate('club-detail', c.id);
                          onClose();
                        }}
                        className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between transition group border border-transparent hover:border-slate-200"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900">{c.name}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{c.description}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {results.events?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-900" />
                    Scheduled Events &amp; Workshops ({results.events.length})
                  </div>
                  <div className="space-y-1">
                    {results.events.map((e: any) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          onNavigate('event-detail', e.id);
                          onClose();
                        }}
                        className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between transition group border border-transparent hover:border-slate-200"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900">{e.title}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{e.venue} &bull; {e.event_type}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {results.projects?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                    Student Innovation Projects ({results.projects.length})
                  </div>
                  <div className="space-y-1">
                    {results.projects.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onNavigate('projects');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between transition group border border-transparent hover:border-slate-200"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900">{p.title}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{p.domain} &bull; {p.creator_name}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {results.clubs?.length === 0 && results.events?.length === 0 && results.projects?.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  No matching institutional records found for &ldquo;{query}&rdquo;.
                </div>
              )}
            </>
          )}

          {!query && (
            <div className="py-6 text-center text-xs text-slate-400 space-y-2">
              <p>Type keywords to search across Pragati University clubs, scheduled events, syllabus roadmaps, and approved projects.</p>
              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">AI &amp; ML</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">Robotics</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">Workshop</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">Hackathon</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
