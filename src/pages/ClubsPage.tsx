import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Users,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Plus,
  Filter,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Building2,
  Tag,
  BookOpen,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Club } from '../types';
import { useAuth } from '../context/AuthContext';

interface ClubsPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

const CATEGORIES = [
  'All Categories',
  'Industry 4.0',
  'Co-Curricular Activities',
  'Extra-Curricular Activities'
];

const DEPARTMENTS = [
  { code: 'ALL', label: 'All Departments' },
  { code: 'CE', label: 'CE' },
  { code: 'IT', label: 'IT' },
  { code: 'ME', label: 'ME' },
  { code: 'CSE', label: 'CSE' },
  { code: 'CSE(CS)', label: 'CSE(CS)' },
  { code: 'CSE(AIML)', label: 'CSE(AIML)' },
  { code: 'CSE(DS)', label: 'CSE(DS)' },
  { code: 'CSE(AI)', label: 'CSE(AI)' },
  { code: 'ECE', label: 'ECE' },
  { code: 'EEE', label: 'EEE' },
  { code: 'BSH', label: 'BSH' }
];

export const ClubsPage: React.FC<ClubsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // New Club Modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubObj, setNewClubObj] = useState('');
  const [newClubDomains, setNewClubDomains] = useState('');
  const [newClubCategory, setNewClubCategory] = useState('Industry 4.0');
  const [newClubDept, setNewClubDept] = useState('CSE');
  const [newClubFaculty, setNewClubFaculty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const res = await api.clubs.list({
        category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
        department: selectedDept !== 'ALL' ? selectedDept : undefined,
        search: search || undefined
      });
      setClubs(res.clubs);
    } catch (err) {
      console.error('Failed to fetch clubs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [selectedCategory, selectedDept, search]);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    try {
      await api.clubs.create({
        name: newClubName,
        description: newClubDesc,
        objectives: newClubObj,
        domains: newClubDomains,
        category: newClubCategory,
        department: newClubDept,
        faculty_coordinator: newClubFaculty,
      });
      setStatusMsg({ type: 'success', text: 'New club chartered successfully.' });
      setShowCreateModal(false);
      fetchClubs();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to create club' });
    } finally {
      setSubmitting(false);
    }
  };

  const canCreateClub = user?.roles.some(r => ['SUPER_ADMIN', 'FACULTY_COORDINATOR'].includes(r));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in bg-slate-50 min-h-screen">
      {/* Header with Pragati University Identity */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5 text-blue-900" />
            Pragati University &bull; Official Clubs Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Accredited Student Clubs &amp; Technical Societies
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Explore the 35 verified student bodies across Industry 4.0, Co-Curricular, and Extra-Curricular domains at Pragati University, overseen by designated faculty coordinators.
          </p>
        </div>

        {canCreateClub && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start md:self-auto px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Charter New Technical Club
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="space-y-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        {/* Search and Category Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by club name, department, faculty, or category..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider mr-1 hidden sm:inline">
              Category:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Department Filter Strip */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider mr-1 shrink-0">
            Department:
          </span>
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.code}
              onClick={() => setSelectedDept(dept.code)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                selectedDept === dept.code
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <div>
          Showing <span className="font-bold text-slate-900">{clubs.length}</span> clubs
          {selectedCategory !== 'All Categories' && (
            <span> in <span className="text-blue-900 font-bold">{selectedCategory}</span></span>
          )}
          {selectedDept !== 'ALL' && (
            <span> for department <span className="text-blue-900 font-bold">{selectedDept}</span></span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
          <span className="text-slate-600 font-medium">All 35 Verified PEC Clubs Active</span>
        </div>
      </div>

      {/* Clubs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-5 rounded-xl bg-white border border-slate-200 animate-pulse space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                <div className="h-4 w-12 bg-slate-200 rounded"></div>
              </div>
              <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
              <div className="space-y-1.5 pt-2">
                <div className="h-3.5 w-full bg-slate-200 rounded"></div>
                <div className="h-3.5 w-5/6 bg-slate-200 rounded"></div>
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
                <div className="h-3 w-2/3 bg-slate-200 rounded"></div>
              </div>
              <div className="h-8 w-full bg-slate-200 rounded pt-2"></div>
            </div>
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <div className="py-12 px-6 text-center text-slate-600 bg-white rounded-xl border border-slate-200 text-xs space-y-3">
          <p className="text-slate-800 font-bold text-sm">No accredited technical clubs match your search criteria.</p>
          <p className="text-slate-500">Please try adjusting your department selection, category filter, or search keywords.</p>
          <button
            onClick={() => {
              setSelectedCategory('All Categories');
              setSelectedDept('ALL');
              setSearch('');
            }}
            className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-800 transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clubs.map((club) => {
            return (
              <div
                key={club.id}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-900 hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  {/* Category & Status Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {club.category || 'Technical Club'}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {club.status || 'ACTIVE'}
                    </span>
                  </div>

                  {/* 1. Club Name */}
                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {club.name}
                  </h3>

                  {/* 2. Short meaningful description */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4 font-normal">
                    {club.description}
                  </p>

                  {/* Institutional Metadata: Department, Category, Faculty Coordinator */}
                  <div className="space-y-2 py-3 border-t border-slate-100 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Department
                      </div>
                      <div className="text-slate-800 font-semibold mt-0.5">
                        {club.department || club.department_code || 'Interdisciplinary'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Category
                      </div>
                      <div className="text-slate-800 font-medium mt-0.5">
                        {club.category}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Faculty Coordinator
                      </div>
                      <div className="text-slate-800 font-semibold mt-0.5 truncate">
                        {club.faculty_coordinator || club.faculty_name || 'Designated Faculty Member'}
                      </div>
                    </div>

                    {club.domains && (
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Key Domains
                        </div>
                        <div className="text-slate-600 text-[11px] mt-0.5 truncate">
                          {club.domains}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="pt-3 border-t border-slate-100 mt-2">
                  <button
                    onClick={() => onNavigate('club-detail', club.id)}
                    className="w-full py-2 px-3 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>View Club Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charter New Club Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-blue-900" />
              <h3 className="text-lg font-bold text-slate-900">Charter New Technical Club</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Establish an accredited society under Pragati University oversight</p>

            <form onSubmit={handleCreateClub} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Club Full Name *</label>
                <input
                  type="text"
                  required
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  placeholder="e.g., Robotics and Automation Club"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={newClubCategory}
                    onChange={(e) => setNewClubCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  >
                    <option value="Industry 4.0">Industry 4.0</option>
                    <option value="Co-Curricular Activities">Co-Curricular</option>
                    <option value="Extra-Curricular Activities">Extra-Curricular</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Department *</label>
                  <select
                    value={newClubDept}
                    onChange={(e) => setNewClubDept(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-900"
                  >
                    <option value="CSE">CSE</option>
                    <option value="AI&DS">AI&amp;DS</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="IT">IT</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                    <option value="BSH">BSH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Faculty Coordinator *</label>
                <input
                  type="text"
                  required
                  value={newClubFaculty}
                  onChange={(e) => setNewClubFaculty(e.target.value)}
                  placeholder="e.g., Dr. V. Sailaja, Dept of ECE"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Key Technical Domains</label>
                <input
                  type="text"
                  value={newClubDomains}
                  onChange={(e) => setNewClubDomains(e.target.value)}
                  placeholder="e.g., AI/ML, Cloud Computing, IoT"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Club Description *</label>
                <textarea
                  required
                  rows={2}
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  placeholder="Summary of student activities and industry focus..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold"
                >
                  {submitting ? 'Submitting...' : 'Charter Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
