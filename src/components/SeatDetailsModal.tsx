import React, { useMemo } from 'react';
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

  if (!isOpen || !seat) return null;

  const isMySeat =
    currentStudent &&
    (seat.status === 'occupied' || seat.status === 'away') &&
    ((seat.studentId && seat.studentId === currentStudent.studentId) ||
      (seat.occupantPhone && seat.occupantPhone === currentStudent.phone) ||
      (seat.occupantName && seat.occupantName.toLowerCase() === currentStudent.name.toLowerCase()));

  const isMySecondarySeat =
    currentStudent &&
    seat.isSecondaryBooked &&
    ((seat.secondaryOccupantPhone && seat.secondaryOccupantPhone === currentStudent.phone) ||
      (seat.secondaryOccupantStudentId && seat.secondaryOccupantStudentId === currentStudent.studentId));

  // Calculate live countdown
  const awayCountdown = useMemo(() => {
    if (seat.status !== 'away' || !seat.awaySince || !seat.awayDurationMinutes) {
      return null;
    }
    const elapsedMs = currentTime.getTime() - seat.awaySince;
    const totalMs = seat.awayDurationMinutes * 60 * 1000;
    const remainingMs = totalMs - elapsedMs;

    if (remainingMs <= 0) {
      return { expired: true, text: 'Time Up' };
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return {
      expired: false,
      text: `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`,
    };
  }, [seat, currentTime]);

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
              ? 'bg-orange-500 text-white border-orange-600'
              : 'bg-slate-50 border-slate-100 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm shadow-xs ${
                seat.isSecondaryBooked
                  ? 'bg-white text-blue-600'
                  : seat.status === 'away'
                  ? 'bg-white text-orange-600'
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
                    ? 'Temporary Break (Away)'
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
                  seat.status === 'away' || seat.isSecondaryBooked ? 'text-blue-100' : 'text-slate-500'
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
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Secondary Booked Blue Banner */}
          {seat.isSecondaryBooked ? (
            <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-400 text-center space-y-1 shadow-2xs">
              <div className="text-xs font-bold text-blue-800 flex items-center justify-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Secondary Temporary Session Active (Blue Seat)</span>
              </div>
              <div className="text-sm font-semibold text-blue-900">
                Temp Occupant: <span className="font-bold">{seat.secondaryOccupantName}</span> ({seat.secondaryOccupantStudentId || 'Student'})
              </div>
              <div className="text-xs text-blue-700">
                Original Owner on break ({awayCountdown ? awayCountdown.text : 'Away remaining'})
              </div>
            </div>
          ) : seat.status === 'away' ? (
            /* Away Big Timer Banner if status is away */
            <div className="p-4 rounded-xl bg-orange-50 border-2 border-orange-400 text-center space-y-1 shadow-2xs">
              <div className="text-xs font-bold text-orange-800 flex items-center justify-center gap-1.5 uppercase tracking-wide">
                <Timer className="w-4 h-4 text-orange-600" />
                <span>Away Remaining Time (Live Countdown)</span>
              </div>
              <div className="text-3xl font-mono font-black text-orange-600 tracking-wider animate-pulse">
                {awayCountdown ? awayCountdown.text : '30:00'}
              </div>
              <div className="text-xs text-orange-700 font-medium">
                Reason: {seat.awayReason === 'Prayer' ? 'Prayer Break 🕌' : seat.awayReason === 'Lunch' ? 'Meal Break 🍱' : seat.awayReason === 'Tea' ? 'Tea & Snack ☕' : seat.awayReason === 'Rest' ? 'Rest & Refresh 🛋️' : 'Emergency Break ⚡'}
              </div>
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

          {/* Occupant Info if occupied or away */}
          {seat.status !== 'available' && seat.status !== 'maintenance' && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Primary Occupant:</span>
                <span className="font-semibold text-slate-800">{seat.occupantName}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Student ID:</span>
                <span className="font-mono text-slate-700">{seat.studentId || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Contact:</span>
                <span className="font-mono text-slate-700">
                  {isAdminLoggedIn || isMySeat
                    ? seat.occupantPhone
                    : seat.occupantPhone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Booking Time:</span>
                <span className="font-mono text-emerald-700 font-semibold">{bookedTimeFormatted}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Valid Until:</span>
                <span className="font-mono text-slate-800 font-semibold">{expectedLeaveFormatted}</span>
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
                <Armchair className="w-4 h-4 text-emerald-400" />
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
                    <button
                      id="btn-return-break"
                      type="button"
                      onClick={() => {
                        returnFromAway(seat.id);
                        onClose();
                      }}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>I'm Back</span>
                    </button>
                  ) : (
                    <button
                      id="btn-take-break"
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAwayTimer();
                      }}
                      className="py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
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

                <button
                  id="btn-release-seat"
                  type="button"
                  onClick={handleRelease}
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Release Seat</span>
                </button>
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
