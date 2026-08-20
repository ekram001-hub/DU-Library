import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Layers,
  Wind,
  VolumeX,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  X,
} from 'lucide-react';
import { Seat, Room } from '../types';
import { useLibrary } from '../context/LibraryContext';
import { SeatCard } from './SeatCard';

interface SeatGridProps {
  onSelectSeat: (seat: Seat) => void;
}

export const SeatGrid: React.FC<SeatGridProps> = ({ onSelectSeat }) => {
  const { branchRooms, branchSeats, currentStudent } = useLibrary();

  // Layout mode: 'single' (select one room tab) or 'all' (combined grid)
  const [layoutMode, setLayoutMode] = useState<'single' | 'all'>('single');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
    return branchRooms[0]?.id || '';
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied' | 'away' | 'female' | 'my_seat'>('all');

  // Keep selectedRoomId valid when branch changes
  const activeRoomId = useMemo(() => {
    if (branchRooms.some((r) => r.id === selectedRoomId)) {
      return selectedRoomId;
    }
    return branchRooms[0]?.id || '';
  }, [branchRooms, selectedRoomId]);

  // Filtered Seats
  const filteredSeats = useMemo(() => {
    let result = branchSeats;

    // Filter by single room if in 'single' mode
    if (layoutMode === 'single' && activeRoomId) {
      result = result.filter((s) => s.roomId === activeRoomId);
    }

    // Filter by Status
    if (statusFilter === 'available') {
      result = result.filter((s) => s.status === 'available');
    } else if (statusFilter === 'occupied') {
      result = result.filter((s) => s.status === 'occupied');
    } else if (statusFilter === 'away') {
      result = result.filter((s) => s.status === 'away');
    } else if (statusFilter === 'female') {
      result = result.filter((s) => s.isFemaleReserved);
    } else if (statusFilter === 'my_seat' && currentStudent) {
      result = result.filter(
        (s) =>
          (s.status === 'occupied' || s.status === 'away') &&
          ((s.studentId && s.studentId === currentStudent.studentId) ||
            (s.occupantPhone && s.occupantPhone === currentStudent.phone) ||
            (s.occupantName && s.occupantName.toLowerCase() === currentStudent.name.toLowerCase()))
      );
    }

    // Filter by Search Query
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
  }, [branchSeats, layoutMode, activeRoomId, statusFilter, searchQuery, currentStudent]);

  // Group seats by room for 'all' mode
  const seatsGroupedByRoom = useMemo(() => {
    const map = new Map<string, Seat[]>();
    branchRooms.forEach((room) => {
      map.set(
        room.id,
        filteredSeats.filter((s) => s.roomId === room.id)
      );
    });
    return map;
  }, [branchRooms, filteredSeats]);

  const activeRoomObj = branchRooms.find((r) => r.id === activeRoomId);

  return (
    <div className="space-y-5">
      {/* Top Filter Bar: Search, Room Tabs, View Switcher & Status Chips */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 sm:p-4 shadow-lg space-y-3">
        {/* Row 1: Search + View Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-seats-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="সিট নম্বর (যেমন: A-01), শিক্ষার্থীর নাম বা আইডি দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-9 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Layout Mode Switcher (Single Room vs All Rooms) */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 self-end sm:self-auto">
            <button
              id="view-mode-single"
              onClick={() => setLayoutMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                layoutMode === 'single'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>রুম ভিত্তিক ভিউ</span>
            </button>

            <button
              id="view-mode-all"
              onClick={() => setLayoutMode('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                layoutMode === 'all'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>একত্রে সব রুম</span>
            </button>
          </div>
        </div>

        {/* Row 2: Room Selection Tabs (Visible in 'single' mode) */}
        {layoutMode === 'single' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {branchRooms.map((room) => {
              const isSelected = room.id === activeRoomId;
              const roomSeats = branchSeats.filter((s) => s.roomId === room.id);
              const availCount = roomSeats.filter((s) => s.status === 'available').length;

              return (
                <button
                  key={room.id}
                  id={`tab-room-${room.id}`}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-sky-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span>{room.bengaliName}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold font-mono ${
                      availCount > 0
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {availCount} ফাঁকা
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Row 3: Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-slate-800/60 text-xs">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-sky-400" />
            ফিল্টার:
          </span>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-700 text-white font-bold'
                : 'bg-slate-950/70 text-slate-400 hover:text-slate-200'
            }`}
          >
            সব সিট ({filteredSeats.length})
          </button>

          <button
            onClick={() => setStatusFilter('available')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40 border border-emerald-500/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            ফাঁকা
          </button>

          <button
            onClick={() => setStatusFilter('occupied')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              statusFilter === 'occupied'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/40 border border-rose-500/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            বুকড
          </button>

          <button
            onClick={() => setStatusFilter('away')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              statusFilter === 'away'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/40 border border-amber-500/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            বিরতিতে (Away)
          </button>

          <button
            onClick={() => setStatusFilter('female')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              statusFilter === 'female'
                ? 'bg-pink-600 text-white font-bold'
                : 'bg-pink-950/40 text-pink-300 hover:bg-pink-900/40 border border-pink-500/20'
            }`}
          >
            <span>🌸</span>
            মহিলা সংরক্ষিত
          </button>

          {currentStudent && (
            <button
              onClick={() => setStatusFilter('my_seat')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                statusFilter === 'my_seat'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-sky-950/40 text-sky-300 hover:bg-sky-900/40 border border-sky-500/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              আমার সিট
            </button>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      {layoutMode === 'single' ? (
        // Single Room View
        activeRoomObj ? (
          <div className="space-y-4">
            {/* Room Header Banner */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {activeRoomObj.bengaliName}
                  </h3>
                  <span className="text-xs text-slate-400">({activeRoomObj.name})</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeRoomObj.bengaliDescription}
                </p>
              </div>

              {/* Room Amenities Badges */}
              <div className="flex items-center gap-2 text-xs">
                {activeRoomObj.hasAC && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium">
                    <Wind className="w-3 h-3 text-cyan-400" />
                    এসি সুবিধা
                  </span>
                )}
                {activeRoomObj.isSilent && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium">
                    <VolumeX className="w-3 h-3 text-indigo-400" />
                    নীরব জোন
                  </span>
                )}
                {activeRoomObj.category === 'female_only' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-950/50 border border-pink-500/30 text-pink-300 text-[11px] font-medium">
                    🌸 মহিলা সংরক্ষিত
                  </span>
                )}
              </div>
            </div>

            {/* Seat Cards Grid */}
            {filteredSeats.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredSeats.map((seat) => (
                  <SeatCard
                    key={seat.id}
                    seat={seat}
                    room={activeRoomObj}
                    onSelectSeat={onSelectSeat}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <p className="font-semibold text-sm">কোনো সিট পাওয়া যায়নি</p>
                <p className="text-xs text-slate-500 mt-1">
                  অনুগ্রহ করে অন্য ফিল্টার বা সার্চ টার্ম ব্যবহার করে দেখুন।
                </p>
              </div>
            )}
          </div>
        ) : null
      ) : (
        // Combined All Rooms View
        <div className="space-y-8">
          {branchRooms.map((room) => {
            const roomSeats = seatsGroupedByRoom.get(room.id) || [];
            if (roomSeats.length === 0 && (searchQuery || statusFilter !== 'all')) {
              return null; // Skip room if no matching seats in filtered mode
            }

            const availCount = roomSeats.filter((s) => s.status === 'available').length;

            return (
              <div key={room.id} className="space-y-3">
                {/* Room Subheader */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div>
                    <h3 className="text-base font-bold text-white">
                      {room.bengaliName}
                    </h3>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      ({room.description.split('.')[0]})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">
                      মোট সিট: <span className="text-slate-200 font-bold">{roomSeats.length}</span>
                    </span>
                    <span className="text-emerald-400 font-bold">
                      ({availCount} ফাঁকা)
                    </span>
                  </div>
                </div>

                {/* Seat Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {roomSeats.map((seat) => (
                    <SeatCard
                      key={seat.id}
                      seat={seat}
                      room={room}
                      onSelectSeat={onSelectSeat}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
