import React, { useState, useEffect } from 'react';
import {
  Map,
  CheckCircle2,
  Award,
  Sparkles,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  Circle,
  Clock,
  Layers,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import { Roadmap, SkillBadge } from '../types';
import { useAuth } from '../context/AuthContext';

interface RoadmapsPageProps {
  onNavigate: (tab: string, param?: string) => void;
  onOpenAuth: () => void;
}

export const RoadmapsPage: React.FC<RoadmapsPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [badges, setBadges] = useState<SkillBadge[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [badgeNotice, setBadgeNotice] = useState<string | null>(null);

  const fetchRoadmaps = async () => {
    setLoading(true);
    try {
      const res = await api.roadmaps.list();
      setRoadmaps(res.roadmaps);
      setBadges(res.badges || []);
    } catch (err) {
      console.error('Failed to load roadmaps', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, [user]);

  const handleSelectRoadmap = async (id: string) => {
    try {
      const res = await api.roadmaps.get(id);
      setSelectedRoadmap(res.roadmap);
    } catch (err) {
      console.error('Failed to load roadmap modules', err);
    }
  };

  const handleToggleModule = async (roadmapId: string, moduleId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      const res = await api.roadmaps.toggleModuleComplete(roadmapId, moduleId);
      if (res.badgeAwarded) {
        setBadgeNotice('Congratulations! You completed this roadmap and unlocked a verified institutional skill badge!');
      }

      // Refresh roadmap view
      const updated = await api.roadmaps.get(roadmapId);
      setSelectedRoadmap(updated.roadmap);
      fetchRoadmaps();
    } catch (err) {
      console.error('Failed to toggle module', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-2">
          <Building2 className="w-3.5 h-3.5 text-blue-900" /> Structured Engineering Pathways &bull; PEC
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Learning Roadmaps &amp; Skill Milestones
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-normal">
          Guided engineering tracks curated by technical society domain leads. Complete modules to earn accredited skill badges.
        </p>
      </div>

      {/* Badge Notice Alert */}
      {badgeNotice && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between animate-in zoom-in-95">
          <div className="flex items-center gap-2 font-bold">
            <Award className="w-5 h-5 text-amber-600" />
            <span>{badgeNotice}</span>
          </div>
          <button onClick={() => setBadgeNotice(null)} className="text-slate-500 hover:text-slate-800 font-bold">✕</button>
        </div>
      )}

      {/* Detailed View Modal / Overlay */}
      {selectedRoadmap ? (
        <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setSelectedRoadmap(null)}
            className="text-xs text-slate-600 hover:text-blue-900 font-bold flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Roadmaps
          </button>

          <div className="space-y-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
              {selectedRoadmap.domain}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{selectedRoadmap.title}</h2>
            <p className="text-xs sm:text-sm text-slate-600 font-normal">{selectedRoadmap.description}</p>
          </div>

          {/* Modules List */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Curriculum Modules</h3>
            <div className="space-y-2.5">
              {selectedRoadmap.modules?.map((m, idx) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border flex items-center justify-between transition ${
                    m.completed
                      ? 'bg-emerald-50/60 border-emerald-200 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleModule(selectedRoadmap.id, m.id)}
                      className="mt-0.5 text-slate-400 hover:text-blue-900 transition"
                    >
                      {m.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Module {idx + 1}: {m.title}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{m.description}</p>
                      {m.resources && m.resources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {m.resources.map((r, i) => (
                            <a
                              key={i}
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-blue-900 hover:underline inline-flex items-center gap-1"
                            >
                              <BookOpen className="w-3 h-3" /> {r.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-3">
                    {m.estimated_hours} hrs
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roadmaps.map(roadmap => (
            <div
              key={roadmap.id}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-900 transition flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                    {roadmap.domain}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {roadmap.total_modules || 4} Modules
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition mb-1">
                  {roadmap.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed font-normal">
                  {roadmap.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px] font-mono">
                  {roadmap.estimated_weeks || 6} Weeks
                </span>
                <button
                  onClick={() => handleSelectRoadmap(roadmap.id)}
                  className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold flex items-center gap-1 shadow-xs"
                >
                  <span>Open Roadmap</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
