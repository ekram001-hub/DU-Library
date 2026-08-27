import React, { useMemo } from 'react';
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
      return { expired: true, text: '00:00', label: 'Time Expired' };
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
        cardBg: 'bg-slate-100/80 border-slate-300 text-slate-400 opacity-60',
        numColor: 'text-slate-500',
      };
    }

    // DIRECTIVE 3: Secondary booked on an orange seat turns completely BLUE
    if (seat.isSecondaryBooked) {
      return {
        cardBg:
          'bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-600 text-white border-2 border-blue-700 shadow-md ring-2 ring-blue-300/60 hover:brightness-105 active:scale-95',
        numColor: 'text-white font-bold',
      };
    }

    // DIRECTIVE 2: Away seat MUST show in prominent complete GREEN with large live countdown timer in Poppins
    if (seat.status === 'away') {
      return {
        cardBg:
          'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white border-2 border-emerald-500 shadow-md ring-2 ring-emerald-300/70 hover:brightness-105 active:scale-95',
        numColor: 'text-white font-bold',
      };
    }

    // My Seat: Glowing Teal / Emerald with Distinct Golden Ring
    if (isMySeat) {
      return {
        cardBg:
          'bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-900 text-white border-2 border-teal-400 ring-2 ring-amber-300 shadow-md hover:brightness-105',
        numColor: 'text-white font-bold',
      };
    }

    // DIRECTIVE 1: Occupied seat turns completely RED for other users
    if (seat.status === 'occupied') {
      return {
        cardBg:
          'bg-gradient-to-br from-rose-600 via-red-600 to-red-700 text-white border-2 border-red-700 shadow-md ring-2 ring-red-300/50 hover:brightness-105',
        numColor: 'text-white font-bold',
      };
    }

    // Available
    return {
      cardBg:
        'bg-white border-slate-200/90 hover:border-emerald-500 hover:bg-emerald-50/40 text-slate-700 shadow-2xs hover:shadow-xs',
      numColor: 'text-slate-800 group-hover:text-emerald-950 font-bold',
    };
  }, [seat.status, seat.isSecondaryBooked, isMySeat]);

  return (
    <button
      id={`seat-card-${seat.seatNumber}`}
      type="button"
      onClick={() => onSelectSeat(seat)}
      className={`group relative aspect-square p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border flex flex-col items-center justify-between transition-all duration-150 cursor-pointer select-none active:scale-95 overflow-hidden font-['Poppins',_sans-serif] ${statusTheme.cardBg}`}
      title={`Seat ${seat.seatNumber} • ${
        seat.status === 'available'
          ? 'Available (Click to book)'
          : seat.status === 'occupied'
          ? `Booked (${seat.occupantName || 'Student'}) - Click for details`
          : seat.status === 'away'
          ? `Temporary Break • ${awayCountdown?.text || 'Away'} remaining - Click for details`
          : 'Under Maintenance'
      }`}
    >
      {/* Top row: Female indicator & Status indicator badge */}
      <div className="w-full flex items-center justify-between gap-1 shrink-0">
        <div className="flex items-center gap-0.5">
          {seat.isFemaleReserved ? (
            <span
              className={`text-[9px] px-1 rounded-sm font-semibold ${
                seat.status === 'away' || seat.status === 'occupied' || seat.isSecondaryBooked
                  ? 'bg-black/30 text-pink-200'
                  : 'text-pink-600 bg-pink-50'
              }`}
              title="Female Reserved Seat"
            >
              🌸
            </span>
          ) : (
            <span className="w-2" />
          )}
        </div>

        {/* Status indicator badge */}
        <div>
          {isMySeat ? (
            <span
              className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-emerald-600 shadow-2xs"
              title="Your Active Seat"
            />
          ) : seat.isSecondaryBooked ? (
            <span
              className="inline-block w-2.5 h-2.5 rounded-full bg-sky-200 ring-2 ring-blue-400 shadow-2xs"
              title="Secondary Booked"
            />
          ) : seat.status === 'away' ? (
            <span
              className="inline-block w-2.5 h-2.5 rounded-full bg-white animate-ping"
              title="On Break"
            />
          ) : seat.status === 'occupied' ? (
            <span
              className="inline-block w-2 h-2 rounded-full bg-white/70 shadow-2xs"
              title="Occupied"
            />
          ) : null}
        </div>
      </div>

      {/* ============================================================== */}
      {/* CENTER BODY: CLEAN TYPOGRAPHY (NO SEAT ICON) */}
      {/* ============================================================== */}
      {seat.isSecondaryBooked ? (
        /* BLUE SECONDARY BOOKED DISPLAY */
        <div className="w-full flex-1 flex flex-col items-center justify-center my-0.5 sm:my-1 text-center font-['Poppins',_sans-serif]">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-sky-100 leading-tight">
            SEC. BOOKED
          </span>
          <div className="text-base sm:text-lg font-['Poppins',_sans-serif] font-black text-white tracking-wide leading-tight my-0.5 drop-shadow-xs">
            {awayCountdown ? awayCountdown.text : 'ACTIVE'}
          </div>
          <span className="text-[8px] sm:text-[9px] text-sky-100 font-medium truncate max-w-full px-1.5 py-0.5 bg-black/25 rounded-full">
            {seat.secondaryOccupantName ? seat.secondaryOccupantName.split(' ')[0] : '2nd User'}
          </span>
        </div>
      ) : seat.status === 'away' ? (
        /* GREEN AWAY DISPLAY WITH LIVE COUNTDOWN TIMER IN POPPINS FONT */
        <div className="w-full flex-1 flex flex-col items-center justify-center my-0.5 sm:my-1 text-center font-['Poppins',_sans-serif]">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-100 leading-tight">
            ON BREAK
          </span>
          <div className="text-base sm:text-lg md:text-xl font-['Poppins',_sans-serif] font-black text-white tracking-wider leading-none drop-shadow-xs my-0.5 animate-pulse">
            {awayCountdown ? awayCountdown.text : '30:00'}
          </div>
          <span className="text-[8px] sm:text-[9px] text-white/95 font-medium truncate max-w-full px-1.5 py-0.5 bg-black/30 rounded-full mt-0.5">
            {seat.awayReason === 'Prayer'
              ? '🕌 Prayer'
              : seat.awayReason === 'Lunch'
              ? '🍱 Lunch'
              : seat.awayReason === 'Tea'
              ? '☕ Tea'
              : seat.awayReason === 'Rest'
              ? '🛋️ Rest'
              : '⏳ Break'}
          </span>
        </div>
      ) : seat.status === 'occupied' ? (
        /* OCCUPIED (RED) SEAT: Clean seat number & Occupant Name */
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center font-['Poppins',_sans-serif]">
          <span className="text-base sm:text-lg font-['Poppins',_sans-serif] font-black text-white tracking-tight leading-none drop-shadow-2xs">
            {seat.seatNumber}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-red-100 uppercase tracking-wider mt-0.5">
            BOOKED
          </span>
        </div>
      ) : seat.status === 'available' ? (
        /* AVAILABLE SEAT: Prominent clean Seat Number */
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center font-['Poppins',_sans-serif]">
          <span className="text-base sm:text-lg md:text-xl font-['Poppins',_sans-serif] font-black text-slate-800 group-hover:text-emerald-700 group-hover:scale-105 transition-all tracking-tight leading-none">
            {seat.seatNumber}
          </span>
        </div>
      ) : (
        /* MAINTENANCE SEAT */
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center font-['Poppins',_sans-serif]">
          <span className="text-sm font-bold text-slate-400">
            {seat.seatNumber}
          </span>
        </div>
      )}

      {/* Bottom Status / Name Indicator */}
      <div className="w-full flex items-center justify-center shrink-0 font-['Poppins',_sans-serif]">
        {seat.isSecondaryBooked ? (
          <span className="text-[8px] sm:text-[9px] text-sky-100 font-medium truncate max-w-full">
            {seat.secondaryOccupantName ? `${seat.secondaryOccupantName.split(' ')[0]} (2nd)` : '2nd Booked'}
          </span>
        ) : seat.status === 'away' ? (
          <span className="text-[8px] sm:text-[9px] text-white/90 font-semibold truncate">
            {seat.occupantName ? seat.occupantName.split(' ')[0] : 'Away'}
          </span>
        ) : seat.status === 'occupied' ? (
          <span className="text-[8px] sm:text-[9px] text-white/95 font-semibold truncate max-w-full">
            {seat.occupantName ? seat.occupantName.split(' ')[0] : 'Booked'}
          </span>
        ) : seat.status === 'available' ? (
          <span className="text-[9px] text-emerald-700 group-hover:text-emerald-800 font-bold uppercase tracking-wider">
            Available
          </span>
        ) : (
          <span className="text-[9px] text-slate-400">Maintenance</span>
        )}
      </div>
    </button>
  );
};
