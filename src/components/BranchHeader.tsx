import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  Clock,
  Heart,
  Percent,
  Shield,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

export const BranchHeader: React.FC = () => {
  const { branchConfig, branchStats, currentBranchId } = useLibrary();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-4 sm:p-6 shadow-xl mb-6">
      {/* Background Subtle Gradient Glow */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{
          backgroundColor: currentBranchId === 'bcs_study' ? '#0284c7' : '#059669',
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Branch Info */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider text-white shadow-sm"
              style={{
                backgroundColor: currentBranchId === 'bcs_study' ? '#0284c7' : '#059669',
              }}
            >
              {branchConfig.badge}
            </span>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              ২৪/৭ স্মার্ট রিডিং স্পেস ও লাইভ সিট ট্র্যাকার
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>{branchConfig.bengaliName}</span>
              <span className="text-slate-500 text-base font-normal">({branchConfig.name})</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-normal mt-0.5">
              {branchConfig.bengaliTagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{branchConfig.bengaliAddress}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{branchConfig.phone}</span>
            </div>
          </div>
        </div>

        {/* Right: Real-time Stats Quick Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
          {/* Total Capacity */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-inner">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium">মোট সিট</span>
              <Layers className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">
              {branchStats.totalSeats}
            </div>
            <div className="text-[10px] text-slate-500">Total Capacity</div>
          </div>

          {/* Available / ফাঁকা */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-inner">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-[11px] font-bold">ফাঁকা সিট</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-300 font-mono">
              {branchStats.availableSeats}
            </div>
            <div className="text-[10px] text-emerald-500/80 font-medium">Available Now</div>
          </div>

          {/* Occupied / বুকড */}
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-inner">
            <div className="flex items-center justify-between text-rose-400 mb-1">
              <span className="text-[11px] font-bold">বুকড সিট</span>
              <Users className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-rose-300 font-mono">
              {branchStats.occupiedSeats}
            </div>
            <div className="text-[10px] text-rose-500/80 font-medium">Occupied</div>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-sky-950/30 border border-sky-500/30 rounded-xl p-2.5 sm:p-3 flex flex-col justify-between shadow-inner">
            <div className="flex items-center justify-between text-sky-400 mb-1">
              <span className="text-[11px] font-bold">অকুপেন্সি</span>
              <Percent className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-sky-300 font-mono">
              {branchStats.occupancyRate}%
            </div>
            <div className="text-[10px] text-sky-500/80 font-medium">
              {branchStats.awaySeats > 0 ? `${branchStats.awaySeats} বিরতিতে` : 'Live Flow'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Status Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>সিট স্ট্যাটাস নির্দেশিকা:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-emerald-500/30 text-emerald-400 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            <span>🟢 ফাঁকা (Available)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-rose-500/30 text-rose-400 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span>
            <span>🔴 বুকড (Occupied)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-amber-500/30 text-amber-300 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>🟡 বিরতিতে (Away Timer)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-sky-500/40 text-sky-300 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-sky-300"></span>
            <span>🔵 আমার সিট (My Seat)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-pink-500/40 text-pink-300 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
            <span>🌸 মহিলা সংরক্ষিত (Female Zone)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-purple-500/40 text-purple-300 text-[11px] hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>🟣 বিশেষ সংরক্ষিত (Reserved)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
