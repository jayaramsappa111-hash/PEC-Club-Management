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
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NotificationItem } from '../types';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, param?: string) => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenSearch,
  onOpenAuth,
}) => {
  const { user, logout, switchRoleUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState<boolean>(false);
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
    { id: 'clubs', label: 'Clubs', icon: Layers },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'projects', label: 'Projects', icon: ShieldCheck },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'roadmaps', label: 'Roadmaps', icon: Map },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
  ];

  const isAdminOrFaculty = user?.roles.some(r =>
    ['SUPER_ADMIN', 'FACULTY_COORDINATOR', 'CLUB_ADMIN', 'DEPARTMENT_ADMIN'].includes(r)
  );

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      {/* Quick Test Role Switcher Banner */}
      <div className="bg-slate-950 text-xs border-b border-slate-800 px-4 py-1.5 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-2 text-slate-400 shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-300">Live Database Session:</span>
          {user ? (
            <span className="text-emerald-400 font-mono font-medium">
              {user.name} ({user.roles.join(', ')})
            </span>
          ) : (
            <span className="text-slate-400">Guest Visitor</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          <span className="text-slate-500">Quick Switch Role:</span>
          <button
            onClick={() => switchRoleUser('SUPER_ADMIN')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
              user?.roles.includes('SUPER_ADMIN')
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Super Admin
          </button>
          <button
            onClick={() => switchRoleUser('FACULTY_COORDINATOR')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
              user?.roles.includes('FACULTY_COORDINATOR')
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Faculty
          </button>
          <button
            onClick={() => switchRoleUser('CLUB_ADMIN')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
              user?.roles.includes('CLUB_ADMIN')
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Club Admin
          </button>
          <button
            onClick={() => switchRoleUser('CLUB_MEMBER')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
              user?.roles.includes('CLUB_MEMBER')
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Student Member
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="h-10 px-2.5 py-1 bg-white rounded-xl border border-slate-700 flex items-center justify-center shadow-md">
              <img
                src="/assets/institutions/pragati-engineering-college/logo.png"
                alt="Pragati Engineering College (PEC)"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                Pragati Engineering College
                <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 bg-blue-900/60 border border-blue-700/60 text-blue-300 font-semibold rounded">
                  PEC
                </span>
              </div>
              <div className="text-[11px] text-slate-400 tracking-wider uppercase font-medium">
                Technical Club Management
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
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Actions: Search, Notifications, User Profile */}
          <div className="flex items-center gap-2.5">
            {/* Global Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition flex items-center gap-2 text-xs"
              title="Global Search across clubs, events, resources"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded text-[10px] border border-slate-700">
                Search
              </span>
            </button>

            {/* Public Verification Link */}
            <button
              onClick={() => onNavigate('verify-hub')}
              className={`p-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                currentTab === 'verify-hub' || currentTab === 'verify-membership' || currentTab === 'verify-certificate'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Public Ledger Verification (Certificates & Cards)"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Verify</span>
            </button>

            {/* Notifications Popover */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-blue-400" />
                        Notifications ({notifications.length})
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 mt-2">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500">
                          No notifications received yet
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`py-2.5 px-2 text-xs transition rounded-lg ${
                              n.read_at ? 'opacity-70' : 'bg-slate-800/40'
                            }`}
                          >
                            <div className="font-semibold text-slate-200">{n.title}</div>
                            <div className="text-slate-400 mt-0.5">{n.message}</div>
                            <div className="text-[10px] text-slate-500 mt-1">
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

            {/* User Dropdown or Login Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <div className="text-xs font-semibold text-white">{user.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                      <div className="mt-1 inline-block px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 text-[10px] font-semibold">
                        {user.roles[0]}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('student-portal');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5" />
                      Student Portal & ID Card
                    </button>

                    {isAdminOrFaculty && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('admin-portal');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-blue-400 hover:bg-slate-800 hover:text-blue-300 flex items-center gap-2 font-medium"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Admin Management Portal
                      </button>
                    )}

                    <div className="border-t border-slate-800 my-1"></div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-slate-800 hover:text-rose-300 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
          {user && (
            <button
              onClick={() => {
                onNavigate('student-portal');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-blue-400 hover:bg-slate-800 flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Student Portal & ID Card
            </button>
          )}
          {isAdminOrFaculty && (
            <button
              onClick={() => {
                onNavigate('admin-portal');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-purple-400 hover:bg-slate-800 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Management Portal
            </button>
          )}
        </div>
      )}
    </header>
  );
};
