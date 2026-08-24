import React, { useState } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { PortalHome } from './components/PortalHome';
import { SeatGrid } from './components/SeatGrid';
import { SeatBookingModal } from './components/SeatBookingModal';
import { StudentPassModal } from './components/StudentPassModal';
import { AwayTimerModal } from './components/AwayTimerModal';
import { SeatDetailsModal } from './components/SeatDetailsModal';
import { AuthModal } from './components/AuthModal';
import { GuidelinesModal } from './components/GuidelinesModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { MySeatFloatingWidget } from './components/MySeatFloatingWidget';
import { Seat, BranchId } from './types';

function MainApp() {
  const {
    currentBranchId,
    setCurrentBranchId,
    branchConfig,
    rooms,
    currentStudentSeat,
    isAdminLoggedIn,
  } = useLibrary();

  // Navigation state: 'portal' (Landing Hub, Image 1) or 'seats' (Live Seat View, Image 2)
  const [currentView, setCurrentView] = useState<'portal' | 'seats'>('portal');

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

  // Branch Selection from Portal
  const handleSelectBranch = (branchId: BranchId) => {
    setCurrentBranchId(branchId);
    setCurrentView('seats');
  };

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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Hind_Siliguri',_'Poppins',_sans-serif] selection:bg-indigo-500 selection:text-white">
      {currentView === 'portal' ? (
        /* Screen 1: Portal Hub View (Matching Screenshot 1) */
        <PortalHome
          onSelectBranch={handleSelectBranch}
          onOpenGuidelines={() => setIsGuidelinesModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          onOpenMyPass={handleOpenMyPass}
        />
      ) : (
        /* Screen 2: Live Seat Grid View (Matching Screenshot 2) */
        <div className="min-h-screen flex flex-col justify-between">
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
            <SeatGrid
              onSelectSeat={handleSelectSeat}
              onOpenGuidelines={() => setIsGuidelinesModalOpen(true)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenAdmin={() => setIsAdminModalOpen(true)}
              onBackToHome={() => setCurrentView('portal')}
            />
          </main>

          {/* Bottom Footer */}
          <footer className="mt-8 bg-white border-t border-slate-200 py-4 px-4 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
              <div>
                {branchConfig.name} • {branchConfig.tagline}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentView('portal')}
                  className="hover:text-slate-800 font-medium transition-colors"
                >
                  হোম পেজ
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setIsGuidelinesModalOpen(true)}
                  className="hover:text-slate-800 transition-colors"
                >
                  নির্দেশনা
                </button>
                {isAdminLoggedIn && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setIsAdminModalOpen(true)}
                      className="text-rose-600 font-semibold hover:text-rose-700 transition-colors"
                    >
                      এডমিন প্যানেল
                    </button>
                  </>
                )}
              </div>
            </div>
          </footer>
        </div>
      )}

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

      {/* Modals */}
      <SeatBookingModal
        seat={selectedSeat}
        room={currentRoom}
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onBookingSuccess={handleBookingSuccess}
        onRequireAuth={() => setIsAuthModalOpen(true)}
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
