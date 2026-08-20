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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        {/* Modal Close Icon */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors print:hidden"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Printable Pass Card */}
        <div id="digital-library-pass" className="p-5 space-y-4 bg-white">
          {/* Pass Top Branding */}
          <div className="text-center pb-3 border-b border-dashed border-slate-200 space-y-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Official Digital Study Pass</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {branchConfig.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {branchConfig.badge}
            </p>
          </div>

          {/* Seat Number Hero Display */}
          <div className="bg-sky-50/70 rounded-xl border border-sky-100 p-3.5 text-center">
            <div className="text-[10px] font-semibold text-sky-700 uppercase tracking-wider">
              Allocated Seat
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono my-0.5 tracking-wider">
              {seat.seatNumber}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              {room ? room.name : 'Central Study Chamber'}
            </div>
          </div>

          {/* Student & Session Information Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Student Name</span>
              <span className="font-semibold text-slate-800 text-xs">
                {seat.occupantName || 'Student'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Contact</span>
              <span className="font-mono text-slate-800 text-xs">
                {seat.occupantPhone || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Student ID</span>
              <span className="font-mono text-slate-800 text-xs">
                {seat.studentId || 'PASS-STUDENT'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Date</span>
              <span className="text-slate-800 font-mono text-xs">
                {formatDate(bookedTime)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Entry Time</span>
              <span className="font-bold text-emerald-600 font-mono text-xs">
                {formatTime(bookedTime)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-medium">Valid Till</span>
              <span className="font-bold text-amber-600 font-mono text-xs">
                {formatTime(validUntilTime)}
              </span>
            </div>
          </div>

          {/* Barcode & Security Pass Code Graphic */}
          <div className="pt-1 text-center space-y-1.5">
            <div className="inline-flex items-center justify-center p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 h-8 px-2 bg-white rounded border border-slate-200">
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
                </div>
                <div className="text-[10px] font-mono font-bold tracking-widest text-slate-700">
                  {seat.passCode || 'PASS-BCS-08191'}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              Keep this token pass ready during desk checks and inspection.
            </p>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors text-center"
          >
            Close
          </button>

          <button
            id="print-pass-btn"
            onClick={handlePrint}
            className="flex-1 py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pass</span>
          </button>
        </div>
      </div>
    </div>
  );
};

