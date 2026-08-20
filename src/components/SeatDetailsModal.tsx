import React from 'react';
import {
  X,
  Armchair,
  Clock,
  User,
  Phone,
  ShieldCheck,
  Timer,
  LogOut,
  Sparkles,
  Ticket,
  Wrench,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Seat, Room } from '../types';
import { useLibrary } from '../context/LibraryContext';

interface SeatDetailsModalProps {
  seat: Seat | null;
  room?: Room;
  isOpen: boolean;
  onClose: () => void;
  onOpenAwayTimer: () => void;
  onOpenPass: () => void;
  onOpenBook: () => void;
}

export const SeatDetailsModal: React.FC<SeatDetailsModalProps> = ({
  seat,
  room,
  isOpen,
  onClose,
  onOpenAwayTimer,
  onOpenPass,
  onOpenBook,
}) => {
  const {
    currentStudent,
    releaseSeat,
    returnFromAway,
    adminForceReleaseSeat,
    adminToggleMaintenance,
    isAdminLoggedIn,
    currentTime,
  } = useLibrary();

  if (!isOpen || !seat) return null;

  const isMySeat =
    currentStudent &&
    (seat.status === 'occupied' || seat.status === 'away') &&
    ((seat.studentId && seat.studentId === currentStudent.studentId) ||
      (seat.occupantPhone && seat.occupantPhone === currentStudent.phone) ||
      (seat.occupantName && seat.occupantName.toLowerCase() === currentStudent.name.toLowerCase()));

  const bookedTimeFormatted = seat.bookedAt
    ? new Date(seat.bookedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'N/A';

  const expectedLeaveFormatted = seat.expectedLeaveAt
    ? new Date(seat.expectedLeaveAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'N/A';

  const handleRelease = () => {
    if (window.confirm('আপনি কি নিশ্চিতভাবে এই সিটটি ত্যাগ করতে চান? (Are you sure you want to release this seat?)')) {
      releaseSeat(seat.id);
      onClose();
    }
  };

  const handleAdminForceRelease = () => {
    if (window.confirm('অ্যাডমিন অ্যাকশন: আপনি কি এই সিটটি জোরপূর্বক ফাঁকা করতে চান?')) {
      adminForceReleaseSeat(seat.id);
      onClose();
    }
  };

  const handleAdminMaintenance = () => {
    adminToggleMaintenance(seat.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-mono font-bold text-sm">
              {seat.seatNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">সিটের বিস্তারিত তথ্য</h3>
                {isMySeat && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500 text-white">
                    আমার সিট
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {room ? room.bengaliName : 'Study Room'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
              seat.status === 'available'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : seat.status === 'away'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : seat.status === 'occupied'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
              <span>
                {seat.status === 'available'
                  ? '🟢 ফাঁকা সিট (Available Now)'
                  : seat.status === 'away'
                  ? `🟡 বিরতিতে আছেন (${seat.awayReason || 'Away'})`
                  : seat.status === 'occupied'
                  ? '🔴 বুকড (Occupied)'
                  : '🔧 সিট মেরামত চলছে (Under Maintenance)'}
              </span>
            </div>

            {seat.isFemaleReserved && (
              <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px]">
                🌸 মহিলা সংরক্ষিত
              </span>
            )}
          </div>

          {/* Occupant Info if occupied or away */}
          {seat.status !== 'available' && seat.status !== 'maintenance' && (
            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">শিক্ষার্থীর নাম:</span>
                <span className="font-bold text-slate-100">{seat.occupantName}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">স্টুডেন্ট আইডি:</span>
                <span className="font-mono text-slate-300">{seat.studentId || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">মোবাইল নম্বর:</span>
                <span className="font-mono text-slate-300">
                  {isAdminLoggedIn || isMySeat
                    ? seat.occupantPhone
                    : seat.occupantPhone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">প্রবেশ সময় (Check-in):</span>
                <span className="font-mono text-emerald-400 font-semibold">{bookedTimeFormatted}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">মেয়াদ শেষ (Valid Till):</span>
                <span className="font-mono text-amber-400 font-semibold">{expectedLeaveFormatted}</span>
              </div>
            </div>
          )}

          {/* Action Buttons based on User Context */}
          <div className="space-y-2 pt-2">
            {/* If seat is available -> Book Button */}
            {seat.status === 'available' && (
              <button
                id="btn-modal-book-now"
                onClick={() => {
                  onClose();
                  onOpenBook();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <Armchair className="w-4 h-4" />
                <span>এই সিটটি বুক করুন (Book Seat Now)</span>
              </button>
            )}

            {/* If it's my seat */}
            {isMySeat && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {seat.status === 'away' ? (
                    <button
                      id="btn-return-break"
                      onClick={() => {
                        returnFromAway(seat.id);
                        onClose();
                      }}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>আমি ফিরে এসেছি</span>
                    </button>
                  ) : (
                    <button
                      id="btn-take-break"
                      onClick={() => {
                        onClose();
                        onOpenAwayTimer();
                      }}
                      className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Timer className="w-4 h-4" />
                      <span>বিরতি নিন (Take Break)</span>
                    </button>
                  )}

                  <button
                    id="btn-view-pass"
                    onClick={() => {
                      onClose();
                      onOpenPass();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>পাস দেখুন (View Pass)</span>
                  </button>
                </div>

                <button
                  id="btn-release-seat"
                  onClick={handleRelease}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>সিট ত্যাগ করুন (Release Seat)</span>
                </button>
              </div>
            )}

            {/* Admin Override Controls */}
            {isAdminLoggedIn && (
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                  Admin Seat Controls:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAdminForceRelease}
                    className="py-2 px-3 rounded-xl bg-rose-900/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 text-xs font-semibold transition-all"
                  >
                    জোরপূর্বক ফাঁকা করুন
                  </button>

                  <button
                    onClick={handleAdminMaintenance}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-all"
                  >
                    {seat.status === 'maintenance' ? 'সচল করুন' : 'মেরামতে পাঠান'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
