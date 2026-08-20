import React, { useState, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  Layers,
  Wind,
  VolumeX,
  AlertCircle,
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
    <div className="space-y-4">
      {/* Top Filter Bar: Search, Room Tabs, View Switcher & Status Chips */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2.5">
        {/* Row 1: Search + View Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-seats-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search seat number (e.g. A-01), student name or ID..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Layout Mode Switcher (Single Room vs All Rooms) */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 self-end sm:self-auto shrink-0">
            <button
              id="view-mode-single"
              onClick={() => setLayoutMode('single')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                layoutMode === 'single'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>By Room</span>
            </button>

            <button
              id="view-mode-all"
              onClick={() => setLayoutMode('all')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                layoutMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Rooms</span>
            </button>
          </div>
        </div>

        {/* Row 2: Room Selection Tabs (Visible in 'single' mode) */}
        {layoutMode === 'single' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            {branchRooms.map((room) => {
              const isSelected = room.id === activeRoomId;
              const roomSeats = branchSeats.filter((s) => s.roomId === room.id);
              const availCount = roomSeats.filter((s) => s.status === 'available').length;

              return (
                <button
                  key={room.id}
                  id={`tab-room-${room.id}`}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-sky-50 border-sky-300 text-sky-900 font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{room.name}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded font-mono ${
                      availCount > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {availCount} open
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Row 3: Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100 text-xs">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Filter:
          </span>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2 py-0.8 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All ({filteredSeats.length})
          </button>

          <button
            onClick={() => setStatusFilter('available')}
            className={`px-2 py-0.8 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Available
          </button>

          <button
            onClick={() => setStatusFilter('occupied')}
            className={`px-2 py-0.8 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              statusFilter === 'occupied'
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Booked
          </button>

          <button
            onClick={() => setStatusFilter('away')}
            className={`px-2 py-0.8 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              statusFilter === 'away'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            On Break
          </button>

          <button
            onClick={() => setStatusFilter('female')}
            className={`px-2 py-0.8 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              statusFilter === 'female'
                ? 'bg-pink-600 text-white font-semibold'
                : 'bg-pink-50 text-pink-800 hover:bg-pink-100 border border-pink-200'
            }`}
          >
            <span>🌸</span>
            Female Reserved
          </button>

          {currentStudent && (
            <button
              onClick={() => setStatusFilter('my_seat')}
              className={`px-2 py-0.8 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                statusFilter === 'my_seat'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              My Seat
            </button>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      {layoutMode === 'single' ? (
        // Single Room View
        activeRoomObj ? (
          <div className="space-y-3">
            {/* Room Header Banner */}
            <div className="bg-white rounded-lg border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {activeRoomObj.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeRoomObj.description}
                </p>
              </div>

              {/* Room Amenities Badges */}
              <div className="flex items-center gap-1.5 text-xs">
                {activeRoomObj.hasAC && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-medium">
                    <Wind className="w-3 h-3 text-sky-600" />
                    AC
                  </span>
                )}
                {activeRoomObj.isSilent && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-medium">
                    <VolumeX className="w-3 h-3 text-indigo-600" />
                    Silent Zone
                  </span>
                )}
                {activeRoomObj.category === 'female_only' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-pink-50 border border-pink-200 text-pink-700 text-[11px] font-medium">
                    🌸 Female Reserved
                  </span>
                )}
              </div>
            </div>

            {/* Seat Cards Grid */}
            {filteredSeats.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
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
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                <AlertCircle className="w-6 h-6 mx-auto text-slate-400 mb-1.5" />
                <p className="font-semibold text-xs text-slate-700">No seats found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try adjusting your filters or search keywords.
                </p>
              </div>
            )}
          </div>
        ) : null
      ) : (
        // Combined All Rooms View
        <div className="space-y-6">
          {branchRooms.map((room) => {
            const roomSeats = seatsGroupedByRoom.get(room.id) || [];
            if (roomSeats.length === 0 && (searchQuery || statusFilter !== 'all')) {
              return null; // Skip room if no matching seats in filtered mode
            }

            const availCount = roomSeats.filter((s) => s.status === 'available').length;

            return (
              <div key={room.id} className="space-y-2.5">
                {/* Room Subheader */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {room.name}
                    </h3>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      • {room.description.split('.')[0]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 text-[11px]">
                      Total: <span className="text-slate-800 font-semibold">{roomSeats.length}</span>
                    </span>
                    <span className="text-emerald-700 font-semibold text-[11px]">
                      ({availCount} open)
                    </span>
                  </div>
                </div>

                {/* Seat Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
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

