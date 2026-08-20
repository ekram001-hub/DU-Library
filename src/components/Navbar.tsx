import React from 'react';
import {
  GraduationCap,
  BookOpen,
  Clock,
  Calendar,
  ExternalLink,
  BookMarked,
  ShieldCheck,
  User,
  LogOut,
  Sparkles,
  Radio,
  Share2,
  ChevronRight,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { BranchId } from '../types';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenGuidelines: () => void;
  onOpenAdmin: () => void;
  onOpenMyPass: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenGuidelines,
  onOpenAdmin,
  onOpenMyPass,
}) => {
  const {
    currentBranchId,
    setCurrentBranchId,
    branchConfig,
    allBranches,
    currentStudent,
    logoutStudent,
    adminUser,
    logoutAdmin,
    branchStats,
    currentStudentSeat,
    currentTime,
  } = useLibrary();

  // Format 12-hour clock (HH:MM:SS AM/PM)
  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const hoursStr = hours.toString().padStart(2, '0');
    return { timeStr: `${hoursStr}:${minutes}:${seconds}`, ampm };
  };

  // Format Bengali & English Date
  const formatDate = (date: Date) => {
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

    const dayNameBn = daysBn[date.getDay()];
    const dayNameEn = daysEn[date.getDay()];
    const dayNum = date.getDate();
    const monthBn = monthsBn[date.getMonth()];
    const monthEn = monthsEn[date.getMonth()];
    const year = date.getFullYear();

    return {
      bn: `${dayNameBn}, ${dayNum} ${monthBn} ${year}`,
      en: `${dayNameEn}, ${dayNum} ${monthEn} ${year}`,
    };
  };

  const { timeStr, ampm } = formatTime(currentTime);
  const formattedDate = formatDate(currentTime);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl transition-all">
      {/* Top Banner Bar: Quick Info & External Links */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-3 sm:px-6 py-1.5 border-b border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Live System Indicator & Date */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold tracking-wide">LIVE REAL-TIME SYSTEM</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>{formattedDate.bn}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{formattedDate.en}</span>
            </div>
          </div>

          {/* Action Links: Memorizer App + Facebook Page */}
          <div className="flex items-center gap-2">
            {/* Memorizer Learning App Button */}
            <a
              id="memorizer-app-link"
              href={branchConfig.memorizerAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-medium text-xs transition-all shadow-sm group"
              title="Open Memorizer Learning App in a new tab"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>🚀 Memorizer Learning App</span>
              <ExternalLink className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* Official Facebook Page Button */}
            <a
              id="facebook-page-link"
              href={branchConfig.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-blue-200 font-medium text-xs transition-all"
              title={`Visit ${branchConfig.facebookPageName} on Facebook`}
            >
              <svg className="w-3.5 h-3.5 fill-blue-400" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="hidden md:inline">{branchConfig.facebookPageName}</span>
              <span className="md:hidden">FB Page</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 font-bold hidden lg:inline">
                {branchConfig.facebookFollowers.split('•')[0]}
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Nav Body */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Brand & Dual Branch Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 border border-sky-400/30">
                {currentBranchId === 'bcs_study' ? (
                  <GraduationCap className="w-6 h-6" />
                ) : (
                  <BookOpen className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                    {branchConfig.bengaliName}
                  </h1>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-sky-400 font-semibold hidden md:inline">
                    {branchConfig.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1 hidden sm:block">
                  {branchConfig.bengaliTagline}
                </p>
              </div>
            </div>

            {/* Branch Switcher Segmented Control */}
            <div className="hidden lg:flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner ml-2">
              <button
                id="btn-branch-bcs"
                onClick={() => setCurrentBranchId('bcs_study')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentBranchId === 'bcs_study'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>🎓 BCS Study Center</span>
              </button>
              <button
                id="btn-branch-fresh"
                onClick={() => setCurrentBranchId('fresh_study')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentBranchId === 'fresh_study'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>📖 Fresh Study Library</span>
              </button>
            </div>
          </div>

          {/* Right Side: Digital Clock + Guidelines + Auth/Profile + Admin */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live 12-Hour Digital Clock */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 font-mono shadow-inner">
              <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold tracking-wider text-emerald-300">{timeStr}</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">{ampm}</span>
              </div>
            </div>

            {/* Guidelines & Rules Button */}
            <button
              id="btn-guidelines-modal"
              onClick={onOpenGuidelines}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
              title="Library Guidelines & Notice Board"
            >
              <BookMarked className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">নিয়মাবলী ও নোটিশ</span>
              <span className="sm:hidden">নোটিশ</span>
            </button>

            {/* Student Auth / Profile Pill */}
            {currentStudent ? (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-current-user-profile"
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-left text-xs transition-all group"
                  title="View / Edit Profile"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold text-[11px] shadow-sm">
                    {currentStudent.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                      {currentStudent.name}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium">
                      {currentStudentSeat ? `সিট: ${currentStudentSeat.seatNumber}` : 'লগইন আছেন'}
                    </div>
                  </div>
                </button>

                {currentStudentSeat && (
                  <button
                    id="btn-view-pass-header"
                    onClick={onOpenMyPass}
                    className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition-all"
                    title="View Digital Library Pass"
                  >
                    <span className="text-[11px] font-bold px-1">🎫 পাস</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                id="btn-login-student"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-sky-600/25"
              >
                <User className="w-3.5 h-3.5" />
                <span>লগইন / প্রোফাইল</span>
              </button>
            )}

            {/* Admin Control Button */}
            {adminUser ? (
              <div className="flex items-center gap-1">
                <button
                  id="btn-admin-dashboard"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all"
                  title="Admin Dashboard"
                >
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">Admin Panel</span>
                </button>
                <button
                  id="btn-admin-logout"
                  onClick={logoutAdmin}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 border border-slate-700 text-slate-400 hover:text-rose-300 transition-all"
                  title="Logout Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-admin-login"
                onClick={onOpenAdmin}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all"
                title="Admin Login & Room Settings"
              >
                <ShieldCheck className="w-4 h-4 text-slate-400 hover:text-amber-400" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Branch Switcher Row */}
        <div className="flex lg:hidden items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center w-full p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setCurrentBranchId('bcs_study')}
              className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold transition-all text-center ${
                currentBranchId === 'bcs_study'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🎓 BCS Study Center
            </button>
            <button
              onClick={() => setCurrentBranchId('fresh_study')}
              className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold transition-all text-center ${
                currentBranchId === 'fresh_study'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📖 Fresh Study Library
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
