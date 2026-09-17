import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Calendar, Award, User, ChevronDown, ChevronUp, Check } from 'lucide-react';

export const StakeholderSimulationBar: React.FC = () => {
  const { user, switchRoleUser, loading } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Map simulated personas to the 6 system roles
  const roles = [
    {
      id: 'STUDENT',
      label: 'Student',
      desc: 'Explore 35 clubs, register for hackathons, submit projects, access LMS & view ID',
      color: 'border-blue-200 bg-blue-50 text-blue-900',
      badge: 'bg-blue-600 text-white'
    },
    {
      id: 'CLUB_MEMBER',
      label: 'Club Member',
      desc: 'Access members-only resources, tenure lists, certificates & digital membership card',
      color: 'border-sky-200 bg-sky-50 text-sky-900',
      badge: 'bg-sky-600 text-white'
    },
    {
      id: 'CLUB_ADMIN',
      label: 'Club Coordinator / Admin',
      desc: 'Manage student executive teams, publish circulars, draft event budgets',
      color: 'border-indigo-200 bg-indigo-50 text-indigo-900',
      badge: 'bg-indigo-600 text-white'
    },
    {
      id: 'FACULTY_COORDINATOR',
      label: 'Faculty Coordinator',
      desc: 'Approve student projects, authorize team changes, stamp physical attendance checklists',
      color: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      badge: 'bg-emerald-600 text-white'
    },
    {
      id: 'DEPARTMENT_ADMIN',
      label: 'Department Admin / HOD',
      desc: 'Issue official certified credentials, monitor department membership, view trends',
      color: 'border-orange-200 bg-orange-50 text-orange-950',
      badge: 'bg-orange-600 text-white'
    },
    {
      id: 'SUPER_ADMIN',
      label: 'Super Admin',
      desc: 'Access complete audit ledgers, modify system constant tables, manage user directory',
      color: 'border-purple-200 bg-purple-50 text-purple-900',
      badge: 'bg-purple-600 text-white'
    }
  ] as const;

  const currentRoleName = user?.roles[0] || 'STUDENT';

  const handleRoleSwitch = async (roleId: typeof roles[number]['id']) => {
    try {
      await switchRoleUser(roleId);
    } catch (err) {
      console.error('Failed to simulate role:', err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm sm:max-w-md bg-white border-2 border-slate-900 rounded-2xl shadow-2xl overflow-hidden print:hidden animate-in slide-in-from-bottom duration-300">
      {/* Bar Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-slate-950 text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />
          <div>
            <span className="text-[11px] uppercase tracking-wider font-black text-slate-300">STAKEHOLDER VIEW MODE</span>
            <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
              <span>Active Persona:</span>
              <strong className="text-orange-400 underline decoration-2">{roles.find(r => r.id === currentRoleName)?.label || 'Public Student'}</strong>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-[10px] text-slate-400 font-bold animate-pulse font-mono uppercase">
              Simulating...
            </span>
          )}
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Dynamic Selector Body */}
      {isOpen && (
        <div className="p-4 bg-white border-t border-slate-200 max-h-[380px] overflow-y-auto space-y-2">
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-3">
            Click any stakeholder below to immediately swap your active account context and preview custom club dashboards, administrative reviewers, or public rosters.
          </p>

          <div className="grid grid-cols-1 gap-2">
            {roles.map((r) => {
              const isActive = currentRoleName === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => handleRoleSwitch(r.id)}
                  disabled={loading}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex items-start gap-3 relative ${
                    isActive 
                      ? 'border-slate-900 bg-slate-50 shadow-inner' 
                      : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                  } disabled:opacity-50`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isActive ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isActive ? <Check className="w-3 h-3" /> : r.label[0]}
                  </div>

                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-900 leading-none">
                        {r.label}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded leading-none shrink-0 border border-orange-200">
                          Viewing
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal leading-relaxed leading-snug">
                      {r.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
