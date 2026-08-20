import React, { useMemo } from 'react';
import {
  Armchair,
  Timer,
  Clock,
  RotateCcw,
  LogOut,
  Ticket,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Seat, Room } from '../types';

interface MySeatFloatingWidgetProps {
  onOpenAwayModal: () => void;
  onOpenPassModal: () => void;
  onSelectSeat: (seat: Seat) => void;
}

export const MySeatFloatingWidget: React.FC<MySeatFloatingWidgetProps> = ({
  onOpenAwayModal,
  onOpenPassModal,
  onSelectSeat,
}) => {
  const {
    currentStudentSeat,
    rooms,
    returnFromAway,
    releaseSeat,
    currentTime,
  } = useLibrary();

  if (!currentStudentSeat) return null;

  const room = rooms.find((r) => r.id === currentStudentSeat.roomId);

  // Elapsed study time calculation
  const elapsedStudyTime = useMemo(() => {
    if (!currentStudentSeat.bookedAt) return '0m';
    const diffMs = currentTime.getTime() - currentStudentSeat.bookedAt;
    const totalMinutes = Math.floor(diffMs / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, [currentStudentSeat.bookedAt, currentTime]);

  // Away countdown if on break
  const awayCountdown = useMemo(() => {
    if (
      currentStudentSeat.status !== 'away' ||
      !currentStudentSeat.awaySince ||
      !currentStudentSeat.awayDurationMinutes
    ) {
      return null;
    }
    const elapsedMs = currentTime.getTime() - currentStudentSeat.awaySince;
    const totalMs = currentStudentSeat.awayDurationMinutes * 60 * 1000;
    const remainingMs = totalMs - elapsedMs;

    if (remainingMs <= 0) {
      return { expired: true, text: 'Expired' };
    }
    const totalSecs = Math.floor(remainingMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return {
      expired: false,
      text: `${mins}m ${secs < 10 ? '0' : ''}${secs}s`,
    };
  }, [currentStudentSeat, currentTime]);

  const handleRelease = () => {
    if (window.confirm('Are you sure you want to release your seat?')) {
      releaseSeat(currentStudentSeat.id);
    }
  };

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-40 animate-slideUp">
      <div className="rounded-xl bg-white border border-slate-200/90 shadow-lg p-3 text-slate-800">
        <div className="flex items-center justify-between gap-3">
          {/* Seat & Status Information */}
          <div
            onClick={() => onSelectSeat(currentStudentSeat)}
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-mono font-semibold text-xs text-white shadow-xs shrink-0">
              {currentStudentSeat.seatNumber}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  My Active Seat
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {room ? room.name : 'Study Room'} • {elapsedStudyTime}
              </div>
            </div>
          </div>


          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {currentStudentSeat.status === 'away' ? (
              <button
                id="floating-return-btn"
                onClick={() => returnFromAway(currentStudentSeat.id)}
                className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors shadow-xs flex items-center gap-1"
                title="Return from break"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Return {awayCountdown && `(${awayCountdown.text})`}</span>
              </button>
            ) : (
              <button
                id="floating-break-btn"
                onClick={onOpenAwayModal}
                className="px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-medium transition-colors flex items-center gap-1"
                title="Take a short break"
              >
                <Timer className="w-3 h-3 text-amber-600" />
                <span>Break</span>
              </button>
            )}

            <button
              id="floating-pass-btn"
              onClick={onOpenPassModal}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
              title="View Digital Pass"
            >
              <Ticket className="w-3.5 h-3.5" />
            </button>

            <button
              id="floating-release-btn"
              onClick={handleRelease}
              className="p-1.5 rounded-md border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors"
              title="Release Seat"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

