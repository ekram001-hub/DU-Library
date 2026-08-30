import React, { useMemo } from 'react';
import {
  Armchair,
  Timer,
  Clock,
  RotateCcw,
  LogOut,
  Ticket,
  Lock,
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

  // Rules of Hooks: both useMemo hooks below MUST run before the early
  // return. When a student books their first seat this widget switches from
  // hidden (currentStudentSeat === null) to visible, and hooks placed after
  // a conditional return change the hook order between renders — crashing
  // the whole app with "Rendered more hooks than during the previous render".

  // Elapsed study time calculation
  const elapsedStudyTime = useMemo(() => {
    if (!currentStudentSeat?.bookedAt) return '0m';
    const diffMs = currentTime.getTime() - currentStudentSeat.bookedAt;
    const totalMinutes = Math.floor(diffMs / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, [currentStudentSeat?.bookedAt, currentTime]);

  // Away countdown if on break
  const awayCountdown = useMemo(() => {
    if (
      !currentStudentSeat ||
      currentStudentSeat.status !== 'away' ||
      !currentStudentSeat.awaySince ||
      !currentStudentSeat.awayDurationMinutes
    ) {
      return null;
    }
    const rawAwaySince = currentStudentSeat.awaySince;
    let awaySinceMs = 0;
    if (typeof rawAwaySince === 'number') {
      awaySinceMs = rawAwaySince;
    } else if (typeof rawAwaySince === 'string') {
      awaySinceMs = new Date(rawAwaySince).getTime();
    }

    if (!awaySinceMs || isNaN(awaySinceMs)) {
      awaySinceMs = currentTime.getTime();
    }

    const durationMins = Number(currentStudentSeat.awayDurationMinutes) || 30;
    const totalMs = durationMins * 60 * 1000;
    const elapsedMs = Math.max(0, currentTime.getTime() - awaySinceMs);
    const remainingMs = totalMs - elapsedMs;

    if (remainingMs <= 0) {
      return { expired: true, text: 'Expired', hmText: '0h 00m' };
    }
    const totalSecs = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return {
      expired: false,
      text: `${hours > 0 ? `${hours}h ` : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`,
      hmText: `${hours}h ${mins < 10 ? '0' : ''}${mins}m`,
    };
  }, [currentStudentSeat, currentTime]);

  if (!currentStudentSeat) return null;

  const room = rooms.find((r) => r.id === currentStudentSeat.roomId);

  const handleRelease = () => {
    if (currentStudentSeat.status === 'away' && !awayCountdown?.expired) {
      alert('ব্রেক চলাকালীন সিট রিলিজ করা যাবে না।');
      return;
    }
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
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center font-mono font-semibold text-xs text-white shadow-xs shrink-0">
              {currentStudentSeat.seatNumber}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                  My Active Seat {currentStudentSeat.status === 'away' && '(On Break)'}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentStudentSeat.status === 'away' ? 'bg-amber-500 animate-pulse' : 'bg-teal-500'}`}></span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {room ? room.name : 'Study Room'} • {currentStudentSeat.status === 'away' ? `Break: ${awayCountdown?.text || 'Active'}` : elapsedStudyTime}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {currentStudentSeat.status === 'away' ? (
              !awayCountdown?.expired ? (
                <button
                  id="floating-return-locked-btn"
                  disabled
                  className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-400 text-[11px] font-medium flex items-center gap-1 cursor-not-allowed opacity-80"
                  title="ব্রেক টাইম শেষ হওয়ার আগে ক্যান্সেল করা যাবে না"
                >
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Locked ({awayCountdown?.text})</span>
                </button>
              ) : (
                <button
                  id="floating-return-btn"
                  onClick={() => returnFromAway(currentStudentSeat.id)}
                  className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors shadow-xs flex items-center gap-1 animate-pulse"
                  title="Return from break"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Return</span>
                </button>
              )
            ) : (
              <button
                id="floating-break-btn"
                onClick={onOpenAwayModal}
                className="px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-medium transition-colors flex items-center gap-1"
                title="Take a break (turns seat yellow)"
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

            {!(currentStudentSeat.status === 'away' && !awayCountdown?.expired) && (
              <button
                id="floating-release-btn"
                onClick={handleRelease}
                className="p-1.5 rounded-md border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors"
                title="Release Seat"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

