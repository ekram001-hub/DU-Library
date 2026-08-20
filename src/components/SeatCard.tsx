import React, { useMemo } from 'react';
import {
  Armchair,
  Clock,
  User,
  Timer,
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
        text: 'Expired',
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

  // Styling based on status (Clean, minimalist light mode)
  const cardStyle = useMemo(() => {
    if (seat.status === 'maintenance') {
      return {
        border: 'border-slate-200 bg-slate-50 opacity-60',
        badgeBg: 'bg-slate-100 text-slate-500 border-slate-200',
        iconColor: 'text-slate-400',
      };
    }

    if (isMySeat) {
      return {
        border: 'border-sky-500 bg-sky-50/40 ring-1 ring-sky-500',
        badgeBg: 'bg-sky-600 text-white font-medium',
        iconColor: 'text-sky-600',
      };
    }

    if (seat.status === 'away') {
      return {
        border: 'border-amber-200 bg-amber-50/30 hover:border-amber-300',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        iconColor: 'text-amber-600',
      };
    }

    if (seat.status === 'occupied') {
      return {
        border: 'border-slate-200 bg-slate-50/60 hover:border-slate-300',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        iconColor: 'text-rose-600',
      };
    }

    // Available
    return {
      border: 'border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-xs',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-600',
    };
  }, [seat.status, isMySeat]);

  return (
    <div
      id={`seat-card-${seat.seatNumber}`}
      onClick={() => onSelectSeat(seat)}
      className={`group relative rounded-lg border p-2.5 flex flex-col justify-between transition-all duration-150 cursor-pointer min-h-[118px] ${cardStyle.border}`}
    >
      {/* Top Bar: Seat Number, Female Reserved Badge & Status Pill */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono font-semibold text-[11px]">
            {seat.seatNumber}
          </div>

          {seat.isFemaleReserved && (
            <span
              className="px-1 py-0.2 rounded text-[9px] font-medium bg-pink-50 border border-pink-200 text-pink-700"
              title="Female Reserved Seat"
            >
              🌸 Female
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div>
          {isMySeat ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-600 text-white flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5" />
              Mine
            </span>
          ) : seat.status === 'available' ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium border bg-emerald-50 border-emerald-200 text-emerald-700">
              Open
            </span>
          ) : seat.status === 'away' ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium border bg-amber-50 border-amber-200 text-amber-800 flex items-center gap-1">
              <Timer className="w-2.5 h-2.5" />
              Break
            </span>
          ) : seat.status === 'occupied' ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium border bg-rose-50 border-rose-200 text-rose-700">
              Booked
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium border bg-slate-100 border-slate-200 text-slate-500">
              Maint.
            </span>
          )}
        </div>
      </div>

      {/* Middle Body: Desk Visual + Occupant details or Available prompt */}
      <div className="my-auto py-0.5">
        {seat.status === 'available' ? (
          <div className="flex flex-col items-center justify-center text-center py-1">
            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-0.5">
              <Armchair className="w-3 h-3" />
            </div>
            <div className="text-[11px] font-medium text-emerald-700">
              Reserve Seat
            </div>
          </div>
        ) : seat.status === 'away' ? (
          <div className="space-y-0.5 bg-amber-50/60 rounded p-1.5 border border-amber-200/60">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-slate-800 truncate">
                {seat.occupantName}
              </span>
              <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-medium">
                {seat.awayReason || 'Break'}
              </span>
            </div>

            {/* Live Away Countdown */}
            {awayCountdown && (
              <div
                className={`text-[10px] font-mono font-medium flex items-center gap-1 ${
                  awayCountdown.expired ? 'text-rose-600' : 'text-amber-800'
                }`}
              >
                <Clock className="w-2.5 h-2.5 shrink-0" />
                <span>
                  {awayCountdown.expired ? 'Time expired' : `Left: ${awayCountdown.text}`}
                </span>
              </div>
            )}
          </div>
        ) : seat.status === 'occupied' ? (
          <div className="space-y-0.5 bg-slate-100/60 rounded p-1.5 border border-slate-200/60">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-semibold text-slate-600 shrink-0">
                {seat.occupantName ? seat.occupantName.charAt(0) : 'U'}
              </div>
              <span className="text-[11px] font-medium text-slate-800 truncate">
                {seat.occupantName}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>{bookedTimeFormatted}</span>
              {seat.targetDurationHours && (
                <span className="text-slate-600 font-sans text-[10px]">
                  {seat.targetDurationHours}h
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-1 text-slate-400 text-[11px] flex flex-col items-center">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
            <span>Under maintenance</span>
          </div>
        )}
      </div>

      {/* Bottom Footer: Room tag & action hint */}
      <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
        <span className="truncate max-w-[90px]">
          {room ? room.name : 'Study Room'}
        </span>

        <span className="text-slate-400 group-hover:text-slate-700 transition-colors flex items-center">
          Details <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
        </span>
      </div>
    </div>
  );
};

