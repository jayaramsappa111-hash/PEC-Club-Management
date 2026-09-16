import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  FileCheck,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { api } from '../services/api';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      setLoading(true);
      try {
        const res = await api.audit.list({ action: actionFilter || undefined });
        setLogs(res.logs);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [actionFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-2">
          <Building2 className="w-3.5 h-3.5 text-blue-900" /> Immutable Security &amp; Governance Ledger &bull; Pragati University
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          System Audit &amp; Activity Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-normal">
          Cryptographically recorded administrative actions, QR pass scans, certificate minting, and role elevations at Pragati University.
        </p>
      </div>

      {/* Filter strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {['All', 'CLUB_CREATED', 'MEMBERSHIP_ENROLLED', 'EVENT_SCHEDULED', 'ATTENDANCE_SCANNED', 'CERTIFICATE_ISSUED', 'PROJECT_REVIEWED'].map(a => (
          <button
            key={a}
            onClick={() => setActionFilter(a === 'All' ? '' : a)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              (a === 'All' && actionFilter === '') || actionFilter === a
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {a.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Fetching audit log entries...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">No audit log records found for this action filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Authorized Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Details / Metadata</th>
                  <th className="py-3 px-4">IP Origin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-900 border border-blue-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-sans font-semibold">
                      {log.actor_name || 'System Daemon'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {log.entity_type}: {log.entity_id}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] truncate max-w-xs font-sans">
                      {log.details || 'Standard transaction logged'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {log.ip_address || '10.0.4.12 (PEC Intranet)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
