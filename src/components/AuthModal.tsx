import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  CreditCard,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  KeyRound,
  LogOut,
  ArrowRight,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Gender } from '../types';
import { fetchStudentByPhone, signInWithGoogle, getSupabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentStudent,
    logoutStudent,
    registerOrUpdateStudent,
    loginAdmin,
    isAdminLoggedIn,
    adminUser,
    logoutAdmin,
    registeredStudents,
  } = useLibrary();

  // Mode: standard clean single-page login or admin manual login
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Form Fields
  const [phone, setPhone] = useState(currentStudent?.phone || '');
  const [name, setName] = useState(currentStudent?.name || '');
  const [studentId, setStudentId] = useState(currentStudent?.studentId || '');
  const [gender, setGender] = useState<Gender>(currentStudent?.gender || 'male');
  const [targetExam, setTargetExam] = useState(
    currentStudent?.targetExam || 'General Study / BCS'
  );

  // Status indicators
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [phoneFound, setPhoneFound] = useState<boolean | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);

  // Admin credentials
  const [adminEmail, setAdminEmail] = useState('admin@studycenter.com');
  const [adminPass, setAdminPass] = useState('admin123');
  const [adminError, setAdminError] = useState<string | null>(null);

  // Sync state when currentStudent changes or modal opens
  useEffect(() => {
    if (currentStudent) {
      setPhone(currentStudent.phone);
      setName(currentStudent.name);
      setStudentId(currentStudent.studentId || '');
      setGender(currentStudent.gender || 'male');
      setTargetExam(currentStudent.targetExam || 'General Study / BCS');
    }
  }, [currentStudent, isOpen]);

  if (!isOpen) return null;

  const cleanPhone = phone.replace(/\D/g, '');
  const isSuperAdminPhone = cleanPhone === '01581624202';

  // Auto search phone when user types number
  const handlePhoneChange = async (newPhone: string) => {
    setPhone(newPhone);
    const cleaned = newPhone.trim().replace(/\D/g, '');

    // Check local registered students first for fast responsiveness
    const localMatch = registeredStudents.find(
      (s) => s.phone.replace(/\D/g, '') === cleaned
    );

    if (localMatch) {
      setPhoneFound(true);
      setName(localMatch.name);
      if (localMatch.studentId) setStudentId(localMatch.studentId);
      if (localMatch.gender) setGender(localMatch.gender as Gender);
      if (localMatch.targetExam) setTargetExam(localMatch.targetExam);
      return;
    }

    // Check cloud database if 10+ digits
    if (cleaned.length >= 10) {
      setIsSearchingPhone(true);
      const existing = await fetchStudentByPhone(cleaned);
      setIsSearchingPhone(false);

      if (existing) {
        setPhoneFound(true);
        setName(existing.name || name);
        if (existing.studentId) setStudentId(existing.studentId);
        if (existing.gender) setGender(existing.gender as Gender);
        if (existing.targetExam) setTargetExam(existing.targetExam);
      } else {
        setPhoneFound(false);
      }
    } else {
      setPhoneFound(null);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    registerOrUpdateStudent({
      name: name.trim(),
      phone: phone.trim(),
      email: `${phone.trim()}@studycenter.com`,
      studentId: studentId.trim() || `ID-${phone.trim().slice(-4)}`,
      gender,
      targetExam: targetExam.trim() || 'General Study',
    });

    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      onClose();
    }, 400);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setGoogleError(
          error.message?.includes('provider is not enabled') || error.message?.includes('Unsupported provider')
            ? 'Supabase-এ Google Provider এখনও চালু করা হয়নি। নিচের গাইড দেখে অন করুন।'
            : error.message || 'গুগল সাইন-ইন করতে সমস্যা হয়েছে।'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGoogleError(msg || 'গুগল লগইন ব্যর্থ হয়েছে।');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    const success = loginAdmin(adminEmail, adminPass);
    if (success) {
      onClose();
    } else {
      setAdminError('ভুল ইমেইল বা পাসওয়ার্ড (অ্যাডমিন: admin@studycenter.com / admin123)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              isSuperAdminPhone || isAdminMode
                ? 'bg-rose-50 border border-rose-200 text-rose-600'
                : 'bg-blue-50 border border-blue-200 text-blue-600'
            }`}>
              {isSuperAdminPhone || isAdminMode ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {isAdminMode ? 'এডমিন পোর্টাল লগইন' : 'লগইন ও প্রোফাইল'}
                </h3>
                {isSuperAdminPhone && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    Super Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {isAdminMode
                  ? 'লাইব্রেরি ম্যানেজমেন্ট সিস্টেম'
                  : 'নাম, মোবাইল নাম্বার ও আইডি দিয়ে সহজে এক পেজে লগইন'}
              </p>
            </div>
          </div>

          <button
            id="close-auth-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Logged In Profile Banner if already active */}
        {!isAdminMode && currentStudent && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                {currentStudent.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{currentStudent.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">{currentStudent.phone}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                logoutStudent();
                setName('');
                setPhone('');
                setStudentId('');
                setPhoneFound(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-[11px] transition-colors"
            >
              লগ আউট
            </button>
          </div>
        )}

        {/* Super Admin Notice if 01581624202 entered */}
        {!isAdminMode && isSuperAdminPhone && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>সুপার এডমিন নাম্বার সনাক্ত:</strong> এই নাম্বার দিয়ে লগইন করলে এডমিন প্যানেল এবং সব কন্ট্রোল চালু হবে।
            </span>
          </div>
        )}

        {/* MAIN SINGLE-PAGE FORM */}
        <div className="overflow-y-auto p-4 flex-1 space-y-4">
          {!isAdminMode ? (
            <div className="space-y-4">
              {/* GOOGLE SIGN IN DIV */}
              <div id="google-login-section" className="space-y-2.5">
                <button
                  type="button"
                  id="google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold text-xs shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-60"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : (
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
                  )}
                  <span>
                    {isGoogleLoading ? 'গুগল সংযোগ করা হচ্ছে...' : 'Google দিয়ে সরাসরি সাইন-ইন করুন'}
                  </span>
                </button>

                {/* Google Error Message if Provider is not yet turned on in Supabase */}
                {googleError && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>গুগল অথেন্টিকেশন নোটিশ:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{googleError}</p>
                  </div>
                )}

                {/* How to enable Google OAuth Toggle / Guide */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden text-[11px]">
                  <button
                    type="button"
                    onClick={() => setShowGoogleGuide(!showGoogleGuide)}
                    className="w-full p-2.5 text-left flex items-center justify-between text-slate-700 hover:text-blue-700 font-medium transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 font-semibold">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                      <span>গুগল লগইন কিভাবে অন/কনফিগার করবেন?</span>
                    </span>
                    {showGoogleGuide ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {showGoogleGuide && (
                    <div className="p-3 pt-0 border-t border-slate-200/60 text-slate-600 space-y-2 leading-relaxed">
                      <p className="font-semibold text-slate-800">
                        গুগল লগইন অন করার ৩টি সহজ ধাপ:
                      </p>
                      <ol className="list-decimal list-inside space-y-1.5 pl-0.5 text-[11px]">
                        <li>
                          <strong>Google Cloud Console</strong> (<a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">console.cloud.google.com</a>)-এ যান এবং একটি <strong>OAuth 2.0 Client ID</strong> (Web Application) তৈরি করুন।
                        </li>
                        <li>
                          সেখানে <em>Authorized redirect URIs</em>-এ আপনার Supabase URL দিন:
                          <div className="mt-1 p-1.5 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded select-all break-all">
                            https://mqrpjhyxfngngegetflb.supabase.co/auth/v1/callback
                          </div>
                        </li>
                        <li>
                          <strong>Supabase Dashboard</strong> &gt; <strong>Authentication</strong> &gt; <strong>Providers</strong> &gt; <strong>Google</strong>-এ গিয়ে Client ID ও Secret পেস্ট করে <strong>Enable</strong> করুন।
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              {/* DIVIDER */}
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400">
                  অথবা মোবাইল নম্বর দিয়ে লগইন
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Student Phone Form */}
              <form onSubmit={handleStudentSubmit} className="space-y-3.5 text-xs">
                {/* Phone Number Field with Auto-Lookup */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>মোবাইল নম্বর *</span>
                  </label>

                  {isSearchingPhone && (
                    <span className="flex items-center gap-1 text-[11px] text-blue-600">
                      <Loader2 className="w-3 h-3 animate-spin" /> প্রোফাইল খোঁজা হচ্ছে...
                    </span>
                  )}
                  {phoneFound === true && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> আগের তথ্য লোড হয়েছে!
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="01581624202 বা 017xxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-50/70 hover:bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-mono text-sm tracking-wide"
                  />
                  {phoneFound && (
                    <Zap className="w-4 h-4 text-amber-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 পরবর্তীতে শুধু নাম্বার টাইপ করলেই অটোমেটিক নাম ও আইডি কার্ড নাম্বার পূরণ হয়ে যাবে।
                </p>
              </div>

              {/* Student Full Name */}
              <div>
                <label className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>শিক্ষার্থীর নাম *</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: একরাম ভুঁইয়া"
                  className="w-full px-3 py-2 bg-slate-50/70 hover:bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-xs"
                />
              </div>

              {/* Student ID / Roll & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    <span>আইডি কার্ড নাম্বার / রোল</span>
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="যেমন: ID-2026 / DU-890"
                    className="w-full px-3 py-2 bg-slate-50/70 hover:bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    লিঙ্গ (Gender) *
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
                        gender === 'male'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ছাত্র (Male)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
                        gender === 'female'
                          ? 'bg-white text-pink-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ছাত্রী (Female)
                    </button>
                  </div>
                </div>
              </div>

              {/* Target / Prep */}
              <div>
                <label className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Target className="w-3.5 h-3.5 text-slate-500" />
                  <span>টার্গেট / পড়াশোনার লক্ষ্য</span>
                </label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="যেমন: বিসিএস / ব্যাংক / বিশ্ববিদ্যালয় ভর্তি / মেডিকেল"
                  className="w-full px-3 py-2 bg-slate-50/70 hover:bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-xs"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="submit-student-login-btn"
                  className={`w-full py-2.5 px-4 rounded-xl text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                    isSuperAdminPhone
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <span>
                    {submitSuccess
                      ? 'সংরক্ষিত হচ্ছে...'
                      : isSuperAdminPhone
                      ? 'এডমিন হিসেবে প্রবেশ করুন'
                      : 'লগইন ও প্রোফাইল সংরক্ষণ'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ADMIN PORTAL FORM */
            <div className="space-y-3.5 text-xs">
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
                    className="mt-2 px-4 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors shadow-xs"
                  >
                    এডমিন লগআউট
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAdminSubmit} className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-slate-900">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span>এডমিন এক্সেস:</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-mono">
                      অথবা সরাসরি <strong className="text-rose-600">01581624202</strong> নাম্বার দিয়ে স্টুডেন্ট লগইনেই প্রবেশ করুন।
                    </p>
                  </div>

                  {adminError && (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{adminError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
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

        {/* Footer switch for admin vs student */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <button
            type="button"
            onClick={() => setIsAdminMode(!isAdminMode)}
            className="text-slate-600 hover:text-blue-600 font-medium flex items-center gap-1.5 transition-colors"
          >
            {isAdminMode ? (
              <>
                <User className="w-3.5 h-3.5" />
                <span>← স্টুডেন্ট লগইনে ফিরে যান</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>বিকল্প এডমিন লগইন</span>
              </>
            )}
          </button>

          <span className="text-[11px] text-slate-400 font-mono">
            {phone ? `01...${phone.slice(-4)}` : 'Cloud Sync Ready'}
          </span>
        </div>

      </div>
    </div>
  );
};
