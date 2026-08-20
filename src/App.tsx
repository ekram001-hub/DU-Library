import React, { useState } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { Navbar } from './components/Navbar';
import { BranchHeader } from './components/BranchHeader';
import { SeatGrid } from './components/SeatGrid';
import { SeatBookingModal } from './components/SeatBookingModal';
import { StudentPassModal } from './components/StudentPassModal';
import { AwayTimerModal } from './components/AwayTimerModal';
import { SeatDetailsModal } from './components/SeatDetailsModal';
import { AuthModal } from './components/AuthModal';
import { GuidelinesModal } from './components/GuidelinesModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { MySeatFloatingWidget } from './components/MySeatFloatingWidget';
import { Seat } from './types';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Heart,
  Facebook,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

function MainApp() {
  const {
    branchConfig,
    rooms,
    currentStudentSeat,
    currentBranchId,
  } = useLibrary();

  // Active Selected Seat for Details/Booking
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isAwayModalOpen, setIsAwayModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Active pass seat (either current student seat or newly booked seat)
  const [passSeat, setPassSeat] = useState<Seat | null>(null);

  // Seat Click Handler
  const handleSelectSeat = (seat: Seat) => {
    setSelectedSeat(seat);
    if (seat.status === 'available') {
      setIsBookModalOpen(true);
    } else {
      setIsDetailsModalOpen(true);
    }
  };

  // On successful booking
  const handleBookingSuccess = (passCode: string, bookedSeat: Seat) => {
    setPassSeat(bookedSeat);
    setIsPassModalOpen(true);
  };

  // Open My Current Pass
  const handleOpenMyPass = () => {
    if (currentStudentSeat) {
      setPassSeat(currentStudentSeat);
      setIsPassModalOpen(true);
    }
  };

  const currentRoom = rooms.find(
    (r) => r.id === (selectedSeat?.roomId || currentStudentSeat?.roomId)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenGuidelines={() => setIsGuidelinesModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenMyPass={handleOpenMyPass}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* Branch Banner & Live Stats Header */}
        <BranchHeader />

        {/* Real-time Interactive Seat Grid & Filters */}
        <SeatGrid onSelectSeat={handleSelectSeat} />
      </main>

      {/* Sticky Bottom Floating Widget for Active User Seat */}
      <MySeatFloatingWidget
        onOpenAwayModal={() => {
          setSelectedSeat(currentStudentSeat);
          setIsAwayModalOpen(true);
        }}
        onOpenPassModal={handleOpenMyPass}
        onSelectSeat={(seat) => {
          setSelectedSeat(seat);
          setIsDetailsModalOpen(true);
        }}
      />

      {/* Footer */}
      <footer className="mt-12 bg-slate-900/90 border-t border-slate-800/80 py-8 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-8 h-8 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              {currentBranchId === 'bcs_study' ? (
                <GraduationCap className="w-4 h-4" />
              ) : (
                <BookOpen className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="font-bold text-slate-200">
                {branchConfig.bengaliName} • Smart Study Center & Library
              </div>
              <div className="text-[11px] text-slate-500">
                {branchConfig.address} • Phone: {branchConfig.phone}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <a
              href={branchConfig.memorizerAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-300 transition-colors flex items-center gap-1 font-medium text-amber-400/90"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Memorizer Learning App</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={branchConfig.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-300 transition-colors flex items-center gap-1 font-medium text-blue-400/90"
            >
              <Facebook className="w-3.5 h-3.5" />
              <span>Facebook Page</span>
            </a>

            <button
              onClick={() => setIsGuidelinesModalOpen(true)}
              className="hover:text-slate-200 transition-colors"
            >
              নিয়মাবলী ও নোটিশ
            </button>

            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="hover:text-rose-400 transition-colors"
            >
              অ্যাডমিন পোর্টাল
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SeatBookingModal
        seat={selectedSeat}
        room={currentRoom}
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onBookingSuccess={handleBookingSuccess}
      />

      <StudentPassModal
        seat={passSeat || selectedSeat || currentStudentSeat}
        room={currentRoom}
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
      />

      <AwayTimerModal
        seat={selectedSeat || currentStudentSeat}
        isOpen={isAwayModalOpen}
        onClose={() => setIsAwayModalOpen(false)}
      />

      <SeatDetailsModal
        seat={selectedSeat}
        room={currentRoom}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onOpenAwayTimer={() => setIsAwayModalOpen(true)}
        onOpenPass={() => {
          setPassSeat(selectedSeat);
          setIsPassModalOpen(true);
        }}
        onOpenBook={() => setIsBookModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <GuidelinesModal
        isOpen={isGuidelinesModalOpen}
        onClose={() => setIsGuidelinesModalOpen(false)}
      />

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <MainApp />
    </LibraryProvider>
  );
}
