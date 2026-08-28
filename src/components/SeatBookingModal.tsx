import React, { useState, useEffect } from 'react';
import {
  X,
  Armchair,
  Clock,
  User,
  Phone,
  Hash,
  ShieldCheck,
  AlertTriangle,
  Heart,
  CheckCircle2,
  Lock,
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
  onRequireAuth?: () => void;
}

export const SeatBookingModal: React.FC<SeatBookingModalProps> = ({
  seat,
  room,
  isOpen,
  onClose,
  onBookingSuccess,
  onRequireAuth,
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
        setName(currentStudent.name || '');
        setPhone(currentStudent.phone || '');
        setStudentId(currentStudent.studentId || '');
        setGender(currentStudent.gender || (seat?.isFemaleReserved ? 'female' : 'male'));
      } else {
        setName('');
        setPhone('');
        setStudentId('');
        setGender(seat?.isFemaleReserved ? 'female' : 'male');
      }
    }
  }, [isOpen, currentStudent, seat]);

  if (!isOpen || !seat) return null;

  // Check if profile is complete (Directive: User must login with Google and submit info)
  const isProfileComplete = Boolean(
    currentStudent && currentStudent.isProfileComplete && currentStudent.phone?.trim()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // If profile is not complete, trigger auth & info submission flow
    if (!isProfileComplete) {
      if (onRequireAuth) {
        onClose();
        onRequireAuth();
      } else {
        setErrorMsg('You must sign in with Google and complete your profile before booking a seat.');
      }
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your contact phone number.');
      return;
    }

    // Gender check for female zone
    if (seat.isFemaleReserved && gender !== 'female') {
      setErrorMsg('This seat is reserved exclusively for female students.');
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
          email: `${name.toLowerCase().replace(/\s+/g, '')}@student.edu`,
          studentId: studentId.trim() || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
          gender,
          isProfileComplete: true,
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
    { hours: 2, label: '2 Hours', sub: 'Short' },
    { hours: 4, label: '4 Hours', sub: 'Standard' },
    { hours: 6, label: '6 Hours', sub: 'Deep Focus' },
    { hours: 8, label: '8 Hours', sub: 'Full Day' },
    { hours: 12, label: '12 Hours', sub: 'Marathon' },
  ];

  return (
    <div
      id="seat-booking-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn font-['Poppins',_sans-serif]"
    >
      <div
        id="seat-booking-modal-card"
        className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-slideUp"
      >
        {/* Header */}
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Armchair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Seat Booking</h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                  Seat #{seat.seatNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {room ? room.name : 'Study Hall'}
              </p>
            </div>
          </div>

          <button
            id="close-booking-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Female reserved warning banner if applicable */}
        {seat.isFemaleReserved && (
          <div className="bg-pink-50 border-b border-pink-200 px-5 py-2.5 flex items-center gap-2 text-xs text-pink-800">
            <Heart className="w-4 h-4 text-pink-600 shrink-0" />
            <span>
              <strong>Female Reserved Section:</strong> This seat is reserved exclusively for female students.
            </span>
          </div>
        )}

        {/* Require Login & Info Banner if not completed */}
        {!isProfileComplete && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Login & Profile Completion Required</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              To book a seat, you must first sign in with Google and submit your student details.
            </p>
            <button
              type="button"
              id="btn-trigger-auth-from-booking"
              onClick={() => {
                onClose();
                if (onRequireAuth) onRequireAuth();
              }}
              className="w-full mt-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign In & Complete Profile</span>
            </button>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Student Info Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Full Name *</span>
              </label>
              <input
                id="booking-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=""
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-slate-400"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Phone Number *</span>
              </label>
              <input
                id="booking-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder=""
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-slate-400 font-mono"
              />
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>Student ID *</span>
              </label>
              <input
                id="booking-student-id"
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder=""
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:border-slate-400 font-mono"
              />
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  disabled={seat.isFemaleReserved}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                    gender === 'male'
                      ? 'bg-slate-900 border-slate-900 text-white font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  } ${seat.isFemaleReserved ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                    gender === 'female'
                      ? 'bg-pink-600 border-pink-600 text-white font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="confirm-booking-btn"
              type="submit"
              disabled={!isProfileComplete}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Confirm Booking</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
