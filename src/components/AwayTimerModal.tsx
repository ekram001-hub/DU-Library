import React, { useState } from 'react';
import {
  X,
  Timer,
  Coffee,
  Utensils,
  Moon,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
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
  const { leaveSeatTemporarily } = useLibrary();

  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [reason, setReason] = useState<AwayReason>('Prayer');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen || !seat) return null;

  const handleStartBreak = () => {
    leaveSeatTemporarily(seat.id, durationMinutes, reason, customReason || undefined);
    onClose();
  };

  const presetDurations = [
    { mins: 15, label: '15 min', sub: 'Quick refreshment' },
    { mins: 30, label: '30 min', sub: 'Prayer / Meal' },
    { mins: 45, label: '45 min', sub: 'Lunch / Dinner' },
    { mins: 60, label: '60 min', sub: 'Extended break' },
  ];

  const reasonOptions: { id: AwayReason; label: string; icon: string; desc: string }[] = [
    { id: 'Prayer', label: 'Prayer Break', icon: '🕌', desc: 'Attending prayer in mosque' },
    { id: 'Lunch', label: 'Meal Break (Lunch / Dinner)', icon: '🍱', desc: 'Dining in cafeteria / lounge' },
    { id: 'Tea', label: 'Tea & Refreshment', icon: '☕', desc: 'Fresh coffee, tea or snacks' },
    { id: 'Rest', label: 'Rest & Relaxation', icon: '🛋️', desc: 'Short physical or mental rest' },
    { id: 'Emergency', label: 'Urgent Task / Call', icon: '⚡', desc: 'Emergency call or errand' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Set Away Timer</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Seat {seat.seatNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Hold your seat during short absence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5">
          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Break Duration</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presetDurations.map((d) => (
                <button
                  key={d.mins}
                  type="button"
                  onClick={() => setDurationMinutes(d.mins)}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    durationMinutes === d.mins
                      ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">{d.label}</div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">{d.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reason Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Reason
            </label>
            <div className="space-y-1.5">
              {reasonOptions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs transition-colors ${
                    reason === r.id
                      ? 'bg-amber-50/70 border-amber-300 text-slate-900 font-medium shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{r.icon}</span>
                    <div>
                      <div className="text-slate-800 font-medium text-xs">{r.label}</div>
                      <div className="text-[10px] text-slate-400">{r.desc}</div>
                    </div>
                  </div>
                  {reason === r.id && (
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notice Box */}
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 space-y-0.5">
            <div className="font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Live Countdown & Auto Reservation</span>
            </div>
            <p className="text-[10px] text-amber-700 leading-normal">
              A countdown badge will appear on your seat. When you return, simply click "I am Back" to resume your session.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              id="confirm-away-timer-btn"
              type="button"
              onClick={handleStartBreak}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Start {durationMinutes} min Break</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

