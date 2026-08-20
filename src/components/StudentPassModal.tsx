import React from 'react';
import {
  X,
  Printer,
  QrCode,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Armchair,
  CheckCircle2,
  GraduationCap,
  Download,
} from 'lucide-react';
import { Seat, Room } from '../types';
import { useLibrary } from '../context/LibraryContext';

interface StudentPassModalProps {
  seat: Seat | null;
  room?: Room;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentPassModal: React.FC<StudentPassModalProps> = ({
  seat,
  room,
  isOpen,
  onClose,
}) => {
  const { branchConfig } = useLibrary();

  if (!isOpen || !seat) return null;

  const bookedTime = seat.bookedAt ? new Date(seat.bookedAt) : new Date();
  const validUntilTime = seat.expectedLeaveAt
    ? new Date(seat.expectedLeaveAt)
    : new Date(bookedTime.getTime() + 4 * 3600 * 1000);

  const formatTime = (d: Date) => {
    let hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${mins} ${ampm}`;
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Modal Close Icon */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Pass Card */}
        <div id="digital-library-pass" className="p-6 space-y-5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
          {/* Pass Top Branding */}
          <div className="text-center pb-4 border-b border-dashed border-slate-800 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Digital Study Pass</span>
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              {branchConfig.bengaliName}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {branchConfig.name} • {branchConfig.badge}
            </p>
          </div>

          {/* Seat Number Hero Display */}
          <div className="bg-gradient-to-r from-sky-950/60 via-indigo-950/60 to-sky-950/60 rounded-xl border border-sky-500/40 p-4 text-center shadow-inner">
            <div className="text-xs font-semibold text-sky-400 uppercase tracking-widest">
              Allocated Seat Number
            </div>
            <div className="text-4xl font-extrabold text-white font-mono my-1 tracking-wider">
              {seat.seatNumber}
            </div>
            <div className="text-xs text-slate-300 font-medium">
              {room ? room.bengaliName : 'Central Study Chamber'}
            </div>
          </div>

          {/* Student & Session Information Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/80 rounded-xl p-3.5 border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">শিক্ষার্থীর নাম</span>
              <span className="font-semibold text-slate-200 text-sm">
                {seat.occupantName || 'Student'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">মোবাইল নম্বর</span>
              <span className="font-mono text-slate-200">
                {seat.occupantPhone || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">স্টুডেন্ট আইডি / রোল</span>
              <span className="font-mono text-slate-200">
                {seat.studentId || 'STUDENT-PASS'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">তারিখ</span>
              <span className="text-slate-200 font-mono">
                {formatDate(bookedTime)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">প্রবেশ সময় (Entry)</span>
              <span className="font-bold text-emerald-400 font-mono">
                {formatTime(bookedTime)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">মেয়াদ শেষ (Valid Till)</span>
              <span className="font-bold text-amber-400 font-mono">
                {formatTime(validUntilTime)}
              </span>
            </div>
          </div>

          {/* Barcode & Security Pass Code Graphic */}
          <div className="pt-2 text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl shadow-md">
              {/* Simulated crisp Barcode / QR lines */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 h-10 px-2 bg-white">
                  <div className="w-1 h-full bg-slate-900"></div>
                  <div className="w-0.5 h-full bg-slate-900"></div>
                  <div className="w-1.5 h-full bg-slate-900"></div>
                  <div className="w-0.5 h-full bg-slate-900"></div>
                  <div className="w-2 h-full bg-slate-900"></div>
                  <div className="w-1 h-full bg-slate-900"></div>
                  <div className="w-0.5 h-full bg-slate-900"></div>
                  <div className="w-1.5 h-full bg-slate-900"></div>
                  <div className="w-2 h-full bg-slate-900"></div>
                  <div className="w-0.5 h-full bg-slate-900"></div>
                  <div className="w-1 h-full bg-slate-900"></div>
                  <div className="w-1.5 h-full bg-slate-900"></div>
                  <div className="w-0.5 h-full bg-slate-900"></div>
                  <div className="w-2 h-full bg-slate-900"></div>
                  <div className="w-1 h-full bg-slate-900"></div>
                </div>
                <div className="text-[10px] font-mono font-bold tracking-widest text-slate-800">
                  {seat.passCode || 'PASS-BCS-08191'}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500">
              লাইব্রেরিতে অবস্থানকালে ও ডেস্কে এই ডিজিটাল পাস সংরক্ষণ করুন।
            </p>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-all text-center"
          >
            বন্ধ করুন (Close)
          </button>

          <button
            id="print-pass-btn"
            onClick={handlePrint}
            className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/30 flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট / সেভ টোকেন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
