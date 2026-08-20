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
  const [studentTarget, setStudentTarget] = useState(currentStudent?.targetExam || '47th BCS Preliminary');

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
      email: studentEmail.trim() || `${studentName.toLowerCase().replace(/\s+/g, '')}@student.bd`,
      studentId: studentId.trim() || `BCS-47-${Math.floor(1000 + Math.random() * 9000)}`,
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
      setAdminError('অ্যাডমিন ইমেইল বা পাসওয়ার্ড সঠিক নয় (ভ্যালিড: admin@studycenter.com / admin123)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ব্যবহারকারী একাউন্ট ও অথেনটিকেশন</h3>
              <p className="text-xs text-slate-400">Student Profile & Admin Access</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
              activeTab === 'demo'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🚀 ডেমো প্রোফাইল
          </button>

          <button
            onClick={() => setActiveTab('student')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
              activeTab === 'student'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👤 শিক্ষার্থী প্রোফাইল
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
              activeTab === 'admin'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔐 অ্যাডমিন লগইন
          </button>
        </div>

        {/* Tab 1: Demo Accounts */}
        {activeTab === 'demo' && (
          <div className="p-5 space-y-3">
            <p className="text-xs text-slate-400">
              দ্রুত অ্যাপ টেস্টের জন্য যেকোনো একটি ডেমো স্টুডেন্ট প্রোফাইল সিলেক্ট করুন:
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
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isCurrent
                        ? 'bg-sky-950/50 border-sky-500 text-white'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                          demo.gender === 'female' ? 'bg-pink-600' : 'bg-sky-600'
                        }`}
                      >
                        {demo.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                          <span>{demo.name}</span>
                          {demo.gender === 'female' && (
                            <span className="text-[10px] text-pink-300 bg-pink-500/20 px-1.5 rounded">
                              নারী
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {demo.targetExam}
                        </div>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500 text-white font-bold">
                        সক্রিয়
                      </span>
                    ) : (
                      <span className="text-xs text-sky-400 font-medium hover:underline">
                        সিলেক্ট করুন
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
          <form onSubmit={handleStudentSubmit} className="p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                আপনার নাম (Full Name)*
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="যেমন: তানভীর আহমেদ"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  মোবাইল নম্বর*
                </label>
                <input
                  type="tel"
                  required
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  স্টুডেন্ট আইডি / রোল
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="BCS-47-XXXX"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                জেন্ডার (Gender)*
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStudentGender('male')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    studentGender === 'male'
                      ? 'bg-sky-600 border-sky-400 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  👨 পুরুষ (Male)
                </button>
                <button
                  type="button"
                  onClick={() => setStudentGender('female')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    studentGender === 'female'
                      ? 'bg-pink-600 border-pink-400 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  👩 মহিলা (Female)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                টার্গেট পরীক্ষা / স্টাডি গোল
              </label>
              <input
                type="text"
                value={studentTarget}
                onChange={(e) => setStudentTarget(e.target.value)}
                placeholder="যেমন: ৪৭তম বিসিএস ক্যাডার / ব্যাংক অফিসার"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500"
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
                  className="px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 font-semibold"
                >
                  লগআউট করুন
                </button>
              )}

              <button
                type="submit"
                className="ml-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/30"
              >
                সংরক্ষণ ও লগইন
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Admin Secret Login */}
        {activeTab === 'admin' && (
          <div className="p-5 space-y-4">
            {isAdminLoggedIn && adminUser ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-100 text-sm">{adminUser.name}</div>
                <div className="text-xs text-emerald-300">অ্যাডমিন হিসেবে লগইন আছেন</div>

                <button
                  onClick={() => {
                    logoutAdmin();
                    onClose();
                  }}
                  className="mt-2 px-4 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-600/30 transition-all"
                >
                  অ্যাডমিন লগআউট করুন
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdminSubmit} className="space-y-3">
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>অ্যাডমিন ডেমো এক্সেস:</span>
                  </div>
                  <p className="text-[11px] opacity-90 font-mono">
                    Email: admin@studycenter.com | Pass: admin123
                  </p>
                </div>

                {adminError && (
                  <div className="p-2.5 rounded-lg bg-rose-900/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    অ্যাডমিন ইমেইল (Admin Email)
                  </label>
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    পাসওয়ার্ড (Password)
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-rose-600/30 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করুন</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
