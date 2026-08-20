import React, { useMemo } from 'react';
import {
  Armchair,
  Timer,
  Clock,
  RotateCcw,
  LogOut,
  Ticket,
  Sparkles,
  ChevronUp,
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
    if (!currentStudentSeat.bookedAt) return '0 মিনিট';
    const diffMs = currentTime.getTime() - currentStudentSeat.bookedAt;
    const totalMinutes = Math.floor(diffMs / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      return `${hours} ঘণ্টা ${mins} মি`;
    }
    return `${mins} মিনিট`;
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
      return { expired: true, text: 'সময় শেষ' };
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
    if (window.confirm('আপনি কি নিশ্চিতভাবে এই সিটটি ত্যাগ করতে চান?')) {
      releaseSeat(currentStudentSeat.id);
    }
  };

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-slideUp">
      <div className="rounded-2xl bg-slate-900/95 backdrop-blur-md border border-sky-500/50 shadow-2xl p-3 sm:p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          {/* Seat & Status Information */}
          <div
            onClick={() => onSelectSeat(currentStudentSeat)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center font-mono font-bold text-sm shadow-lg shadow-sky-600/30 group-hover:scale-105 transition-transform">
              {currentStudentSeat.seatNumber}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-sky-300 group-hover:text-white transition-colors">
                  আমার সক্রিয় সিট
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-1">
                {room ? room.bengaliName.split('(')[0] : 'Study Room'} • {elapsedStudyTime}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            {currentStudentSeat.status === 'away' ? (
              <button
                id="floating-return-btn"
                onClick={() => returnFromAway(currentStudentSeat.id)}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1"
                title="Return from break"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ফিরেছি {awayCountdown && `(${awayCountdown.text})`}</span>
              </button>
            ) : (
              <button
                id="floating-break-btn"
                onClick={onOpenAwayModal}
                className="px-2.5 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all flex items-center gap-1"
                title="Take a short break"
              >
                <Timer className="w-3.5 h-3.5" />
                <span>বিরতি</span>
              </button>
            )}

            <button
              id="floating-pass-btn"
              onClick={onOpenPassModal}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white transition-all border border-slate-700"
              title="View Digital Pass"
            >
              <Ticket className="w-4 h-4" />
            </button>

            <button
              id="floating-release-btn"
              onClick={handleRelease}
              className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 transition-all"
              title="Release Seat"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
