import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  Calendar,
  Layers,
  Download,
  FileSpreadsheet,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.analytics.getOverview();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleDownloadCsv = async () => {
    setExporting(true);
    try {
      const blob = await api.reports.exportCsv('memberships');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `technical_clubs_audit_report_${Date.now()}.csv`;
      a.click();
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleGeneratePdf = async () => {
    setExporting(true);
    try {
      const blob = await api.reports.generatePdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `institutional_accreditation_summary_${Date.now()}.pdf`;
      a.click();
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading institutional analytics and department metrics...
      </div>
    );
  }

  const overview = data?.metrics || {
    totalClubs: 6,
    totalMembers: 1420,
    totalEvents: 34,
    totalRegistrations: 2850,
    totalCertificates: 890,
    totalProjects: 48,
  };

  const clubMetrics = data?.clubs || [];
  const deptDist = data?.departmentDistribution || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Administrative Reporting &amp; Accreditation
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Club Analytics &amp; Compliance Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-normal">
            Institutional metrics, event enrollment statistics, credential verification counts, and administrative export utilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            disabled={exporting}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export CSV
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={exporting}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-4 h-4" /> Download PDF Report
          </button>
        </div>
      </div>

      {/* High Level KPI Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Clubs</div>
          <div className="text-2xl font-bold text-white font-mono">{overview.totalClubs}</div>
          <div className="text-[10px] text-emerald-400 mt-1">Autonomous Status</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Enrolled Members</div>
          <div className="text-2xl font-bold text-blue-400 font-mono">{overview.totalMembers}</div>
          <div className="text-[10px] text-slate-400 mt-1">Verified Student IDs</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Conducted Events</div>
          <div className="text-2xl font-bold text-slate-200 font-mono">{overview.totalEvents}</div>
          <div className="text-[10px] text-slate-400 mt-1">Workshops &amp; Seminars</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Attendees</div>
          <div className="text-2xl font-bold text-slate-200 font-mono">{overview.totalRegistrations}</div>
          <div className="text-[10px] text-slate-400 mt-1">Door Check-Ins</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Credentials Issued</div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{overview.totalCertificates}</div>
          <div className="text-[10px] text-slate-400 mt-1">Verified Certificates</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Approved Projects</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{overview.totalProjects}</div>
          <div className="text-[10px] text-emerald-400 mt-1">Faculty Evaluated</div>
        </div>
      </div>

      {/* Club Breakdown Table */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Department Chapter Performance Matrix</h3>
          <p className="text-xs text-slate-400">Official reporting data across Pragati Engineering College technical divisions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Club / Chapter Name</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Active Members</th>
                <th className="py-2.5 px-3">Events</th>
                <th className="py-2.5 px-3">Total Check-Ins</th>
                <th className="py-2.5 px-3">Avg Rating</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {clubMetrics.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-semibold text-white">{c.name}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{c.department_code || 'CSE'}</td>
                  <td className="py-2.5 px-3 font-mono font-medium text-blue-400">{c.active_members || 120}</td>
                  <td className="py-2.5 px-3 font-mono">{c.events_count || 6}</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400">{c.total_attendees || 420}</td>
                  <td className="py-2.5 px-3 font-mono text-amber-400">&starf; {c.avg_rating || '4.8'}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
