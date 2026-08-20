import React, { useState, useMemo } from 'react';
import {
  Search,
  Armchair,
  User,
  Coffee,
  Users,
  BarChart2,
  Building2,
  X,
  FileText,
  Home,
  ShieldCheck,
  FlaskConical,
  BookOpen,
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
            title="হোম পেজে ফিরে যান"
          >
            <Home className="w-3.5 h-3.5" />
            <span>হোম পেজ</span>
          </button>

          {/* Guidelines */}
          <button
            type="button"
            onClick={onOpenGuidelines}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-amber-700" />
            <span>নির্দেশনা</span>
          </button>

          {/* Admin Panel button - ONLY visible for Admin (01581624202 or admin user) */}
          {isAdminLoggedIn && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all shadow-2xs"
              title="অ্যাডমিন কন্ট্রোল প্যানেল খুলুন"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
              <span>এডমিন প্যানেল</span>
            </button>
          )}

          {/* Active User profile badge */}
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{studentName}</span>
          </button>
        </div>
      </div>

      {/* 2. Room Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-xs">
        {/* Room Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {/* All Rooms Tab */}
          <button
            type="button"
            onClick={() => setSelectedRoomTab('all')}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedRoomTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            সকল রুম {occupiedCount + awayCount}/{totalCount}
          </button>

          {/* Individual Room Tabs */}
          {branchRooms.map((room) => {
            const roomSeats = branchSeats.filter((s) => s.roomId === room.id);
            const bookedInRoom = roomSeats.filter(
              (s) => s.status === 'occupied' || s.status === 'away'
            ).length;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setSelectedRoomTab(room.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  selectedRoomTab === room.id
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                {room.name} {bookedInRoom}/{roomSeats.length}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="সিট নং খুঁজুন..."
            className="w-full pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. 5 Quick Metric Summary Cards (Matching Screenshot 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {/* Available */}
        <div className="bg-slate-100/90 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <Armchair className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold">খালি</span>
          </div>
          <span className="text-sm font-bold text-slate-900 font-mono">
            {availableCount}
          </span>
        </div>

        {/* Occupied */}
        <div className="bg-rose-50/90 border border-rose-200/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800">
            <User className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-semibold">উপস্থিত</span>
          </div>
          <span className="text-sm font-bold text-rose-900 font-mono">
            {occupiedCount}
          </span>
        </div>

        {/* Away */}
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900">
            <Coffee className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold">বিরতি</span>
          </div>
          <span className="text-sm font-bold text-amber-900 font-mono">
            {awayCount}
          </span>
        </div>

        {/* Female / Reserved */}
        <div className="bg-purple-50/90 border border-purple-200/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-900">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold">ফিমেল জোন</span>
          </div>
          <span className="text-sm font-bold text-purple-900 font-mono">
            {reservedCount}
          </span>
        </div>

        {/* Total */}
        <div className="bg-blue-50/90 border border-blue-200/80 rounded-xl p-3 flex items-center justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-blue-900">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold">মোট সিট</span>
          </div>
          <span className="text-sm font-bold text-blue-900 font-mono">
            {totalCount}
          </span>
        </div>
      </div>

      {/* 4. Multi-Room Grid Boxes (Matching Screenshot 2) */}
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
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {room.name}
                  </h3>
                </div>


                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                    খালি {roomAvail}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                    বুকড {roomBooked}
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
                  কোনো সিট খুঁজে পাওয়া যায়নি
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
