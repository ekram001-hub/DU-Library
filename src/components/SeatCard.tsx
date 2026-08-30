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
    return Boolean(
      (seat.studentId && currentStudent.studentId && seat.studentId === currentStudent.studentId) ||
      (seat.occupantPhone && currentStudent.phone && seat.occupantPhone === currentStudent.phone) ||
      (seat.occupantName && currentStudent.name && seat.occupantName.toLowerCase() === currentStudent.name.toLowerCase())
    );
  }, [seat, currentStudent]);

  // Calculate live away countdown if seat is on break with H:M format
  const awayCountdown = useMemo(() => {
    if (seat.status !== 'away') {
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
    const totalMinutes = Math.floor(totalSeconds / 60);

    return {
      expired: false,
      text: `${hours > 0 ? `${hours}:` : ''}${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`,
      hmText: `${hours}h ${mins < 10 ? '0' : ''}${mins}m`,
      // Minutes:seconds, uncapped at 60 minutes — used for the seat card's
      // own countdown display so a multi-hour break still reads as a single
      // clean "M:SS" instead of switching to "H:MM:SS" mid-card.
      mmss: `${totalMinutes}:${secs < 10 ? '0' : ''}${secs}`,
      hours,
      mins,
      secs,
    };
  }, [seat.status, seat.awaySince, seat.awayDurationMinutes, currentTime]);

  // Card theme styling
  const statusTheme = useMemo(() => {
    if (seat.status === 'maintenance') {
      return {
        cardBg: 'bg-slate-100/80 border-slate-300 text-slate-400 opacity-60',
        numColor: 'text-slate-500',
      };
    }

    // Secondary booking: sky blue for everyone (owner and other students see
    // the same color — there's nothing to hide here, unlike a primary booking).
    if (seat.isSecondaryBooked) {
      return {
        cardBg:
          'bg-gradient-to-br from-sky-500 via-sky-600 to-blue-600 text-white border-2 border-sky-700 shadow-md ring-2 ring-sky-300/60 hover:brightness-105 active:scale-95',
        numColor: 'text-white font-bold',
      };
    }

    // Temporary break (away): yellow for everyone — the seat holder and
    // every other student see the exact same color here.
    if (seat.status === 'away') {
      return {
        cardBg:
          'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-500 text-amber-950 border-2 border-amber-500 shadow-md ring-2 ring-amber-200/70 hover:brightness-105 active:scale-95',
        numColor: 'text-amber-950 font-bold',
      };
    }

    // Booked, and it's MY seat: green.
    if (isMySeat) {
      return {
        cardBg:
          'bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 text-white border-2 border-green-500 ring-2 ring-emerald-200/70 shadow-md hover:brightness-105',
        numColor: 'text-white font-bold',
      };
    }

    // Booked, seen by anyone else: red.
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
      className={`group relative aspect-square p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border flex flex-col items-center justify-between transition-all duration-150 cursor-pointer select-none active:scale-95 overflow-hidden font-['Poppins',_sans-serif] ${statusTheme.cardBg}`}
      title={`Seat ${seat.seatNumber} • ${
        seat.status === 'available'
          ? 'Available (Click to book)'
          : seat.status === 'occupied'
          ? `Booked (${seat.occupantName || 'Student'}) - Click for details`
          : seat.status === 'away'
          ? `Temporary Break • ${awayCountdown?.hmText || 'Away'} remaining - Click for details`
          : 'Under Maintenance'
      }`}
    >
      {/* Top row: Female indicator & Status indicator badge */}
      <div className="w-full flex items-center justify-between gap-0.5 shrink-0 px-0.5">
        <div className="flex items-center gap-0.5">
          {seat.isFemaleReserved ? (
            <span
              className={`text-[8px] sm:text-[9px] px-1 rounded-sm font-semibold ${
                seat.status === 'away' || seat.status === 'occupied' || seat.isSecondaryBooked
                  ? 'bg-black/30 text-pink-200'
                  : 'text-pink-600 bg-pink-50'
              }`}
              title="Female Reserved Seat"
            >
              🌸
            </span>
          ) : (
            <span className="w-1.5" />
          )}
        </div>

        {/* Status indicator badge */}
        <div>
          {isMySeat ? (
            <span
              className="inline-block w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-300 ring-2 ring-emerald-600 shadow-2xs"
              title="Your Active Seat"
            />
          ) : seat.isSecondaryBooked ? (
            <span
              className="inline-block w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-sky-200 ring-2 ring-blue-400 shadow-2xs"
              title="Secondary Booked"
            />
          ) : seat.status === 'away' ? (
            <span
              className="inline-block w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-white animate-ping"
              title="On Break"
            />
          ) : seat.status === 'occupied' ? (
            <span
              className="inline-block w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-white/70 shadow-2xs"
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
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center font-['Poppins',_sans-serif] px-0.5">
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-sky-100 leading-tight">
            SEC. BOOKED
          </span>
          <div className="whitespace-nowrap text-xs sm:text-sm font-['Poppins',_sans-serif] font-black text-white tracking-tight leading-tight my-0.5 drop-shadow-xs">
            {awayCountdown ? awayCountdown.hmText : 'ACTIVE'}
          </div>
          <span className="text-[7px] sm:text-[8px] text-sky-100 font-medium truncate max-w-full px-1 py-0.2 bg-black/25 rounded-full">
            {seat.secondaryOccupantName ? seat.secondaryOccupantName.split(' ')[0] : '2nd User'}
          </span>
        </div>
      ) : seat.status === 'away' ? (
        /* YELLOW AWAY DISPLAY: small seat number on top, big centered M:SS live countdown */
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center font-['Poppins',_sans-serif] px-0.5 my-auto">
          <span className="whitespace-nowrap inline-block max-w-full text-[7px] sm:text-[8px] font-bold text-amber-900/80 tracking-tight leading-tight">
            {seat.seatNumber}
          </span>
          <div className="whitespace-nowrap text-xs sm:text-sm font-['Poppins',_sans-serif] font-black font-mono text-amber-950 tracking-tight leading-tight drop-shadow-xs mt-0.5">
            {awayCountdown ? awayCountdown.mmss : '30:00'}
          </div>
        </div>
      ) : seat.status === 'occupied' ? (
        /* OCCUPIED (RED) SEAT: Clean seat number & Occupant Name */
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center font-['Poppins',_sans-serif] px-0.5">
          <span className="whitespace-nowrap inline-block max-w-full text-xs sm:text-sm font-['Poppins',_sans-serif] font-black text-white tracking-tight leading-tight drop-shadow-2xs">
            {seat.seatNumber}
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold text-red-100 uppercase tracking-wider mt-0.5">
            BOOKED
          </span>
        </div>
      ) : seat.status === 'available' ? (
        /* AVAILABLE SEAT: Prominent clean Seat Number (Never wraps onto two lines) */
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center font-['Poppins',_sans-serif] px-0.5">
          <span className="whitespace-nowrap inline-block max-w-full text-xs sm:text-sm font-['Poppins',_sans-serif] font-black text-slate-800 group-hover:text-emerald-700 transition-all tracking-tight leading-tight">
            {seat.seatNumber}
          </span>
        </div>
      ) : (
        /* MAINTENANCE SEAT */
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center font-['Poppins',_sans-serif] px-0.5">
          <span className="whitespace-nowrap inline-block max-w-full text-xs sm:text-sm font-bold text-slate-400">
            {seat.seatNumber}
          </span>
        </div>
      )}

      {/* Bottom Status / Name Indicator */}
      <div className="w-full flex items-center justify-center shrink-0 font-['Poppins',_sans-serif] px-0.5">
        {seat.status === 'away' ? (
          /* Empty spacer to keep center body perfectly balanced */
          <span className="h-0.5" />
        ) : seat.isSecondaryBooked ? (
          <span className="text-[7px] sm:text-[8px] text-sky-100 font-medium truncate max-w-full">
            {seat.secondaryOccupantName ? `${seat.secondaryOccupantName.split(' ')[0]} (2nd)` : '2nd Booked'}
          </span>
        ) : seat.status === 'occupied' ? (
          <span className="text-[7px] sm:text-[8px] text-white/95 font-semibold truncate max-w-full">
            {seat.occupantName ? seat.occupantName.split(' ')[0] : 'Booked'}
          </span>
        ) : seat.status === 'available' ? (
          /* Empty spacer to keep center body perfectly balanced */
          <span className="h-0.5" />
        ) : (
          <span className="text-[8px] sm:text-[9px] text-slate-400">Maintenance</span>
        )}
      </div>
    </button>
  );
};
