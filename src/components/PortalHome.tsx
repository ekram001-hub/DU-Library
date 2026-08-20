import React from 'react';
import {
  FlaskConical,
  BookOpen,
  ChevronRight,
  Sparkles,
  FileText,
  ExternalLink,
  ShieldCheck,
  User,
  Clock,
  GraduationCap,
  Calendar,
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
    branchStats,
    overallStats,
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

  const studentName = currentStudent?.name || 'Ekram Bhuiyan';

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

        {/* 1. Logged In User Pill (Top Card from Screenshot 1) */}
        <div
          id="portal-user-status-card"
          onClick={onOpenAuth}
          className="w-full bg-white hover:bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 shadow-xs flex items-center justify-between transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                  {studentName}
                </h3>
              </div>
              <p className="text-xs text-emerald-600 font-medium">
                লগইন করা আছে (স্বাগতম)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentStudentSeat && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMyPass();
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold"
              >
                সিট #{currentStudentSeat.seatNumber}
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Branches & Ecosystem (Matching Screenshot 1) */}
      <main className="max-w-xl mx-auto w-full space-y-4">
        {/* 2. Branch 1: সাইন্স লাইব্রেরি (Vibrant Amber/Orange Gradient Card) */}
        <button
          id="btn-portal-branch-science"
          type="button"
          onClick={() => onSelectBranch('science_library')}
          className="w-full text-left bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:via-orange-600 hover:to-orange-700 text-white p-4 sm:p-5 rounded-2xl shadow-md hover:shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                সাইন্স লাইব্রেরি
              </h2>
              <p className="text-xs sm:text-sm text-orange-100/90 font-normal mt-0.5">
                সিট বুকিং • সকাল ৮:০০ — রাত ১০:০০
              </p>
            </div>
          </div>

          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:bg-white/30 group-hover:translate-x-1 transition-all">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        {/* 3. Branch 2: সেন্ট্রাল লাইব্রেরি (Vibrant Fiery Red-Orange Gradient Card) */}
        <button
          id="btn-portal-branch-central"
          type="button"
          onClick={() => onSelectBranch('central_library')}
          className="w-full text-left bg-gradient-to-r from-orange-600 via-rose-600 to-red-600 hover:from-orange-700 hover:via-rose-700 hover:to-red-700 text-white p-4 sm:p-5 rounded-2xl shadow-md hover:shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                সেন্ট্রাল লাইব্রেরি
              </h2>
              <p className="text-xs sm:text-sm text-rose-100/90 font-normal mt-0.5">
                সিট বুকিং • সকাল ৮:০০ — রাত ১০:০০
              </p>
            </div>
          </div>

          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:bg-white/30 group-hover:translate-x-1 transition-all">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        {/* 4. Memorizer Study Room Card (Dark Emerald/Teal Modern Banner) */}
        <a
          id="memorizer-study-room-card"
          href="https://ais-dev-xeniqwh76n7spkxw2xk4sw-1047076485341.asia-southeast1.run.app"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md hover:shadow-lg transition-all group relative overflow-hidden"
        >
          {/* Subtle glow circle decoration */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-semibold text-emerald-200">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Study Room</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2 group-hover:text-emerald-300 transition-colors">
                Memorizer-bd <span className="group-hover:translate-x-1 transition-transform">→</span>
              </h3>

              <p className="text-xs sm:text-sm text-emerald-100/80 font-normal">
                স্মার্ট স্টাডি, ফ্ল্যাশকার্ড ও কুইজ প্র্যাকটিস
              </p>
            </div>

            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 group-hover:bg-white/20 transition-all">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </a>

        {/* 5. Action Buttons (Side-by-side: Guidelines & Follow Facebook) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Guidelines Button */}
          <button
            id="btn-portal-guidelines"
            type="button"
            onClick={onOpenGuidelines}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200 text-amber-900 font-semibold text-sm transition-all shadow-2xs"
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

        {/* 6. Section Divider */}
        <div className="relative flex py-3 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            লার্নিং মেথডোলজি ও ডেমো
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* 7. Memorizer Learning Ecosystem Feature Card */}
        <div
          id="portal-ecosystem-card"
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3.5"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>মেমোরাইজার লার্নিং ইকোসিস্টেম</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            স্মার্ট স্টাডি মেথডোলজি ও পূর্ণাঙ্গ প্র্যাকটিস
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            গল্প, আন্তর্জাতিক সম্পাদকীয়, ফ্ল্যাশকার্ড ও ৬+ গেম প্র্যাকটিসের মাধ্যমে ভোকাবুলারি মনে রাখার আধুনিক সমাধান।
          </p>

          <div className="pt-1">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium text-xs transition-all shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Follow Facebook</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </a>
          </div>
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
          <span>•</span>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="flex items-center gap-1 hover:text-slate-900 font-medium transition-colors text-slate-600"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>এডমিন প্যানেল</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
