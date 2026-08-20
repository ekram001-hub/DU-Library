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
      return { expired: true, text: 'সময় শেষ' };
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return {
      expired: false,
      text: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
    };
  }, [seat, currentTime]);

  // Card theme styling matching Screenshot 2
  const statusTheme = useMemo(() => {
    if (seat.status === 'maintenance') {
      return {
        cardBg: 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-60',
        iconColor: 'text-slate-400',
        numColor: 'text-slate-500',
      };
    }

    if (isMySeat) {
      return {
        cardBg: 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500 text-blue-900 shadow-xs',
        iconColor: 'text-blue-600',
        numColor: 'text-blue-900 font-bold',
      };
    }

    if (seat.status === 'away') {
      return {
        cardBg: 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-2xs hover:border-amber-400',
        iconColor: 'text-amber-600',
        numColor: 'text-amber-900 font-bold',
      };
    }

    if (seat.status === 'occupied') {
      return {
        cardBg: 'bg-rose-50/90 border-rose-200 text-rose-900 shadow-2xs hover:border-rose-300',
        iconColor: 'text-rose-600',
        numColor: 'text-rose-900 font-bold',
      };
    }

    // Available
    return {
      cardBg: 'bg-white border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/20 text-slate-700 shadow-2xs hover:shadow-xs',
      iconColor: 'text-slate-600 group-hover:text-blue-600',
      numColor: 'text-slate-800 group-hover:text-blue-900 font-semibold',
    };
  }, [seat.status, isMySeat]);

  return (
    <button
      id={`seat-card-${seat.seatNumber}`}
      type="button"
      onClick={() => onSelectSeat(seat)}
      className={`group relative aspect-square p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer select-none active:scale-95 ${statusTheme.cardBg}`}
      title={`সিট ${seat.seatNumber} • ${
        seat.status === 'available'
          ? 'খালি (বুকিং করতে ক্লিক করুন)'
          : seat.status === 'occupied'
          ? `বুকড (${seat.occupantName || 'ব্যবহারকারী'})`
          : seat.status === 'away'
          ? 'সাময়িক বিরতি'
          : 'মেরামত'
      }`}
    >
      {/* Top right status mini badge */}
      {isMySeat && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600" />
      )}

      {seat.status === 'away' && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
      )}
      {seat.isFemaleReserved && seat.status === 'available' && (
        <span className="absolute top-1 left-1 text-[8px] text-pink-600">🌸</span>
      )}

      {/* Armchair Icon */}
      <div className={`transition-colors ${statusTheme.iconColor}`}>
        <Armchair className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.75]" />
      </div>

      {/* Seat Number */}
      <span className={`text-xs sm:text-sm tracking-tight ${statusTheme.numColor}`}>
        {seat.seatNumber}
      </span>

      {/* Away mini countdown if away */}
      {seat.status === 'away' && awayCountdown && (
        <span className="text-[9px] font-mono text-amber-700 leading-none">
          {awayCountdown.text}
        </span>
      )}
    </button>
  );
};
