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
    { mins: 15, label: '১৫ মিনিট', sub: 'চা-নাস্তা / ফ্রেশ হওয়া' },
    { mins: 30, label: '৩০ মিনিট', sub: 'নামায / খাবার' },
    { mins: 45, label: '৪৫ মিনিট', sub: 'দুপুরের খাবার / রেস্ট' },
    { mins: 60, label: '৬০ মিনিট', sub: 'জরুরি কাজ / বিশ্রাম' },
  ];

  const reasonOptions: { id: AwayReason; label: string; icon: string; desc: string }[] = [
    { id: 'Prayer', label: 'নামায আদায় (Prayer)', icon: '🕌', desc: 'মসজিদে নামায আদায়ের জন্য' },
    { id: 'Lunch', label: 'খাবার গ্রহণ (Lunch/Dinner)', icon: '🍱', desc: 'ক্যান্টিন বা লাউঞ্জে খাবার' },
    { id: 'Tea', label: 'চা-নাস্তা (Tea Break)', icon: '☕', desc: 'ফ্রেশ ও রিফ্রেশমেন্ট' },
    { id: 'Rest', label: 'স্বল্প বিরতি / বিশ্রাম (Rest)', icon: '🛋️', desc: 'চোখ ও শরীর রিল্যাক্স' },
    { id: 'Emergency', label: 'জরুরি প্রয়োজন (Urgent)', icon: '⚡', desc: 'জরুরি কল বা কাজ' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 p-5 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">সাময়িক বিরতি নিন (Away Timer)</h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {seat.seatNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                সিট রিজার্ভ রেখে স্বল্প সময়ের বিরতি সেট করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>বিরতির সময়কাল (Break Duration):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presetDurations.map((d) => (
                <button
                  key={d.mins}
                  type="button"
                  onClick={() => setDurationMinutes(d.mins)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    durationMinutes === d.mins
                      ? 'bg-amber-600 border-amber-400 text-white font-bold shadow-md shadow-amber-600/30'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-sm font-bold">{d.label}</div>
                  <div className="text-[10px] opacity-80 line-clamp-1 mt-0.5">{d.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Reason Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              বিরতির কারণ (Select Reason):
            </label>
            <div className="space-y-1.5">
              {reasonOptions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                    reason === r.id
                      ? 'bg-slate-800 border-amber-500 text-white font-semibold shadow-inner'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{r.icon}</span>
                    <div>
                      <div className="text-slate-200 font-medium">{r.label}</div>
                      <div className="text-[10px] text-slate-500">{r.desc}</div>
                    </div>
                  </div>
                  {reason === r.id && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notice Box */}
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200/90 space-y-1">
            <div className="font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>লাইভ কাউন্টডাউন ও সিট সংরক্ষণ:</span>
            </div>
            <p>
              বিরতি শুরু করলে আপনার সিটের উপর লাইভ কাউন্টডাউন ব্যাজ চালু হবে। বিরতি শেষে ফিরে এসে "আমি ফিরে এসেছি / I am Back" বাটনে চাপ দিলেই সিট পুনরায় সচল হবে।
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              বাতিল
            </button>

            <button
              id="confirm-away-timer-btn"
              type="button"
              onClick={handleStartBreak}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-amber-600/30 flex items-center gap-2"
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
