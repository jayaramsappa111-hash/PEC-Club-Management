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
  Layers
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800 text-blue-300 text-xs font-semibold mb-2">
          <Map className="w-3.5 h-3.5" /> Structured Engineering Pathways
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Learning Roadmaps & Skill Milestones
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Guided engineering tracks curated by technical society domain leads. Complete modules to earn accredited skill badges.
        </p>
      </div>

      {/* Badge Notice Alert */}
      {badgeNotice && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-indigo-950/80 to-slate-900 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between animate-in zoom-in-95">
          <div className="flex items-center gap-2 font-semibold">
            <Award className="w-5 h-5 text-amber-400" />
            <span>{badgeNotice}</span>
          </div>
          <button onClick={() => setBadgeNotice(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Earned Badges Showcase (if any) */}
      {badges.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-amber-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Your Unlocked Skill Credentials ({badges.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map(b => (
              <div key={b.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{b.title}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{b.description}</div>
                  <div className="text-[9px] text-emerald-400 mt-1 font-mono">Issued {new Date(b.issued_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content: Roadmaps list or Selected Roadmap Detail */}
      {selectedRoadmap ? (
        /* Selected Roadmap Modules View */
        <div className="space-y-6">
          <button
            onClick={() => setSelectedRoadmap(null)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Roadmaps
          </button>

          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-500/40">
                    {selectedRoadmap.level}
                  </span>
                  <span className="text-xs text-slate-400">{selectedRoadmap.domain}</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedRoadmap.title}</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {selectedRoadmap.description}
                </p>
              </div>

              {/* Progress Circle & Counter */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shrink-0 text-center min-w-[140px]">
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  {selectedRoadmap.progress_percentage}%
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {selectedRoadmap.completed_modules} of {selectedRoadmap.total_modules} completed
                </div>
              </div>
            </div>

            {/* Prerequisites */}
            {selectedRoadmap.prerequisites && (
              <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                <strong>Prerequisites:</strong> {selectedRoadmap.prerequisites}
              </div>
            )}
          </div>

          {/* Modules List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Curriculum Modules & Milestones
            </h3>

            {selectedRoadmap.modules?.map((m, idx) => (
              <div
                key={m.id}
                className={`p-5 rounded-2xl border transition flex items-start justify-between gap-4 ${
                  m.isCompleted
                    ? 'bg-slate-900/60 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => handleToggleModule(selectedRoadmap.id, m.id)}
                    className={`mt-0.5 p-1 rounded-lg transition shrink-0 ${
                      m.isCompleted
                        ? 'text-emerald-400 hover:text-emerald-300'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {m.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                      <h4 className={`text-sm font-bold ${m.isCompleted ? 'text-emerald-300 line-through' : 'text-white'}`}>
                        {m.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {m.description}
                    </p>

                    {m.resources && m.resources.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {m.resources.map((res: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono border border-slate-800">
                            {res}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleModule(selectedRoadmap.id, m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                    m.isCompleted
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {m.isCompleted ? 'Completed' : 'Mark Done'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Roadmaps Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roadmaps.map(rm => (
            <div
              key={rm.id}
              onClick={() => handleSelectRoadmap(rm.id)}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/90 transition cursor-pointer flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-500/40">
                    {rm.level}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {rm.total_modules} Modules
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition mb-1">
                  {rm.title}
                </h3>
                <div className="text-xs text-slate-400 mb-3 font-medium">
                  Track: <span className="text-slate-300">{rm.domain}</span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                  {rm.description}
                </p>
              </div>

              <div>
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Milestone Progress</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {rm.progress_percentage}% ({rm.completed_modules}/{rm.total_modules})
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${rm.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Unlocks Specialist Badge
                  </span>
                  <span className="text-blue-400 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                    Open Track &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
