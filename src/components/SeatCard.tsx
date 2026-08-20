import React, { useMemo } from 'react';
import {
  Armchair,
  Clock,
  User,
  ShieldAlert,
  Sparkles,
  Lock,
  Timer,
  Coffee,
  Check,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Seat, Room } from '../types';
import { useLibrary } from '../context/LibraryContext';

interface SeatCardProps {
  seat: Seat;
  room?: Room;
  onSelectSeat: (seat: Seat) => void;
}

export const SeatCard: React.FC<SeatCardProps> = ({ seat, room, onSelectSeat }) => {
  const { currentStudent, currentTime } = useLibrary();

  // Check if this seat belongs to current logged in student
  const isMySeat = useMemo(() => {
    if (!currentStudent) return false;
    if (seat.status !== 'occupied' && seat.status !== 'away') return false;
    return (
      (seat.studentId && seat.studentId === currentStudent.studentId) ||
      (seat.occupantPhone && seat.occupantPhone === currentStudent.phone) ||
      (seat.occupantName && seat.occupantName.toLowerCase() === currentStudent.name.toLowerCase())
    );
  }, [seat, currentStudent]);

  // Calculate live away countdown if seat is on break
  const awayCountdown = useMemo(() => {
    if (seat.status !== 'away' || !seat.awaySince || !seat.awayDurationMinutes) {
      return null;
    }
    const elapsedMs = currentTime.getTime() - seat.awaySince;
    const totalMs = seat.awayDurationMinutes * 60 * 1000;
    const remainingMs = totalMs - elapsedMs;

    if (remainingMs <= 0) {
      return {
        expired: true,
        text: 'বিরতির সময় শেষ',
        secondsLeft: 0,
      };
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return {
      expired: false,
      text: `${mins}m ${secs < 10 ? '0' : ''}${secs}s`,
      secondsLeft: totalSeconds,
    };
  }, [seat, currentTime]);

  // Format booked time
  const bookedTimeFormatted = useMemo(() => {
    if (!seat.bookedAt) return '';
    const date = new Date(seat.bookedAt);
    let hours = date.getHours();
    const mins = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${mins} ${ampm}`;
  }, [seat.bookedAt]);

  // Styling based on status
  const cardStyle = useMemo(() => {
    if (seat.status === 'maintenance') {
      return {
        border: 'border-slate-700/60 bg-slate-900/50',
        badgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
        glow: '',
        iconColor: 'text-slate-500',
      };
    }

    if (isMySeat) {
      return {
        border: 'border-sky-500 bg-gradient-to-b from-sky-950/60 to-slate-900 ring-2 ring-sky-500/50',
        badgeBg: 'bg-sky-500 text-white font-bold',
        glow: 'shadow-lg shadow-sky-500/20',
        iconColor: 'text-sky-400',
      };
    }

    if (seat.status === 'away') {
      return {
        border: 'border-amber-500/70 bg-gradient-to-b from-amber-950/40 to-slate-900',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        glow: 'shadow-lg shadow-amber-500/10',
        iconColor: 'text-amber-400',
      };
    }

    if (seat.status === 'occupied') {
      return {
        border: 'border-rose-500/40 bg-gradient-to-b from-rose-950/30 to-slate-900',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        glow: 'shadow-md shadow-rose-500/5',
        iconColor: 'text-rose-400',
      };
    }

    // Available
    return {
      border: 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 to-slate-900 hover:border-emerald-400 hover:from-emerald-950/40',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      glow: 'hover:shadow-lg hover:shadow-emerald-500/10',
      iconColor: 'text-emerald-400',
    };
  }, [seat.status, isMySeat]);

  return (
    <div
      id={`seat-card-${seat.seatNumber}`}
      onClick={() => onSelectSeat(seat)}
      className={`group relative rounded-xl border p-3 flex flex-col justify-between transition-all duration-200 cursor-pointer min-h-[148px] ${cardStyle.border} ${cardStyle.glow}`}
    >
      {/* Top Bar: Seat Number, Female Reserved Badge & Status Pill */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-950/80 border border-slate-700/80 text-white font-mono font-bold text-xs tracking-tight shadow-inner">
            {seat.seatNumber}
          </div>

          {seat.isFemaleReserved && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 border border-pink-500/40 text-pink-300 flex items-center gap-0.5"
              title="মহিলা সংরক্ষিত কর্নার / Female Dedicated Area"
            >
              🌸 <span className="hidden sm:inline">মহিলা</span>
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div>
          {isMySeat ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500 text-white shadow-sm flex items-center gap-1 animate-pulse">
              <Check className="w-3 h-3" />
              আমার সিট
            </span>
          ) : seat.status === 'available' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-500/20 border-emerald-500/40 text-emerald-300">
              🟢 ফাঁকা
            </span>
          ) : seat.status === 'away' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-500/20 border-amber-500/40 text-amber-300 flex items-center gap-1">
              <Timer className="w-3 h-3 animate-spin" />
              বিরতিতে
            </span>
          ) : seat.status === 'occupied' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-rose-500/20 border-rose-500/30 text-rose-300">
              🔴 বুকড
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-800 border-slate-700 text-slate-400">
              মেরামত
            </span>
          )}
        </div>
      </div>

      {/* Middle Body: Desk Visual + Occupant details or Available prompt */}
      <div className="my-auto py-1">
        {seat.status === 'available' ? (
          <div className="flex flex-col items-center justify-center text-center py-1">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-1">
              <Armchair className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              বুক করতে ক্লিক করুন
            </div>
            <div className="text-[10px] text-slate-400">
              {seat.isFemaleReserved ? 'নারী শিক্ষার্থীদের জন্য' : 'সবার জন্য উন্মুক্ত'}
            </div>
          </div>
        ) : seat.status === 'away' ? (
          <div className="space-y-1 bg-slate-950/60 rounded-lg p-2 border border-amber-500/20">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 line-clamp-1">
                {seat.occupantName}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                {seat.awayReason === 'Prayer'
                  ? 'নামায'
                  : seat.awayReason === 'Lunch'
                  ? 'খাবার'
                  : seat.awayReason === 'Tea'
                  ? 'চা-নাস্তা'
                  : seat.awayReason === 'Rest'
                  ? 'বিশ্রাম'
                  : 'বিরতি'}
              </span>
            </div>

            {/* Live Away Countdown */}
            {awayCountdown && (
              <div
                className={`text-[11px] font-mono font-bold flex items-center gap-1 ${
                  awayCountdown.expired
                    ? 'text-rose-400 animate-bounce'
                    : 'text-amber-300'
                }`}
              >
                <Clock className="w-3 h-3 shrink-0" />
                <span>
                  {awayCountdown.expired
                    ? '⚠️ সময় শেষ (অতিশীঘ্রই ফিরবেন)'
                    : `বাকি: ${awayCountdown.text}`}
                </span>
              </div>
            )}
          </div>
        ) : seat.status === 'occupied' ? (
          <div className="space-y-1 bg-slate-950/60 rounded-lg p-2 border border-slate-800">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                {seat.occupantName ? seat.occupantName.charAt(0) : 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                {seat.occupantName}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>প্রবেশ: {bookedTimeFormatted}</span>
              {seat.targetDurationHours && (
                <span className="text-slate-300 font-sans">
                  {seat.targetDurationHours} ঘণ্টা
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-slate-400 text-xs flex flex-col items-center">
            <AlertCircle className="w-4 h-4 text-slate-500 mb-1" />
            <span>সিট মেরামত চলছে</span>
          </div>
        )}
      </div>

      {/* Bottom Footer: Room tag & action hint */}
      <div className="mt-1 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
        <span className="line-clamp-1 max-w-[120px]">
          {room ? room.bengaliName.split('(')[0] : 'Study Room'}
        </span>

        <span className="text-slate-500 group-hover:text-slate-300 transition-colors flex items-center">
          বিস্তারিত <ChevronRight className="w-3 h-3 ml-0.5" />
        </span>
      </div>
    </div>
  );
};
