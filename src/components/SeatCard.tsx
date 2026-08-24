import React, { useMemo } from 'react';
import { Armchair, Clock, User, Timer, Check, AlertCircle } from 'lucide-react';
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
      return { expired: true, text: '00:00', label: 'সময় শেষ' };
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return {
      expired: false,
      text: `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`,
      mins,
      secs,
    };
  }, [seat, currentTime]);

  // Card theme styling
  const statusTheme = useMemo(() => {
    if (seat.status === 'maintenance') {
      return {
        cardBg: 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-60',
        iconColor: 'text-slate-400',
        numColor: 'text-slate-500',
      };
    }

    // DIRECTIVE: Away seat MUST show in prominent ORANGE with large timer taking over the seat
    if (seat.status === 'away') {
      return {
        cardBg:
          'bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 text-white border-2 border-orange-600 shadow-md ring-2 ring-orange-300/60 hover:brightness-105 active:scale-95',
        iconColor: 'text-white',
        numColor: 'text-white font-bold',
      };
    }

    if (isMySeat) {
      return {
        cardBg:
          'bg-emerald-50/95 border-emerald-500 ring-2 ring-emerald-500 text-emerald-950 shadow-xs hover:border-emerald-600',
        iconColor: 'text-emerald-700',
        numColor: 'text-emerald-950 font-bold',
      };
    }

    if (seat.status === 'occupied') {
      return {
        cardBg:
          'bg-rose-50/90 border-rose-200 text-rose-900 shadow-2xs hover:border-rose-300 hover:bg-rose-100/60',
        iconColor: 'text-rose-600',
        numColor: 'text-rose-900 font-bold',
      };
    }

    // Available
    return {
      cardBg:
        'bg-white border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/20 text-slate-700 shadow-2xs hover:shadow-xs',
      iconColor: 'text-slate-600 group-hover:text-emerald-700',
      numColor: 'text-slate-800 group-hover:text-emerald-950 font-semibold',
    };
  }, [seat.status, isMySeat]);

  return (
    <button
      id={`seat-card-${seat.seatNumber}`}
      type="button"
      onClick={() => onSelectSeat(seat)}
      className={`group relative aspect-square p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border flex flex-col items-center justify-between transition-all duration-150 cursor-pointer select-none active:scale-95 overflow-hidden ${statusTheme.cardBg}`}
      title={`সিট ${seat.seatNumber} • ${
        seat.status === 'available'
          ? 'খালি (বুকিং করতে ক্লিক করুন)'
          : seat.status === 'occupied'
          ? `বুকড (${seat.occupantName || 'ব্যবহারকারী'})`
          : seat.status === 'away'
          ? `সাময়িক বিরতি • ${awayCountdown?.text || 'Away'} অবশিষ্ট`
          : 'মেরামত'
      }`}
    >
      {/* Top row: Female indicator, Seat Number, My Seat badge */}
      <div className="w-full flex items-center justify-between gap-1 shrink-0">
        <div className="flex items-center gap-0.5">
          {seat.isFemaleReserved && (
            <span
              className={`text-[9px] px-1 rounded-sm font-semibold ${
                seat.status === 'away'
                  ? 'bg-pink-900/60 text-pink-100'
                  : 'text-pink-600'
              }`}
              title="Female Reserved"
            >
              🌸
            </span>
          )}
        </div>

        {/* Seat Number Top / Corner */}
        <span
          className={`text-[11px] sm:text-xs tracking-tight font-bold ${
            seat.status === 'away' ? 'text-white/95 drop-shadow-2xs' : statusTheme.numColor
          }`}
        >
          {seat.seatNumber}
        </span>

        {/* Status indicator badge */}
        <div>
          {isMySeat ? (
            <span
              className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-emerald-600 shadow-2xs"
              title="আপনার সিট (My Seat)"
            />
          ) : seat.status === 'away' ? (
            <span
              className="inline-block w-2.5 h-2.5 rounded-full bg-white animate-ping"
              title="বিরতি চলছে"
            />
          ) : null}
        </div>
      </div>

      {/* ============================================================== */}
      {/* CENTER BODY: IF AWAY -> BIG FULL-SEAT PROMINENT COUNTDOWN     */}
      {/* ============================================================== */}
      {seat.status === 'away' ? (
        <div className="w-full flex-1 flex flex-col items-center justify-center my-0.5 sm:my-1 text-center">
          {/* Away Label Tag */}
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-orange-100/90 leading-tight">
            বিরতি / AWAY
          </span>

          {/* LARGE TIMER COUNTDOWN taking center stage across the seat */}
          <div className="text-sm sm:text-base md:text-lg font-mono font-black text-white tracking-wider leading-none drop-shadow-xs my-0.5 animate-pulse">
            {awayCountdown ? awayCountdown.text : '30:00'}
          </div>

          {/* Reason icon/tag */}
          <span className="text-[8px] sm:text-[9px] text-white/90 font-medium truncate max-w-full px-1 py-0.2 bg-black/20 rounded-full mt-0.5">
            {seat.awayReason === 'Prayer'
              ? '🕌 নামাজ'
              : seat.awayReason === 'Lunch'
              ? '🍱 খাবার'
              : seat.awayReason === 'Tea'
              ? '☕ চা'
              : seat.awayReason === 'Rest'
              ? '🛋️ রেস্ট'
              : '⏳ সাময়িক'}
          </span>
        </div>
      ) : (
        /* STANDARD BODY FOR OTHER STATUSES */
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className={`transition-colors ${statusTheme.iconColor}`}>
            <Armchair className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.75]" />
          </div>
        </div>
      )}

      {/* Bottom Status / Name Indicator */}
      <div className="w-full flex items-center justify-center shrink-0">
        {seat.status === 'away' ? (
          <span className="text-[8px] sm:text-[9px] text-white/80 font-mono font-semibold truncate">
            {seat.occupantName ? seat.occupantName.split(' ')[0] : 'অপেক্ষমাণ'}
          </span>
        ) : seat.status === 'occupied' ? (
          <span className="text-[9px] text-rose-700 font-medium truncate max-w-full">
            {seat.occupantName ? seat.occupantName.split(' ')[0] : 'বুকড'}
          </span>
        ) : seat.status === 'available' ? (
          <span className="text-[9px] text-emerald-700 group-hover:text-emerald-800 font-medium">
            খালি
          </span>
        ) : (
          <span className="text-[9px] text-slate-400">মেরামত</span>
        )}
      </div>
    </button>
  );
};
