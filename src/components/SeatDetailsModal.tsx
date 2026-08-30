import React, { useMemo } from 'react';
import {
  X,
  Timer,
  LogOut,
  Sparkles,
  Ticket,
  RotateCcw,
  Lock,
  ChevronRight,
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
    secondaryBookSeat,
    releaseSecondaryBooking,
    adminForceReleaseSeat,
    adminToggleMaintenance,
    isAdminLoggedIn,
    currentTime,
  } = useLibrary();

  const [isSecondaryFormOpen, setIsSecondaryFormOpen] = React.useState(false);
  const [secName, setSecName] = React.useState('');
  const [secPhone, setSecPhone] = React.useState('');
  const [secStudentId, setSecStudentId] = React.useState('');

  React.useEffect(() => {
    if (currentStudent) {
      setSecName(currentStudent.name || '');
      setSecPhone(currentStudent.phone || '');
      setSecStudentId(currentStudent.studentId || '');
    }
  }, [currentStudent, isOpen]);

  // Rules of Hooks: every hook below MUST run before the early return.
  // This modal starts out hidden (isOpen=false / seat=null), so the early
  // "if (!isOpen || !seat) return null" used to sit ABOVE these useMemo
  // calls. The moment a student clicked a booked/away seat, isOpen and seat
  // both became truthy and render suddenly executed 3 extra hooks it hadn't
  // called on the previous (hidden) render — React throws "Rendered more
  // hooks than during the previous render" — so every hook stays up here.

  // Live remaining-time countdown, expressed as minutes:seconds (uncapped
  // minutes) so a multi-hour break still reads as one clean number instead
  // of switching formats mid-countdown — same convention as the seat card.
  const awayCountdown = useMemo(() => {
    if (!seat || seat.status !== 'away') {
      return null;
    }
    const rawAwaySince = seat.awaySince;
    let awaySinceMs = 0;
    if (typeof rawAwaySince === 'number') {
      awaySinceMs = rawAwaySince;
    } else if (typeof rawAwaySince === 'string') {
      awaySinceMs = new Date(rawAwaySince).getTime();
    }

    if (!awaySinceMs || isNaN(awaySinceMs)) {
      awaySinceMs = currentTime.getTime();
    }

    const durationMins = Number(seat.awayDurationMinutes) || 30;
    const totalMs = durationMins * 60 * 1000;
    const elapsedMs = Math.max(0, currentTime.getTime() - awaySinceMs);
    const remainingMs = totalMs - elapsedMs;

    if (remainingMs <= 0) {
      return { expired: true, mmss: '0:00', text: '00:00' };
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);

    return {
      expired: false,
      mmss: `${totalMinutes}:${secs < 10 ? '0' : ''}${secs}`,
      text: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
    };
  }, [seat, currentTime]);

  const bookedTimeFormatted = useMemo(() => {
    if (!seat?.bookedAt) return 'N/A';
    try {
      const d = new Date(seat.bookedAt);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'N/A';
    }
  }, [seat?.bookedAt]);

  const expectedLeaveFormatted = useMemo(() => {
    if (!seat?.expectedLeaveAt) return 'N/A';
    try {
      const d = new Date(seat.expectedLeaveAt);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'N/A';
    }
  }, [seat?.expectedLeaveAt]);

  if (!isOpen || !seat) return null;

  const isMySeat = Boolean(
    currentStudent &&
    (seat.status === 'occupied' || seat.status === 'away') &&
    ((seat.studentId && currentStudent.studentId && seat.studentId === currentStudent.studentId) ||
      (seat.occupantPhone && currentStudent.phone && seat.occupantPhone === currentStudent.phone) ||
      (seat.occupantName && currentStudent.name && seat.occupantName.toLowerCase() === currentStudent.name.toLowerCase()))
  );

  const isMySecondarySeat = Boolean(
    currentStudent &&
    seat.isSecondaryBooked &&
    ((seat.secondaryOccupantPhone && currentStudent.phone && seat.secondaryOccupantPhone === currentStudent.phone) ||
      (seat.secondaryOccupantStudentId && currentStudent.studentId && seat.secondaryOccupantStudentId === currentStudent.studentId))
  );

  const handleRelease = () => {
    if (window.confirm('Are you sure you want to release this seat?')) {
      releaseSeat(seat.id);
      onClose();
    }
  };

  const handleAdminForceRelease = () => {
    if (window.confirm('Admin Action: Force release this seat?')) {
      adminForceReleaseSeat(seat.id);
      onClose();
    }
  };

  const handleAdminMaintenance = () => {
    adminToggleMaintenance(seat.id);
    onClose();
  };

  const reasonLabel =
    seat.awayReason === 'Prayer'
      ? 'Prayer Break 🕌'
      : seat.awayReason === 'Lunch'
      ? 'Meal Break 🍱'
      : seat.awayReason === 'Tea'
      ? 'Tea & Snack ☕'
      : seat.awayReason === 'Rest'
      ? 'Rest & Refresh 🛋️'
      : 'Emergency Break ⚡';

  // Header accent: one color per state, everything else stays neutral.
  const accent = seat.isSecondaryBooked
    ? { chip: 'bg-blue-600', text: 'text-blue-600', soft: 'bg-blue-50', softText: 'text-blue-700' }
    : seat.status === 'away'
    ? { chip: 'bg-amber-400', text: 'text-amber-600', soft: 'bg-amber-50', softText: 'text-amber-700' }
    : isMySeat
    ? { chip: 'bg-green-600', text: 'text-green-600', soft: 'bg-green-50', softText: 'text-green-700' }
    : seat.status === 'occupied'
    ? { chip: 'bg-red-600', text: 'text-red-600', soft: 'bg-red-50', softText: 'text-red-700' }
    : { chip: 'bg-slate-900', text: 'text-slate-900', soft: 'bg-slate-50', softText: 'text-slate-600' };

  const title = seat.isSecondaryBooked
    ? 'Secondary Session'
    : seat.status === 'away'
    ? 'On a Break'
    : seat.status === 'occupied'
    ? isMySeat
      ? 'Your Seat'
      : 'Occupied'
    : seat.status === 'maintenance'
    ? 'Under Maintenance'
    : 'Available Seat';

  return (
    <div
      id="seat-details-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn font-['Poppins',_sans-serif]"
    >
      <div
        id="seat-details-modal-card"
        className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-slideUp max-h-[88vh] flex flex-col"
      >
        {/* Header — minimal, no colored block */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl ${accent.chip} flex items-center justify-center shrink-0 text-white font-mono font-black text-sm`}>
              {seat.seatNumber}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">{title}</h3>
                {(isMySeat || isMySecondarySeat) && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${accent.soft} ${accent.softText}`}>
                    You
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">{room ? room.name : 'Study Room'}</p>
            </div>
          </div>

          <button
            id="close-seat-details-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="px-5 pb-5 space-y-4 overflow-y-auto">
          {/* Secondary booking summary */}
          {seat.isSecondaryBooked ? (
            <div className="flex flex-col items-center text-center py-2">
              <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-wide">
                Temporarily studying here
              </span>
              <span className="text-lg font-bold text-slate-900 mt-1">{seat.secondaryOccupantName}</span>
              <span className="text-xs text-slate-400 mt-0.5">
                Seat owner back in {awayCountdown ? awayCountdown.text : '—'}
              </span>
            </div>
          ) : seat.status === 'away' ? (
            /* Big centered M:SS countdown, Poppins, minimal chrome */
            <div className="flex flex-col items-center text-center py-1">
              <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wide">
                Time remaining
              </span>
              <span className="text-5xl font-black font-mono text-amber-500 tracking-tight mt-1">
                {awayCountdown ? awayCountdown.mmss : '30:00'}
              </span>
              <span className="text-xs text-slate-400 mt-1.5">{reasonLabel}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between px-1 py-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${accent.chip}`} />
                <span className="text-sm font-semibold text-slate-700">{title}</span>
              </div>
              {seat.isFemaleReserved && (
                <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 text-[10px] font-bold">
                  🌸 Female Reserved
                </span>
              )}
            </div>
          )}

          {seat.status === 'away' && !awayCountdown?.expired && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-700">
              <Lock className="w-3 h-3 shrink-0" />
              <span>টাইম শেষ হওয়ার আগে ব্রেক ক্যান্সেল করা যাবে না</span>
            </div>
          )}

          {/* Occupant details — clean list, no boxes-within-boxes */}
          {seat.status !== 'available' && seat.status !== 'maintenance' && (
            <div className="rounded-2xl bg-slate-50 px-4 py-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Name</span>
                <span className="font-bold text-slate-900">{seat.occupantName || 'Registered Student'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Student ID</span>
                <span className="font-mono font-semibold text-slate-700">{seat.studentId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Phone</span>
                <span className="font-mono font-semibold text-slate-700">{seat.occupantPhone || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Booked at</span>
                <span className="font-mono font-semibold text-slate-700">{bookedTimeFormatted}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Valid until</span>
                <span className="font-mono font-semibold text-slate-700">{expectedLeaveFormatted}</span>
              </div>
            </div>
          )}

          {/* Secondary occupant details */}
          {seat.isSecondaryBooked && (
            <div className="rounded-2xl bg-blue-50 px-4 py-3.5 space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-500 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Temporary occupant</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-blue-400">Name</span>
                <span className="font-bold text-blue-950">{seat.secondaryOccupantName || '2nd Student'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-blue-400">Student ID</span>
                <span className="font-mono font-semibold text-blue-900">{seat.secondaryOccupantStudentId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-blue-400">Phone</span>
                <span className="font-mono font-semibold text-blue-900">{seat.secondaryOccupantPhone || 'N/A'}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Available -> Book */}
            {seat.status === 'available' && (
              <button
                id="btn-modal-book-now"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBook();
                }}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Book This Seat</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* On someone else's break -> offer secondary booking */}
            {seat.status === 'away' && !isMySeat && !seat.isSecondaryBooked && (
              <div className="space-y-2">
                {!isSecondaryFormOpen ? (
                  <button
                    id="btn-secondary-book-open"
                    type="button"
                    onClick={() => setIsSecondaryFormOpen(true)}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Study Here Temporarily</span>
                  </button>
                ) : (
                  <div className="p-3.5 bg-blue-50 rounded-2xl space-y-2 text-xs animate-fadeIn">
                    <p className="font-bold text-blue-900 text-[11px]">Confirm your details</p>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={secName}
                      onChange={(e) => setSecName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-blue-100 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number (e.g. 017...)"
                      value={secPhone}
                      onChange={(e) => setSecPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-blue-100 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Student ID (Optional)"
                      value={secStudentId}
                      onChange={(e) => setSecStudentId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-blue-100 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                    <div className="flex gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setIsSecondaryFormOpen(false)}
                        className="w-1/2 py-2 rounded-xl bg-white text-slate-600 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!secName.trim() || !secPhone.trim()) {
                            alert('Please enter your name and phone number.');
                            return;
                          }
                          secondaryBookSeat(seat.id, {
                            name: secName,
                            phone: secPhone,
                            studentId: secStudentId,
                            gender: currentStudent?.gender || 'male',
                          });
                          setIsSecondaryFormOpen(false);
                          onClose();
                        }}
                        className="w-1/2 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* My secondary booking -> release */}
            {seat.isSecondaryBooked && (isMySecondarySeat || isAdminLoggedIn) && (
              <button
                id="btn-release-secondary"
                type="button"
                onClick={() => {
                  releaseSecondaryBooking(seat.id);
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave Temporary Seat</span>
              </button>
            )}

            {/* My primary seat */}
            {isMySeat && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {seat.status === 'away' ? (
                    !awayCountdown?.expired ? (
                      <button
                        id="btn-return-break-locked"
                        type="button"
                        disabled
                        title="ব্রেক টাইম শেষ হওয়ার আগে ক্যান্সেল বা রিটার্ন করা যাবে না"
                        className="py-3 rounded-2xl bg-slate-50 text-slate-400 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Locked</span>
                      </button>
                    ) : (
                      <button
                        id="btn-return-break"
                        type="button"
                        onClick={() => {
                          returnFromAway(seat.id);
                          onClose();
                        }}
                        className="py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>I'm Back</span>
                      </button>
                    )
                  ) : (
                    <button
                      id="btn-take-break"
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAwayTimer();
                      }}
                      className="py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Timer className="w-4 h-4" />
                      <span>Take Break</span>
                    </button>
                  )}

                  <button
                    id="btn-view-pass"
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPass();
                    }}
                    className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Pass</span>
                  </button>
                </div>

                {seat.status === 'away' && !awayCountdown?.expired ? (
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 py-1">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>ব্রেক চলাকালীন সিট রিলিজ ও রিটার্ন লক করা আছে</span>
                  </div>
                ) : (
                  <button
                    id="btn-release-seat"
                    type="button"
                    onClick={handleRelease}
                    className="w-full py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Release Seat</span>
                  </button>
                )}
              </div>
            )}

            {/* Admin Override Controls */}
            {isAdminLoggedIn && (
              <div className="pt-3 mt-1 border-t border-slate-100 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  Admin
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleAdminForceRelease}
                    className="py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Force Release
                  </button>

                  <button
                    type="button"
                    onClick={handleAdminMaintenance}
                    className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {seat.status === 'maintenance' ? 'Activate Seat' : 'Set Maintenance'}
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
