import React from 'react';
import {
  MapPin,
  Phone,
  Users,
  CheckCircle2,
  Percent,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

export const BranchHeader: React.FC = () => {
  const { branchConfig, branchStats, currentBranchId } = useLibrary();

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs mb-6 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {/* Left: Branch Info */}
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider text-white"
              style={{
                backgroundColor: currentBranchId === 'bcs_study' ? '#2563eb' : '#059669',
              }}
            >
              {branchConfig.badge}
            </span>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              24/7 Smart Reading Space & Live Seat Tracker
            </span>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>{branchConfig.name}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-normal mt-0.5">
              {branchConfig.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{branchConfig.address}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{branchConfig.phone}</span>
            </div>
          </div>
        </div>

        {/* Right: Real-time Stats Quick Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 shrink-0">
          {/* Total Capacity */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-medium">Total Seats</span>
              <Layers className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
              {branchStats.totalSeats}
            </div>
            <div className="text-[10px] text-slate-400">Total Capacity</div>
          </div>

          {/* Available */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-[11px] font-semibold">Available</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-emerald-700 font-mono">
              {branchStats.availableSeats}
            </div>
            <div className="text-[10px] text-emerald-600/90 font-medium">Ready to Book</div>
          </div>

          {/* Occupied */}
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-rose-700 mb-1">
              <span className="text-[11px] font-semibold">Occupied</span>
              <Users className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-rose-700 font-mono">
              {branchStats.occupiedSeats}
            </div>
            <div className="text-[10px] text-rose-600/90 font-medium">In Session</div>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-[11px] font-semibold">Occupancy</span>
              <Percent className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-blue-700 font-mono">
              {branchStats.occupancyRate}%
            </div>
            <div className="text-[10px] text-blue-600/90 font-medium">
              {branchStats.awaySeats > 0 ? `${branchStats.awaySeats} on Break` : 'Live Flow'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Status Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
          <Info className="w-3.5 h-3.5 text-blue-600" />
          <span>Seat Status Legend:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-700 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Available</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-rose-200 text-rose-700 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Occupied</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-800 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>On Break</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-700 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-200"></span>
            <span>My Seat</span>
          </div>


          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-pink-200 text-pink-700 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
            <span>Female Reserved</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white border border-purple-200 text-purple-700 text-[11px] hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

