import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { PortalHome } from './components/PortalHome';
import { SeatGrid } from './components/SeatGrid';
import { AdminPage } from './components/AdminPage';
import { SeatBookingModal } from './components/SeatBookingModal';
import { StudentPassModal } from './components/StudentPassModal';
import { AwayTimerModal } from './components/AwayTimerModal';
import { SeatDetailsModal } from './components/SeatDetailsModal';
import { AuthModal } from './components/AuthModal';
import { GuidelinesModal } from './components/GuidelinesModal';
import { MySeatFloatingWidget } from './components/MySeatFloatingWidget';
import { Seat, BranchId } from './types';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-slate-700 font-['Poppins',_sans-serif]">
          <h2 className="text-lg font-bold text-rose-600 mb-2">Something went wrong</h2>
          <p className="text-xs text-slate-500 mb-4">Please refresh the page to reload the seat state.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const {
    currentBranchId,
    setCurrentBranchId,
    branchConfig,
    rooms,
    currentStudentSeat,
    isAdminLoggedIn,
  } = useLibrary();

  // Navigation state: 'portal' (Landing Hub), 'seats' (Live Seat View), or 'admin' (Dedicated Admin Panel Page)
  const [currentView, setCurrentView] = useState<'portal' | 'seats' | 'admin'>('portal');

  // Active Selected Seat for Details/Booking
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isAwayModalOpen, setIsAwayModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false);

  // Active pass seat (either current student seat or newly booked seat)
  const [passSeat, setPassSeat] = useState<Seat | null>(null);

  // Hash URL listener for direct link navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') {
        setCurrentView('admin');
      } else if (hash === '#seats') {
        setCurrentView('seats');
      } else if (hash === '#portal' || hash === '') {
        // keep current view unless explicitly changing
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Branch Selection from Portal
  const handleSelectBranch = (branchId: BranchId) => {
    setCurrentBranchId(branchId);
    setCurrentView('seats');
    window.location.hash = '#seats';
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

  const handleOpenAdminPage = () => {
    setCurrentView('admin');
    window.location.hash = '#admin';
  };

  const handleBackToPortal = () => {
    setCurrentView('portal');
    window.location.hash = '#portal';
  };

  const handleOpenSeats = () => {
    setCurrentView('seats');
    window.location.hash = '#seats';
  };

  const currentRoom = rooms.find(
    (r) => r.id === (selectedSeat?.roomId || currentStudentSeat?.roomId)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Poppins',_sans-serif] selection:bg-indigo-500 selection:text-white">
      {currentView === 'admin' ? (
        /* Screen 3: Dedicated Admin Dashboard Page */
        <AdminPage
          onBackToPortal={handleBackToPortal}
          onOpenSeats={handleOpenSeats}
        />
      ) : currentView === 'portal' ? (
        /* Screen 1: Portal Hub View */
        <PortalHome
          onSelectBranch={handleSelectBranch}
          onOpenGuidelines={() => setIsGuidelinesModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenAdmin={handleOpenAdminPage}
          onOpenMyPass={handleOpenMyPass}
        />
      ) : (
        /* Screen 2: Live Seat Grid View */
        <div className="min-h-screen flex flex-col justify-between">
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
            <SeatGrid
              onSelectSeat={handleSelectSeat}
              onOpenGuidelines={() => setIsGuidelinesModalOpen(true)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenAdmin={handleOpenAdminPage}
              onBackToHome={handleBackToPortal}
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
                  onClick={handleBackToPortal}
                  className="hover:text-slate-800 font-medium transition-colors cursor-pointer"
                >
                  Home Portal
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setIsGuidelinesModalOpen(true)}
                  className="hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Rules & Guidelines
                </button>
                {isAdminLoggedIn && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleOpenAdminPage}
                      className="text-rose-600 font-semibold hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      Admin Dashboard
                    </button>
                  </>
                )}
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* Sticky Bottom Floating Widget for Active User Seat (only outside admin) */}
      {currentView !== 'admin' && (
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
      )}

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
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LibraryProvider>
        <MainApp />
      </LibraryProvider>
    </ErrorBoundary>
  );
}
