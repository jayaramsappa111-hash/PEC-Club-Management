import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthenticatedUser, RoleName } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchRoleUser: (role: 'SUPER_ADMIN' | 'FACULTY_COORDINATOR' | 'CLUB_ADMIN' | 'CLUB_MEMBER' | 'STUDENT') => Promise<void>;
  hasRole: (roles: RoleName[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('tc_auth_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.auth.getMe();
      setUser(res.user);
    } catch {
      localStorage.removeItem('tc_auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.auth.login({ email, password: pass });
    localStorage.setItem('tc_auth_token', res.token);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.auth.register(data);
    localStorage.setItem('tc_auth_token', res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('tc_auth_token');
    setUser(null);
  };

  const switchRoleUser = async (role: 'SUPER_ADMIN' | 'FACULTY_COORDINATOR' | 'CLUB_ADMIN' | 'CLUB_MEMBER' | 'STUDENT') => {
    const roleEmailMap: Record<string, string> = {
      SUPER_ADMIN: 'superadmin@techclubs.edu',
      FACULTY_COORDINATOR: 'dr.sharma@techclubs.edu',
      CLUB_ADMIN: 'alex.clubadmin@techclubs.edu',
      CLUB_MEMBER: 'student.priya@techclubs.edu',
      STUDENT: 'student.rahul@techclubs.edu',
    };

    const targetEmail = roleEmailMap[role];
    if (targetEmail) {
      await login(targetEmail, 'Password123!');
    }
  };

  const hasRole = (roles: RoleName[]): boolean => {
    if (!user) return false;
    if (user.roles.includes('SUPER_ADMIN')) return true;
    return user.roles.some(r => roles.includes(r));
  };

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    if (user.roles.includes('SUPER_ADMIN')) return true;
    return user.permissions.includes(perm);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        switchRoleUser,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
