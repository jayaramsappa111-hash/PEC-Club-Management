import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User, Hash, School, AlertCircle, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('B.Tech Computer Science & Engineering');
  const [departmentId, setDepartmentId] = useState('dept-cse');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!identifier.trim() || !password) {
          throw new Error('Please enter your Institutional Email or Roll Number and Password.');
        }
        await login(identifier.trim(), password);
      } else {
        if (!name.trim() || !email.trim() || !password || !studentId.trim()) {
          throw new Error('All required fields (Name, Roll Number, Email, Password) must be filled.');
        }
        await register({
          email: email.trim(),
          password,
          name: name.trim(),
          student_id: studentId.trim(),
          course,
          department_id: departmentId,
          phone: phone.trim() || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 relative text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Institutional Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-navy-50 border border-navy-200 text-navy-900 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <School className="w-6 h-6" />
          </div>
          <div className="text-[11px] font-bold text-navy-900 uppercase tracking-wider mb-0.5 font-display">
            Pragati University
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 font-display">
            {mode === 'login' ? 'Institutional Portal Sign In' : 'Student Identity Registration'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Enter your institutional email or student roll number and password'
              : 'Register your official roll number to enroll in clubs, submit projects, and access certificates'}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-5 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'login'
                ? 'bg-white text-navy-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Portal Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'register'
                ? 'bg-white text-navy-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Student Registration
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 mb-4 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 disabled:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-2.5 shadow-xs hover:border-slate-400 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google Account</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white px-2.5 text-slate-400 font-semibold">
                or use institutional email / roll no
              </span>
            </div>
          </div>
        </div>

        {/* Strict Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (as per University ID) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. K. Sai Varun"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Roll Number *
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                      placeholder="e.g. 23A31A0501"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900 uppercase font-record-code font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department / Branch *
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                  >
                    <option value="dept-cse">Computer Science &amp; Engg (CSE)</option>
                    <option value="dept-cseds">AI &amp; Data Science / CSE (Data Science)</option>
                    <option value="dept-cseaiml">AI &amp; Machine Learning / CSE (AI &amp; ML)</option>
                    <option value="dept-csecs">CSE (Cyber Security)</option>
                    <option value="dept-ece">Electronics &amp; Comm. (ECE)</option>
                    <option value="dept-eee">Electrical &amp; Electronics (EEE)</option>
                    <option value="dept-it">Information Tech (IT)</option>
                    <option value="dept-me">Mechanical Engg (MECH)</option>
                    <option value="dept-ce">Civil Engg (CIVIL)</option>
                    <option value="dept-bsh">Basic Sciences &amp; Humanities (BSH)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional / Student Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student.name@pragati.ac.in"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong account password"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email or Student Roll No. / Staff ID *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. student@pragati.ac.in or 23A31A0501"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Account Password *
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your portal password"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Authenticate & Sign In' : 'Complete Registration'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Stakeholder Quick-Selector panel inside Auth Modal */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5 text-center">
            Institutional Demo Role Quick-Switchers
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {[
              { label: 'Student', email: 'student.ece@pragati.ac.in' },
              { label: 'Club Member', email: 'student.cse@pragati.ac.in' },
              { label: 'Club Admin', email: 'president.cse@pragati.ac.in' },
              { label: 'Faculty Coord', email: 'faculty.ece@pragati.ac.in' },
              { label: 'HOD Admin', email: 'deptadmin.cse@pragati.ac.in' },
              { label: 'Super Admin', email: 'admin@pragati.ac.in' },
            ].map((role) => (
              <button
                key={role.email}
                type="button"
                onClick={async () => {
                  setError(null);
                  setLoading(true);
                  try {
                    await login(role.email, 'Password123!');
                    onClose();
                  } catch (err: any) {
                    setError(err.message || 'Simulation sign-in failed.');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-2 py-1.5 bg-slate-50 hover:bg-navy-50 hover:text-navy-900 border border-slate-200 hover:border-navy-200 rounded-lg text-[10px] font-bold text-slate-700 text-center transition cursor-pointer"
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
