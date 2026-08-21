import React from 'react';
import {
  FlaskConical,
  BookOpen,
  ChevronRight,
  FileText,
  ShieldCheck,
  User,
  Clock,
  Calendar,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { BranchId } from '../types';

interface PortalHomeProps {
  onSelectBranch: (branchId: BranchId) => void;
  onOpenGuidelines: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenMyPass: () => void;
}

export const PortalHome: React.FC<PortalHomeProps> = ({
  onSelectBranch,
  onOpenGuidelines,
  onOpenAuth,
  onOpenAdmin,
  onOpenMyPass,
}) => {
  const {
    currentStudent,
    currentStudentSeat,
    currentTime,
    isAdminLoggedIn,
    logoutStudent,
  } = useLibrary();

  // Format 12-hour clock (HH:MM:SS AM/PM)
  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = hours.toString().padStart(2, '0');
    return { timeStr: `${hoursStr}:${minutes}:${seconds}`, ampm };
  };

  const formatDate = (date: Date) => {
    const daysEn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const monthsEn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const dayName = daysEn[date.getDay()];
    const dayNum = date.getDate();
    const month = monthsEn[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${dayNum} ${month} ${year}`;
  };

  const { timeStr, ampm } = formatTime(currentTime);
  const formattedDate = formatDate(currentTime);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Top Header Bar */}
      <div className="max-w-xl mx-auto w-full mb-6">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 mb-2">
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
            <Clock className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span className="font-bold">{timeStr}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">{ampm}</span>
          </div>
        </div>

        {/* 1. Logged In User Profile Card / Login Trigger Card */}
        {currentStudent ? (
          <div
            id="portal-user-profile-section"
            className="w-full bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-xs transition-all space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              {/* User Avatar & Info */}
              <div
                onClick={onOpenAuth}
                className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                title="প্রোফাইল দেখতে বা এডিট করতে ক্লিক করুন"
              >
                {currentStudent.avatar ? (
                  <img
                    src={currentStudent.avatar}
                    alt={currentStudent.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500 shadow-2xs group-hover:scale-105 transition-transform shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-lg flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                    {currentStudent.name ? currentStudent.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug truncate group-hover:text-emerald-800 transition-colors">
                      {currentStudent.name}
                    </h3>
                    {isAdminLoggedIn && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {currentStudent.email || currentStudent.phone || 'Google Authenticated Student'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>লগইন করা আছে</span>
              </span>
            </div>

            {/* Quick Actions for Logged-in User: Seat details + Profile Modal + Logout Button */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                {currentStudentSeat ? (
                  <button
                    type="button"
                    onClick={onOpenMyPass}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <span>ডিজিটাল পাস (সিট #{currentStudentSeat.seatNumber})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-all cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>প্রোফাইল তথ্য</span>
                  </button>
                )}
              </div>

              {/* Logout Button */}
              <button
                id="btn-portal-logout"
                type="button"
                onClick={logoutStudent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-700 text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
                title="সাইন আউট বা লগআউট করুন"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            id="portal-user-status-card"
            onClick={onOpenAuth}
            className="w-full bg-white hover:bg-emerald-50/50 border border-slate-200/90 hover:border-emerald-400 rounded-2xl p-3.5 shadow-xs flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                  লগ ইন করুন
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Google বা মোবাইল নম্বর দিয়ে প্রবেশ করুন
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold tracking-wide shadow-xs transition-all group-hover:shadow-sm">
                <LogIn className="w-3.5 h-3.5" />
                <span>লগ ইন করুন</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area: Branches & Ecosystem (Matching the Scientific Botanical Teal & Honey Amber Aesthetic) */}
      <main className="max-w-xl mx-auto w-full space-y-4">
        {/* 2. Branch 1: সাইন্স লাইব্রেরি (Rich Botanical Emerald Teal Gradient) */}
        <button
          id="btn-portal-branch-science"
          type="button"
          onClick={() => onSelectBranch('science_library')}
          className="w-full text-left bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 hover:from-emerald-900 hover:via-teal-900 hover:to-emerald-950 text-white p-4 sm:p-5 rounded-2xl shadow-md hover:shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-emerald-300 shadow-inner group-hover:scale-105 transition-transform border border-white/10">
              <FlaskConical className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  সাইন্স লাইব্রেরি
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-semibold border border-emerald-300/30">
                  Science
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-normal mt-0.5">
                সিট বুকিং • সকাল ৮:০০ — রাত ১০:০০
              </p>
            </div>
          </div>

          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-emerald-200 group-hover:bg-white/25 group-hover:translate-x-1 transition-all border border-white/10">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        {/* 3. Branch 2: সেন্ট্রাল লাইব্রেরি (Warm Honey Amber & Tangerine Gradient) */}
        <button
          id="btn-portal-branch-central"
          type="button"
          onClick={() => onSelectBranch('central_library')}
          className="w-full text-left bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-700 hover:from-amber-700 hover:via-amber-800 hover:to-yellow-800 text-white p-4 sm:p-5 rounded-2xl shadow-md hover:shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-amber-200 shadow-inner group-hover:scale-105 transition-transform border border-white/10">
              <BookOpen className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  সেন্ট্রাল লাইব্রেরি
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-300/20 text-amber-100 text-[10px] font-semibold border border-amber-300/30">
                  Central
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-100/90 font-normal mt-0.5">
                সিট বুকিং • সকাল ৮:০০ — রাত ১০:০০
              </p>
            </div>
          </div>

          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-amber-200 group-hover:bg-white/25 group-hover:translate-x-1 transition-all border border-white/10">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        {/* 4. Action Buttons (Side-by-side: Guidelines & Follow Facebook) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Guidelines Button */}
          <button
            id="btn-portal-guidelines"
            type="button"
            onClick={onOpenGuidelines}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200 text-amber-900 font-semibold text-sm transition-all shadow-2xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-700" />
            <span>নির্দেশনা</span>
          </button>

          {/* Facebook Link Button */}
          <a
            id="btn-portal-facebook"
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-sm transition-all shadow-2xs"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Follow Facebook</span>
          </a>
        </div>
      </main>

      {/* Bottom Footer & Admin Login */}
      <footer className="max-w-xl mx-auto w-full mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          © {new Date().getFullYear()} স্মার্ট স্টাডি সেন্টার ও লাইব্রেরি
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenGuidelines}
            className="hover:text-slate-800 underline transition-colors"
          >
            নিয়মাবলী
          </button>
          {isAdminLoggedIn && (
            <>
              <span>•</span>
              <button
                id="btn-portal-admin-panel"
                type="button"
                onClick={onOpenAdmin}
                className="flex items-center gap-1 hover:text-rose-700 font-semibold transition-colors text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                <span>এডমিন প্যানেল</span>
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
};
