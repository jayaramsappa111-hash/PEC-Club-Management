import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Bell,
  User,
  LogOut,
  Compass,
  Calendar,
  Layers,
  BookOpen,
  Map,
  Wrench,
  Megaphone,
  QrCode,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  GraduationCap,
  Building2,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NotificationItem } from '../types';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, param?: string) => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onOpenDigitalCard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenSearch,
  onOpenAuth,
  onOpenDigitalCard,
}) => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const countRes = await api.notifications.unreadCount();
      setUnreadCount(countRes.count);
      const listRes = await api.notifications.list();
      setNotifications(listRes.notifications);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.readAll();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch {
      // ignore
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'clubs', label: 'Student Chapters', icon: Layers },
    { id: 'events', label: 'Events & Workshops', icon: Calendar },
    { id: 'projects', label: 'Project Registry', icon: ShieldCheck },
    { id: 'learning', label: 'E-Resources', icon: BookOpen },
    { id: 'roadmaps', label: 'Skill Roadmaps', icon: Map },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'announcements', label: 'Circulars', icon: Megaphone },
  ];

  const isAdminOrFaculty = user?.roles.some(r =>
    ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN', 'DEPARTMENT_ADMIN'].includes(r)
  );

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Official Institutional Top Bar */}
      <div className="bg-navy-950 text-white text-[11px] px-4 py-1.5 border-b border-navy-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-2 text-slate-200 text-center sm:text-left">
            <span className="font-bold text-white tracking-wide">PRAGATI UNIVERSITY</span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="hidden md:inline text-slate-300">Autonomous University &bull; Approved by UGC &amp; AICTE &bull; NAAC 'A' Accredited</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300 text-[10px]">
            <span className="hidden sm:inline bg-navy-900 px-2 py-0.5 rounded text-slate-200 font-record-code border border-slate-700/60">
              Academic Year 2025-2026
            </span>
            <a
              href="https://pragati.ac.in/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1 transition text-slate-300"
            >
              Official University Portal <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Institutional Title */}
          <div
            className="flex items-center gap-3 cursor-pointer py-1 select-none"
            onClick={() => onNavigate('home')}
          >
            <div className="h-11 w-11 bg-white rounded-lg border border-slate-200 flex items-center justify-center p-1 shrink-0 shadow-xs">
              <img
                src="/assets/institutions/pragati-engineering-college/logo.png"
                alt="Pragati University"
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 font-display flex items-center gap-1.5 leading-tight">
                Pragati University
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 bg-navy-50 text-navy-900 border border-navy-200 font-bold rounded">
                  PU
                </span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium tracking-wide">
                Student Life &amp; Club Management
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-navy-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Actions: Search, Verification, Notifications, User Profile */}
          <div className="flex items-center gap-2">
            {/* Global Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition flex items-center gap-1.5 text-xs border border-slate-200"
              title="Search clubs, events, projects, resources"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span className="hidden md:inline text-slate-700 font-medium text-[11px]">
                Search
              </span>
            </button>

            {/* Public Verification Hub */}
            <button
              onClick={() => onNavigate('verify-hub')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border ${
                currentTab === 'verify-hub' || currentTab === 'verify-membership' || currentTab === 'verify-certificate'
                  ? 'bg-navy-900 text-white border-navy-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Public Verification (Certificates & Digital Cards)"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Verify</span>
            </button>

            {/* Notifications Popover */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition relative border border-slate-200"
                  title="Institutional Notifications"
                >
                  <Bell className="w-4 h-4 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-700 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-50 animate-in fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5 font-display">
                        <Bell className="w-4 h-4 text-navy-900" />
                        Official Notifications ({notifications.length})
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-navy-900 hover:underline font-semibold"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 mt-2">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500">
                          No circulars or notifications received yet.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`py-2.5 px-2 text-xs transition rounded-lg ${
                              n.read_at ? 'opacity-70' : 'bg-slate-50'
                            }`}
                          >
                            <div className="font-semibold text-slate-900">{n.title}</div>
                            <div className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</div>
                            <div className="text-[10px] text-slate-400 mt-1 font-record-code">
                              {new Date(n.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Authenticated User Menu or Strict Sign In Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                >
                  <div className="w-8 h-8 rounded bg-navy-900 text-white flex items-center justify-center font-bold text-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden xl:block text-left">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{user.name}</div>
                    <div className="text-[10px] text-slate-500 font-record-code">{user.student_id || user.roles[0]}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in">
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                      <div className="text-xs font-bold text-slate-900 font-display">{user.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-navy-100 text-navy-900 text-[10px] font-bold">
                          {user.roles[0].replace('_', ' ')}
                        </span>
                        {user.student_id && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-record-code font-medium">
                            {user.student_id}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('student-portal');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-navy-900" />
                      Student Portal &amp; Digital ID
                    </button>

                    {isAdminOrFaculty && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('admin-portal');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-900 font-semibold hover:bg-slate-100 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-navy-900" />
                        Administrative Portal
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Sign In
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate(item.id);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                    isActive
                      ? 'bg-navy-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('verify-hub');
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-navy-900" />
                Certificate &amp; Card Verification Hub
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
