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
  const { login, register } = useAuth();
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

  const fillTestCredentials = (testId: string, testPass: string) => {
    setIdentifier(testId);
    setPassword(testPass);
    setError(null);
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
                    <option value="dept-aids">AI &amp; Data Science (AI&amp;DS)</option>
                    <option value="dept-aiml">AI &amp; Machine Learning (AI&amp;ML)</option>
                    <option value="dept-ece">Electronics &amp; Comm. (ECE)</option>
                    <option value="dept-eee">Electrical &amp; Electronics (EEE)</option>
                    <option value="dept-it">Information Tech (IT)</option>
                    <option value="dept-mech">Mechanical Engg (MECH)</option>
                    <option value="dept-civil">Civil Engg (CIVIL)</option>
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
                    placeholder="e.g. admin@pragati.ac.in or 23A31A0501"
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
            className="w-full py-2.5 mt-2 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
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

        {/* Institutional Test Account Reference */}
        {mode === 'login' && (
          <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-navy-900 font-display">
                <ShieldCheck className="w-3.5 h-3.5 text-navy-900" />
                Institutional Testing Credentials (Real SQLite Database)
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800">Super Admin / Principal:</span>{' '}
                  <span className="font-record-code text-slate-600">admin@pragati.ac.in</span>
                </div>
                <button
                  type="button"
                  onClick={() => fillTestCredentials('admin@pragati.ac.in', 'Password123!')}
                  className="px-2 py-0.5 rounded bg-slate-100 text-navy-900 hover:bg-slate-200 font-semibold border border-slate-300 text-[10px]"
                >
                  Use Fill
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800">Faculty Coordinator:</span>{' '}
                  <span className="font-record-code text-slate-600">faculty.ece@pragati.ac.in</span>
                </div>
                <button
                  type="button"
                  onClick={() => fillTestCredentials('faculty.ece@pragati.ac.in', 'Password123!')}
                  className="px-2 py-0.5 rounded bg-slate-100 text-navy-900 hover:bg-slate-200 font-semibold border border-slate-300 text-[10px]"
                >
                  Use Fill
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800">Student (Roll No: 23A31A0501):</span>{' '}
                  <span className="font-record-code text-slate-600">23A31A0501</span>
                </div>
                <button
                  type="button"
                  onClick={() => fillTestCredentials('23A31A0501', 'Password123!')}
                  className="px-2 py-0.5 rounded bg-slate-100 text-navy-900 hover:bg-slate-200 font-semibold border border-slate-300 text-[10px]"
                >
                  Use Fill
                </button>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 italic text-center">
              All accounts authenticate with hashed passwords via SQLite backend (`/api/v1/auth/login`).
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
