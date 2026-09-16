import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AuthenticatedUser, RoleName } from '../types';
import { api, getAuthToken, setAuthToken, removeAuthToken, onUnauthorized } from '../services/api';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type FirebaseUser
} from '../lib/firebase';

export interface DecodedToken {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  sessionExpiry: Date | null;
  login: (emailOrId: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: (reason?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  switchRoleUser: (role: 'SUPER_ADMIN' | 'FACULTY_COORDINATOR' | 'CLUB_ADMIN' | 'CLUB_MEMBER' | 'STUDENT') => Promise<void>;
  hasRole: (roles: RoleName[]) => boolean;
  hasPermission: (permission: string) => boolean;
  clearError: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string): DecodedToken | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);

  const isSyncingRef = useRef<boolean>(false);

  const clearSession = useCallback((reason?: string) => {
    removeAuthToken();
    setTokenState(null);
    setUser(null);
    setSessionExpiry(null);
    if (reason) {
      setError(reason);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      if (!auth.currentUser) {
        clearSession();
      }
      setLoading(false);
      return;
    }

    // Inspect token expiration
    const decoded = parseJwt(currentToken);
    if (decoded?.exp) {
      const expiryDate = new Date(decoded.exp * 1000);
      setSessionExpiry(expiryDate);
      if (expiryDate.getTime() <= Date.now()) {
        clearSession('Your session has expired. Please sign in again.');
        setLoading(false);
        return;
      }
    }

    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const res = await api.auth.getMe();
      if (res?.user) {
        setUser(res.user);
        setTokenState(currentToken);
        setError(null);
      } else {
        clearSession('Session verification failed. Please sign in again.');
      }
    } catch (err: any) {
      console.warn('[AuthContext] Session validation warning:', err?.message || err);
      clearSession('Session is no longer valid. Please sign in again.');
    } finally {
      isSyncingRef.current = false;
      setLoading(false);
    }
  }, [clearSession]);

  // Firebase Auth SDK onAuthStateChanged listener with user persistence
  useEffect(() => {
    const unsubscribeFirebase = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email) {
        try {
          // Sync Firebase authenticated user with University backend claims
          const syncRes = await api.auth.firebaseSync({
            email: fbUser.email,
            name: fbUser.displayName || undefined,
            uid: fbUser.uid,
            photoURL: fbUser.photoURL || undefined
          });
          if (syncRes?.token && syncRes?.user) {
            setAuthToken(syncRes.token);
            setTokenState(syncRes.token);
            setUser(syncRes.user);
            const decoded = parseJwt(syncRes.token);
            if (decoded?.exp) {
              setSessionExpiry(new Date(decoded.exp * 1000));
            }
          }
        } catch (syncErr) {
          console.warn('[Firebase Auth] Backend sync notice:', syncErr);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeFirebase();
    };
  }, []);

  // Initial user fetch
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen to 401 unauthorized notifications across any API call
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      clearSession('Session timed out or unauthorized. Please re-authenticate.');
    });
    return () => {
      unsubscribe();
    };
  }, [clearSession]);

  // Periodic heartbeat & tab focus revalidation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && getAuthToken()) {
        refreshUser();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    const interval = setInterval(() => {
      if (getAuthToken()) {
        refreshUser();
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [refreshUser]);

  const login = async (emailOrId: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Authenticate against University API directory (supports both institutional email and student roll numbers)
      const res = await api.auth.login({ email: emailOrId, password: pass });
      if (!res.token || !res.user) {
        throw new Error('Authentication response did not contain a valid session token.');
      }

      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);

      const decoded = parseJwt(res.token);
      if (decoded?.exp) {
        setSessionExpiry(new Date(decoded.exp * 1000));
      }

      // 2. Also authenticate/sync with Firebase Auth SDK if valid email format
      if (res.user.email.includes('@')) {
        try {
          await signInWithEmailAndPassword(auth, res.user.email, pass);
        } catch (fbErr: any) {
          // If user doesn't exist in Firebase Auth yet, provision in Firebase Auth
          if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential') {
            try {
              await createUserWithEmailAndPassword(auth, res.user.email, pass);
            } catch {
              // Ignore secondary creation errors if password requirements differ
            }
          }
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to sign in. Please check your institutional credentials.';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Register with Firebase Auth SDK
      if (data.email && data.password) {
        try {
          await createUserWithEmailAndPassword(auth, data.email, data.password);
        } catch (fbErr: any) {
          if (fbErr.code !== 'auth/email-already-in-use') {
            console.warn('[Firebase Auth] Register notice:', fbErr.message);
          }
        }
      }

      // 2. Register with University Database
      const res = await api.auth.register(data);
      if (!res.token || !res.user) {
        throw new Error('Registration did not produce an active session token.');
      }
      setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);

      const decoded = parseJwt(res.token);
      if (decoded?.exp) {
        setSessionExpiry(new Date(decoded.exp * 1000));
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Registration failed. Please check the entered details.';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      if (!fbUser || !fbUser.email) {
        throw new Error('No email returned from Google authentication');
      }

      setFirebaseUser(fbUser);

      const syncRes = await api.auth.firebaseSync({
        email: fbUser.email,
        name: fbUser.displayName || undefined,
        uid: fbUser.uid,
        photoURL: fbUser.photoURL || undefined
      });

      if (!syncRes.token || !syncRes.user) {
        throw new Error('Failed to synchronize user session with university directory');
      }

      setAuthToken(syncRes.token);
      setTokenState(syncRes.token);
      setUser(syncRes.user);

      const decoded = parseJwt(syncRes.token);
      if (decoded?.exp) {
        setSessionExpiry(new Date(decoded.exp * 1000));
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Google sign-in could not be completed.';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = signInWithGoogle;

  const logout = async (reason?: string) => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[Firebase Auth] Sign out notice:', err);
    }
    clearSession(reason);
  };

  const clearError = () => {
    setError(null);
  };

  const getToken = () => {
    return token || getAuthToken();
  };

  const switchRoleUser = async (role: 'SUPER_ADMIN' | 'FACULTY_COORDINATOR' | 'CLUB_ADMIN' | 'CLUB_MEMBER' | 'STUDENT') => {
    const roleEmailMap: Record<string, string> = {
      SUPER_ADMIN: 'admin@pragati.ac.in',
      FACULTY_COORDINATOR: 'faculty.ece@pragati.ac.in',
      CLUB_ADMIN: 'president.cse@pragati.ac.in',
      CLUB_MEMBER: 'student.cse@pragati.ac.in',
      STUDENT: 'student.ece@pragati.ac.in',
    };

    const targetEmail = roleEmailMap[role];
    if (targetEmail) {
      await login(targetEmail, 'Password123!');
    }
  };

  const hasRole = (roles: RoleName[]): boolean => {
    if (!user) return false;
    if (user.roles.includes('SUPER_ADMIN')) return true;
    return user.roles.some((r) => roles.includes(r));
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
        firebaseUser,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        error,
        sessionExpiry,
        login,
        register,
        loginWithGoogle,
        signInWithGoogle,
        logout,
        refreshUser,
        switchRoleUser,
        hasRole,
        hasPermission,
        clearError,
        getToken,
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
