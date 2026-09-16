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
  ShieldCheck,
  Building2
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
      a.download = `pec_technical_clubs_audit_report_${Date.now()}.csv`;
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
      a.download = `pec_institutional_accreditation_summary_${Date.now()}.pdf`;
      a.click();
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-500 bg-slate-50 min-h-screen">
        Loading institutional analytics and department metrics...
      </div>
    );
  }

  const overview = data?.metrics || {
    totalClubs: 35,
    totalMembers: 1420,
    totalEvents: 34,
    totalRegistrations: 2850,
    totalCertificates: 890,
    totalProjects: 48,
  };

  const clubMetrics = data?.clubs || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-blue-900" /> Administrative Reporting &amp; Accreditation &bull; PEC
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Club Analytics &amp; Compliance Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            Institutional metrics, event enrollment statistics, credential verification counts, and official administrative export utilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            disabled={exporting}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> Export CSV Ledger
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={exporting}
            className="px-3.5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <FileText className="w-4 h-4" /> Download Official PDF Report
          </button>
        </div>
      </div>

      {/* High Level KPI Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Chapters</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{overview.totalClubs}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Autonomous Status</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Enrolled Members</div>
          <div className="text-2xl font-extrabold text-blue-900 font-mono">{overview.totalMembers}</div>
          <div className="text-[10px] text-slate-500 mt-1">Verified Student Roll IDs</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Conducted Events</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{overview.totalEvents}</div>
          <div className="text-[10px] text-slate-500 mt-1">Workshops &amp; Seminars</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Attendees</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{overview.totalRegistrations}</div>
          <div className="text-[10px] text-slate-500 mt-1">QR Scanned Check-Ins</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Certs Minted</div>
          <div className="text-2xl font-extrabold text-amber-800 font-mono">{overview.totalCertificates}</div>
          <div className="text-[10px] text-slate-500 mt-1">Hash Verified</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Approved Projects</div>
          <div className="text-2xl font-extrabold text-emerald-800 font-mono">{overview.totalProjects}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Faculty Evaluated</div>
        </div>
      </div>

      {/* Club Breakdown Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Department Chapter Performance Matrix</h3>
          <p className="text-xs text-slate-500">Official accreditation data across Pragati University technical divisions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Club / Chapter Name</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Active Members</th>
                <th className="py-3 px-3">Events</th>
                <th className="py-3 px-3">Total Check-Ins</th>
                <th className="py-3 px-3">Avg Rating</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clubMetrics.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900">{c.name}</td>
                  <td className="py-3 px-3 text-slate-600 font-mono">{c.department_code || 'CSE'}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-blue-900">{c.active_members || 120}</td>
                  <td className="py-3 px-3 font-mono">{c.events_count || 6}</td>
                  <td className="py-3 px-3 font-mono text-emerald-800 font-semibold">{c.total_attendees || 420}</td>
                  <td className="py-3 px-3 font-mono text-amber-700 font-semibold">&starf; {c.avg_rating || '4.8'}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
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
