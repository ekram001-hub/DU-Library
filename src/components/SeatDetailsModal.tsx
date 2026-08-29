import React, { useMemo } from 'react';
import {
  X,
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
  Lock,
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
  // hooks than during the previous render" and the app's ErrorBoundary
  // catches it, showing "Something went wrong". (Same bug class already
  // fixed once in MySeatFloatingWidget — see commit 7333911.)

  // Calculate live countdown in H:M format
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
      return { expired: true, text: '00:00', hmText: '0h 00m' };
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return {
      expired: false,
      text: `${hours > 0 ? `${hours}:` : ''}${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`,
      hmText: `${hours}h ${mins < 10 ? '0' : ''}${mins}m`,
      hours,
      mins,
      secs,
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

  return (
    <div
      id="seat-details-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn font-['Poppins',_sans-serif]"
    >
      <div
        id="seat-details-modal-card"
        className="relative w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-slideUp"
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            seat.isSecondaryBooked
              ? 'bg-blue-600 text-white border-blue-700'
              : seat.status === 'away'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-slate-50 border-slate-100 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm shadow-xs ${
                seat.isSecondaryBooked
                  ? 'bg-white text-blue-600'
                  : seat.status === 'away'
                  ? 'bg-white text-emerald-700'
                  : 'bg-white border border-slate-200 text-slate-800'
              }`}
            >
              {seat.seatNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold leading-tight">
                  {seat.isSecondaryBooked
                    ? 'Secondary Active (Temporary Study)'
                    : seat.status === 'away'
                    ? 'Temporary Break (Green Seat)'
                    : 'Seat Details'}
                </h3>
                {isMySeat && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      seat.status === 'away' || seat.isSecondaryBooked
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    My Seat
                  </span>
                )}
                {isMySecondarySeat && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-white/20 text-white">
                    My Temp Seat
                  </span>
                )}
              </div>
              <p
                className={`text-xs ${
                  seat.status === 'away' || seat.isSecondaryBooked ? 'text-emerald-100' : 'text-slate-500'
                }`}
              >
                {room ? room.name : 'Study Room'}
              </p>
            </div>
          </div>

          <button
            id="close-seat-details-btn"
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              seat.status === 'away' || seat.isSecondaryBooked
                ? 'text-white/80 hover:text-white hover:bg-white/10'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3.5 font-['Poppins',_sans-serif]">
          {/* Secondary Booked Blue Banner */}
          {seat.isSecondaryBooked ? (
            <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-400 text-center space-y-1.5 shadow-2xs">
              <div className="text-xs font-bold text-blue-800 flex items-center justify-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Secondary Temporary Session Active (Blue Seat)</span>
              </div>
              <div className="text-sm font-semibold text-blue-900">
                Temp Occupant: <span className="font-bold">{seat.secondaryOccupantName}</span> ({seat.secondaryOccupantStudentId || 'Student'})
              </div>
              <div className="text-xs text-blue-700 font-medium">
                Original Owner on break ({awayCountdown ? awayCountdown.text : 'Away remaining'})
              </div>
            </div>
          ) : seat.status === 'away' ? (
            /* Away Big Timer Banner in Green (Emerald) in Poppins Font */
            <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-center space-y-1.5 shadow-2xs">
              <div className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5 uppercase tracking-wide">
                <Timer className="w-4 h-4 text-emerald-600" />
                <span>Away Remaining Time (H:M Live Countdown)</span>
              </div>
              <div className="text-3xl sm:text-4xl font-['Poppins',_sans-serif] font-black text-emerald-700 tracking-wider animate-pulse my-1">
                {awayCountdown ? awayCountdown.hmText : '0h 30m'}
              </div>
              <div className="text-xs font-mono font-bold text-emerald-600">
                ({awayCountdown ? awayCountdown.text : '30:00'} remaining)
              </div>
              <div className="text-xs text-emerald-800 font-semibold">
                Reason: {seat.awayReason === 'Prayer' ? 'Prayer Break 🕌' : seat.awayReason === 'Lunch' ? 'Meal Break 🍱' : seat.awayReason === 'Tea' ? 'Tea & Snack ☕' : seat.awayReason === 'Rest' ? 'Rest & Refresh 🛋️' : 'Emergency Break ⚡'}
              </div>
              {!awayCountdown?.expired && (
                <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-1.5 flex items-center justify-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>টাইম শেষ হওয়ার আগে ব্রেক ক্যান্সেল করা যাবে না</span>
                </div>
              )}
            </div>
          ) : (
            /* Status Banner for other states */
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
                seat.status === 'available'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                  : seat.status === 'occupied'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
                <span className="font-semibold">
                  {seat.status === 'available'
                    ? 'Seat Available'
                    : seat.status === 'occupied'
                    ? 'Seat Booked (Occupied - Red)'
                    : 'Under Maintenance'}
                </span>
              </div>

              {seat.isFemaleReserved && (
                <span className="px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 border border-pink-200 text-[10px] font-bold">
                  🌸 Female Reserved
                </span>
              )}
            </div>
          )}

          {/* Primary Occupant Info Card (Visible for occupied, away, or secondary booked) */}
          {seat.status !== 'available' && seat.status !== 'maintenance' && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Primary Occupant User Details</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {seat.status === 'away' ? '🟢 On Break' : seat.status === 'occupied' ? '🔴 Booked' : '🔵 Booked'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Name:</span>
                <span className="font-bold text-slate-900">{seat.occupantName || 'Registered Student'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Student ID:</span>
                <span className="font-mono text-slate-800 font-semibold">{seat.studentId || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Contact Phone:</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {seat.occupantPhone || 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Booking Time:</span>
                <span className="font-mono text-emerald-700 font-semibold">{bookedTimeFormatted}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Valid Until:</span>
                <span className="font-mono text-slate-800 font-semibold">{expectedLeaveFormatted}</span>
              </div>
            </div>
          )}

          {/* Secondary Occupant Details Card (if seat is secondary booked) */}
          {seat.isSecondaryBooked && (
            <div className="bg-blue-50/70 rounded-xl p-3.5 border border-blue-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-blue-900 border-b border-blue-200 pb-1.5">
                <span className="flex items-center gap-1.5 text-blue-800">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Temporary (2nd) Occupant Details</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                  Active Temp Study
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-blue-100 pb-1">
                <span className="text-blue-700">Name:</span>
                <span className="font-bold text-blue-950">{seat.secondaryOccupantName || '2nd Student'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-blue-100 pb-1">
                <span className="text-blue-700">Student ID:</span>
                <span className="font-mono text-blue-950 font-semibold">{seat.secondaryOccupantStudentId || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-blue-700">Contact Phone:</span>
                <span className="font-mono text-blue-950 font-semibold">
                  {seat.secondaryOccupantPhone || 'N/A'}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* If seat is available -> Book Button */}
            {seat.status === 'available' && (
              <button
                id="btn-modal-book-now"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBook();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Book This Seat</span>
              </button>
            )}

            {/* If seat is on Break (Orange) and not isMySeat and not yet secondary booked -> Option for other student to secondary book */}
            {seat.status === 'away' && !isMySeat && !seat.isSecondaryBooked && (
              <div className="space-y-2">
                {!isSecondaryFormOpen ? (
                  <button
                    id="btn-secondary-book-open"
                    type="button"
                    onClick={() => setIsSecondaryFormOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-sky-200" />
                    <span>Take Temporary Study Seat (Turns Seat Blue)</span>
                  </button>
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs animate-fadeIn">
                    <p className="font-bold text-blue-900">Confirm Temporary Study Session</p>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={secName}
                      onChange={(e) => setSecName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number (e.g. 017...)"
                      value={secPhone}
                      onChange={(e) => setSecPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Student ID (Optional)"
                      value={secStudentId}
                      onChange={(e) => setSecStudentId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsSecondaryFormOpen(false)}
                        className="w-1/2 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-300"
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
                        className="w-1/2 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
                      >
                        Confirm (Turn Blue)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If isMySecondarySeat -> Release button */}
            {seat.isSecondaryBooked && (isMySecondarySeat || isAdminLoggedIn) && (
              <button
                id="btn-release-secondary"
                type="button"
                onClick={() => {
                  releaseSecondaryBooking(seat.id);
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave Temporary Seat</span>
              </button>
            )}

            {/* If it's my primary seat */}
            {isMySeat && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {seat.status === 'away' ? (
                    !awayCountdown?.expired ? (
                      <button
                        id="btn-return-break-locked"
                        type="button"
                        disabled
                        title="ব্রেক টাইম শেষ হওয়ার আগে ক্যান্সেল বা রিটার্ন করা যাবে না"
                        className="py-2.5 px-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-400 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
                      >
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span>Locked ({awayCountdown?.text || 'Away'})</span>
                      </button>
                    ) : (
                      <button
                        id="btn-return-break"
                        type="button"
                        onClick={() => {
                          returnFromAway(seat.id);
                          onClose();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer animate-pulse"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>I'm Back (ব্রেক শেষ)</span>
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
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
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
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Ticket className="w-4 h-4 text-amber-400" />
                    <span>View Pass</span>
                  </button>
                </div>

                {seat.status === 'away' && !awayCountdown?.expired ? (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] text-center flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>ব্রেক চলাকালীন সিট রিলিজ ও রিটার্ন লক করা আছে</span>
                  </div>
                ) : (
                  <button
                    id="btn-release-seat"
                    type="button"
                    onClick={handleRelease}
                    className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Release Seat</span>
                  </button>
                )}
              </div>
            )}

            {/* Admin Override Controls */}
            {isAdminLoggedIn && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Admin Controls
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleAdminForceRelease}
                    className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Force Release
                  </button>

                  <button
                    type="button"
                    onClick={handleAdminMaintenance}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
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
