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
  AlertCircle
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
      // Refresh
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

  const domains = ['All', 'Artificial Intelligence', 'Robotics & Hardware', 'Distributed Systems', 'Cybersecurity', 'Web Architecture'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Academic &amp; Technical Project Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Student Projects &amp; Innovations
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-normal">
            Technical society engineering builds and research initiatives evaluated by Pragati Engineering College faculty committees.
          </p>
        </div>

        <button
          onClick={() => (user ? setShowSubmitModal(true) : onOpenAuth())}
          className="self-start md:self-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Submit Project for Review
        </button>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
          statusMsg.type === 'success'
            ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Filters Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project, stack, author..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {domains.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d === 'All' ? '' : d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                (d === 'All' && selectedDomain === '') || selectedDomain === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading verified projects...</div>
      ) : projects.length === 0 ? (
        <div className="py-16 px-4 text-center bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <p className="text-slate-300 font-medium">No projects found matching the specified domain.</p>
          <p className="text-slate-500 mt-1">Submitted projects appear here following review by the faculty project evaluation committee.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(proj => (
            <div
              key={proj.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                    {proj.domain}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    <Star className="w-3 h-3 fill-amber-400" />
                    {proj.avg_rating ? Number(proj.avg_rating).toFixed(1) : '9.0'}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mb-1">
                  {proj.title}
                </h3>
                <div className="text-xs text-slate-400 mb-2.5">
                  Lead: <span className="text-slate-200 font-medium">{proj.creator_name}</span> &bull; {proj.creator_roll || '23BCE1001'}
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 mb-3.5 leading-relaxed font-normal">
                  {proj.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {proj.technologies.split(',').map((tech, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-mono">
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {proj.github_url && (
                      <a
                        href={proj.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="GitHub Repository"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {proj.demo_url && (
                      <a
                        href={proj.demo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Live Demonstration"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenDetails(proj.id)}
                    className="text-emerald-400 font-semibold hover:underline"
                  >
                    View Specs & Reviews &rarr;
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Project Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-1">Submit Project for Faculty Review</h3>
            <p className="text-xs text-slate-400 mb-4">Submit engineering build for institutional grading and showcase publication</p>

            <form onSubmit={handleSubmitProject} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Autonomous Ground Vehicle Localization Engine"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Domain</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Robotics & Hardware">Robotics & Hardware</option>
                  <option value="Distributed Systems">Distributed Systems</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Web Architecture">Web Architecture</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Technologies (Comma separated)</label>
                <input
                  type="text"
                  required
                  value={technologies}
                  onChange={(e) => setTechnologies(e.target.value)}
                  placeholder="e.g. Python, ROS2, C++, OpenCV, LiDAR"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">GitHub / Source Repository URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/organization/repo"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Live Demo / Deployment URL (Optional)</label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://demo.techclubs.edu"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Architecture & Technical Summary</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="System design, benchmarks, algorithms, test results..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  {submitting ? 'Submitting...' : 'Submit to Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details & Faculty Review Modal */}
      {activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    {activeProject.project.domain}
                  </span>
                  <span className="text-xs text-slate-400">
                    Status: <strong className="text-white">{activeProject.project.status}</strong>
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{activeProject.project.title}</h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Created by {activeProject.project.creator_name} ({activeProject.project.creator_roll || 'Student'})
                </div>
              </div>
              <button
                onClick={() => setActiveProject(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
              {activeProject.project.description}
            </div>

            {/* Team Members */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" /> Team Contributors
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {activeProject.members?.map((m: any) => (
                  <div key={m.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="font-semibold text-white">{m.member_name}</div>
                    <div className="text-[11px] text-blue-400">{m.role} &bull; {m.student_id}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Faculty Reviews */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" /> Faculty Reviews & Remarks
              </h4>
              {activeProject.reviews?.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                  Awaiting faculty committee review.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeProject.reviews?.map((r: any) => (
                    <div key={r.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{r.reviewer_name} (Faculty)</span>
                        <span className="text-amber-400 font-mono font-bold">Rating: {r.rating}/10</span>
                      </div>
                      <div className="text-slate-300 italic">"{r.remarks}"</div>
                      <div className="text-[10px] text-emerald-400 font-bold uppercase">Decision: {r.decision}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Faculty Reviewer Form (Only shown to Faculty or Admins) */}
            {canReview && (
              <form onSubmit={handleFacultyReview} className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Coordinator Evaluation & Decision Panel
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Numerical Rating (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={reviewRating}
                      onChange={(e) => setReviewRating(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Official Decision</label>
                    <select
                      value={reviewDecision}
                      onChange={(e: any) => setReviewDecision(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    >
                      <option value="APPROVED">APPROVE (Publish to Showcase)</option>
                      <option value="REVISE">REQUEST REVISIONS</option>
                      <option value="REJECTED">REJECT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Review Remarks & Feedback</label>
                  <textarea
                    rows={2}
                    required
                    value={reviewRemarks}
                    onChange={(e) => setReviewRemarks(e.target.value)}
                    placeholder="Evaluation of architecture, code quality, research relevance..."
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
                >
                  {reviewing ? 'Recording...' : 'Submit Evaluation'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
