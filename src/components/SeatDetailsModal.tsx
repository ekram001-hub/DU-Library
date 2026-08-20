import React from 'react';
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
    adminForceReleaseSeat,
    adminToggleMaintenance,
    isAdminLoggedIn,
    currentTime,
  } = useLibrary();

  if (!isOpen || !seat) return null;

  const isMySeat =
    currentStudent &&
    (seat.status === 'occupied' || seat.status === 'away') &&
    ((seat.studentId && seat.studentId === currentStudent.studentId) ||
      (seat.occupantPhone && seat.occupantPhone === currentStudent.phone) ||
      (seat.occupantName && seat.occupantName.toLowerCase() === currentStudent.name.toLowerCase()));

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800 font-mono font-bold text-sm shadow-xs">
              {seat.seatNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Seat Details</h3>
                {isMySeat && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-700">
                    My Seat
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {room ? room.name : 'Study Room'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5">
          {/* Status Banner */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
              seat.status === 'available'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-700'
                : seat.status === 'away'
                ? 'bg-amber-50/70 border-amber-200 text-amber-700'
                : seat.status === 'occupied'
                ? 'bg-rose-50/70 border-rose-200 text-rose-700'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-current"></span>
              <span>
                {seat.status === 'available'
                  ? 'Available'
                  : seat.status === 'away'
                  ? `On Break (${seat.awayReason || 'Away'})`
                  : seat.status === 'occupied'
                  ? 'Occupied'
                  : 'Under Maintenance'}
              </span>
            </div>

            {seat.isFemaleReserved && (
              <span className="px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 border border-pink-200 text-[10px] font-medium">
                Female Reserved
              </span>
            )}
          </div>

          {/* Occupant Info if occupied or away */}
          {seat.status !== 'available' && seat.status !== 'maintenance' && (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Occupant:</span>
                <span className="font-semibold text-slate-800">{seat.occupantName}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Student ID:</span>
                <span className="font-mono text-slate-700">{seat.studentId || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Contact:</span>
                <span className="font-mono text-slate-700">
                  {isAdminLoggedIn || isMySeat
                    ? seat.occupantPhone
                    : seat.occupantPhone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Check-in:</span>
                <span className="font-mono text-emerald-600 font-semibold">{bookedTimeFormatted}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Valid Until:</span>
                <span className="font-mono text-amber-600 font-semibold">{expectedLeaveFormatted}</span>
              </div>
            </div>
          )}

          {/* Action Buttons based on User Context */}
          <div className="space-y-2 pt-1">
            {/* If seat is available -> Book Button */}
            {seat.status === 'available' && (
              <button
                id="btn-modal-book-now"
                onClick={() => {
                  onClose();
                  onOpenBook();
                }}
                className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Armchair className="w-3.5 h-3.5" />
                <span>Book This Seat</span>
              </button>
            )}

            {/* If it's my seat */}
            {isMySeat && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {seat.status === 'away' ? (
                    <button
                      id="btn-return-break"
                      onClick={() => {
                        returnFromAway(seat.id);
                        onClose();
                      }}
                      className="py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>I am Back</span>
                    </button>
                  ) : (
                    <button
                      id="btn-take-break"
                      onClick={() => {
                        onClose();
                        onOpenAwayTimer();
                      }}
                      className="py-2 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>Take Break</span>
                    </button>
                  )}

                  <button
                    id="btn-view-pass"
                    onClick={() => {
                      onClose();
                      onOpenPass();
                    }}
                    className="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>View Pass</span>
                  </button>
                </div>

                <button
                  id="btn-release-seat"
                  onClick={handleRelease}
                  className="w-full py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Release Seat</span>
                </button>
              </div>
            )}

            {/* Admin Override Controls */}
            {isAdminLoggedIn && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Admin Controls
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAdminForceRelease}
                    className="py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-medium transition-colors"
                  >
                    Force Release
                  </button>

                  <button
                    onClick={handleAdminMaintenance}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
                  >
                    {seat.status === 'maintenance' ? 'Set Active' : 'Set Maintenance'}
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

