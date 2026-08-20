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
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

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
    currentStudent,
    adminUser,
    logoutAdmin,
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

  // Format English Date
  const formatDate = (date: Date) => {
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNameEn = daysEn[date.getDay()];
    const dayNum = date.getDate();
    const monthEn = monthsEn[date.getMonth()];
    const year = date.getFullYear();

    return `${dayNameEn}, ${dayNum} ${monthEn} ${year}`;
  };

  const { timeStr, ampm } = formatTime(currentTime);
  const formattedDate = formatDate(currentTime);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      {/* Top Banner Bar: Quick Info & External Links */}
      <div className="bg-slate-100/70 px-3 sm:px-6 py-1.5 border-b border-slate-200/60 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Live System Indicator & Date */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold tracking-wide">LIVE REAL-TIME</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{formattedDate}</span>
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 font-medium text-xs transition-all group"
              title="Open Memorizer Learning App in a new tab"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Memorizer App</span>
              <ExternalLink className="w-3 h-3 text-amber-600 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            {/* Official Facebook Page Button */}
            <a
              id="facebook-page-link"
              href={branchConfig.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 font-medium text-xs transition-all"
              title={`Visit ${branchConfig.facebookPageName} on Facebook`}
            >
              <svg className="w-3.5 h-3.5 fill-blue-600" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="hidden md:inline">{branchConfig.facebookPageName}</span>
              <span className="md:hidden">FB Page</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold hidden lg:inline">
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
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
                {currentBranchId === 'bcs_study' ? (
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                ) : (
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                    {branchConfig.name}
                  </h1>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-medium hidden md:inline">
                    {branchConfig.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 hidden sm:block">
                  {branchConfig.tagline}
                </p>
              </div>
            </div>

            {/* Branch Switcher Segmented Control */}
            <div className="hidden lg:flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80 ml-2">
              <button
                id="btn-branch-bcs"
                onClick={() => setCurrentBranchId('bcs_study')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentBranchId === 'bcs_study'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>BCS Study Center</span>
              </button>
              <button
                id="btn-branch-fresh"
                onClick={() => setCurrentBranchId('fresh_study')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentBranchId === 'fresh_study'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fresh Study Library</span>
              </button>
            </div>
          </div>

          {/* Right Side: Digital Clock + Guidelines + Auth/Profile + Admin */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live 12-Hour Digital Clock */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono shadow-2xs">
              <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold tracking-wider text-slate-900">{timeStr}</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">{ampm}</span>
              </div>
            </div>

            {/* Guidelines & Rules Button */}
            <button
              id="btn-guidelines-modal"
              onClick={onOpenGuidelines}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium transition-all shadow-2xs"
              title="Guidelines & Notice Board"
            >
              <BookMarked className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Rules & Notices</span>
              <span className="sm:hidden">Notices</span>
            </button>

            {/* Student Auth / Profile Pill */}
            {currentStudent ? (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-current-user-profile"
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-left text-xs transition-all shadow-2xs group"
                  title="View / Edit Profile"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[11px]">
                    {currentStudent.name.charAt(0)}
                  </div>

                  <div className="hidden sm:block">
                    <div className="font-semibold text-slate-800 group-hover:text-slate-900 line-clamp-1">
                      {currentStudent.name}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium">
                      {currentStudentSeat ? `Seat: ${currentStudentSeat.seatNumber}` : 'Logged In'}
                    </div>
                  </div>
                </button>

                {currentStudentSeat && (
                  <button
                    id="btn-view-pass-header"
                    onClick={onOpenMyPass}
                    className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition-all"
                    title="View Digital Library Pass"
                  >
                    <span className="text-[11px]">Pass</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                id="btn-login-student"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-2xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Admin Control Button */}
            {adminUser ? (
              <div className="flex items-center gap-1">
                <button
                  id="btn-admin-dashboard"
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-all"
                  title="Admin Dashboard"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
                <button
                  id="btn-admin-logout"
                  onClick={logoutAdmin}
                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 transition-all"
                  title="Logout Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-admin-login"
                onClick={onOpenAdmin}
                className="p-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-medium transition-all"
                title="Admin Login & Room Settings"
              >
                <ShieldCheck className="w-4 h-4 text-slate-500 hover:text-amber-600" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Branch Switcher Row */}
        <div className="flex lg:hidden items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200">
          <div className="flex items-center w-full p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setCurrentBranchId('bcs_study')}
              className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold transition-all text-center ${
                currentBranchId === 'bcs_study'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              BCS Study Center
            </button>

            <button
              onClick={() => setCurrentBranchId('fresh_study')}
              className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold transition-all text-center ${
                currentBranchId === 'fresh_study'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fresh Study Library
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

