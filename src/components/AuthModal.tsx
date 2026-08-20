import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Phone,
  Hash,
  Sparkles,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  KeyRound,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { DEMO_STUDENTS } from '../data/initialData';
import { Gender } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentStudent,
    loginStudent,
    logoutStudent,
    demoLogin,
    registerOrUpdateStudent,
    loginAdmin,
    isAdminLoggedIn,
    adminUser,
    logoutAdmin,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'student' | 'demo' | 'admin'>('demo');

  // Student Form State
  const [studentName, setStudentName] = useState(currentStudent?.name || '');
  const [studentPhone, setStudentPhone] = useState(currentStudent?.phone || '');
  const [studentEmail, setStudentEmail] = useState(currentStudent?.email || '');
  const [studentId, setStudentId] = useState(currentStudent?.studentId || '');
  const [studentGender, setStudentGender] = useState<Gender>(currentStudent?.gender || 'male');
  const [studentTarget, setStudentTarget] = useState(currentStudent?.targetExam || 'Competitive Exam Prep');

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('admin@studycenter.com');
  const [adminPass, setAdminPass] = useState('admin123');
  const [adminError, setAdminError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentPhone.trim()) return;

    registerOrUpdateStudent({
      name: studentName.trim(),
      phone: studentPhone.trim(),
      email: studentEmail.trim() || `${studentName.toLowerCase().replace(/\s+/g, '')}@student.edu`,
      studentId: studentId.trim() || `ID-${Math.floor(1000 + Math.random() * 9000)}`,
      gender: studentGender,
      targetExam: studentTarget,
    });
    onClose();
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    const success = loginAdmin(adminEmail, adminPass);
    if (success) {
      onClose();
    } else {
      setAdminError('Invalid email or password (Credentials: admin@studycenter.com / admin123)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">User Authentication</h3>
              <p className="text-xs text-slate-500">Student Profile & Admin Access</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center ${
              activeTab === 'demo'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Demo Profiles
          </button>

          <button
            onClick={() => setActiveTab('student')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center ${
              activeTab === 'student'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Student Sign In
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Admin Login
          </button>
        </div>

        {/* Tab 1: Demo Accounts */}
        {activeTab === 'demo' && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-500">
              Select a quick demo profile to simulate student actions:
            </p>

            <div className="space-y-2">
              {DEMO_STUDENTS.map((demo) => {
                const isCurrent = currentStudent?.id === demo.id;

                return (
                  <button
                    key={demo.id}
                    onClick={() => {
                      demoLogin(demo.id);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      isCurrent
                        ? 'bg-sky-50/70 border-sky-300 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                          demo.gender === 'female' ? 'bg-pink-500' : 'bg-sky-600'
                        }`}
                      >
                        {demo.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{demo.name}</span>
                          {demo.gender === 'female' && (
                            <span className="text-[10px] text-pink-700 bg-pink-50 border border-pink-200 px-1.5 py-0.2 rounded font-medium">
                              Female
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {demo.targetExam}
                        </div>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-sky-100 text-sky-700 font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="text-xs text-sky-600 font-medium hover:underline">
                        Select
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Student Sign in */}
        {activeTab === 'student' && (
          <form onSubmit={handleStudentSubmit} className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Tanvir Ahmed"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student ID / Roll
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="STU-1049"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Gender *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStudentGender('male')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                    studentGender === 'male'
                      ? 'bg-sky-50 border-sky-300 text-sky-800 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setStudentGender('female')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                    studentGender === 'female'
                      ? 'bg-pink-50 border-pink-300 text-pink-800 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Exam / Study Goal
              </label>
              <input
                type="text"
                value={studentTarget}
                onChange={(e) => setStudentTarget(e.target.value)}
                placeholder="e.g. Competitive Exam / Higher Studies"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {currentStudent && (
                <button
                  type="button"
                  onClick={() => {
                    logoutStudent();
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 font-medium transition-colors"
                >
                  Log Out
                </button>
              )}

              <button
                type="submit"
                className="ml-auto px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs"
              >
                Save & Sign In
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Admin Secret Login */}
        {activeTab === 'admin' && (
          <div className="p-4 space-y-3.5">
            {isAdminLoggedIn && adminUser ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-9 h-9 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="font-semibold text-slate-900 text-sm">{adminUser.name}</div>
                <div className="text-xs text-emerald-700">Logged in as Administrator</div>

                <button
                  onClick={() => {
                    logoutAdmin();
                    onClose();
                  }}
                  className="mt-2 px-3.5 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50 transition-colors shadow-xs"
                >
                  Admin Logout
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdminSubmit} className="space-y-3">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-0.5">
                  <div className="font-semibold flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                    <span>Demo Credentials:</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Email: admin@studycenter.com | Pass: admin123
                  </p>
                </div>

                {adminError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Admin Dashboard</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

