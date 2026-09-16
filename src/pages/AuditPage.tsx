import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  FileCheck,
  CheckCircle2
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold mb-2">
          <ShieldAlert className="w-3.5 h-3.5" /> Immutable Security & Governance Ledger
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          System Audit & Activity Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Cryptographically recorded administrative actions, QR pass scans, certificate minting, and role elevations.
        </p>
      </div>

      {/* Filter strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['All', 'CLUB_CREATED', 'MEMBERSHIP_ENROLLED', 'EVENT_SCHEDULED', 'ATTENDANCE_SCANNED', 'CERTIFICATE_ISSUED', 'PROJECT_REVIEWED'].map(a => (
          <button
            key={a}
            onClick={() => setActionFilter(a === 'All' ? '' : a)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              (a === 'All' && actionFilter === '') || actionFilter === a
                ? 'bg-rose-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {a.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Fetching audit log entries...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">No audit log records found for this action filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Authorized Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Details / Metadata</th>
                  <th className="py-3 px-4">IP Origin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-indigo-300 border border-indigo-500/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-sans font-semibold">
                      {log.actor_name || 'System Daemon'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {log.entity_type} #{log.entity_id?.slice(0, 12)}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-sans text-[11px] max-w-xs truncate">
                      {log.details || 'OK'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[10px]">
                      {log.ip_address || '127.0.0.1'}
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
