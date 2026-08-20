import React, { useState, useEffect } from 'react';
import {
  X,
  Armchair,
  Clock,
  User,
  Phone,
  Hash,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Seat, Room, Gender } from '../types';
import { useLibrary } from '../context/LibraryContext';

interface SeatBookingModalProps {
  seat: Seat | null;
  room?: Room;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (passCode: string, bookedSeat: Seat) => void;
}

export const SeatBookingModal: React.FC<SeatBookingModalProps> = ({
  seat,
  room,
  isOpen,
  onClose,
  onBookingSuccess,
}) => {
  const { currentStudent, bookSeat, registerOrUpdateStudent } = useLibrary();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [targetHours, setTargetHours] = useState<number>(4);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state with current student when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (currentStudent) {
        setName(currentStudent.name);
        setPhone(currentStudent.phone);
        setStudentId(currentStudent.studentId);
        setGender(currentStudent.gender);
      } else {
        setName('');
        setPhone('');
        setStudentId('');
        setGender(seat?.isFemaleReserved ? 'female' : 'male');
      }
    }
  }, [isOpen, currentStudent, seat]);

  if (!isOpen || !seat) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার পুরো নাম লিখুন (Enter your full name)');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('অনুগ্রহ করে মোবাইল নম্বর লিখুন (Enter phone number)');
      return;
    }

    // Gender check for female zone
    if (seat.isFemaleReserved && gender !== 'female') {
      setErrorMsg('⚠️ এই সিটটি শুধুমাত্র নারী শিক্ষার্থীদের জন্য সংরক্ষিত।');
      return;
    }

    // Book seat
    const result = bookSeat(seat.id, {
      name: name.trim(),
      phone: phone.trim(),
      studentId: studentId.trim() || undefined,
      gender,
      targetHours,
    });

    if (result.success && result.passCode) {
      // Save or update student profile in local state
      if (!currentStudent) {
        registerOrUpdateStudent({
          name: name.trim(),
          phone: phone.trim(),
          email: `${name.toLowerCase().replace(/\s+/g, '')}@student.bd`,
          studentId: studentId.trim() || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
          gender,
        });
      }

      // Celebrate with confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Ignore confetti error if canvas not available
      }

      onBookingSuccess(result.passCode, {
        ...seat,
        status: 'occupied',
        occupantName: name.trim(),
        occupantPhone: phone.trim(),
        studentId: studentId.trim(),
        occupantGender: gender,
        targetDurationHours: targetHours,
        passCode: result.passCode,
      });
      onClose();
    } else {
      setErrorMsg(result.message);
    }
  };

  const durationOptions = [
    { hours: 2, label: '২ ঘণ্টা', sub: 'Short Session' },
    { hours: 4, label: '৪ ঘণ্টা', sub: 'Standard Study' },
    { hours: 6, label: '৬ ঘণ্টা', sub: 'Deep Focus' },
    { hours: 8, label: '৮ ঘণ্টা', sub: 'Full Day' },
    { hours: 12, label: '১২ ঘণ্টা', sub: 'Marathon Session' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Armchair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">সিট বুকিং নিশ্চিতকরণ</h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                  {seat.seatNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {room ? room.bengaliName : 'Study Center Hall'}
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

        {/* Female reserved warning banner if applicable */}
        {seat.isFemaleReserved && (
          <div className="bg-pink-950/40 border-b border-pink-500/30 px-5 py-2.5 flex items-center gap-2 text-xs text-pink-300">
            <Heart className="w-4 h-4 text-pink-400 shrink-0" />
            <span>
              <strong>মহিলা সংরক্ষিত জোন:</strong> এই সিটটি শুধুমাত্র নারী শিক্ষার্থীদের ব্যবহারের জন্য নির্ধারিত।
            </span>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Duration Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>কত সময় অধ্যয়ন করবেন? (Target Duration):</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {durationOptions.map((opt) => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setTargetHours(opt.hours)}
                  className={`py-2 px-1 rounded-xl text-center border text-xs transition-all ${
                    targetHours === opt.hours
                      ? 'bg-sky-600 border-sky-400 text-white font-bold shadow-md shadow-sky-600/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className="text-[9px] opacity-80">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Student Info Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>শিক্ষার্থীর পুরো নাম (Full Name)*</span>
              </label>
              <input
                id="booking-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: তানভীর আহমেদ"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>মোবাইল নম্বর (Phone Number)*</span>
              </label>
              <input
                id="booking-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            {/* Student ID / Roll (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>স্টুডেন্ট আইডি / রোল (ঐচ্ছিক)</span>
              </label>
              <input
                id="booking-student-id"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="যেমন: BCS-47-2026"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                জেন্ডার (Gender)*
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  disabled={seat.isFemaleReserved}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    gender === 'male'
                      ? 'bg-sky-600 border-sky-400 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  } ${seat.isFemaleReserved ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  👨 পুরুষ (Male)
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    gender === 'female'
                      ? 'bg-pink-600 border-pink-400 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  👩 মহিলা (Female)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ডিজিটাল লাইব্রেরি পাস ও লাইভ ট্র্যাকিং</span>
            </div>
            <p>
              বুকিং সম্পন্ন হলে সাথে সাথে আপনার ডিজিটাল স্টাডি টোকেন/পাস জেনারেট হবে। বাইরে যাওয়ার সময় ‘বিরতি নিন’ অপশনটি ব্যবহার করতে পারবেন।
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              বাতিল করুন
            </button>

            <button
              id="confirm-booking-btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>বুকিং কনফার্ম করুন ({targetHours} ঘণ্টা)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
