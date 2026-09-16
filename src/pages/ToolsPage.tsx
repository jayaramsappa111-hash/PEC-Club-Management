import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  ExternalLink,
  Plus,
  Filter,
  CheckCircle,
  Terminal,
  Cpu,
  Layers,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { Tool } from '../types';
import { useAuth } from '../context/AuthContext';

export const ToolsPage: React.FC = () => {
  const { user } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Add Tool modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [cat, setCat] = useState('Development');
  const [desc, setDesc] = useState('');
  const [docUrl, setDocUrl] = useState('https://');
  const [submitting, setSubmitting] = useState(false);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const res = await api.tools.list({
        category: category || undefined,
        search: search || undefined,
      });
      setTools(res.tools);
    } catch (err) {
      console.error('Failed to load tools', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, [category, search]);

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.tools.create({
        name,
        category: cat,
        description: desc,
        documentation_url: docUrl,
      });
      setShowModal(false);
      setName('');
      setDesc('');
      fetchTools();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const canAdd = user?.roles.some(r =>
    ['SUPER_ADMIN', 'FACULTY_COORDINATOR'].includes(r)
  );

  const categories = ['All', 'Development', 'AI & Data', 'Hardware & Embedded', 'Cloud & DevOps', 'Security'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs font-semibold mb-2">
            <Wrench className="w-3.5 h-3.5" /> Approved Software & Lab Toolchains
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Developer Toolchains & Lab Software
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Standardized technical software suites, hardware compilers, cloud sandboxes, and campus licensing directories.
          </p>
        </div>

        {canAdd && (
          <button
            onClick={() => setShowModal(true)}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Catalog New Toolchain
          </button>
        )}
      </div>

      {/* Filter strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tool name, category..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c === 'All' ? '' : c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                (c === 'All' && category === '') || category === c
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading toolchains...</div>
      ) : tools.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 text-xs">
          No toolchains cataloged for this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map(tool => (
            <div
              key={tool.id}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    {tool.category}
                  </span>
                  <Terminal className="w-4 h-4 text-slate-500" />
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition mb-2">
                  {tool.name}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {tool.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Campus Standard</span>
                {tool.documentation_url && (
                  <a
                    href={tool.documentation_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-400 font-semibold hover:underline"
                  >
                    Setup Guide <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Tool Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-white mb-1">Catalog Developer Toolchain</h3>
            <p className="text-xs text-slate-400 mb-4">Register authorized software, compiler, or lab platform</p>

            <form onSubmit={handleAddTool} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tool Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ROS 2 Iron Irwini"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Development">Development</option>
                  <option value="AI & Data">AI & Data</option>
                  <option value="Hardware & Embedded">Hardware & Embedded</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Documentation & Setup URL</label>
                <input
                  type="url"
                  required
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://docs.ros.org/..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Description & Prerequisites</label>
                <textarea
                  rows={3}
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Installation instructions, license information, hardware dependencies..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  {submitting ? 'Cataloging...' : 'Save to Directory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
