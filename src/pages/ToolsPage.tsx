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
  Database,
  Building2,
  X
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-blue-900" /> Approved Software &amp; Lab Toolchains &bull; Pragati University
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Developer Toolchains &amp; Lab Software
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            Standardized technical software suites, hardware compilers, cloud sandboxes, and campus licensing directories at Pragati University.
          </p>
        </div>

        {canAdd && (
          <button
            onClick={() => setShowModal(true)}
            className="self-start md:self-auto px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Software Tool
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
            placeholder="Search compilers, toolchains, SDKs..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-900"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c === 'All' ? '' : c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                (c === 'All' && category === '') || category === c
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading authorized toolchains...</div>
      ) : tools.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-xs">
          No software tools found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map(tool => (
            <div
              key={tool.id}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-900 transition flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                    {tool.category}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    CAMPUS LICENSED
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition mb-1">
                  {tool.name}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed font-normal">
                  {tool.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-mono">PEC Lab Suite</span>
                {tool.documentation_url && (
                  <a
                    href={tool.documentation_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold flex items-center gap-1 shadow-xs"
                  >
                    <span>Documentation</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Tool Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Approved Technical Tool</h3>
            <p className="text-xs text-slate-500 mb-4">Register new lab compilers or developer software in the official registry</p>

            <form onSubmit={handleAddTool} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Tool Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Quartus Prime FPGA Suite"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Category *</label>
                <select
                  value={cat}
                  onChange={e => setCat(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                >
                  <option value="Development">Development</option>
                  <option value="AI & Data">AI &amp; Data</option>
                  <option value="Hardware & Embedded">Hardware &amp; Embedded</option>
                  <option value="Cloud & DevOps">Cloud &amp; DevOps</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Documentation URL *</label>
                <input
                  type="url"
                  required
                  value={docUrl}
                  onChange={e => setDocUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Installation notes, lab workstation availability, and licensing..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold"
                >
                  {submitting ? 'Registering...' : 'Register Tool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
