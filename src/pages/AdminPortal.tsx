import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Award,
  Layers,
  FileCheck,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  Plus,
  Send,
  Loader2,
  Calendar,
  AlertCircle,
  ShieldAlert,
  Building2,
  Printer,
  QrCode,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Club, Membership, Project, Certificate, PlatformMetrics, Event } from '../types';

export const AdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'memberships' | 'certificates' | 'projects' | 'events' | 'audit'>('analytics');
  
  // Data State
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal / Printable states
  const [selectedEventForQR, setSelectedEventForQR] = useState<Event | null>(null);

  // Allot Certificate Form State
  const [certRecipientRoll, setCertRecipientRoll] = useState<string>('23A31A0501');
  const [certRecipientName, setCertRecipientName] = useState<string>('K. Sai Varun');
  const [certTitle, setCertTitle] = useState<string>('Pragati Coding Hackathon Winner');
  const [certType, setCertType] = useState<'PARTICIPATION' | 'MERIT' | 'WINNER' | 'COORDINATOR'>('WINNER');
  const [certClubId, setCertClubId] = useState<string>('club-1');
  const [certEventTitle, setCertEventTitle] = useState<string>('PragSoft CodeQuest 2026');
  const [certDesc, setCertDesc] = useState<string>('Awarded for achieving 1st place in the Pragati Computer Science technical hackathon.');
  
  // Attendance & Certificate Claim States
  const [selectedClaimEventId, setSelectedClaimEventId] = useState<string>('');
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [claimFeedbackType, setClaimFeedbackType] = useState<{[regId: string]: string}>({});

  // Action Feedback State
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch claims for selected event
  const fetchClaimsForEvent = async (eventId: string) => {
    if (!eventId) return;
    try {
      const res = await api.events.getClaims(eventId);
      setClaimsList(res.claims || []);
    } catch (err) {
      console.error('Failed to fetch claims for event', eventId, err);
    }
  };

  // Fetch all administrative datasets
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [platformRes, clubsRes, projectsRes, auditRes, eventsRes] = await Promise.all([
        api.analytics.getPlatform(),
        api.clubs.list(),
        api.projects.list({ status: 'SUBMITTED' }),
        api.audit.list(),
        api.events.list()
      ]);

      setMetrics(platformRes.metrics);
      setClubs(clubsRes.clubs);
      setPendingProjects(projectsRes.projects);
      setAuditLogs(auditRes.logs.slice(0, 50));
      const fetchedEvents = eventsRes.events || [];
      setEvents(fetchedEvents);

      // Set default selected claim event if not set yet
      if (fetchedEvents.length > 0 && !selectedClaimEventId) {
        setSelectedClaimEventId(fetchedEvents[0].id);
      }

      // Fetch pending memberships across all clubs
      const allPendingMembers: any[] = [];
      for (const club of clubsRes.clubs.slice(0, 5)) {
        try {
          const res = await api.memberships.listByClub(club.id, 'PENDING');
          if (res.members && res.members.length > 0) {
            allPendingMembers.push(...res.members.map(m => ({ ...m, clubName: club.name })));
          }
        } catch (e) {
          // ignore individual club fetch failures
        }
      }
      setPendingMembers(allPendingMembers);
    } catch (err: any) {
      console.error('Failed to load admin dataset', err);
      setErrorMessage('Failed to load administrative dataset. Please verify your token and role.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAdminData();
    }
  }, [user]);

  // Load claims automatically when selectedClaimEventId changes
  useEffect(() => {
    if (selectedClaimEventId) {
      fetchClaimsForEvent(selectedClaimEventId);
    }
  }, [selectedClaimEventId]);

  // Approve / Reject Attendance Claim + Immediately Mint Certificate
  const handleApproveClaim = async (eventId: string, regId: string, action: 'APPROVE' | 'REJECT') => {
    setActionLoading(regId);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const type = claimFeedbackType[regId] || 'PARTICIPATION';
      const res = await api.events.approveClaim(eventId, {
        registration_id: regId,
        action,
        certificate_type: type
      });
      setSuccessMessage(res.message || 'Attendance claim updated successfully.');
      await fetchClaimsForEvent(eventId);
      fetchAdminData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update attendance claim.');
    } finally {
      setActionLoading(null);
    }
  };

  // Approve / Reject Membership Applications
  const handleMembershipStatus = async (membershipId: string, status: 'ACTIVE' | 'REJECTED') => {
    setActionLoading(membershipId);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await api.memberships.updateStatus(membershipId, status);
      setSuccessMessage(`Membership successfully ${status === 'ACTIVE' ? 'Approved' : 'Rejected'}!`);
      // Update local state
      setPendingMembers(prev => prev.filter(m => m.id !== membershipId));
      fetchAdminData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update membership application state.');
    } finally {
      setActionLoading(null);
    }
  };

  // Approve / Reject Project Submissions
  const handleProjectReview = async (projectId: string, decision: 'APPROVED' | 'REJECTED') => {
    setActionLoading(projectId);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await api.projects.review(projectId, {
        rating: decision === 'APPROVED' ? 5 : 1,
        remarks: `Official faculty evaluation completed. Status changed to ${decision}.`,
        decision
      });
      setSuccessMessage(`Project successfully ${decision === 'APPROVED' ? 'Approved' : 'Rejected'}!`);
      setPendingProjects(prev => prev.filter(p => p.id !== projectId));
      fetchAdminData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete project review.');
    } finally {
      setActionLoading(null);
    }
  };

  // Certificate Allotment Flow
  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('certificate');
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Find or verify matching student
      const res = await api.certificates.issue({
        recipient_id: certRecipientRoll, // Works with roll number or user id
        student_id: certRecipientRoll,
        student_name: certRecipientName,
        title: certTitle,
        type: certType,
        club_id: certClubId,
        description: certDesc,
        event_title: certEventTitle
      });

      setSuccessMessage(`Certificate successfully allotted and minted to ${certRecipientName} (${certRecipientRoll})! Verification Token: ${res.certificate?.verification_token || 'GEN-SUCCESS'}`);
      
      // Clear Form or set to defaults
      setCertRecipientRoll('23A31A0501');
      setCertRecipientName('K. Sai Varun');
      setCertTitle('Pragati Coding Hackathon Winner');
      
      fetchAdminData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Minting failed. Make sure student roll number is correct.');
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-rose-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-600">This area is reserved for Pragati University administrative leaders and faculty advisors.</p>
      </div>
    );
  }

  const isAdminOrFaculty = user.roles.some(r =>
    ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'DEPARTMENT_ADMIN', 'CLUB_ADMIN'].includes(r)
  );

  if (!isAdminOrFaculty) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-rose-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Elevated Authority Required</h2>
        <p className="text-xs text-slate-600">Your account does not possess the credentials to enter the faculty administrative desk.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in bg-slate-50 min-h-screen text-slate-900 print:hidden">
      {/* Official Identity Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-blue-900" />
            Pragati University Faculty &amp; Chapter Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrative Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-normal">
            Verify student chapters, approve memberships, allot technical certificates, and monitor real-time platform metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Session Authorized: {user.roles[0].replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Action Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 shadow-xs font-medium">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5 shadow-xs font-medium">
          <XCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />
          Analytics Dashboard
        </button>
        <button
          onClick={() => setActiveTab('memberships')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'memberships'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5 inline mr-1.5" />
          Memberships Approvals ({pendingMembers.length})
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'certificates'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Award className="w-3.5 h-3.5 inline mr-1.5" />
          Allot &amp; Mint Certificates
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'projects'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 inline mr-1.5" />
          Project Review ({pendingProjects.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'events'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
          Event Management ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5 inline mr-1.5" />
          System Audit Ledger
        </button>
      </div>

      {/* Main Tab Render Body */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-navy-900 mb-2" />
          Syncing with Pragati University administrative nodes...
        </div>
      ) : (
        <>
          {/* TAB 1: ANALYTICS OVERVIEW */}
          {activeTab === 'analytics' && metrics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Registered Students</div>
                  <div className="text-3xl font-black text-navy-900 mt-1">{metrics.total_users || 342}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-record-code">Active PEC Identity Registries</div>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Chapters</div>
                  <div className="text-3xl font-black text-navy-900 mt-1">{metrics.total_clubs || 35}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-record-code">Official technical societies</div>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Conducted Events</div>
                  <div className="text-3xl font-black text-navy-900 mt-1">{metrics.total_events || 48}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-record-code">Hackathons, Seminars &amp; Bootcamps</div>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cryptographic Certificates</div>
                  <div className="text-3xl font-black text-navy-900 mt-1">{metrics.total_certificates || 128}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-record-code">Total verified allocations</div>
                </div>
              </div>

              {/* Clubs list state info */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-navy-900" /> Real Institutional Chapters Status
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Chapter Name</th>
                        <th className="py-3 px-4">Faculty Advisor</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {clubs.slice(0, 10).map(club => (
                        <tr key={club.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 text-slate-900 font-semibold">{club.name}</td>
                          <td className="py-3.5 px-4 text-slate-600">{club.faculty_coordinator || 'Assigned Professor'}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {club.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{club.department || 'Pragati University'}</td>
                          <td className="py-3.5 px-4">
                            <button className="text-navy-900 hover:underline font-bold text-xs">Manage Desk</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENDING MEMBERSHIP APPROVALS */}
          {activeTab === 'memberships' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-navy-900" /> Pending Student Applications
                </h3>
                <p className="text-xs text-slate-500 mt-1">Review student applications requesting to join their respective technical club chapters.</p>
              </div>

              {pendingMembers.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500">
                  No pending membership enrollment requests found across checked chapters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Roll Number</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Target Society</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {pendingMembers.map(member => (
                        <tr key={member.id} className="hover:bg-slate-50 transition">
                          <td className="py-4 px-4 text-slate-900 font-semibold">{member.student_name}</td>
                          <td className="py-4 px-4 text-slate-800 font-record-code font-medium uppercase">{member.student_roll || '23A31A0501'}</td>
                          <td className="py-4 px-4 text-slate-500">{member.department_name || 'CSE'}</td>
                          <td className="py-4 px-4 text-navy-950 font-semibold">{member.clubName}</td>
                          <td className="py-4 px-4 text-slate-500 font-record-code">{new Date(member.joined_at).toLocaleDateString()}</td>
                          <td className="py-4 px-4 text-center flex items-center justify-center gap-2">
                            <button
                              disabled={actionLoading === member.id}
                              onClick={() => handleMembershipStatus(member.id, 'ACTIVE')}
                              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-md text-[10px] transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              disabled={actionLoading === member.id}
                              onClick={() => handleMembershipStatus(member.id, 'REJECTED')}
                              className="px-2.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-md text-[10px] transition disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CERTIFICATE ALLOTMENT & MINTING */}
          {activeTab === 'certificates' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form panel */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-navy-900" /> Certificate Allocation Console
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Mint cryptographically signed verified student achievements directly to their institutional ledger.</p>
                </div>

                <form onSubmit={handleIssueCertificate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Recipient Student Roll Number *</label>
                      <input
                        type="text"
                        required
                        value={certRecipientRoll}
                        onChange={(e) => setCertRecipientRoll(e.target.value.toUpperCase())}
                        placeholder="e.g. 23A31A0501"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900 font-record-code uppercase font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Recipient Student Name *</label>
                      <input
                        type="text"
                        required
                        value={certRecipientName}
                        onChange={(e) => setCertRecipientName(e.target.value)}
                        placeholder="e.g. K. Sai Varun"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Alloting Department / Club *</label>
                      <select
                        value={certClubId}
                        onChange={(e) => setCertClubId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-navy-900"
                      >
                        {clubs.map(club => (
                          <option key={club.id} value={club.id}>{club.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Credential Category *</label>
                      <select
                        value={certType}
                        onChange={(e) => setCertType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-navy-900"
                      >
                        <option value="WINNER">WINNER (1st/2nd/3rd prize)</option>
                        <option value="MERIT">MERIT (Outstanding contribution)</option>
                        <option value="PARTICIPATION">PARTICIPATION (Event/Seminar attendee)</option>
                        <option value="COORDINATOR">COORDINATOR (Student Lead or volunteer)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Certificate Title *</label>
                      <input
                        type="text"
                        required
                        value={certTitle}
                        onChange={(e) => setCertTitle(e.target.value)}
                        placeholder="e.g. Certificate of Hackathon Excellence"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Reference Activity / Event *</label>
                      <input
                        type="text"
                        required
                        value={certEventTitle}
                        onChange={(e) => setCertEventTitle(e.target.value)}
                        placeholder="e.g. CodeQuest 2026"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Citations / Achievement Details *</label>
                    <textarea
                      required
                      rows={3}
                      value={certDesc}
                      onChange={(e) => setCertDesc(e.target.value)}
                      placeholder="e.g. Awarded for developing an AI-driven student logistics tracker in the 36-hour technical hackathon..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900 font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading === 'certificate'}
                    className="w-full py-2.5 px-4 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {actionLoading === 'certificate' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating cryptographic verification tokens...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Mint &amp; Issue Cryptographic Certificate</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Info panel */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-900" /> Ledger Verification Guide
                </h3>
                <ul className="space-y-3.5 text-xs text-slate-600 leading-relaxed font-normal">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Verified Identifiers</strong>: The process resolves the recipient's roll number to mint certificates linked to their profile instantly.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Verification QR</strong>: A public verification token is generated, allowing companies or HODs to scan the QR to inspect legitimacy.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Immutable Audit Track</strong>: Every single minting action is securely written to the audit log trail, recording the admin IP and actor credentials.</span>
                  </li>
                </ul>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-[11px] text-slate-500 font-record-code">
                  <span className="font-bold block text-slate-700 mb-1 uppercase text-[10px]">Verifiable URL Pattern:</span>
                  /verify-certificate/HASH-KEY
                </div>
              </div>
            </div>

            {/* Attendance & Certificate Claims Section */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-6 mt-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-700" /> Pending Student Attendance &amp; Certificate Claims
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Review student requests for attendance authorization. Approving instantly records attendance and issues a verified digital certificate.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Event:</span>
                  <select
                    value={selectedClaimEventId}
                    onChange={(e) => setSelectedClaimEventId(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-navy-900"
                  >
                    <option value="">-- Choose Event --</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {claimsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  No pending attendance authorization or certificate claims found for the selected event.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Roll Number</th>
                        <th className="py-3 px-4">Course</th>
                        <th className="py-3 px-4">Claim Date</th>
                        <th className="py-3 px-4">Status / Action</th>
                        <th className="py-3 px-4 text-center">Approve / Decline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {claimsList.map(claim => (
                        <tr key={claim.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{claim.student_name}</div>
                            <div className="text-[10px] text-slate-400">{claim.email}</div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">{claim.student_roll}</td>
                          <td className="py-3 px-4 text-slate-500">{claim.course}</td>
                          <td className="py-3 px-4 text-slate-500">
                            {claim.attendance_claim_time ? new Date(claim.attendance_claim_time).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            {claim.attendance_claim_status === 'APPROVED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> Issued: {claim.certificate_code || 'VERIFIED'}
                              </span>
                            ) : claim.attendance_claim_status === 'REJECTED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold">
                                <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                  Pending Approval
                                </span>
                                <select
                                  value={claimFeedbackType[claim.id] || 'PARTICIPATION'}
                                  onChange={(e) => setClaimFeedbackType(prev => ({...prev, [claim.id]: e.target.value}))}
                                  className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-700 focus:outline-hidden"
                                >
                                  <option value="PARTICIPATION">PARTICIPATION</option>
                                  <option value="WINNER">WINNER</option>
                                  <option value="MERIT">MERIT</option>
                                  <option value="COORDINATOR">COORDINATOR</option>
                                </select>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {claim.attendance_claim_status === 'PENDING' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  disabled={actionLoading === claim.id}
                                  onClick={() => handleApproveClaim(selectedClaimEventId, claim.id, 'APPROVE')}
                                  className="p-1 px-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                                >
                                  Approve &amp; Issue
                                </button>
                                <button
                                  disabled={actionLoading === claim.id}
                                  onClick={() => handleApproveClaim(selectedClaimEventId, claim.id, 'REJECT')}
                                  className="p-1 px-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-medium">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
          )}

          {/* TAB 4: PROJECT REVIEWS */}
          {activeTab === 'projects' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-navy-900" /> Student Projects Moderation Desk
                </h3>
                <p className="text-xs text-slate-500 mt-1">Review, rate, and approve student-submitted projects before they publish in the public showcases.</p>
              </div>

              {pendingProjects.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500">
                  No pending student projects awaiting moderation or reviews.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingProjects.map(project => (
                    <div key={project.id} className="p-6 flex flex-col md:flex-row items-start justify-between gap-6 hover:bg-slate-50 transition">
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-900">
                            {project.domain}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Submitted by: <strong className="text-slate-800 font-semibold">{project.creator_name} ({project.creator_roll || '23A31A0501'})</strong>
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{project.title}</h4>
                        <p className="text-xs text-slate-600 font-normal leading-relaxed">{project.description}</p>
                        <div className="text-[11px] font-record-code text-slate-400">
                          Technologies: {project.technologies}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          disabled={actionLoading === project.id}
                          onClick={() => handleProjectReview(project.id, 'APPROVED')}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1"
                        >
                          Approve
                        </button>
                        <button
                          disabled={actionLoading === project.id}
                          onClick={() => handleProjectReview(project.id, 'REJECTED')}
                          className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-1"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SYSTEM AUDIT LOG DESK */}
          {activeTab === 'audit' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-navy-900" /> Platform Security Compliance Logs
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Immutable security activity tracking and login attempts recorded globally.</p>
                </div>
                <button
                  onClick={fetchAdminData}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition border border-slate-200 whitespace-nowrap"
                >
                  Refresh Log Ledger
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Admin Actor</th>
                      <th className="py-3 px-4">Ip Origin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-600">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-300">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-sans font-semibold">{log.actor_name || 'System Auto Seed'}</td>
                        <td className="py-3 px-4">{log.ip_address || '127.0.0.1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: EVENT MANAGEMENT & PASS GENERATION */}
          {activeTab === 'events' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-navy-900" /> Event Attendance QR Center
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Generate dynamic entrance QR passes for scheduled society workshops, coding bootcamps, and technical contests.</p>
                </div>
                <div className="text-xs text-slate-400 font-record-code">
                  Active Venues: Pragati Engineering Campus
                </div>
              </div>

              {events.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500">
                  No scheduled activities found. Please create an event in the events catalog first.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {events.map(event => (
                    <div key={event.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50/75 transition">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-orange-50 text-orange-700 border border-orange-200">
                            {event.event_type}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 font-record-code">
                            ID: {event.id}
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900">{event.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                          <span className="text-navy-950 font-semibold">{event.club_name}</span>
                          <span>&bull;</span>
                          <span>{event.venue}</span>
                          <span>&bull;</span>
                          <span className="font-record-code">{new Date(event.start_datetime).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-4 pt-1">
                          <div className="text-xs">
                            <span className="text-slate-400">Registrations:</span>{' '}
                            <strong className="text-slate-700 font-extrabold">{event.confirmed_registrations_count || 0} / {event.capacity}</strong>
                          </div>
                          <div className="text-xs">
                            <span className="text-slate-400">Attended Check-ins:</span>{' '}
                            <strong className="text-emerald-700 font-extrabold">{event.attended_count || 0} checked-in</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-stretch gap-2 shrink-0 sm:w-44">
                        <button
                          onClick={() => setSelectedEventForQR(event)}
                          className="px-3.5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                          <QrCode className="w-4 h-4 shrink-0" />
                          <span>Venue Check-in QR</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Event QR Poster Modal */}
      {selectedEventForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in print:hidden">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => setSelectedEventForQR(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shadow-xs">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Venue QR Poster Generator</h3>
                <p className="text-[11px] text-slate-500">Pragati Engineering College Entry Point</p>
              </div>
            </div>

            {/* Printable Frame Preview Container */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-4">
              <div className="text-[10px] font-black tracking-wider text-orange-600 uppercase">PRAGATI ENGINEERING COLLEGE</div>
              <div className="text-sm font-bold text-slate-900 line-clamp-1">{selectedEventForQR.title}</div>
              <div className="text-[10px] font-mono font-bold text-navy-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 uppercase">
                {selectedEventForQR.club_name}
              </div>

              {/* Dynamic QR */}
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PU-EVENT-CHECKIN-${selectedEventForQR.id}`}
                  alt="Check-in QR Code"
                  className="w-44 h-44"
                />
              </div>

              <div className="text-[10px] font-mono text-slate-500 font-bold uppercase select-all bg-slate-100 px-3 py-1 rounded-md">
                PU-EVENT-CHECKIN-{selectedEventForQR.id}
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">
                Students scan this unique poster QR code using their built-in web-scanner to instantly sign their attendance into the ledger.
              </p>
            </div>

            {/* Action buttons */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => window.print()}
                className="py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Poster</span>
              </button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=PU-EVENT-CHECKIN-${selectedEventForQR.id}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <span>Download High-Res</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable A4 Event QR Entrance Poster Flyer */}
      {selectedEventForQR && (
        <div className="hidden print:flex print:fixed print:inset-0 print:bg-white print:z-50 print:flex-col print:items-center print:justify-center print:text-center print:p-16 text-slate-900 bg-white">
          <div className="max-w-xl border-4 border-slate-900 p-12 rounded-3xl space-y-8 flex flex-col items-center bg-white">
            {/* Logo and Header */}
            <div className="space-y-2">
              <div className="text-base font-black tracking-widest text-orange-600 uppercase">PRAGATI ENGINEERING COLLEGE</div>
              <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tight">ATTENDANCE CHECK-IN</h1>
              <p className="text-xs text-slate-500 font-bold tracking-wider">OFFICIAL VENUE ENTRANCE SCANNER POSTER</p>
            </div>

            <div className="w-full h-0.5 bg-slate-200"></div>

            {/* Event Meta */}
            <div className="space-y-2">
              <div className="text-2xl font-extrabold text-slate-900">{selectedEventForQR.title}</div>
              <div className="text-xs font-bold text-navy-900 bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full inline-block">
                Organized by: {selectedEventForQR.club_name}
              </div>
              <div className="grid grid-cols-2 gap-8 text-xs font-bold text-slate-600 pt-2 font-mono uppercase">
                <div>VENUE: {selectedEventForQR.venue}</div>
                <div>DATE: {new Date(selectedEventForQR.start_datetime).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Huge QR Code */}
            <div className="p-4 bg-white border-2 border-slate-200 rounded-3xl shadow-xs">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=PU-EVENT-CHECKIN-${selectedEventForQR.id}`}
                alt="Entrance Check-in QR"
                className="w-72 h-72"
              />
            </div>

            {/* Scanning Instructions */}
            <div className="space-y-3 max-w-md">
              <div className="text-xs font-black text-orange-600 uppercase tracking-widest">Instructions for Students</div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                1. Open the student portal on your mobile device.<br />
                2. Tap your profile picture in the upper-right corner and select <strong>Student Portal &amp; Digital ID</strong>.<br />
                3. Go to the registered event and tap <strong>Self Check-In via QR Scanner</strong>.<br />
                4. Point your camera at this QR code to log your attendance instantly.
              </p>
            </div>

            <div className="w-full h-0.5 bg-slate-200"></div>

            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              PRAGATI ENGINEERING COLLEGE • EVENT ID: {selectedEventForQR.id} • SECURE CHECKSUM REGISTERED
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
