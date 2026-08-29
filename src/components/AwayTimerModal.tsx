import React, { useState } from 'react';
import {
  X,
  Timer,
  Clock,
  Sparkles,
  CheckCircle2,
  Plus,
  Minus,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Seat, AwayReason } from '../types';
import { useLibrary } from '../context/LibraryContext';

interface AwayTimerModalProps {
  seat: Seat | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AwayTimerModal: React.FC<AwayTimerModalProps> = ({
  seat,
  isOpen,
  onClose,
}) => {
  const { leaveSeatTemporarily, currentTime } = useLibrary();

  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [customInput, setCustomInput] = useState<string>('');
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [reason, setReason] = useState<AwayReason>('Prayer');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen || !seat) return null;

  const handleSelectPreset = (mins: number) => {
    setDurationMinutes(mins);
    setIsCustomSelected(false);
    setCustomInput('');
  };

  const handleCustomInputChange = (val: string) => {
    const numOnly = val.replace(/\D/g, '');
    setCustomInput(numOnly);
    setIsCustomSelected(true);
    const parsed = parseInt(numOnly, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setDurationMinutes(parsed);
    }
  };

  const adjustMinutes = (delta: number) => {
    setDurationMinutes((prev) => {
      const next = Math.max(5, prev + delta);
      if (isCustomSelected) {
        setCustomInput(next.toString());
      }
      return next;
    });
  };

  const handleStartBreak = () => {
    leaveSeatTemporarily(seat.id, durationMinutes, reason, customReason || undefined);
    onClose();
  };

  const presetDurations = [
    { mins: 15, label: '15 Mins', sub: 'Tea / Snack' },
    { mins: 30, label: '30 Mins', sub: 'Prayer / Rest' },
    { mins: 45, label: '45 Mins', sub: 'Meal / Lunch' },
    { mins: 60, label: '1 Hour', sub: '60 Mins' },
    { mins: 120, label: '2 Hours', sub: '120 Mins' },
    { mins: 180, label: '3 Hours', sub: '180 Mins' },
    { mins: 240, label: '4 Hours', sub: '240 Mins' },
    { mins: 360, label: '6 Hours', sub: '360 Mins' },
  ];

  const reasonOptions: { id: AwayReason; label: string; icon: string; desc: string }[] = [
    { id: 'Prayer', label: 'Prayer Break', icon: '🕌', desc: 'Attending prayer at mosque' },
    { id: 'Lunch', label: 'Meal Break', icon: '🍱', desc: 'Lunch / Dinner / Cafeteria' },
    { id: 'Tea', label: 'Tea & Refreshment', icon: '☕', desc: 'Tea, coffee or light snack' },
    { id: 'Rest', label: 'Rest & Refresh', icon: '🛋️', desc: 'Eye strain & mental pause' },
    { id: 'Emergency', label: 'Emergency / Call', icon: '⚡', desc: 'Urgent phone call or errand' },
  ];

  // Calculate expected return time
  const returnTime = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);
  const returnTimeStr = returnTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div
      id="away-timer-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn font-['Poppins',_sans-serif]"
    >
      <div
        id="away-timer-modal-card"
        className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-slideUp max-h-[90vh] flex flex-col"
      >
        {/* Header - Green (Emerald) Theme */}
        <div className="bg-emerald-50/90 px-5 py-4 border-b border-emerald-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Take Temporary Break</h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Seat #{seat.seatNumber}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Your seat will turn <strong className="text-emerald-700">Green</strong> with a live countdown timer
              </p>
            </div>
          </div>

          <button
            id="close-away-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Strict Rule Notice: Cannot cancel until timer expires */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950">No Early Cancel:</div>
              <div className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                একবার ব্রেক শুরু করলে নির্ধারিত সময় শেষ হওয়ার আগে ব্রেক বাতিল বা সিটে রিটার্ন করা যাবে না। আপনি যতক্ষণ ইচ্ছা ব্রেক নিতে পারেন।
              </div>
            </div>
          </div>

          {/* Duration Selector: Presets + Custom Input (No Limit) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Select Break Duration</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                {durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60 ? (durationMinutes % 60) + 'm' : ''}` : `${durationMinutes} Mins`} ({durationMinutes}m)
              </span>
            </label>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presetDurations.map((d) => (
                <button
                  key={d.mins}
                  type="button"
                  id={`btn-preset-away-${d.mins}`}
                  onClick={() => handleSelectPreset(d.mins)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    durationMinutes === d.mins && !isCustomSelected
                      ? 'bg-emerald-600 border-emerald-700 text-white font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{d.label}</div>
                  <div
                    className={`text-[10px] mt-0.5 truncate ${
                      durationMinutes === d.mins && !isCustomSelected
                        ? 'text-emerald-100'
                        : 'text-slate-500'
                    }`}
                  >
                    {d.sub}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Minutes Input Section (Unlimited) */}
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>Custom Duration:</span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Any time
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-decrement-mins"
                  onClick={() => adjustMinutes(-10)}
                  className="p-2 rounded-xl bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                  title="Decrease 10 minutes"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="relative flex-1">
                  <input
                    id="input-custom-away-minutes"
                    type="text"
                    inputMode="numeric"
                    value={isCustomSelected ? customInput : durationMinutes}
                    onChange={(e) => handleCustomInputChange(e.target.value)}
                    placeholder="Enter minutes..."
                    className="w-full text-center py-2 px-3 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-slate-900 font-mono focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                    mins
                  </span>
                </div>

                <button
                  type="button"
                  id="btn-increment-mins"
                  onClick={() => adjustMinutes(10)}
                  className="p-2 rounded-xl bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                  title="Increase 10 minutes"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-0.5">
                {[10, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setDurationMinutes(m);
                      setCustomInput(m.toString());
                      setIsCustomSelected(true);
                    }}
                    className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                      durationMinutes === m
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    {m >= 60 ? `${m / 60}h` : `${m}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reason Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Select Break Purpose</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
              {reasonOptions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  id={`btn-away-reason-${r.id}`}
                  onClick={() => setReason(r.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    reason === r.id
                      ? 'bg-emerald-50 border-emerald-400 text-slate-900 font-medium shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{r.icon}</span>
                    <div>
                      <div className="text-slate-800 font-semibold text-xs">{r.label}</div>
                      <div className="text-[10px] text-slate-500">{r.desc}</div>
                    </div>
                  </div>
                  {reason === r.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Return Time Preview Notice - Emerald */}
          <div className="p-3 rounded-xl bg-emerald-700 text-white flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
              <span>
                Expected return time: <strong>{returnTimeStr}</strong>
              </span>
            </div>
            <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded-md font-bold">
              {durationMinutes} min
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="confirm-away-timer-btn"
              type="button"
              onClick={handleStartBreak}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Timer className="w-4 h-4" />
              <span>Start {durationMinutes}-Min Break (Green)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
