import React, { useState } from 'react';
import {
  X,
  Timer,
  Clock,
  Sparkles,
  CheckCircle2,
  Plus,
  Minus,
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
      setDurationMinutes(Math.min(180, parsed));
    }
  };

  const adjustMinutes = (delta: number) => {
    setDurationMinutes((prev) => {
      const next = Math.max(5, Math.min(180, prev + delta));
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
    { mins: 15, label: '১৫ মিনিট', sub: 'চা / নাস্তা' },
    { mins: 30, label: '৩০ মিনিট', sub: 'নামাজ / বিশ্রাম' },
    { mins: 45, label: '৪৫ মিনিট', sub: 'খাবার / লাঞ্চ' },
    { mins: 60, label: '৬০ মিনিট', sub: 'দীর্ঘ বিরতি' },
  ];

  const reasonOptions: { id: AwayReason; label: string; icon: string; desc: string }[] = [
    { id: 'Prayer', label: 'নামাজের বিরতি (Prayer Break)', icon: '🕌', desc: 'মসজিদে নামাজ আদায়' },
    { id: 'Lunch', label: 'খাবারের বিরতি (Meal Break)', icon: '🍱', desc: 'লাঞ্চ / ডিনার / ক্যাফেটেরিয়া' },
    { id: 'Tea', label: 'চা ও রিফ্রেশমেন্ট (Tea & Snack)', icon: '☕', desc: 'চা, কফি বা হালকা নাস্তা' },
    { id: 'Rest', label: 'বিশ্রাম (Rest & Refresh)', icon: '🛋️', desc: 'চোখের ও শারীরিক বিশ্রাম' },
    { id: 'Emergency', label: 'জরুরি কাজ / কল (Emergency)', icon: '⚡', desc: 'জরুরি ফোন কল বা কাজ' },
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn"
    >
      <div
        id="away-timer-modal-card"
        className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-slideUp"
      >
        {/* Header */}
        <div className="bg-orange-50/80 px-5 py-4 border-b border-orange-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">সাময়িক বিরতি (Away Timer)</h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-orange-100 text-orange-900 border border-orange-300">
                  সিট {seat.seatNumber}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                বিরতিকালীন সিটটি অরেঞ্জ কালারে ও বড় টাইমার সহ সংরক্ষিত থাকবে
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

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Duration Selector: Presets + Custom Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-600" />
                <span>বিরতির সময়সীমা নির্বাচন করুন</span>
              </span>
              <span className="text-xs font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                {durationMinutes} মিনিট
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
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    durationMinutes === d.mins && !isCustomSelected
                      ? 'bg-orange-500 border-orange-600 text-white font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{d.label}</div>
                  <div
                    className={`text-[10px] mt-0.5 truncate ${
                      durationMinutes === d.mins && !isCustomSelected
                        ? 'text-orange-100'
                        : 'text-slate-500'
                    }`}
                  >
                    {d.sub}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Minutes Input Section (Directive: Custom Time Option in Minutes) */}
            <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>কাস্টম সময় (মিনিট এককে):</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  ১ থেকে ১৮০ মিনিট পর্যন্ত
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-decrement-mins"
                  onClick={() => adjustMinutes(-5)}
                  className="p-2 rounded-xl bg-white hover:bg-orange-100 border border-orange-200 text-orange-800 transition-colors shadow-2xs cursor-pointer"
                  title="5 মিনিট কমান"
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
                    placeholder=""
                    className="w-full text-center py-2 px-3 bg-white border border-orange-300 rounded-xl text-sm font-bold text-slate-900 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-hidden"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                    মিনিট
                  </span>
                </div>

                <button
                  type="button"
                  id="btn-increment-mins"
                  onClick={() => adjustMinutes(5)}
                  className="p-2 rounded-xl bg-white hover:bg-orange-100 border border-orange-200 text-orange-800 transition-colors shadow-2xs cursor-pointer"
                  title="5 মিনিট বাড়ান"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                {[10, 20, 25, 40, 50, 75, 90].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setDurationMinutes(m);
                      setCustomInput(m.toString());
                      setIsCustomSelected(true);
                    }}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                      durationMinutes === m
                        ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reason Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">বিরতির কারণ নির্বাচন করুন</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              {reasonOptions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  id={`btn-away-reason-${r.id}`}
                  onClick={() => setReason(r.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    reason === r.id
                      ? 'bg-orange-50 border-orange-400 text-slate-900 font-medium shadow-2xs'
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
                    <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Return Time Preview Notice */}
          <div className="p-3 rounded-xl bg-orange-500 text-white flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-200 animate-pulse" />
              <span>
                বিরতি শুরু হলে শেষ হবে: <strong>{returnTimeStr}</strong>
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
              বাতিল
            </button>

            <button
              id="confirm-away-timer-btn"
              type="button"
              onClick={handleStartBreak}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Timer className="w-4 h-4" />
              <span>{durationMinutes} মিনিটের বিরতি শুরু করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
