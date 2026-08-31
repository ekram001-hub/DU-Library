import React, { useState, useMemo } from 'react';
import {
  Search,
  Coffee,
  Building2,
  X,
  FileText,
  Home,
  ShieldCheck,
  FlaskConical,
  BookOpen,
  LayoutGrid,
  DoorOpen,
} from 'lucide-react';
import { Seat, Room } from '../types';
import { useLibrary } from '../context/LibraryContext';
import { SeatCard } from './SeatCard';

interface SeatGridProps {
  onSelectSeat: (seat: Seat) => void;
  onOpenGuidelines: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onBackToHome: () => void;
}

export const SeatGrid: React.FC<SeatGridProps> = ({
  onSelectSeat,
  onOpenGuidelines,
  onOpenAuth,
  onOpenAdmin,
  onBackToHome,
}) => {
  const {
    currentBranchId,
    branchConfig,
    branchRooms,
    branchSeats,
    currentStudent,
    isAdminLoggedIn,
  } = useLibrary();

  // Tab selection: 'all' or specific room ID
  const [selectedRoomTab, setSelectedRoomTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Search filter
  const filteredSeats = useMemo(() => {
    let result = branchSeats;

    if (selectedRoomTab !== 'all') {
      result = result.filter((s) => s.roomId === selectedRoomTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((s) => {
        const matchSeat = s.seatNumber.toLowerCase().includes(q);
        const matchName = s.occupantName?.toLowerCase().includes(q);
        const matchId = s.studentId?.toLowerCase().includes(q);
        const matchPhone = s.occupantPhone?.toLowerCase().includes(q);
        return matchSeat || matchName || matchId || matchPhone;
      });
    }

    return result;
  }, [branchSeats, selectedRoomTab, searchQuery]);

  // Overall metrics calculation
  const totalCount = branchSeats.length;
  const occupiedCount = branchSeats.filter((s) => s.status === 'occupied').length;
  const awayCount = branchSeats.filter((s) => s.status === 'away').length;
  const availableCount = branchSeats.filter((s) => s.status === 'available').length;
  const reservedCount = branchSeats.filter((s) => s.isFemaleReserved).length;

  const studentName = currentStudent?.name || 'Ekram Bhuiyan';

  // Group seats by room
  const roomsToRender = useMemo(() => {
    if (selectedRoomTab !== 'all') {
      return branchRooms.filter((r) => r.id === selectedRoomTab);
    }
    return branchRooms;
  }, [branchRooms, selectedRoomTab]);

  return (
    <div className="space-y-4">
      {/* 1. Header Bar matching Screenshot 2 */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branch Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
            {currentBranchId === 'science_library' ? (
              <FlaskConical className="w-6 h-6" />
            ) : (
              <BookOpen className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {branchConfig.name}
            </h1>
            <p className="text-xs text-slate-500">
              {branchConfig.tagline}
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Home / Switch Branch button */}
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            title="Back to Home"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          {/* Guidelines */}
          <button
            type="button"
            onClick={onOpenGuidelines}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-700" />
            <span>Guidelines</span>
          </button>

          {/* Admin Panel button - ONLY visible for Admin */}
          {isAdminLoggedIn && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Open Admin Control Panel"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
              <span>Admin Panel</span>
            </button>
          )}

          {/* Active User profile badge */}
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{studentName}</span>
          </button>
        </div>
      </div>

      {/* 2. Room Tabs, Single Break Stat, and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-xs w-full max-w-full overflow-hidden">
        {/* Left Side: Room Navigation Tabs + Single Break Stat — minimal, icon-first, room number only */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none w-full md:w-auto shrink min-w-0">
          {/* All Rooms Tab */}
          <button
            type="button"
            onClick={() => setSelectedRoomTab('all')}
            className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${
              selectedRoomTab === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200/70'
            }`}
            title={`All Rooms (${occupiedCount + awayCount}/${totalCount} booked)`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Individual Room Tabs — icon + room number only */}
          {branchRooms.map((room) => {
            const roomSeats = branchSeats.filter((s) => s.roomId === room.id);
            const bookedInRoom = roomSeats.filter(
              (s) => s.status === 'occupied' || s.status === 'away'
            ).length;

            // Extract room number if like "Room 1", "Room 2"
            const roomNumMatch = room.name.match(/\d+/);
            const roomDisplay = roomNumMatch ? roomNumMatch[0] : room.name;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoomTab(room.id)}
                className={`shrink-0 flex items-center justify-center gap-1 px-2.5 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRoomTab === room.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
                title={`${room.name} (${bookedInRoom}/${roomSeats.length} booked)`}
              >
                <DoorOpen className="w-3.5 h-3.5" />
                <span>{roomDisplay}</span>
              </button>
            );
          })}

          {/* Break count — icon + number only */}
          <div
            className="shrink-0 flex items-center justify-center gap-1 px-2.5 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold"
            title={`${awayCount} seat${awayCount === 1 ? '' : 's'} on break`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>{awayCount}</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-56 lg:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search seat or student..."
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Visual Status Legend (English Only, Clean & Mobile Optimized) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-700 shadow-2xs w-full max-w-full overflow-hidden">
        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-slate-900" /> Seat Status Colors:
        </span>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-md bg-white border border-slate-300 shadow-2xs inline-block" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-md bg-green-600 shadow-2xs inline-block" />
            <span className="font-semibold text-green-700">My Seat (Booked)</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-md bg-red-600 shadow-2xs inline-block" />
            <span className="font-semibold text-red-700">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-md bg-amber-400 shadow-2xs inline-block" />
            <span className="font-semibold text-amber-700">On Break</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-md bg-blue-600 shadow-2xs inline-block" />
            <span className="font-semibold text-blue-700">2nd Booking</span>
          </div>
        </div>
      </div>

      {/* 4. Multi-Room Grid Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {roomsToRender.map((room) => {
          const roomSeats = filteredSeats.filter((s) => s.roomId === room.id);
          const roomTotal = branchSeats.filter((s) => s.roomId === room.id).length;
          const roomAvail = branchSeats.filter(
            (s) => s.roomId === room.id && s.status === 'available'
          ).length;
          const roomBooked = roomTotal - roomAvail;

          return (
            <div
              key={room.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3"
            >
              {/* Room Header with badges */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {room.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                    Available {roomAvail}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                    Booked {roomBooked}
                  </span>
                </div>
              </div>

              {/* Room Seats Grid (8 columns on desktop) */}
              {roomSeats.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {roomSeats.map((seat) => (
                    <SeatCard
                      key={seat.id}
                      seat={seat}
                      room={room}
                      onSelectSeat={onSelectSeat}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No seats found matching criteria
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

