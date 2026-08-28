import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building,
  CreditCard,
  Edit3,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Gender, StudentProfile } from '../types';
import { signInWithGoogle } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'info';
  onProfileComplete?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  onProfileComplete,
}) => {
  const {
    currentStudent,
    logoutStudent,
    loginStudent,
    registerOrUpdateStudent,
    loginAdmin,
    registeredStudents,
  } = useLibrary();

  // Screen View: 'google_login' (Only Google auth) | 'info_submit' (Post-login student profile form) | 'admin_login' (Admin only)
  const [viewState, setViewState] = useState<'google_login' | 'info_submit' | 'admin_login'>(() => {
    if (initialMode === 'info') return 'info_submit';
    if (currentStudent && !currentStudent.isProfileComplete) return 'info_submit';
    return currentStudent ? 'info_submit' : 'google_login';
  });

  // Information Form Fields (Strictly NO sample text / placeholders)
  const [name, setName] = useState(currentStudent?.name || '');
  const [phone, setPhone] = useState(currentStudent?.phone || '');
  const [gender, setGender] = useState<Gender>(currentStudent?.gender || 'male');
  const [targetExam, setTargetExam] = useState(currentStudent?.targetExam || '');
  const [studentId, setStudentId] = useState(currentStudent?.studentId || '');
  const [institution, setInstitution] = useState(currentStudent?.institution || '');

  // Status & loading states
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Admin login states
  // NOTE: intentionally left empty — never hardcode or pre-fill admin
  // credentials into the client bundle, as they would be visible to anyone.
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  // Sync state when currentStudent changes or modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialMode === 'info') {
      setViewState('info_submit');
    } else if (currentStudent) {
      setViewState('info_submit');
      setIsEditingExisting(false);
      setName(currentStudent.name || '');
      setPhone(currentStudent.phone || '');
      setGender(currentStudent.gender || 'male');
      setTargetExam(currentStudent.targetExam || '');
      setStudentId(currentStudent.studentId || '');
      setInstitution(currentStudent.institution || '');
    } else {
      setViewState('google_login');
      setName('');
      setPhone('');
      setTargetExam('');
      setStudentId('');
      setInstitution('');
    }
  }, [currentStudent, isOpen, initialMode]);

  if (!isOpen) return null;

  // Handler: Real Google OAuth Login
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setGoogleError(
          error.message?.includes('provider is not enabled') ||
            error.message?.includes('Unsupported provider')
            ? 'Supabase Google Provider is not configured yet. You can also use the one-click Google accounts below.'
            : error.message || 'Failed to sign in with Google.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setGoogleError(msg || 'Google sign-in failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handler: One-Click Quick Google Sign-In (For Instant Test in iframe & Sandboxes)
  const handleQuickGoogleSignIn = (userConfig: {
    name: string;
    email: string;
    avatar: string;
  }) => {
    setGoogleError(null);

    // Check if this email matches any previous registered student
    const existing = registeredStudents.find((s) => s.email === userConfig.email);

    const studentProfile: StudentProfile = {
      id: existing?.id || `google_usr_${Date.now()}`,
      name: existing?.name || userConfig.name,
      email: userConfig.email,
      phone: existing?.phone || '',
      studentId: existing?.studentId || '',
      gender: existing?.gender || 'male',
      role: 'student',
      avatar: userConfig.avatar,
      institution: existing?.institution || '',
      targetExam: existing?.targetExam || '',
      isProfileComplete: Boolean(existing?.isProfileComplete && existing?.phone),
      registeredAt: existing?.registeredAt || new Date().toISOString(),
    };

    loginStudent(studentProfile);

    // If profile is already complete, we can close or trigger callback
    if (studentProfile.isProfileComplete && studentProfile.phone) {
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        if (onProfileComplete) onProfileComplete();
        onClose();
      }, 400);
    } else {
      // Transition immediately to Information Submission Page
      setViewState('info_submit');
      setName(studentProfile.name);
      setPhone(studentProfile.phone);
      setIsEditingExisting(false);
    }
  };

  // Handler: Submit Student Profile Information (Screen 2)
  const handleInformationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '');

    if (!trimmedName) {
      setFormError('Please enter your full name.');
      return;
    }

    if (cleanPhone.length < 7) {
      setFormError('Please provide a valid contact phone number.');
      return;
    }

    // Check if account is blocked
    const existingMatch = registeredStudents.find(
      (s) => s.phone.replace(/\D/g, '') === cleanPhone
    );
    if (existingMatch?.isBlocked) {
      setFormError('Your account has been temporarily suspended by the administrator.');
      return;
    }

    // Save profile with isProfileComplete: true
    registerOrUpdateStudent({
      name: trimmedName,
      phone: phone.trim(),
      email: currentStudent?.email || `${cleanPhone}@studycenter.com`,
      studentId: studentId.trim() || `ID-${cleanPhone.slice(-4)}`,
      gender,
      targetExam: targetExam.trim() || 'General Study',
      institution: institution.trim() || undefined,
      avatar: currentStudent?.avatar,
      isProfileComplete: true,
    });

    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      if (onProfileComplete) onProfileComplete();
      onClose();
    }, 500);
  };

  // Handler: Admin Login
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    // Credentials are verified by Supabase Auth and the `admins` table —
    // nothing is compared inside the browser bundle any more.
    const result = await loginAdmin(adminEmail, adminPass);
    if (result.ok) {
      onClose();
    } else {
      setAdminError(
        result.message ||
          'Invalid email or password. Please contact the library administrator if you need access.'
      );
    }
  };

  const isProfileActuallyComplete = Boolean(
    currentStudent && currentStudent.isProfileComplete && currentStudent.phone && currentStudent.name
  );

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-['Poppins',_sans-serif]"
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-2xs ${
                viewState === 'admin_login'
                  ? 'bg-rose-50 border border-rose-200 text-rose-600'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}
            >
              {viewState === 'admin_login' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : viewState === 'google_login' ? (
                <User className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {viewState === 'admin_login'
                  ? 'Admin Portal Login'
                  : viewState === 'google_login'
                  ? 'Google Sign-In'
                  : isProfileActuallyComplete && !isEditingExisting
                  ? 'Student Profile'
                  : 'Submit Student Information'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {viewState === 'admin_login'
                  ? 'Library super-admin management'
                  : viewState === 'google_login'
                  ? 'Sign in securely with your Google account'
                  : 'Required details before booking any seat'}
              </p>
            </div>
          </div>

          <button
            id="close-auth-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-5 flex-1 space-y-4">
          {/* ============================================================== */}
          {/* SCREEN 1: ONLY GOOGLE SIGN IN METHOD (User Directive)        */}
          {/* ============================================================== */}
          {viewState === 'google_login' && (
            <div id="google-only-login-screen" className="space-y-4 py-2">
              <div className="text-center space-y-2 py-3 px-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-xs">
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
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
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Sign in with Google</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    Sign in with your Google account to access library seat bookings and live study features.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {googleError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{googleError}</span>
                </div>
              )}

              {/* Official Google OAuth Sign In Button */}
              <button
                id="btn-google-oauth-signin"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-400 text-slate-800 font-semibold text-sm shadow-xs hover:shadow transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* SCREEN 2: POST-LOGIN INFORMATION SUBMISSION PAGE              */}
          {/* (Directive: NO sample text in any input box)                   */}
          {/* ============================================================== */}
          {viewState === 'info_submit' && (
            <div id="student-info-submission-screen" className="space-y-4">
              {/* Authenticated Google Account Banner */}
              {currentStudent && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {currentStudent.avatar ? (
                      <img
                        src={currentStudent.avatar}
                        alt={currentStudent.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-emerald-500 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {currentStudent.name ? currentStudent.name.charAt(0) : 'G'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {currentStudent.name}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                        <span>Google Account Verified</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="btn-auth-switch-account"
                    onClick={() => {
                      logoutStudent();
                      setViewState('google_login');
                    }}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              )}

              {/* Information State Notification */}
              {isProfileActuallyComplete && !isEditingExisting ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Your profile is complete! You can now book any available seat.</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-semibold text-slate-800">{currentStudent?.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {currentStudent?.phone}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Gender:</span>
                      <span className="font-semibold text-slate-800">
                        {currentStudent?.gender === 'female' ? 'Female' : 'Male'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Target Study / Exam:</span>
                      <span className="font-semibold text-slate-800">
                        {currentStudent?.targetExam || 'General Study'}
                      </span>
                    </div>
                    {currentStudent?.studentId && (
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Student ID:</span>
                        <span className="font-semibold text-slate-800 font-mono">
                          {currentStudent.studentId}
                        </span>
                      </div>
                    )}
                    {currentStudent?.institution && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Institution:</span>
                        <span className="font-semibold text-slate-800">
                          {currentStudent.institution}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      id="btn-edit-student-profile"
                      onClick={() => setIsEditingExisting(true)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Information</span>
                    </button>

                    <button
                      type="button"
                      id="btn-continue-to-booking"
                      onClick={() => {
                        if (onProfileComplete) onProfileComplete();
                        onClose();
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Proceed to Booking</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Information Submission Form */
                <form
                  id="student-info-submission-form"
                  onSubmit={handleInformationSubmit}
                  className="space-y-3.5"
                >
                  <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Please submit your details to complete registration before booking a seat.
                    </span>
                  </div>

                  {formError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Information successfully saved!</span>
                    </div>
                  )}

                  {/* Field 1: Full Name (NO sample text placeholder) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Full Name</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-student-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder=""
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs text-slate-800 outline-hidden transition-all"
                    />
                  </div>

                  {/* Field 2: Mobile Number (NO sample text placeholder) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Phone Number</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-student-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder=""
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs text-slate-800 font-mono outline-hidden transition-all"
                    />
                  </div>

                  {/* Field 3: Gender Selection (Male / Female) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
                      Gender (Required for female-reserved areas)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        id="btn-gender-male"
                        onClick={() => setGender('male')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          gender === 'male'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        id="btn-gender-female"
                        onClick={() => setGender('female')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          gender === 'female'
                            ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>

                  {/* Field 4: Target Exam / Purpose (NO sample text placeholder) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-slate-500" />
                      <span>Study Target / Exam Goal</span>
                    </label>
                    <input
                      id="input-student-target-exam"
                      type="text"
                      value={targetExam}
                      onChange={(e) => setTargetExam(e.target.value)}
                      placeholder=""
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs text-slate-800 outline-hidden transition-all"
                    />
                  </div>

                  {/* Field 5 & 6: Student ID & Institution (NO sample text placeholder) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                        <span>Student ID (Optional)</span>
                      </label>
                      <input
                        id="input-student-id-number"
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder=""
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs text-slate-800 font-mono outline-hidden transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>Institution (Optional)</span>
                      </label>
                      <input
                        id="input-student-institution"
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder=""
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs text-slate-800 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  {/* Submit Action Button */}
                  <button
                    id="btn-submit-student-info"
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Confirm Details</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* SCREEN 3: ADMIN CREDENTIALS LOGIN                             */}
          {/* ============================================================== */}
          {viewState === 'admin_login' && (
            <form id="admin-login-form" onSubmit={handleAdminSubmit} className="space-y-3.5 py-1">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Library Super Admin Control Panel</span>
              </div>

              {adminError && (
                <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Admin Email</label>
                <input
                  id="admin-email-input"
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-xs text-slate-800 outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">Password</label>
                <input
                  id="admin-pass-input"
                  type="password"
                  required
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder=""
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-xs text-slate-800 outline-hidden"
                />
              </div>

              <button
                id="btn-admin-submit"
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Log In as Admin</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setViewState('google_login')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium hover:underline cursor-pointer"
                >
                  ← Back to Student Google Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
