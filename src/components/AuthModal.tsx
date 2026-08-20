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
  ExternalLink,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { DEMO_STUDENTS } from '../data/initialData';
import { Gender } from '../types';
import { SUPABASE_PROJECT_URL, isSupabaseConfigured } from '../lib/supabase';

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
    signInWithGoogleAuth,
    loginAdmin,
    isAdminLoggedIn,
    adminUser,
    logoutAdmin,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'google' | 'student' | 'demo' | 'admin'>('google');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Student Form State
  const [studentName, setStudentName] = useState(currentStudent?.name || '');
  const [studentPhone, setStudentPhone] = useState(currentStudent?.phone || '');
  const [studentEmail, setStudentEmail] = useState(currentStudent?.email || '');
  const [studentId, setStudentId] = useState(currentStudent?.studentId || '');
  const [studentGender, setStudentGender] = useState<Gender>(currentStudent?.gender || 'male');
  const [studentTarget, setStudentTarget] = useState(currentStudent?.targetExam || 'BCS & Competitive Exams');

  // Supabase Manual Key Setup Modal/Input (for instant testing if env isn't loaded yet)
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [tempAnonKey, setTempAnonKey] = useState(
    () => localStorage.getItem('supabase_anon_key') || ''
  );
  const [keySaved, setKeySaved] = useState(false);

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('admin@studycenter.com');
  const [adminPass, setAdminPass] = useState('admin123');
  const [adminError, setAdminError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setGoogleError(null);

    const configured = isSupabaseConfigured();
    if (!configured) {
      setGoogleError(
        'Supabase Anon Key দেওয়া হয়নি। নিচে "Supabase Key কনফিগার" অপশনে গিয়ে Anon Key পেস্ট করুন অথবা .env এ যোগ করুন।'
      );
      setShowKeySetup(true);
      setGoogleLoading(false);
      return;
    }

    try {
      const res = await signInWithGoogleAuth();
      if (res.error) {
        setGoogleError(res.error.message);
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setGoogleError(error.message || 'গুগল লগইনে সমস্যা হয়েছে');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSaveAnonKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempAnonKey.trim()) {
      localStorage.setItem('supabase_anon_key', tempAnonKey.trim());
      setKeySaved(true);
      setTimeout(() => {
        setKeySaved(false);
        setShowKeySetup(false);
      }, 1000);
    }
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentPhone.trim()) return;

    registerOrUpdateStudent({
      name: studentName.trim(),
      phone: studentPhone.trim(),
      email: studentEmail.trim() || `${studentName.toLowerCase().replace(/\s+/g, '')}@student.du.ac.bd`,
      studentId: studentId.trim() || `DU-${Math.floor(1000 + Math.random() * 9000)}`,
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
      setAdminError('ভুল ইমেইল বা পাসওয়ার্ড (অ্যাডমিন ক্রেডেনশিয়াল: admin@studycenter.com / admin123)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-['Hind_Siliguri',_'Poppins',_sans-serif]">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">ইউজার অথেনটিকেশন</h3>
              <p className="text-xs text-slate-500">গুগল লগইন, স্টুডেন্ট প্রোফাইল ও অ্যাডমিন</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('google')}
            className={`flex-1 py-1.5 font-semibold rounded-lg transition-all text-center ${
              activeTab === 'google'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            গুগল লগইন
          </button>

          <button
            onClick={() => setActiveTab('student')}
            className={`flex-1 py-1.5 font-semibold rounded-lg transition-all text-center ${
              activeTab === 'student'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ম্যানুয়াল সাইন-ইন
          </button>

          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-1.5 font-semibold rounded-lg transition-all text-center ${
              activeTab === 'demo'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ডেমো ইউজার
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-1.5 font-semibold rounded-lg transition-all text-center ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            এডমিন
          </button>
        </div>

        {/* Tab 1: Google OAuth with Supabase */}
        {activeTab === 'google' && (
          <div className="p-5 space-y-4">
            {currentStudent ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2.5">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                  {currentStudent.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{currentStudent.name}</h4>
                  <p className="text-xs text-slate-500">{currentStudent.email || currentStudent.phone}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  সফলভাবে লগইন করা আছে
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      logoutStudent();
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-all"
                  >
                    লগ আউট করুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="text-center space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">সুপাবেজ গুগল অথেনটিকেশন</h4>
                  <p className="text-xs text-slate-500">
                    আপনার গুগল অ্যাকাউন্ট দিয়ে এক ক্লিকে সাইন-ইন করুন
                  </p>
                </div>

                {googleError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <p className="font-medium">{googleError}</p>
                    </div>
                  </div>
                )}

                {/* Google Sign In Button */}
                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={handleGoogleLogin}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{googleLoading ? 'গুগলে কানেক্ট হচ্ছে...' : 'Continue with Google'}</span>
                </button>

                {/* Supabase Status Pill */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSupabaseConfigured() ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span>
                      Supabase:{' '}
                      <span className="font-mono text-slate-700">
                        {SUPABASE_PROJECT_URL.replace('https://', '').replace('.supabase.co', '')}
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowKeySetup(!showKeySetup)}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-[11px]"
                  >
                    <Settings className="w-3 h-3" />
                    <span>API কি সেটআপ</span>
                  </button>
                </div>

                {/* Supabase Key Quick Input */}
                {showKeySetup && (
                  <form
                    onSubmit={handleSaveAnonKey}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-700">
                        Supabase Anon Key (Project Settings &gt; API Keys):
                      </label>
                    </div>
                    <input
                      type="text"
                      value={tempAnonKey}
                      onChange={(e) => setTempAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500">
                        সুপাবেজ ড্যাশবোর্ড থেকে কপি করে এখানে সেভ করুন
                      </span>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                      >
                        {keySaved ? '✓ সেভ হয়েছে' : 'সেভ করুন'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Custom Student Sign in */}
        {activeTab === 'student' && (
          <form onSubmit={handleStudentSubmit} className="p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                শিক্ষার্থীর পুরো নাম *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="যেমন: মো: একরাম ভুঁইয়া"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  মোবাইল নম্বর *
                </label>
                <input
                  type="tel"
                  required
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  স্টুডেন্ট আইডি / রোল
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="DU-4819"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                লিঙ্গ (Gender) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStudentGender('male')}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-colors ${
                    studentGender === 'male'
                      ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ছাত্র (Male)
                </button>
                <button
                  type="button"
                  onClick={() => setStudentGender('female')}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-colors ${
                    studentGender === 'female'
                      ? 'bg-purple-50 border-purple-300 text-purple-800 font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ছাত্রী (Female)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                টার্গেট বা লক্ষ্য
              </label>
              <input
                type="text"
                value={studentTarget}
                onChange={(e) => setStudentTarget(e.target.value)}
                placeholder="যেমন: ৪৭তম বিসিএস / ব্যাংক জব / গবেষণা"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
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
                  className="px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                >
                  লগ আউট
                </button>
              )}

              <button
                type="submit"
                className="ml-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                সংরক্ষণ ও প্রবেশ করুন
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Demo Profiles */}
        {activeTab === 'demo' && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-500">
              দ্রুত টেস্ট করার জন্য যেকোনো একটি ডেমো স্টুডেন্ট প্রোফাইল বেছে নিন:
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
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                      isCurrent
                        ? 'bg-blue-50/80 border-blue-300 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                          demo.gender === 'female' ? 'bg-purple-600' : 'bg-blue-600'
                        }`}
                      >
                        {demo.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{demo.name}</span>
                          {demo.gender === 'female' && (
                            <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded font-medium">
                              Female
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {demo.targetExam}
                        </div>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] bg-blue-100 text-blue-700 font-bold">
                        সক্রিয়
                      </span>
                    ) : (
                      <span className="text-xs text-blue-600 font-medium hover:underline">
                        নির্বাচন করুন
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Admin Login */}
        {activeTab === 'admin' && (
          <div className="p-4 space-y-3.5">
            {isAdminLoggedIn && adminUser ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-900 text-sm">{adminUser.name}</div>
                <div className="text-xs text-emerald-700">লাইব্রেরি সুপার এডমিন হিসেবে লগইন আছেন</div>

                <button
                  onClick={() => {
                    logoutAdmin();
                    onClose();
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors shadow-xs"
                >
                  এডমিন লগআউট
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdminSubmit} className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-slate-900">
                    <KeyRound className="w-4 h-4 text-slate-500" />
                    <span>এডমিন লগইন তথ্য:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono">
                    Email: admin@studycenter.com • Pass: admin123
                  </p>
                </div>

                {adminError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    এডমিন ইমেইল
                  </label>
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    পাসওয়ার্ড
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>এডমিন প্যানেলে প্রবেশ করুন</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
