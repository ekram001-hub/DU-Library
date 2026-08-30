import React, { useState } from 'react';
import {
  X,
  Timer,
  Plus,
  Minus,
  Lock,
  ChevronRight,
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
  const [customReason] = useState('');

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
    { mins: 15, label: '15m' },
    { mins: 30, label: '30m' },
    { mins: 45, label: '45m' },
    { mins: 60, label: '1h' },
    { mins: 120, label: '2h' },
    { mins: 180, label: '3h' },
    { mins: 240, label: '4h' },
    { mins: 360, label: '6h' },
  ];

  const reasonOptions: { id: AwayReason; label: string; icon: string }[] = [
    { id: 'Prayer', label: 'Prayer', icon: '🕌' },
    { id: 'Lunch', label: 'Meal', icon: '🍱' },
    { id: 'Tea', label: 'Tea', icon: '☕' },
    { id: 'Rest', label: 'Rest', icon: '🛋️' },
    { id: 'Emergency', label: 'Urgent', icon: '⚡' },
  ];

  const formatDuration = (mins: number) =>
    mins >= 60
      ? `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}`
      : `${mins}m`;

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn font-['Poppins',_sans-serif]"
    >
      <div
        id="away-timer-modal-card"
        className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-slideUp max-h-[88vh] flex flex-col"
      >
        {/* Header — minimal, no colored block */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0">
              <Timer className="w-5 h-5 text-amber-950" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Take a Break</h3>
              <p className="text-[11px] text-slate-400 truncate">
                Seat {seat.seatNumber} · turns yellow while you're away
              </p>
            </div>
          </div>

          <button
            id="close-away-modal-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="px-5 pb-5 space-y-5 overflow-y-auto">
          {/* Duration */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Duration
              </span>
              <span className="text-sm font-bold text-amber-600 font-mono">
                {formatDuration(durationMinutes)}
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {presetDurations.map((d) => (
                <button
                  key={d.mins}
                  type="button"
                  id={`btn-preset-away-${d.mins}`}
                  onClick={() => handleSelectPreset(d.mins)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    durationMinutes === d.mins && !isCustomSelected
                      ? 'bg-amber-400 text-amber-950 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Custom stepper — compact single row */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                id="btn-decrement-mins"
                onClick={() => adjustMinutes(-10)}
                className="w-9 h-9 shrink-0 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
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
                  placeholder="Custom minutes"
                  className="w-full text-center py-2 px-3 bg-slate-50 rounded-full text-sm font-bold text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-amber-300 outline-hidden transition-all"
                />
              </div>

              <button
                type="button"
                id="btn-increment-mins"
                onClick={() => adjustMinutes(10)}
                className="w-9 h-9 shrink-0 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Increase 10 minutes"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reason — compact pill row instead of a tall list */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Reason
            </span>
            <div className="flex flex-wrap gap-1.5">
              {reasonOptions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  id={`btn-away-reason-${r.id}`}
                  onClick={() => setReason(r.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    reason === r.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Return preview — quiet, single line */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-slate-400">Back by</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{returnTimeStr}</span>
          </div>

          {/* No-early-cancel notice — compact single line */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 text-amber-800">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              একবার ব্রেক শুরু করলে সময় শেষ হওয়ার আগে ফিরে আসা যাবে না — যতক্ষণ ইচ্ছা সময় বেছে নিতে পারেন।
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="confirm-away-timer-btn"
              type="button"
              onClick={handleStartBreak}
              className="flex-1 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              <span>Start {formatDuration(durationMinutes)} Break</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
