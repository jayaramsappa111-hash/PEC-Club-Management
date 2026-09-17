import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Github,
  ExternalLink,
  Plus,
  Star,
  Users,
  CheckCircle,
  Filter,
  FileText,
  AlertCircle,
  Building2,
  X,
  Code
} from 'lucide-react';
import { api } from '../services/api';
import { Project } from '../types';
import { useAuth } from '../context/AuthContext';

interface ProjectsPageProps {
  onNavigate: (tab: string, param?: string) => void;
  onOpenAuth: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('Artificial Intelligence');
  const [technologies, setTechnologies] = useState('Python, PyTorch, FastAPI, React');
  const [githubUrl, setGithubUrl] = useState('https://github.com/');
  const [demoUrl, setDemoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Project details & review modal
  const [activeProject, setActiveProject] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState('9');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REJECTED' | 'REVISE'>('APPROVED');
  const [reviewing, setReviewing] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.projects.list({
        domain: selectedDomain || undefined,
        search: search || undefined,
      });
      setProjects(res.projects);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedDomain, search]);

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);
    try {
      await api.projects.submit({
        title,
        description,
        domain,
        technologies,
        github_url: githubUrl,
        demo_url: demoUrl || null,
      });
      setStatusMsg({
        type: 'success',
        text: 'Project submitted for faculty coordinator review successfully!',
      });
      setShowSubmitModal(false);
      setTitle('');
      setDescription('');
      fetchProjects();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetails = async (projectId: string) => {
    try {
      const res = await api.projects.get(projectId);
      setActiveProject(res);
    } catch (err) {
      console.error('Failed to load project details', err);
    }
  };

  const handleFacultyReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    setReviewing(true);
    try {
      await api.projects.review(activeProject.project.id, {
        rating: Number(reviewRating),
        remarks: reviewRemarks,
        decision: reviewDecision,
      });
      const updated = await api.projects.get(activeProject.project.id);
      setActiveProject(updated);
      fetchProjects();
    } catch (err) {
      console.error('Failed to submit review', err);
    } finally {
      setReviewing(false);
    }
  };

  const canReview = user?.roles.some(r =>
    ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'DEPARTMENT_ADMIN'].includes(r)
  );

  const domains = ['All', 'Artificial Intelligence', 'Robotics & Hardware', 'AeroTelemetry', 'PragEduLLM', 'SmartGrid BMS', 'ZeroWaste-GIS', 'Cybersecurity'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-blue-900" /> Academic &amp; Technical Project Registry &bull; Pragati University
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Projects &amp; Innovations
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            Technical society engineering builds and research initiatives evaluated by Pragati University faculty committees.
          </p>
        </div>

        <button
          onClick={() => (user ? setShowSubmitModal(true) : onOpenAuth())}
          className="self-start md:self-auto px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Submit Project for Review
        </button>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div className={`p-3.5 rounded-lg text-xs flex items-center gap-2 ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Filters Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project, stack, author..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-900"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {domains.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d === 'All' ? '' : d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                (d === 'All' && selectedDomain === '') || selectedDomain === d
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading verified projects...</div>
      ) : projects.length === 0 ? (
        <div className="py-16 px-4 text-center bg-white rounded-xl border border-slate-200 text-xs">
          <p className="text-slate-800 font-bold text-sm">No projects found matching the specified domain.</p>
          <p className="text-slate-500 mt-1">Submitted projects appear here following review by the faculty project evaluation committee.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(proj => (
            <div
              key={proj.id}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-900 hover:shadow-xs transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                    {proj.domain}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    proj.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : proj.status === 'PENDING_REVIEW'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {proj.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {proj.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed font-normal">
                  {proj.description}
                </p>

                {proj.technologies && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {proj.technologies.split(',').map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-500">
                  By: <span className="font-semibold text-slate-800">{proj.creator_name || 'PEC Student'}</span>
                </div>
                <button
                  onClick={() => handleOpenDetails(proj.id)}
                  className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  <span>Inspect</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Details Modal */}
      {activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setActiveProject(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-900 border border-blue-200">
                {activeProject.project.domain}
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {activeProject.project.status}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900">{activeProject.project.title}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{activeProject.project.description}</p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div><span className="text-slate-500 font-medium">Author / Lead:</span> <span className="font-bold text-slate-900">{activeProject.project.creator_name || 'PEC Student'} ({activeProject.project.creator_roll || '23A31A0501'})</span></div>
              <div><span className="text-slate-500 font-medium">Tech Stack:</span> <span className="text-slate-800">{activeProject.project.technologies}</span></div>
              {activeProject.project.github_url && (
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={activeProject.project.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-900 font-bold hover:underline"
                  >
                    <Github className="w-4 h-4" /> GitHub Repository <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Faculty Reviews */}
            {activeProject.reviews && activeProject.reviews.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Faculty Review Assessment</h4>
                {activeProject.reviews.map((r: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{r.faculty_name || 'Evaluation Committee'}</span>
                      <span className="text-emerald-800">Score: {r.score} / 10 &bull; {r.decision}</span>
                    </div>
                    <p className="text-slate-600 italic">&ldquo;{r.remarks}&rdquo;</p>
                  </div>
                ))}
              </div>
            )}

            {/* Faculty Evaluation Form */}
            {canReview && (
              <form onSubmit={handleFacultyReview} className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3 mt-4">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">Faculty Committee Evaluation</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Score (out of 10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={reviewRating}
                      onChange={e => setReviewRating(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Decision</label>
                    <select
                      value={reviewDecision}
                      onChange={e => setReviewDecision(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="APPROVED">APPROVED</option>
                      <option value="REVISE">REVISE</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Remarks &amp; Feedback</label>
                  <textarea
                    rows={2}
                    required
                    value={reviewRemarks}
                    onChange={e => setReviewRemarks(e.target.value)}
                    placeholder="Provide technical evaluation remarks for institutional records..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={reviewing}
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold"
                >
                  {reviewing ? 'Recording Review...' : 'Record Faculty Decision'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Submit Project Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Submit Student Innovation / Project</h3>
            <p className="text-xs text-slate-500 mb-4">Official submission for review by the Pragati Technical Society Committee</p>

            <form onSubmit={handleSubmitProject} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Autonomous Quadcopter Drone with Computer Vision"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Domain *</label>
                  <select
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  >
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Robotics & Hardware">Robotics &amp; Hardware</option>
                    <option value="Distributed Systems">Distributed Systems</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Web Architecture">Web Architecture</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Tech Stack *</label>
                  <input
                    type="text"
                    required
                    value={technologies}
                    onChange={e => setTechnologies(e.target.value)}
                    placeholder="Python, ROS, React..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">GitHub Repo URL *</label>
                <input
                  type="url"
                  required
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Project Summary / Abstract *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explain problem statement, methodology, architecture, and results..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold"
                >
                  {submitting ? 'Submitting...' : 'Submit to Registry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
