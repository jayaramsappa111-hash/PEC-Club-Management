import React, { useState, useEffect } from 'react';
import { Search, X, Layers, Calendar, ShieldCheck, BookOpen, Megaphone, Wrench, ArrowRight } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clubs, events, projects, resources, roadmaps..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded">
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="p-4 overflow-y-auto space-y-4">
          {loading && (
            <div className="text-center py-8 text-xs text-slate-400">
              Searching database...
            </div>
          )}

          {!loading && results && (
            <>
              {/* Clubs */}
              {results.clubs?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Clubs ({results.clubs.length})
                  </div>
                  <div className="space-y-1">
                    {results.clubs.map((c: any) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onNavigate('club-detail', c.id);
                          onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-blue-400">{c.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{c.description}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {results.events?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Events ({results.events.length})
                  </div>
                  <div className="space-y-1">
                    {results.events.map((e: any) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          onNavigate('event-detail', e.id);
                          onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-indigo-400">{e.title}</div>
                          <div className="text-[11px] text-slate-400">{e.event_type} &bull; {e.venue}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {results.projects?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Projects ({results.projects.length})
                  </div>
                  <div className="space-y-1">
                    {results.projects.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onNavigate('projects', p.id);
                          onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-emerald-400">{p.title}</div>
                          <div className="text-[11px] text-slate-400">{p.domain} &bull; {p.technologies}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              {results.resources?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    Learning Resources ({results.resources.length})
                  </div>
                  <div className="space-y-1">
                    {results.resources.map((r: any) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          onNavigate('learning');
                          onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-amber-400">{r.title}</div>
                          <div className="text-[11px] text-slate-400">{r.type} &bull; {r.domain} &bull; {r.difficulty}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tools */}
              {results.tools?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    Software Tools ({results.tools.length})
                  </div>
                  <div className="space-y-1">
                    {results.tools.map((t: any) => (
                      <a
                        key={t.id}
                        href={t.official_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white group-hover:text-cyan-400">{t.name}</div>
                          <div className="text-[11px] text-slate-400">{t.category} &bull; {t.purpose}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {results.clubs?.length === 0 &&
               results.events?.length === 0 &&
               results.projects?.length === 0 &&
               results.resources?.length === 0 &&
               results.tools?.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  No matching items found in the database for "{query}".
                </div>
              )}
            </>
          )}

          {!query && (
            <div className="text-center py-8 text-xs text-slate-500">
              Type keywords like "Python", "Rust", "Hackathon", "Robotics", or "ACM" to search real database records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
