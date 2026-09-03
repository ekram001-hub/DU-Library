import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  BranchId,
  BranchConfig,
  Room,
  Seat,
  StudentProfile,
  AdminUser,
  LibraryNotice,
  AttendanceRecord,
  LibraryStats,
  Gender,
  AwayReason,
  LibraryRule,
  WifiFacilityConfig,
  WifiNetwork,
  BookingSchedule,
  DaySchedule,
} from '../types';
import {
  BRANCHES_DATA,
  INITIAL_ROOMS,
  INITIAL_NOTICES,
  INITIAL_RULES,
  INITIAL_WIFI_CONFIGS,
  INITIAL_WIFI_NETWORKS,
  DEMO_STUDENTS,
  DEFAULT_BOOKING_SCHEDULE,
  generateInitialSeats,
} from '../data/initialData';
import {
  getSupabase,
  signInWithGoogle as supabaseSignInGoogle,
  signInWithEmail as supabaseSignInWithEmail,
  signOutSupabase as supabaseSignOut,
  isSupabaseConfigured,
  syncStudentToCloud,
  updateStudentPinHash,
  updateStudentBlockedStatus,
  deleteStudentFromCloud,
  fetchAllStudentsFromCloud,
  syncLibraryStateToCloud,
  fetchLibraryStateFromCloud,
  fetchDailyResetMarker,
  setDailyResetMarker,
  fetchBookingScheduleFromCloud,
  saveBookingScheduleToCloud,
  subscribeToSupabaseRealtime,
  broadcastStateViaSupabase,
  runSupabaseDiagnostics,
  checkAdminAccess,
  SupabaseDiagnosticReport,
} from '../lib/supabase';
import {
  hashPin,
  verifyPin,
  needsHashUpgrade,
  pinValidationError,
  normalizePin,
  isHashedPin,
} from '../lib/crypto';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  OWNER IDENTITY — LABELS ONLY, NEVER AUTHORIZATION
 * ────────────────────────────────────────────────────────────────────────────
 *  Everything a browser can read, a browser can rewrite. These constants used
 *  to *grant* admin access, which meant anyone could open DevTools, set
 *  `currentStudent.phone = '01581624202'` and own the library.
 *
 *  They are kept only so the UI can still render a "Project Owner" label.
 *  Authorization now comes exclusively from the `admins` table in Postgres,
 *  checked against the Supabase-signed JWT — see `verifyAdminSession()`.
 *  Never call these functions to decide whether an action is allowed.
 */
export const ADMIN_PHONE_NUMBER = '01581624202';

export const ADMIN_EMAILS = [
  'mohammad.001ekram@gmail.com',
  'ryanekram001@gmail.com',
];

/** @deprecated Label only. Use `verifyAdminSession()` / `isSuperAdminUser`. */
export const isSuperAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.includes(normalized);
};

/** @deprecated Label only. Use `verifyAdminSession()` / `isSuperAdminUser`. */
export const isSuperAdminPhone = (phone?: string): boolean => {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits === ADMIN_PHONE_NUMBER;
};

/**
 * @deprecated Label only — a whitelisted e-mail or phone on a client-side
 * object proves nothing. Kept so existing call sites keep compiling; it must
 * not be used to gate any feature.
 */
export const isSuperAdminUserCheck = (user?: { email?: string; phone?: string; role?: string } | null): boolean => {
  if (!user) return false;
  return isSuperAdminEmail(user.email) || isSuperAdminPhone(user.phone);
};

export interface AdminLoginResult {
  ok: boolean;
  /** Why the login failed, safe to render. */
  message?: string;
  /**
   * `server_not_configured` means the database has not been migrated yet: the
   * admin console shows the SQL script instead of a generic "wrong password".
   */
  reason?: 'invalid_credentials' | 'not_an_admin' | 'server_not_configured' | 'no_session' | 'error';
}

interface LibraryContextType {
  currentBranchId: BranchId;
  setCurrentBranchId: (branchId: BranchId) => void;
  branchConfig: BranchConfig;
  allBranches: Record<string, BranchConfig>;
  updateBranchConfig: (branchId: BranchId, updates: Partial<BranchConfig>) => void;
  bookingSchedule: BookingSchedule;
  updateBookingSchedule: (day: number, updates: Partial<DaySchedule>) => void;
  isBookingOpenNow: boolean;

  rooms: Room[];
  branchRooms: Room[];
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;
  moveRoomOrder: (roomId: string, direction: 'up' | 'down') => void;
  setRoomOrder: (roomId: string, newOrder: number) => void;

  seats: Seat[];
  branchSeats: Seat[];
  currentStudentSeat: Seat | null;
  bookSeat: (
    seatId: string,
    studentDetails: {
      name: string;
      phone: string;
      email?: string;
      studentId?: string;
      gender: Gender;
      targetHours: number;
    }
  ) => { success: boolean; message: string; passCode?: string };
  leaveSeatTemporarily: (seatId: string, durationMinutes: number, reason: AwayReason, customReason?: string) => void;
  returnFromAway: (seatId: string) => void;
  releaseSeat: (seatId: string) => void;
  secondaryBookSeat: (
    seatId: string,
    studentDetails: {
      name: string;
      phone: string;
      studentId?: string;
      gender: Gender;
    }
  ) => { success: boolean; message: string; passCode?: string };
  releaseSecondaryBooking: (seatId: string) => void;
  
  // Guidelines & Code of Conduct
  rules: LibraryRule[];
  addRule: (rule: Omit<LibraryRule, 'id'>) => void;
  updateRule: (ruleId: string, updates: Partial<LibraryRule>) => void;
  deleteRule: (ruleId: string) => void;

  // Wi-Fi & Facility Amenities
  wifiFacilities: Record<string, WifiFacilityConfig>;
  currentBranchWifi: WifiFacilityConfig;
  updateWifiFacility: (branchId: BranchId, updates: Partial<WifiFacilityConfig>) => void;
  wifiNetworks: WifiNetwork[];
  addWifiNetwork: (network: Omit<WifiNetwork, 'id'>) => void;
  updateWifiNetwork: (networkId: string, updates: Partial<WifiNetwork>) => void;
  deleteWifiNetwork: (networkId: string) => void;
  setWifiNetworkPassword: (networkId: string, newPassword: string) => void;

  // Admin actions
  adminForceReleaseSeat: (seatId: string) => void;
  adminToggleMaintenance: (seatId: string, note?: string) => void;
  adminManuallyAssignSeat: (
    seatId: string,
    occupantName: string,
    phone: string,
    durationHours: number,
    gender: Gender
  ) => void;
  /**
   * Hash `rawPin` and store the credential. The plaintext is discarded as soon
   * as this function returns — nothing downstream ever sees it.
   */
  adminResetStudentPin: (phone: string, rawPin: string) => Promise<{ success: boolean; message: string }>;
  /**
   * Desk-side check: does `rawPin` match the credential stored for `phone`?
   * Returns `null` when the student has no PIN set.
   */
  adminVerifyStudentPin: (phone: string, rawPin: string) => Promise<boolean | null>;
  adminToggleBlockStudent: (phone: string) => void;
  adminAddCustomSeat: (seatData: Omit<Seat, 'id'>) => void;
  adminDeleteSeat: (seatId: string) => void;
  adminToggleSeatFemaleReserved: (seatId: string) => void;

  // Data Backup & Cloud Sync
  exportFullBackupJSON: () => string;
  importFullBackupJSON: (jsonStr: string) => { success: boolean; message: string };
  syncStateToCloudManual: () => Promise<{ success: boolean; message: string }>;
  runDiagnostics: () => Promise<SupabaseDiagnosticReport>;
  cloudLastSyncedAt: string | null;

  // Student Auth & Directory
  currentStudent: StudentProfile | null;
  registeredStudents: StudentProfile[];
  loginStudent: (student: StudentProfile) => void;
  logoutStudent: () => void;
  demoLogin: (demoStudentId: string) => void;
  registerOrUpdateStudent: (data: Omit<StudentProfile, 'id' | 'role'>) => void;
  deleteRegisteredStudent: (phone: string) => void;
  refreshStudentsFromCloud: () => Promise<void>;
  signInWithGoogleAuth: () => Promise<{ error: Error | null; data?: unknown }>;
  isSupabaseReady: boolean;

  // Admin Auth
  adminUser: AdminUser | null;
  isAdminLoggedIn: boolean;
  isSuperAdminUser: boolean;
  /** True while the very first server-side admin check is still in flight. */
  adminCheckPending: boolean;
  /** Set when Postgres says the `admins` table is missing. */
  adminSetupRequired: boolean;
  loginAdmin: (email: string, pass: string) => Promise<AdminLoginResult>;
  logoutAdmin: () => void;

  // Notices
  notices: LibraryNotice[];
  addNotice: (notice: Omit<LibraryNotice, 'id'>) => void;
  updateNotice: (noticeId: string, updates: Partial<LibraryNotice>) => void;
  deleteNotice: (noticeId: string) => void;

  // Attendance Records
  attendanceRecords: AttendanceRecord[];
  
  // Stats
  branchStats: LibraryStats;
  overallStats: LibraryStats;

  // Auto-Reset and maintenance
  triggerDailyAutoReset: () => void;
  resetToDefaultData: () => void;

  // Live timer tick
  currentTime: Date;
}


const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BRANCH: 'smart_library_current_branch',
  BRANCHES_CONFIG: 'smart_library_branches_config_v2',
  ROOMS: 'smart_library_rooms_v2',
  SEATS: 'smart_library_seats_v2',
  CURRENT_STUDENT: 'smart_library_current_student_v2',
  REGISTERED_STUDENTS: 'smart_library_registered_students_v2',
  ADMIN_USER: 'smart_library_admin_user_v2',
  NOTICES: 'smart_library_notices_v2',
  ATTENDANCE: 'smart_library_attendance_v2',
  LAST_RESET_DATE: 'smart_library_last_reset_date_v2',
  RULES: 'smart_library_rules_v2',
  WIFI_FACILITIES: 'smart_library_wifi_facilities_v2',
  WIFI_NETWORKS: 'smart_library_wifi_networks_v2',
  BOOKING_SCHEDULE: 'smart_library_booking_schedule_v1',
};

/**
 * Reconcile & Heal Seats to guarantee every room has its full configured capacity of seats
 * and preserves live active booking states, student info, and countdowns.
 */
export function reconcileSeatsWithRooms(roomsList: Room[], seatsList: Seat[]): Seat[] {
  if (!Array.isArray(roomsList) || roomsList.length === 0) {
    return seatsList || [];
  }

  const result: Seat[] = [];
  const safeSeatsList = Array.isArray(seatsList) ? seatsList : [];

  // Group existing seats by roomId
  const existingSeatsByRoomId = new Map<string, Seat[]>();
  safeSeatsList.forEach((s) => {
    if (!existingSeatsByRoomId.has(s.roomId)) {
      existingSeatsByRoomId.set(s.roomId, []);
    }
    existingSeatsByRoomId.get(s.roomId)!.push(s);
  });

  // Track orphan seats (whose roomId does not match any current room)
  const orphanSeats = safeSeatsList.filter((s) => !roomsList.some((r) => r.id === s.roomId));

  roomsList.forEach((room, roomIdx) => {
    let matchedSeats = existingSeatsByRoomId.get(room.id) || [];

    // If no seats directly match room.id, rescue from orphan seats (e.g. legacy room_1 -> sci_room_1)
    if (matchedSeats.length === 0 && orphanSeats.length > 0) {
      const rescued = orphanSeats.filter(
        (s) =>
          s.branchId === room.branchId &&
          (s.seatNumber.startsWith(room.seatPrefix) ||
            s.roomId.endsWith(`_${roomIdx + 1}`) ||
            s.roomId === `room_${roomIdx + 1}` ||
            s.roomId === `sci_room_${roomIdx + 1}` ||
            s.roomId === `cen_room_${roomIdx + 1}`)
      );
      if (rescued.length > 0) {
        matchedSeats = rescued.map((s) => ({
          ...s,
          roomId: room.id,
          branchId: room.branchId,
        }));
      }
    }

    const isFemale = room.category === 'female_only';
    const finalRoomSeats: Seat[] = [];

    for (let i = 1; i <= room.capacity; i++) {
      const seatNumPadded = i < 10 ? `0${i}` : `${i}`;
      const expectedSeatNumber = `${room.seatPrefix}-${seatNumPadded}`;
      const expectedSeatId = `${room.id}_seat_${i}`;

      // Prioritize exact seat ID and exact seat number match so active bookings & status are preserved
      const existingSeat = matchedSeats.find(
        (s) =>
          s.id === expectedSeatId ||
          s.seatNumber === expectedSeatNumber ||
          s.seatNumber === `${i}` ||
          s.seatNumber === `${room.seatPrefix}-${i}` ||
          s.seatNumber === `${room.seatPrefix}-${seatNumPadded}`
      );

      if (existingSeat) {
        finalRoomSeats.push({
          ...existingSeat,
          id: expectedSeatId,
          roomId: room.id,
          branchId: room.branchId,
          seatNumber: expectedSeatNumber,
          isFemaleReserved: existingSeat.isFemaleReserved ?? isFemale,
        });
      } else {
        finalRoomSeats.push({
          id: expectedSeatId,
          roomId: room.id,
          branchId: room.branchId,
          seatNumber: expectedSeatNumber,
          status: 'available',
          isFemaleReserved: isFemale,
          isSpecialReserved: false,
        });
      }
    }

    result.push(...finalRoomSeats);
  });

  return result;
}

// =========================================================================
// Booking Schedule helpers — pure functions of (date, schedule), used both
// by bookSeat's window enforcement and by the UI (pass "Valid Till", admin
// settings preview). Keyed by Date#getDay() (0 = Sunday .. 6 = Saturday).
// =========================================================================

export function getDaySchedule(date: Date, schedule: BookingSchedule): DaySchedule {
  return schedule[date.getDay()] || DEFAULT_BOOKING_SCHEDULE[date.getDay()];
}

function scheduleTimestamp(date: Date, hour: number, minute: number): number {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

export function getTodaysStartTimestamp(date: Date, schedule: BookingSchedule): number {
  const day = getDaySchedule(date, schedule);
  return scheduleTimestamp(date, day.startHour, day.startMinute);
}

export function getTodaysResetTimestamp(date: Date, schedule: BookingSchedule): number {
  const day = getDaySchedule(date, schedule);
  return scheduleTimestamp(date, day.resetHour, day.resetMinute);
}

/** Is the given moment within today's [start, reset) booking window? */
export function isBookingWindowOpen(date: Date, schedule: BookingSchedule): boolean {
  const t = date.getTime();
  return t >= getTodaysStartTimestamp(date, schedule) && t < getTodaysResetTimestamp(date, schedule);
}

export function formatScheduleTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${minute < 10 ? '0' : ''}${minute} ${period}`;
}

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Current Branch
  const [currentBranchId, setCurrentBranchIdState] = useState<BranchId>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BRANCH);
    if (saved === 'central_library' || saved === 'science_library') {
      return saved as BranchId;
    }
    return 'science_library';
  });

  const setCurrentBranchId = useCallback((id: BranchId) => {
    const validId: BranchId = id === 'central_library' ? 'central_library' : 'science_library';
    setCurrentBranchIdState(validId);
    localStorage.setItem(STORAGE_KEYS.BRANCH, validId);
  }, []);

  // 2. Branches config
  const [allBranches, setAllBranches] = useState<Record<string, BranchConfig>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BRANCHES_CONFIG);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.science_library && parsed.central_library) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved branches config', e);
      }
    }
    return BRANCHES_DATA;
  });

  const updateBranchConfig = useCallback((branchId: BranchId, updates: Partial<BranchConfig>) => {
    setAllBranches((prev) => {
      const next = {
        ...prev,
        [branchId]: {
          ...prev[branchId],
          ...updates,
        },
      };
      localStorage.setItem(STORAGE_KEYS.BRANCHES_CONFIG, JSON.stringify(next));
      // Without this, Settings-tab edits (Facebook link, contact phone,
      // memorizer app URL) only ever reached this admin's own browser/
      // localStorage — other devices and a fresh visitor's browser kept
      // showing the old values forever. broadcastSync/roomsRef/etc. are
      // declared further down this same component function but are already
      // initialized by the time a person can actually click "Save" (they're
      // set on every render, well before any click handler runs), so this
      // closure sees their current values just like their own callers do.
      lastLocalMutationAtRef.current = Date.now();
      broadcastSync({ branchesConfig: next });
      syncLibraryStateToCloud({
        rooms: roomsRef.current,
        seats: seatsRef.current,
        notices: noticesRef.current,
        branchesConfig: next,
        rules: rulesRef.current,
        wifiFacilities: wifiFacilitiesRef.current,
        wifiNetworks: wifiNetworksRef.current,
      }).catch(() => {});
      return next;
    });
  }, []);

  // 3. Rooms
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
    if (saved) {
      try {
        const parsed: Room[] = JSON.parse(saved);
        const hasSciRooms = parsed.some((r) => r.branchId === 'science_library');
        const hasCenRooms = parsed.some((r) => r.branchId === 'central_library');
        if (hasSciRooms && hasCenRooms && parsed.length >= 8) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved rooms', e);
      }
    }
    return INITIAL_ROOMS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }, [rooms]);

  // 4. Seats (Always healed and reconciled with rooms)
  const [seats, setSeats] = useState<Seat[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SEATS);
    if (saved) {
      try {
        const parsed: Seat[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return reconcileSeatsWithRooms(rooms, parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved seats', e);
      }
    }
    return reconcileSeatsWithRooms(rooms, generateInitialSeats());
  });

  // Reconcile seats whenever rooms list changes
  useEffect(() => {
    setSeats((prev) => {
      const reconciled = reconcileSeatsWithRooms(rooms, prev);
      const isMismatch =
        reconciled.length !== prev.length ||
        reconciled.some(
          (s, idx) =>
            !prev[idx] ||
            prev[idx].id !== s.id ||
            prev[idx].roomId !== s.roomId ||
            prev[idx].seatNumber !== s.seatNumber
        );
      return isMismatch ? reconciled : prev;
    });
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seats));
  }, [seats]);

  // 5. Current Student & Registered Students Directory
  const [registeredStudents, setRegisteredStudents] = useState<StudentProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REGISTERED_STUDENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse registered students', e);
      }
    }
    return DEMO_STUDENTS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REGISTERED_STUDENTS, JSON.stringify(registeredStudents));
  }, [registeredStudents]);

  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved student', e);
      }
    }
    return null;
  });

  const currentStudentRef = useRef<StudentProfile | null>(currentStudent);
  useEffect(() => {
    currentStudentRef.current = currentStudent;
  }, [currentStudent]);

  // ==========================================================================
  // 6. ADMIN SESSION
  // ==========================================================================
  // Deliberately NOT initialised from localStorage. A persisted
  // `{ "role": "superadmin" }` blob is exactly what used to let any visitor
  // open the dashboard; the browser can write anything it likes there. The
  // only durable credential is the Supabase session token, which the server
  // signs, and it is re-checked against the `admins` table on every load.
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminCheckPending, setAdminCheckPending] = useState<boolean>(true);
  const [adminSetupRequired, setAdminSetupRequired] = useState<boolean>(false);

  const registeredStudentsRef = useRef<StudentProfile[]>([]);
  useEffect(() => {
    registeredStudentsRef.current = registeredStudents;
  }, [registeredStudents]);

  /** Remove anything older builds left behind in localStorage. */
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
  }, []);

  /**
   * The single authority for "is this account an administrator?".
   *
   * It asks Postgres, which matches the e-mail inside the *signed* Supabase
   * JWT against the `admins` allow-list. No client-side value can influence
   * the answer, so DevTools edits no longer work.
   */
  const verifyAdminSession = useCallback(
    async (email?: string | null): Promise<AdminUser | null> => {
      try {
        const result = await checkAdminAccess(email);

        if (result.status === 'granted') {
          setAdminSetupRequired(false);
          const admin: AdminUser = {
            id: `admin_${result.admin.email}`,
            name: result.admin.name || result.admin.email.split('@')[0] || 'Library Admin',
            email: result.admin.email,
            role: result.admin.role,
            branchAccess:
              result.admin.branch_access === 'science_library' ||
              result.admin.branch_access === 'central_library'
                ? result.admin.branch_access
                : 'all',
          };
          setAdminUser(admin);
          return admin;
        }

        setAdminSetupRequired(result.status === 'not_configured');
        setAdminUser(null);
        return null;
      } catch (err) {
        console.warn('[Admin] Server-side authorization check failed:', err);
        setAdminUser(null);
        return null;
      }
    },
    []
  );

  // Supabase Auth integration & session listener
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setAdminCheckPending(false);
      return;
    }

    let cancelled = false;

    const handleSessionUser = async (user: SupabaseUser | null) => {
      if (!user) {
        if (cancelled) return;
        setAdminUser(null);
        setAdminCheckPending(false);
        return;
      }

      // Authorization first: the local profile is only cosmetics.
      const admin = await verifyAdminSession(user.email);
      if (cancelled) return;

      const meta = user.user_metadata || {};
      const fullName =
        (meta.full_name as string) ||
        (meta.name as string) ||
        user.email?.split('@')[0] ||
        'Library Member';
      const userPhone = String(meta.phone || '');

      const existingLocal = registeredStudentsRef.current.find(
        (s) =>
          (user.email && s.email?.toLowerCase() === user.email.toLowerCase()) ||
          (userPhone && s.phone.replace(/\D/g, '') === userPhone.replace(/\D/g, ''))
      );

      const loadedStudent: StudentProfile = {
        id: user.id,
        name: existingLocal?.name || fullName,
        email: user.email || existingLocal?.email || '',
        phone: existingLocal?.phone || userPhone,
        studentId: existingLocal?.studentId || `DU-${user.id.slice(0, 6).toUpperCase()}`,
        gender: existingLocal?.gender || 'male',
        // `role` is a display label only; `adminUser` carries the real access.
        role: admin ? admin.role : existingLocal?.role || 'student',
        avatar: meta.avatar_url || meta.picture || existingLocal?.avatar,
        targetExam: existingLocal?.targetExam || 'Competitive Exam / BCS',
        institution: existingLocal?.institution,
        pinHash: existingLocal?.pinHash,
        isProfileComplete: Boolean(
          existingLocal?.isProfileComplete || (existingLocal?.phone && existingLocal?.name)
        ),
        registeredAt: existingLocal?.registeredAt || new Date().toISOString(),
      };

      setCurrentStudent(loadedStudent);
      setAdminCheckPending(false);
    };

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => handleSessionUser(session?.user ?? null))
      .catch(() => setAdminCheckPending(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void handleSessionUser(session?.user ?? null);
    });

    // The Google OAuth button opens a POPUP window (see signInWithGoogle) so the
    // flow works inside sandboxed/iframed previews. That popup completes the
    // OAuth redirect and writes the new session to localStorage, but nothing
    // told *this* window to look again — onAuthStateChange only fires from
    // this window's own actions, not another window's. Without this listener
    // the popup closes itself (see App.tsx) after a successful sign-in but the
    // main window's admin/session state never updates, so a real admin login
    // silently fails to show the Admin Panel button until the next full
    // reload. The popup posts this message right before closing.
    const handleOAuthPopupMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'library_oauth_popup_done') return;
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => handleSessionUser(session?.user ?? null))
        .catch(() => {});
    };
    window.addEventListener('message', handleOAuthPopupMessage);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener('message', handleOAuthPopupMessage);
    };
  }, [verifyAdminSession]);

  // Persist the *student* profile only. Admin access is never written here.
  useEffect(() => {
    if (currentStudent) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, JSON.stringify(currentStudent));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
    }
  }, [currentStudent]);

  // ==========================================================================
  // One-time migration: any plaintext `pin` left in localStorage by an older
  // build is converted to a salted PBKDF2-SHA256 credential and the plaintext
  // is deleted, then pushed to Supabase so the cloud copy is cleaned too.
  // ==========================================================================
  useEffect(() => {
    let cancelled = false;

    const migrateLegacyPins = async () => {
      const legacy = registeredStudentsRef.current.filter(
        (s) => Boolean((s as StudentProfile & { pin?: string }).pin) || needsHashUpgrade(s.pinHash)
      );
      if (legacy.length === 0) return;

      for (const student of legacy) {
        const legacyPlain = (student as StudentProfile & { pin?: string }).pin;
        const source = legacyPlain || student.pinHash;
        if (!source) continue;

        try {
          // A legacy value cannot be reversed, so the plaintext (if we still
          // hold one locally) is re-hashed; an old unsalted digest is simply
          // flagged for upgrade on the student's next successful PIN check.
          if (!legacyPlain) continue;
          const pinHash = await hashPin(legacyPlain);
          if (cancelled) return;

          const cleaned: StudentProfile = { ...student, pinHash };
          delete (cleaned as StudentProfile & { pin?: string }).pin;

          setRegisteredStudents((prev) =>
            prev.map((s) => (s.phone === student.phone ? cleaned : s))
          );
          setCurrentStudent((prev) => (prev && prev.phone === student.phone ? cleaned : prev));
          syncStudentToCloud(cleaned).catch(() => {});
        } catch (err) {
          console.warn('[Security] Could not migrate a legacy PIN:', err);
        }
      }
    };

    void migrateLegacyPins();
    return () => {
      cancelled = true;
    };
  }, []);


  // 7. Notices
  const [notices, setNotices] = useState<LibraryNotice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTICES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved notices', e);
      }
    }
    return INITIAL_NOTICES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
  }, [notices]);

  // 8. Attendance Records
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse attendance records', e);
      }
    }
    const todayStr = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'att_sample_1',
        branchId: 'science_library',
        branchName: 'Science Library',
        studentName: 'Saiful Islam',
        studentPhone: '01715000000',
        studentId: 'SCI-47-101',
        gender: 'male',
        seatNumber: 'R1-01',
        roomName: 'Room 1 (Silent Zone)',
        checkInTime: Date.now() - 2.5 * 3600 * 1000,
        dateStr: todayStr,
        passCode: 'PASS-SCI-08191',
      },
      {
        id: 'att_sample_2',
        branchId: 'central_library',
        branchName: 'Central Library',
        studentName: 'Farhana Akter',
        studentPhone: '01877000000',
        studentId: 'CEN-47-301',
        gender: 'female',
        seatNumber: 'C3-01',
        roomName: 'Room 3 (Female Only)',
        checkInTime: Date.now() - 1.2 * 3600 * 1000,
        dateStr: todayStr,
        passCode: 'PASS-CEN-94812',
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  // 8b. Guidelines & Code of Conduct Rules
  const [rules, setRules] = useState<LibraryRule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RULES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved rules', e);
      }
    }
    return INITIAL_RULES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  }, [rules]);

  // 8c. Wi-Fi & Facility Amenities
  const [wifiFacilities, setWifiFacilities] = useState<Record<string, WifiFacilityConfig>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WIFI_FACILITIES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved wifi facilities', e);
      }
    }
    return INITIAL_WIFI_CONFIGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WIFI_FACILITIES, JSON.stringify(wifiFacilities));
  }, [wifiFacilities]);

  // 8d. Wi-Fi Networks List
  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WIFI_NETWORKS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved wifi networks', e);
      }
    }
    return INITIAL_WIFI_NETWORKS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WIFI_NETWORKS, JSON.stringify(wifiNetworks));
  }, [wifiNetworks]);

  // 8e. Booking Schedule — per-weekday start/reset times (defaults 8:00 AM
  // start, 10:00 PM reset every day; admins can override any single day).
  const [bookingSchedule, setBookingSchedule] = useState<BookingSchedule>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKING_SCHEDULE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed[0] && parsed[6]) {
          return { ...DEFAULT_BOOKING_SCHEDULE, ...parsed };
        }
      } catch (e) {
        console.error('Failed to parse saved booking schedule', e);
      }
    }
    return DEFAULT_BOOKING_SCHEDULE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKING_SCHEDULE, JSON.stringify(bookingSchedule));
  }, [bookingSchedule]);

  // Admin: update one weekday's start/reset time (Admin Panel > Booking
  // Schedule). Persists to its own cloud row — see saveBookingScheduleToCloud
  // for why this can't just ride along with the other admin-edit syncs.
  // lastLocalMutationAtRef is declared further down this same component
  // function but, like updateBranchConfig above, is only actually read once
  // this callback is invoked by a click — long after the whole component has
  // finished its first render pass and the ref exists.
  const updateBookingSchedule = useCallback((day: number, updates: Partial<DaySchedule>) => {
    setBookingSchedule((prev) => {
      const next: BookingSchedule = {
        ...prev,
        [day]: { ...(prev[day] || DEFAULT_BOOKING_SCHEDULE[day]), ...updates },
      };
      lastLocalMutationAtRef.current = Date.now();
      void saveBookingScheduleToCloud(next);
      return next;
    });
  }, []);

  // Cloud Sync & Backup State
  const [cloudLastSyncedAt, setCloudLastSyncedAt] = useState<string | null>(null);

  // References to track current state without triggering effect closures
  const roomsRef = React.useRef(rooms);
  useEffect(() => { roomsRef.current = rooms; }, [rooms]);

  const seatsRef = React.useRef(seats);
  useEffect(() => { seatsRef.current = seats; }, [seats]);

  const allBranchesRef = React.useRef(allBranches);
  useEffect(() => { allBranchesRef.current = allBranches; }, [allBranches]);

  const noticesRef = React.useRef(notices);
  useEffect(() => { noticesRef.current = notices; }, [notices]);

  const rulesRef = React.useRef(rules);
  useEffect(() => { rulesRef.current = rules; }, [rules]);

  const wifiFacilitiesRef = React.useRef(wifiFacilities);
  useEffect(() => { wifiFacilitiesRef.current = wifiFacilities; }, [wifiFacilities]);

  const wifiNetworksRef = React.useRef(wifiNetworks);
  useEffect(() => { wifiNetworksRef.current = wifiNetworks; }, [wifiNetworks]);

  const bookingScheduleRef = React.useRef(bookingSchedule);
  useEffect(() => { bookingScheduleRef.current = bookingSchedule; }, [bookingSchedule]);

  // Cross-Tab & Supabase Realtime Broadcast
  const broadcastSync = useCallback((payload: {
    rooms?: Room[];
    seats?: Seat[];
    notices?: LibraryNotice[];
    branchesConfig?: unknown;
    rules?: LibraryRule[];
    wifiFacilities?: unknown;
    wifiNetworks?: unknown[];
  }) => {
    // 1. Cross-tab within same browser
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('smart_library_sync_channel');
        channel.postMessage({ type: 'STATE_UPDATE', payload });
        channel.close();
      } catch (err) {
        // ignore
      }
    }
    // 2. Supabase Realtime across all browsers & devices
    broadcastStateViaSupabase(payload);
  }, []);

  // Timestamp of the most recent LOCAL write (booking, release, break, admin
  // action, etc). The periodic cloud poll below reads this before applying
  // anything it fetches — see CLOUD_POLL_GRACE_MS for why.
  const lastLocalMutationAtRef = React.useRef<number>(0);

  // Track recently mutated seats on this local client to prevent race-condition clobbering
  const recentLocalSeatMutationsRef = React.useRef<
    Map<
      string,
      {
        status: Seat['status'];
        isSecondaryBooked?: boolean;
        timestamp: number;
        occupantPhone?: string;
        passCode?: string;
      }
    >
  >(new Map());

  // Instant Cloud Push for interactive user seat actions (Booking, Break, Release)
  const pushStateToCloudNow = useCallback(
    async (customSeats?: Seat[], customRooms?: Room[]) => {
      lastLocalMutationAtRef.current = Date.now();
      const payload = {
        rooms: customRooms || roomsRef.current,
        seats: customSeats || seatsRef.current,
        notices: noticesRef.current,
        branchesConfig: allBranchesRef.current,
        rules: rulesRef.current,
        wifiFacilities: wifiFacilitiesRef.current,
        wifiNetworks: wifiNetworksRef.current,
      };
      broadcastSync(payload);
      try {
        const res = await syncLibraryStateToCloud(payload);
        if (!res.success) {
          console.warn('[Sync] pushStateToCloudNow cloud write unsuccessful:', res.error);
        }
      } catch (err) {
        console.warn('[Sync] pushStateToCloudNow threw:', err);
      }
    },
    [broadcastSync]
  );

  // Intelligently merge incoming seats with local state so that:
  // 1. Fresh local mutations (within 30s) are never clobbered by stale polls or delayed broadcasts.
  // 2. An active booking held by the user on THIS device is preserved and auto-healed in the cloud.
  // 3. Legitimate releases or remote bookings from other students / admin are correctly adopted.
  const mergeIncomingSeats = useCallback(
    (incomingSeats: Seat[]): Seat[] => {
      const currentSeats = seatsRef.current;
      const now = Date.now();
      const LOCAL_PROTECTION_WINDOW_MS = 30000; // 30s window for recently mutated seats

      // Cleanup expired mutations older than 90s
      for (const [id, mut] of recentLocalSeatMutationsRef.current.entries()) {
        if (now - mut.timestamp > 90000) {
          recentLocalSeatMutationsRef.current.delete(id);
        }
      }

      const activeStudent = currentStudentRef.current;
      let needsResyncToCloud = false;

      const merged = incomingSeats.map((incoming) => {
        const local = currentSeats.find((s) => s.id === incoming.id);
        if (!local) return incoming;

        // 1. Check if this seat was mutated locally within the protection window
        const recentMut = recentLocalSeatMutationsRef.current.get(incoming.id);
        if (recentMut && now - recentMut.timestamp < LOCAL_PROTECTION_WINDOW_MS) {
          // If we locally released it, but incoming still says occupied/away -> enforce available
          if (recentMut.status === 'available') {
            return {
              ...incoming,
              status: 'available' as const,
              occupantName: undefined,
              occupantPhone: undefined,
              occupantEmail: undefined,
              studentId: undefined,
              bookedAt: undefined,
              expectedLeaveAt: undefined,
              targetDurationHours: undefined,
              awaySince: undefined,
              awayDurationMinutes: undefined,
              awayReason: undefined,
              awayCustomReason: undefined,
              passCode: undefined,
              isSecondaryBooked: false,
              secondaryOccupantName: undefined,
              secondaryOccupantPhone: undefined,
              secondaryOccupantStudentId: undefined,
              secondaryOccupantGender: undefined,
              secondaryBookedAt: undefined,
              secondaryExpectedLeaveAt: undefined,
              secondaryPassCode: undefined,
            };
          }

          // If we locally booked, broke, or occupied, but incoming says available -> PROTECT LOCAL
          if (
            (recentMut.status === 'occupied' || recentMut.status === 'away') &&
            incoming.status === 'available'
          ) {
            needsResyncToCloud = true;
            return local;
          }

          // If local has secondary booking but incoming does not -> preserve local secondary
          if (recentMut.isSecondaryBooked && !incoming.isSecondaryBooked) {
            needsResyncToCloud = true;
            return {
              ...incoming,
              isSecondaryBooked: true,
              secondaryOccupantName: local.secondaryOccupantName,
              secondaryOccupantPhone: local.secondaryOccupantPhone,
              secondaryOccupantStudentId: local.secondaryOccupantStudentId,
              secondaryOccupantGender: local.secondaryOccupantGender,
              secondaryBookedAt: local.secondaryBookedAt,
              secondaryPassCode: local.secondaryPassCode,
            };
          }
        }

        // 2. Check if this seat belongs to current student logged in on THIS device
        if (
          activeStudent &&
          (local.status === 'occupied' || local.status === 'away') &&
          incoming.status === 'available'
        ) {
          const cleanLocalPhone = (local.occupantPhone || '').replace(/\D/g, '');
          const cleanStudentPhone = (activeStudent.phone || '').replace(/\D/g, '');
          const isMySeat = Boolean(
            (local.studentId && activeStudent.studentId && local.studentId === activeStudent.studentId) ||
            (cleanLocalPhone && cleanStudentPhone && cleanLocalPhone === cleanStudentPhone) ||
            (local.occupantName && activeStudent.name && local.occupantName.toLowerCase() === activeStudent.name.toLowerCase())
          );

          // If user hasn't explicitly released this seat on this device
          const wasExplicitlyReleased = recentMut && recentMut.status === 'available';
          if (isMySeat && !wasExplicitlyReleased) {
            needsResyncToCloud = true;
            return local;
          }
        }

        return incoming;
      });

      // If cloud was missing a confirmed active booking from this client, heal the cloud in background!
      if (needsResyncToCloud) {
        console.warn('[Sync] Detected missing cloud booking for active local seat — auto-repairing cloud state.');
        setTimeout(() => {
          pushStateToCloudNow(merged);
        }, 800);
      }

      return merged;
    },
    [pushStateToCloudNow]
  );

  // Listen for Cross-Tab broadcast (same browser)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('smart_library_sync_channel');

    channel.onmessage = (event) => {
      if (event.data?.type === 'STATE_UPDATE') {
        const p = event.data.payload;
        if (Array.isArray(p.rooms) && p.rooms.length > 0) setRooms(p.rooms);
        if (Array.isArray(p.seats) && p.seats.length > 0) {
          const reconciled = reconcileSeatsWithRooms(p.rooms || roomsRef.current, p.seats);
          const merged = mergeIncomingSeats(reconciled);
          setSeats(merged);
        }
        if (Array.isArray(p.notices)) setNotices(p.notices);
        if (Array.isArray(p.rules)) setRules(p.rules);
        if (p.wifiFacilities && typeof p.wifiFacilities === 'object') setWifiFacilities(p.wifiFacilities as Record<string, WifiFacilityConfig>);
        if (Array.isArray(p.wifiNetworks)) setWifiNetworks(p.wifiNetworks as WifiNetwork[]);
      }
    };

    return () => {
      channel.close();
    };
  }, [mergeIncomingSeats]);

  // Remote update flag to prevent echo loops
  const isRemoteUpdateRef = React.useRef(false);

  // Listen for Supabase Realtime Broadcast (all external users & devices live)
  useEffect(() => {
    const unsubscribe = subscribeToSupabaseRealtime((payload) => {
      if (payload) {
        isRemoteUpdateRef.current = true;
        let incomingRooms = roomsRef.current;
        if (Array.isArray(payload.rooms) && payload.rooms.length > 0) {
          incomingRooms = payload.rooms as Room[];
          setRooms(incomingRooms);
        }
        if (Array.isArray(payload.seats) && payload.seats.length > 0) {
          const reconciled = reconcileSeatsWithRooms(incomingRooms, payload.seats as Seat[]);
          const merged = mergeIncomingSeats(reconciled);
          setSeats(merged);
        }
        if (Array.isArray(payload.notices) && payload.notices.length > 0) {
          setNotices(payload.notices as LibraryNotice[]);
        }
        if (Array.isArray(payload.rules) && payload.rules.length > 0) {
          setRules(payload.rules as LibraryRule[]);
        }
        if (payload.wifiFacilities && typeof payload.wifiFacilities === 'object') {
          setWifiFacilities(payload.wifiFacilities as Record<string, WifiFacilityConfig>);
        }
        if (Array.isArray(payload.wifiNetworks) && payload.wifiNetworks.length > 0) {
          setWifiNetworks(payload.wifiNetworks as WifiNetwork[]);
        }
        const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setCloudLastSyncedAt(timeStr);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [mergeIncomingSeats]);

  // Supabase initial cloud load tracker
  const isCloudLoadedRef = React.useRef(false);

  // Polling grace period (12 seconds) so local optimistic writes never get clobbered
  const CLOUD_POLL_GRACE_MS = 12000;

  // Helper to load and apply cloud state
  const loadCloudState = useCallback(async () => {
    if (Date.now() - lastLocalMutationAtRef.current < CLOUD_POLL_GRACE_MS) {
      return;
    }
    try {
      const cloudState = await fetchLibraryStateFromCloud();
      if (cloudState) {
        isRemoteUpdateRef.current = true;
        let incomingRooms = roomsRef.current;
        if (Array.isArray(cloudState.rooms) && cloudState.rooms.length > 0) {
          incomingRooms = cloudState.rooms as Room[];
          setRooms(incomingRooms);
        }
        if (Array.isArray(cloudState.seats) && cloudState.seats.length > 0) {
          const reconciled = reconcileSeatsWithRooms(incomingRooms, cloudState.seats as Seat[]);
          const merged = mergeIncomingSeats(reconciled);
          setSeats(merged);
        }
        if (Array.isArray(cloudState.notices) && cloudState.notices.length > 0) {
          setNotices(cloudState.notices as LibraryNotice[]);
        }
        if (Array.isArray(cloudState.rules) && cloudState.rules.length > 0) {
          setRules(cloudState.rules as LibraryRule[]);
        }
        if (cloudState.wifiFacilities && typeof cloudState.wifiFacilities === 'object') {
          setWifiFacilities(cloudState.wifiFacilities as Record<string, WifiFacilityConfig>);
        }
        if (Array.isArray(cloudState.wifiNetworks) && cloudState.wifiNetworks.length > 0) {
          setWifiNetworks(cloudState.wifiNetworks as WifiNetwork[]);
        }
        setCloudLastSyncedAt(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
      isCloudLoadedRef.current = true;
    } catch {
      isCloudLoadedRef.current = true;
    }
  }, [mergeIncomingSeats]);

  // Fetch initial global library configuration from Supabase Cloud on mount
  useEffect(() => {
    loadCloudState();
  }, [loadCloudState]);

  // Periodic Cloud Polling Fallback (every 4 seconds) to guarantee real-time sync across all devices
  useEffect(() => {
    const pollTimer = setInterval(() => {
      loadCloudState();
    }, 4000);

    return () => clearInterval(pollTimer);
  }, [loadCloudState]);

  // 9. Live Digital Clock (1s tick)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 10. Auto-Reset Checker for night expiry / daily reset
  //
  // This used to compare against a date stamped in THIS BROWSER's own
  // localStorage. That meant every returning visitor's browser independently
  // decided "a new day has started" and fired a GLOBAL reset the instant it
  // loaded — wiping every seat's booking, for every connected user, the
  // moment any single visitor happened to open the app on a new calendar
  // day (or simply had a wrong system clock). That's exactly the "seat goes
  // blank the moment another user opens the page" behaviour that was
  // reported. It now waits for the cloud state to finish loading and checks
  // a marker shared by everyone (see fetchDailyResetMarker) so the reset can
  // only actually fire once per real calendar day, however many browsers
  // open the app around the day boundary. It's also now schedule-aware: the
  // reset only actually fires once today's configured reset TIME (per
  // weekday, see bookingSchedule) has actually passed — previously it fired
  // at whatever time of day the first returning visitor happened to open
  // the app, even if that was the middle of the afternoon.
  //
  // triggerDailyAutoReset itself is declared much further down this same
  // component function (it needs rooms/notices/etc. that aren't ready yet
  // at this point), so it's called through a ref that always points at the
  // latest version instead of being a dependency here — putting it directly
  // in this effect's dependency array would evaluate the identifier
  // immediately during this render, before its own declaration has run.
  const triggerDailyAutoResetRef = React.useRef<(() => void) | null>(null);
  const hasResetTodayRef = React.useRef<string>('');

  useEffect(() => {
    let cancelled = false;

    const checkSharedDailyReset = async () => {
      // Wait for the initial cloud fetch so we're comparing against the
      // real current seat state, not this tab's possibly-stale local copy.
      for (let attempt = 0; attempt < 40 && !isCloudLoadedRef.current; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      if (cancelled) return;

      // Pick up any admin-configured schedule from the cloud before judging
      // whether today's reset time has passed.
      const cloudSchedule = await fetchBookingScheduleFromCloud();
      if (!cancelled && cloudSchedule && typeof cloudSchedule === 'object') {
        const merged = { ...bookingScheduleRef.current, ...(cloudSchedule as BookingSchedule) };
        bookingScheduleRef.current = merged;
        setBookingSchedule(merged);
      }
      if (cancelled) return;

      const now = new Date();
      const todayStr = now.toDateString();
      if (hasResetTodayRef.current === todayStr) {
        return;
      }

      const resetTimestamp = getTodaysResetTimestamp(now, bookingScheduleRef.current);
      const sharedLastReset = await fetchDailyResetMarker();
      if (cancelled) return;

      if (now.getTime() >= resetTimestamp && sharedLastReset !== todayStr) {
        hasResetTodayRef.current = todayStr;
        const day = getDaySchedule(now, bookingScheduleRef.current);
        console.log(`Reset time (${formatScheduleTime(day.resetHour, day.resetMinute)}) has passed — running daily seat auto-reset once.`);
        await setDailyResetMarker(todayStr);
        triggerDailyAutoResetRef.current?.();
      }
    };

    void checkSharedDailyReset();
    // Re-check periodically so a tab left open across the reset boundary
    // still catches it, instead of only checking once on mount/reload.
    const interval = setInterval(checkSharedDailyReset, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Computed: Branch Config
  const branchConfig = useMemo(() => {
    return allBranches[currentBranchId] || BRANCHES_DATA[currentBranchId];
  }, [allBranches, currentBranchId]);

  // Computed: Branch Rooms (sorted by order / serial)
  const branchRooms = useMemo(() => {
    return rooms
      .filter((r) => r.branchId === currentBranchId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [rooms, currentBranchId]);

  // Computed: Branch Seats
  const branchSeats = useMemo(() => {
    return seats.filter((s) => s.branchId === currentBranchId);
  }, [seats, currentBranchId]);

  // Computed: Current Student's Active Seat (across any branch)
  const currentStudentSeat = useMemo(() => {
    if (!currentStudent) return null;
    return (
      seats.find(
        (s) =>
          (s.status === 'occupied' || s.status === 'away') &&
          ((s.studentId && s.studentId === currentStudent.studentId) ||
            (s.occupantPhone && s.occupantPhone === currentStudent.phone) ||
            (s.occupantName && s.occupantName.toLowerCase() === currentStudent.name.toLowerCase()))
      ) || null
    );
  }, [seats, currentStudent]);

  // Seat Booking Action
  const bookSeat = useCallback(
    (
      seatId: string,
      studentDetails: {
        name: string;
        phone: string;
        email?: string;
        studentId?: string;
        gender: Gender;
        targetHours: number;
      }
    ) => {
      // Availability MUST be checked against seatsRef.current — the same
      // fresh source the write below uses. Reading the closure's `seats`
      // made this check run on data captured when the callback was created
      // (`seats` is not in the dep array), so two students could both book
      // the same seat and the later write silently overwrote the first.
      const seat = seatsRef.current.find((s) => s.id === seatId);
      if (!seat) {
        return { success: false, message: 'Seat not found' };
      }

      if (seat.status !== 'available') {
        return {
          success: false,
          message: 'Seat is no longer available',
        };
      }

      // A student can only hold one active seat (occupied or on a break) at
      // a time. Nothing previously checked this here — a student could open
      // the grid in a second tab (or just click a different seat before
      // releasing their current one) and end up occupying two seats at
      // once. Match on phone first (the actual account key), then studentId,
      // matching the identity checks used everywhere else in this file.
      const cleanPhone = studentDetails.phone.replace(/\D/g, '');
      const existingSeat = seatsRef.current.find(
        (s) =>
          s.id !== seatId &&
          (s.status === 'occupied' || s.status === 'away') &&
          ((s.occupantPhone && cleanPhone && s.occupantPhone.replace(/\D/g, '') === cleanPhone) ||
            (studentDetails.studentId &&
              s.studentId &&
              s.studentId === studentDetails.studentId))
      );
      if (existingSeat) {
        return {
          success: false,
          message: `You already have an active seat (${existingSeat.seatNumber}). Please release it before booking another one.`,
        };
      }

      // Booking is only allowed inside today's configured window (default
      // 8:00 AM start, 10:00 PM auto-reset; admins can override per weekday
      // from Admin Panel > Booking Schedule).
      const nowDate = new Date();
      if (!isBookingWindowOpen(nowDate, bookingScheduleRef.current)) {
        const day = getDaySchedule(nowDate, bookingScheduleRef.current);
        return {
          success: false,
          message: `Seat booking is closed right now. It opens at ${formatScheduleTime(day.startHour, day.startMinute)}.`,
        };
      }

      // Check Female Reserved Area rule
      if (seat.isFemaleReserved && studentDetails.gender !== 'female') {
        return {
          success: false,
          message: 'This area is strictly reserved for female students.',
        };
      }

      const room = rooms.find((r) => r.id === seat.roomId);
      const roomName = room ? room.name : 'Study Room';
      const branchName = allBranches[seat.branchId]?.name || 'Study Center';

      const now = Date.now();
      // Valid Till now always matches today's configured reset/closing
      // time (not a fixed duration from booking time) — since every seat
      // gets auto-released at reset anyway, a pass "valid until 2 AM" would
      // be meaningless if the library closes at 10 PM.
      const expectedLeave = getTodaysResetTimestamp(nowDate, bookingScheduleRef.current);
      const passCode = `PASS-${seat.branchId === 'science_library' ? 'SCI' : 'CEN'}-${Math.floor(
        10000 + Math.random() * 90000
      )}`;

      // Update seat
      const updatedSeats = seatsRef.current.map((s) => {
        if (s.id === seatId) {
          return {
            ...s,
            status: 'occupied' as const,
            occupantName: studentDetails.name,
            occupantPhone: studentDetails.phone,
            occupantEmail: studentDetails.email || '',
            studentId: studentDetails.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
            occupantGender: studentDetails.gender,
            bookedAt: now,
            expectedLeaveAt: expectedLeave,
            targetDurationHours: studentDetails.targetHours,
            awaySince: undefined,
            awayDurationMinutes: undefined,
            awayReason: undefined,
            passCode,
          };
        }
        return s;
      });

      setSeats(updatedSeats);
      recentLocalSeatMutationsRef.current.set(seatId, {
        status: 'occupied',
        timestamp: now,
        occupantPhone: studentDetails.phone,
        passCode,
      });
      pushStateToCloudNow(updatedSeats);

      // Record attendance
      const newAttendance: AttendanceRecord = {
        id: `att_${Date.now()}`,
        branchId: seat.branchId,
        branchName,
        studentName: studentDetails.name,
        studentPhone: studentDetails.phone,
        studentId: studentDetails.studentId || 'N/A',
        gender: studentDetails.gender,
        seatNumber: seat.seatNumber,
        roomName,
        checkInTime: now,
        dateStr: new Date().toISOString().split('T')[0],
        passCode,
      };

      setAttendanceRecords((prev) => [newAttendance, ...prev]);

      return {
        success: true,
        message: 'Seat successfully booked!',
        passCode,
      };
    },
    [rooms, allBranches, pushStateToCloudNow]
  );

  // Leave Seat Temporarily (Break)
  const leaveSeatTemporarily = useCallback(
    (seatId: string, durationMinutes: number, reason: AwayReason, customReason?: string) => {
      const now = Date.now();
      const updatedSeats = seatsRef.current.map((s) => {
        if (s.id === seatId) {
          return {
            ...s,
            status: 'away' as const,
            awaySince: now,
            awayDurationMinutes: durationMinutes,
            awayReason: reason,
            awayCustomReason: customReason,
          };
        }
        return s;
      });
      setSeats(updatedSeats);
      recentLocalSeatMutationsRef.current.set(seatId, {
        status: 'away',
        timestamp: now,
      });
      pushStateToCloudNow(updatedSeats);
    },
    [pushStateToCloudNow]
  );

  // Return from away (Enforces: Cannot cancel early before duration finishes)
  const returnFromAway = useCallback((seatId: string, force = false) => {
    const targetSeat = seatsRef.current.find((s) => s.id === seatId);
    if (!force && targetSeat && targetSeat.awaySince && targetSeat.awayDurationMinutes) {
      const remainingMs = targetSeat.awaySince + targetSeat.awayDurationMinutes * 60 * 1000 - Date.now();
      if (remainingMs > 2000) {
        console.warn('Cannot return early before break timer expires.');
        return;
      }
    }

    const updatedSeats = seatsRef.current.map((s) => {
      if (s.id === seatId) {
        return {
          ...s,
          status: 'occupied' as const,
          awaySince: undefined,
          awayDurationMinutes: undefined,
          awayReason: undefined,
          awayCustomReason: undefined,
          isSecondaryBooked: false,
          secondaryOccupantName: undefined,
          secondaryOccupantPhone: undefined,
          secondaryOccupantStudentId: undefined,
          secondaryOccupantGender: undefined,
          secondaryBookedAt: undefined,
          secondaryExpectedLeaveAt: undefined,
          secondaryPassCode: undefined,
        };
      }
      return s;
    });
    setSeats(updatedSeats);
    recentLocalSeatMutationsRef.current.set(seatId, {
      status: 'occupied',
      timestamp: Date.now(),
    });
    pushStateToCloudNow(updatedSeats);
  }, [pushStateToCloudNow]);

  // Secondary Book Seat during Break (Orange Seat turns Blue)
  const secondaryBookSeat = useCallback(
    (
      seatId: string,
      studentDetails: {
        name: string;
        phone: string;
        studentId?: string;
        gender: Gender;
      }
    ) => {
      const now = Date.now();
      const passCode = `SEC-${Math.floor(10000 + Math.random() * 90000)}`;

      const updatedSeats = seatsRef.current.map((s) => {
        if (s.id === seatId) {
          return {
            ...s,
            isSecondaryBooked: true,
            secondaryOccupantName: studentDetails.name,
            secondaryOccupantPhone: studentDetails.phone,
            secondaryOccupantStudentId: studentDetails.studentId || 'N/A',
            secondaryOccupantGender: studentDetails.gender,
            secondaryBookedAt: now,
            secondaryPassCode: passCode,
          };
        }
        return s;
      });

      setSeats(updatedSeats);
      recentLocalSeatMutationsRef.current.set(seatId, {
        status: 'away',
        isSecondaryBooked: true,
        timestamp: now,
        occupantPhone: studentDetails.phone,
        passCode,
      });
      pushStateToCloudNow(updatedSeats);

      return {
        success: true,
        message: 'Secondary break booking confirmed! Seat is now marked in Blue for your temporary study session.',
        passCode,
      };
    },
    [pushStateToCloudNow]
  );

  // Release Secondary Booking
  const releaseSecondaryBooking = useCallback((seatId: string) => {
    const updatedSeats = seatsRef.current.map((s) => {
      if (s.id === seatId) {
        return {
          ...s,
          isSecondaryBooked: false,
          secondaryOccupantName: undefined,
          secondaryOccupantPhone: undefined,
          secondaryOccupantStudentId: undefined,
          secondaryOccupantGender: undefined,
          secondaryBookedAt: undefined,
          secondaryExpectedLeaveAt: undefined,
          secondaryPassCode: undefined,
        };
      }
      return s;
    });
    setSeats(updatedSeats);
    recentLocalSeatMutationsRef.current.set(seatId, {
      status: 'away',
      isSecondaryBooked: false,
      timestamp: Date.now(),
    });
    pushStateToCloudNow(updatedSeats);
  }, [pushStateToCloudNow]);

  // Release Seat
  const releaseSeat = useCallback((seatId: string) => {
    const now = Date.now();
    // Capture the booking that is being released BEFORE the seat record is
    // wiped, so the matching attendance row can be identified.
    const releasedSeat = seatsRef.current.find((s) => s.id === seatId);
    const updatedSeats = seatsRef.current.map((s) => {
      if (s.id === seatId) {
        return {
          ...s,
          status: 'available' as const,
          occupantName: undefined,
          occupantPhone: undefined,
          occupantEmail: undefined,
          studentId: undefined,
          occupantGender: undefined,
          bookedAt: undefined,
          expectedLeaveAt: undefined,
          targetDurationHours: undefined,
          awaySince: undefined,
          awayDurationMinutes: undefined,
          awayReason: undefined,
          awayCustomReason: undefined,
          passCode: undefined,
          isSecondaryBooked: false,
          secondaryOccupantName: undefined,
          secondaryOccupantPhone: undefined,
          secondaryOccupantStudentId: undefined,
          secondaryOccupantGender: undefined,
          secondaryBookedAt: undefined,
          secondaryExpectedLeaveAt: undefined,
          secondaryPassCode: undefined,
        };
      }
      return s;
    });

    setSeats(updatedSeats);
    recentLocalSeatMutationsRef.current.set(seatId, {
      status: 'available',
      timestamp: now,
    });
    pushStateToCloudNow(updatedSeats);

    // Close ONLY the attendance record that belongs to this booking —
    // matched by seat number + branch + occupant phone. The previous
    // condition (`record.seatNumber && !record.checkOutTime`) checked out
    // every open record in the whole log whenever anyone released any seat.
    if (releasedSeat) {
      const cleanPhone = (releasedSeat.occupantPhone || '').replace(/\D/g, '');
      setAttendanceRecords((prev) => {
        // Records are stored newest-first (`[newAttendance, ...prev]`), so
        // the first match is the most recent open check-in for this booking.
        const openIdx = prev.findIndex(
          (record) =>
            !record.checkOutTime &&
            record.seatNumber === releasedSeat.seatNumber &&
            record.branchId === releasedSeat.branchId &&
            (!cleanPhone || record.studentPhone.replace(/\D/g, '') === cleanPhone)
        );
        if (openIdx === -1) return prev;
        return prev.map((record, idx) => {
          if (idx !== openIdx) return record;
          return {
            ...record,
            checkOutTime: now,
            durationMinutes: Math.round((now - record.checkInTime) / 60000),
          };
        });
      });
    }
  }, [pushStateToCloudNow]);

  // Admin Actions
  const adminForceReleaseSeat = useCallback((seatId: string) => {
    releaseSeat(seatId);
  }, [releaseSeat]);

  const adminToggleMaintenance = useCallback((seatId: string, note?: string) => {
    let nextStatus: Seat['status'] = 'available';
    const updatedSeats = seatsRef.current.map((s) => {
      if (s.id === seatId) {
        nextStatus = s.status === 'maintenance' ? ('available' as const) : ('maintenance' as const);
        return {
          ...s,
          status: nextStatus,
          maintenanceNote: nextStatus === 'maintenance' ? note || 'Under maintenance' : undefined,
          occupantName: undefined,
          occupantPhone: undefined,
          studentId: undefined,
          bookedAt: undefined,
        };
      }
      return s;
    });
    setSeats(updatedSeats);
    recentLocalSeatMutationsRef.current.set(seatId, {
      status: nextStatus,
      timestamp: Date.now(),
    });
    pushStateToCloudNow(updatedSeats);
  }, [pushStateToCloudNow]);

  const adminManuallyAssignSeat = useCallback(
    (
      seatId: string,
      occupantName: string,
      phone: string,
      durationHours: number,
      gender: Gender
    ) => {
      const now = Date.now();
      const expectedLeave = now + durationHours * 3600 * 1000;
      const passCode = `ADMIN-PASS-${Math.floor(10000 + Math.random() * 90000)}`;

      const updatedSeats = seatsRef.current.map((s) => {
        if (s.id === seatId) {
          return {
            ...s,
            status: 'occupied' as const,
            occupantName,
            occupantPhone: phone,
            occupantGender: gender,
            studentId: `ADM-MANUAL-${Math.floor(100 + Math.random() * 900)}`,
            bookedAt: now,
            expectedLeaveAt: expectedLeave,
            targetDurationHours: durationHours,
            awaySince: undefined,
            passCode,
          };
        }
        return s;
      });

      setSeats(updatedSeats);
      recentLocalSeatMutationsRef.current.set(seatId, {
        status: 'occupied',
        timestamp: now,
        occupantPhone: phone,
        passCode,
      });
      pushStateToCloudNow(updatedSeats);
    },
    [pushStateToCloudNow]
  );

  // Student Auth
  const loginStudent = useCallback((student: StudentProfile) => {
    // Signing in as a student never confers admin rights, whatever phone
    // number the object carries. Admin access comes from `verifyAdminSession`.
    setCurrentStudent({ ...student, role: student.role === 'admin' || student.role === 'superadmin' ? student.role : 'student' });
  }, []);

  const logoutStudent = useCallback(() => {
    // Always revoke admin on sign-out so a different account can't inherit it.
    setAdminUser(null);
    setCurrentStudent(null);
    supabaseSignOut().catch(() => {});
  }, []);

  const signInWithGoogleAuth = useCallback(async () => {
    return await supabaseSignInGoogle();
  }, []);

  const demoLogin = useCallback((demoStudentId: string) => {
    const student = DEMO_STUDENTS.find((s) => s.id === demoStudentId);
    if (student) {
      // Demo accounts are always plain students — no admin shortcut.
      setCurrentStudent({ ...student, role: 'student' });
    }
  }, []);

  const registerOrUpdateStudent = useCallback((data: Omit<StudentProfile, 'id' | 'role'>) => {
    // Registering a profile cannot promote anyone: the role is carried over
    // from the *server-verified* session (or stays `student`), never derived
    // from the e-mail / phone the visitor just typed into a form.
    const newStudent: StudentProfile = {
      ...data,
      id: currentStudent?.id || `stu_${Date.now()}`,
      role: adminUser ? adminUser.role : currentStudent?.role || 'student',
      avatar: currentStudent?.avatar || data.avatar,
      isProfileComplete: true,
      registeredAt: currentStudent?.registeredAt || new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    setCurrentStudent(newStudent);

    setRegisteredStudents((prev) => {
      const cleanPhone = data.phone.replace(/\D/g, '');
      const filtered = prev.filter((s) => s.phone.replace(/\D/g, '') !== cleanPhone);
      return [newStudent, ...filtered];
    });

    // Automatically backup & sync to Supabase cloud. Only a hashed credential
    // is ever sent; a raw PIN never reaches the network.
    syncStudentToCloud(data).catch(() => {});
  }, [currentStudent, adminUser]);

  const deleteRegisteredStudent = useCallback((phone: string) => {
    const clean = phone.replace(/\D/g, '');
    setRegisteredStudents((prev) => prev.filter((s) => s.phone.replace(/\D/g, '') !== clean));
    // Without this, only the admin's own local list lost the student — the
    // row stayed in Postgres and reappeared on the next cloud refresh.
    void deleteStudentFromCloud(phone).catch(() => {});
  }, []);

  const refreshStudentsFromCloud = useCallback(async () => {
    try {
      const cloudStudents = await fetchAllStudentsFromCloud();
      if (cloudStudents && cloudStudents.length > 0) {
        setRegisteredStudents((prev) => {
          const studentMap = new Map<string, StudentProfile>();
          // Existing
          prev.forEach((s) => studentMap.set(s.phone.replace(/\D/g, ''), s));
          // Cloud
          cloudStudents.forEach((cs) => {
            const cleanPhone = cs.phone.replace(/\D/g, '');
            const existing = studentMap.get(cleanPhone);
            const isCsAdmin = isSuperAdminEmail(cs.email) || cleanPhone === ADMIN_PHONE_NUMBER;
            studentMap.set(cleanPhone, {
              id: existing?.id || `stu_cloud_${cleanPhone}`,
              name: cs.name || existing?.name || 'Registered Student',
              phone: cs.phone,
              email: cs.email || existing?.email || '',
              studentId: cs.student_id || existing?.studentId || `ID-${cleanPhone.slice(-4)}`,
              gender: (cs.gender as Gender) || existing?.gender || 'male',
              role: isCsAdmin ? 'superadmin' : 'student',
              targetExam: cs.target_exam || existing?.targetExam || 'Competitive Exam',
              registeredAt: cs.created_at || existing?.registeredAt || new Date().toISOString(),
              lastActive: cs.last_active || existing?.lastActive,
              // Credential only — the plaintext PIN no longer exists anywhere.
              pinHash: cs.pin_hash || existing?.pinHash,
            });
          });
          return Array.from(studentMap.values());
        });
      }
    } catch (err) {
      console.warn('Failed to refresh students from cloud', err);
    }
  }, []);

  // ==========================================================================
  // ADMIN AUTH — decided by Supabase Auth + the `admins` table in Postgres
  // ==========================================================================
  // There is no password list and no whitelist in this bundle any more. The
  // password is checked by Supabase Auth, and "is this account an admin?" is
  // answered by an RLS-filtered query against `admins` using the signed JWT.
  const loginAdmin = useCallback(
    async (email: string, pass: string): Promise<AdminLoginResult> => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !pass) {
        return {
          ok: false,
          reason: 'invalid_credentials',
          message: 'Enter the administrator e-mail and password.',
        };
      }

      setAdminCheckPending(true);

      // Step 1 — authenticate with Supabase Auth (server-side password check).
      const { user, error } = await supabaseSignInWithEmail(normalizedEmail, pass);
      if (error || !user) {
        setAdminCheckPending(false);
        return {
          ok: false,
          reason: 'invalid_credentials',
          message:
            error ||
            'Sign-in failed. Use the e-mail and password created in Supabase → Authentication → Users.',
        };
      }

      // Step 2 — authorize against the `admins` allow-list in Postgres.
      const result = await checkAdminAccess(user.email);
      setAdminCheckPending(false);

      if (result.status === 'granted') {
        setAdminSetupRequired(false);
        setAdminUser({
          id: `admin_${result.admin.email}`,
          name: result.admin.name || result.admin.email.split('@')[0] || 'Library Admin',
          email: result.admin.email,
          role: result.admin.role,
          branchAccess:
            result.admin.branch_access === 'science_library' ||
            result.admin.branch_access === 'central_library'
              ? result.admin.branch_access
              : 'all',
        });
        return { ok: true };
      }

      if (result.status === 'not_configured') {
        setAdminSetupRequired(true);
        // Signing in worked, but the database has no allow-list yet. Sign the
        // session back out so a half-authenticated state is never left behind.
        void supabaseSignOut().catch(() => {});
        return {
          ok: false,
          reason: 'server_not_configured',
          message:
            'Database security setup is missing: the `admins` table does not exist. Run supabase/01_security_core.sql in the Supabase SQL editor, then sign in again.',
        };
      }

      void supabaseSignOut().catch(() => {});
      return {
        ok: false,
        reason: 'not_an_admin',
        message:
          result.status === 'no_session'
            ? result.message
            : 'That account is signed in, but its e-mail is not on the administrator allow-list.',
      };
    },
    []
  );

  const logoutAdmin = useCallback(() => {
    // Clearing local state is not enough — the Supabase session would simply
    // re-authorize on the next reload, so end it at the source.
    setAdminUser(null);
    setCurrentStudent(null);
    void supabaseSignOut().catch(() => {});
  }, []);

  // Rooms CRUD & Ordering
  const addRoom = useCallback((roomData: Omit<Room, 'id'>) => {
    const newRoomId = `room_${Date.now()}`;
    const branchRoomsList = rooms.filter((r) => r.branchId === roomData.branchId);
    const nextOrder = roomData.order ?? branchRoomsList.length + 1;
    const newRoom: Room = {
      ...roomData,
      id: newRoomId,
      order: nextOrder,
      roomNumber: roomData.roomNumber || `Room ${nextOrder}`,
    };

    const nextRooms = [...rooms, newRoom];
    setRooms(nextRooms);

    // Automatically generate seats for the new room
    const newSeats: Seat[] = [];
    const isFemale = newRoom.category === 'female_only';

    for (let i = 1; i <= newRoom.capacity; i++) {
      const seatNumPadded = i < 10 ? `0${i}` : `${i}`;
      newSeats.push({
        id: `${newRoomId}_seat_${i}`,
        roomId: newRoomId,
        branchId: newRoom.branchId,
        seatNumber: `${newRoom.seatPrefix}-${seatNumPadded}`,
        status: 'available',
        isFemaleReserved: isFemale,
        isSpecialReserved: false,
      });
    }

    const nextAllSeats = [...seats, ...newSeats];
    setSeats(nextAllSeats);

    // Cross-tab and Cloud sync
    broadcastSync({ rooms: nextRooms, seats: nextAllSeats });
    syncLibraryStateToCloud({
      rooms: nextRooms,
      seats: nextAllSeats,
      notices,
      branchesConfig: allBranches,
    }).catch(() => {});
  }, [rooms, seats, notices, allBranches, broadcastSync]);

  const updateRoom = useCallback((roomId: string, updates: Partial<Room>) => {
    const updatedRooms = rooms.map((r) => {
      if (r.id === roomId) {
        return { ...r, ...updates };
      }
      return r;
    });
    setRooms(updatedRooms);

    // If capacity changed or prefix changed, refresh seat prefixes or add/remove seats
    let updatedAllSeats = seats;
    if (updates.seatPrefix || updates.capacity !== undefined || updates.category !== undefined) {
      const roomSeats = seats.filter((s) => s.roomId === roomId);
      const otherSeats = seats.filter((s) => s.roomId !== roomId);
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        const targetCap = updates.capacity !== undefined ? updates.capacity : room.capacity;
        const targetPrefix = updates.seatPrefix !== undefined ? updates.seatPrefix : room.seatPrefix;
        const targetIsFemale = updates.category !== undefined ? updates.category === 'female_only' : room.category === 'female_only';

        const updatedRoomSeats: Seat[] = [];
        for (let i = 1; i <= targetCap; i++) {
          const seatNumPadded = i < 10 ? `0${i}` : `${i}`;
          const existing = roomSeats[i - 1];
          if (existing) {
            updatedRoomSeats.push({
              ...existing,
              seatNumber: `${targetPrefix}-${seatNumPadded}`,
              isFemaleReserved: targetIsFemale,
            });
          } else {
            updatedRoomSeats.push({
              id: `${roomId}_seat_${i}`,
              roomId,
              branchId: room.branchId,
              seatNumber: `${targetPrefix}-${seatNumPadded}`,
              status: 'available',
              isFemaleReserved: targetIsFemale,
              isSpecialReserved: false,
            });
          }
        }

        updatedAllSeats = [...otherSeats, ...updatedRoomSeats];
        setSeats(updatedAllSeats);
      }
    }

    broadcastSync({ rooms: updatedRooms, seats: updatedAllSeats });
    syncLibraryStateToCloud({
      rooms: updatedRooms,
      seats: updatedAllSeats,
      notices,
      branchesConfig: allBranches,
    }).catch(() => {});
  }, [rooms, seats, notices, allBranches, broadcastSync]);

  const deleteRoom = useCallback((roomId: string) => {
    const nextRooms = rooms.filter((r) => r.id !== roomId);
    const nextSeats = seats.filter((s) => s.roomId !== roomId);
    setRooms(nextRooms);
    setSeats(nextSeats);

    broadcastSync({ rooms: nextRooms, seats: nextSeats });
    syncLibraryStateToCloud({
      rooms: nextRooms,
      seats: nextSeats,
      notices,
      branchesConfig: allBranches,
    }).catch(() => {});
  }, [rooms, seats, notices, allBranches, broadcastSync]);

  const moveRoomOrder = useCallback((roomId: string, direction: 'up' | 'down') => {
    setRooms((prev) => {
      const target = prev.find((r) => r.id === roomId);
      if (!target) return prev;

      const branchList = prev
        .filter((r) => r.branchId === target.branchId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const idx = branchList.findIndex((r) => r.id === roomId);
      if (idx === -1) return prev;

      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= branchList.length) return prev;

      const currentItem = branchList[idx];
      const swapItem = branchList[swapIdx];

      const currentOrder = currentItem.order ?? idx + 1;
      const swapOrder = swapItem.order ?? swapIdx + 1;

      const reordered = prev.map((r) => {
        if (r.id === currentItem.id) return { ...r, order: swapOrder };
        if (r.id === swapItem.id) return { ...r, order: currentOrder };
        return r;
      });

      broadcastSync({ rooms: reordered });
      syncLibraryStateToCloud({ rooms: reordered, seats, notices, branchesConfig: allBranches }).catch(() => {});
      return reordered;
    });
  }, [seats, notices, allBranches, broadcastSync]);

  const setRoomOrder = useCallback((roomId: string, newOrder: number) => {
    setRooms((prev) => {
      const updated = prev.map((r) => (r.id === roomId ? { ...r, order: newOrder } : r));
      broadcastSync({ rooms: updated });
      syncLibraryStateToCloud({ rooms: updated, seats, notices, branchesConfig: allBranches }).catch(() => {});
      return updated;
    });
  }, [seats, notices, allBranches, broadcastSync]);

  // Admin Custom Seats and Student Control Actions
  /**
   * Admin PIN reset.
   *
   * The raw PIN exists only as a local variable inside this function. It is
   * hashed (PBKDF2-SHA256, random per-PIN salt, 210k rounds) before it touches
   * React state, localStorage or the network.
   */
  const adminResetStudentPin = useCallback(
    async (phone: string, rawPin: string): Promise<{ success: boolean; message: string }> => {
      const clean = phone.replace(/\D/g, '');
      const pin = normalizePin(rawPin);

      const validationError = pinValidationError(pin);
      if (validationError) return { success: false, message: validationError };

      let pinHash: string;
      try {
        pinHash = await hashPin(pin);
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'Could not hash the PIN.',
        };
      }

      let matched = false;
      setRegisteredStudents((prev) =>
        prev.map((s) => {
          if (s.phone.replace(/\D/g, '') === clean) {
            matched = true;
            const updated: StudentProfile = { ...s, pinHash };
            delete (updated as StudentProfile & { pin?: string }).pin;
            syncStudentToCloud(updated).catch(() => {});
            return updated;
          }
          return s;
        })
      );

      if (currentStudent?.phone.replace(/\D/g, '') === clean) {
        setCurrentStudent((prev) => {
          if (!prev) return prev;
          const updated: StudentProfile = { ...prev, pinHash };
          delete (updated as StudentProfile & { pin?: string }).pin;
          return updated;
        });
      }

      // Best effort: also patch the cloud row directly so the change survives
      // even if the profile sync above is rejected by RLS.
      void updateStudentPinHash(phone, pinHash).catch(() => {});

      return matched
        ? { success: true, message: 'PIN updated. Only the hash is stored.' }
        : { success: false, message: 'No local record found for that phone number.' };
    },
    [currentStudent]
  );

  /**
   * Desk-side verification: an admin can confirm a PIN a student quotes over
   * the phone without the PIN ever being displayed or stored.
   * Returns `null` when the student has no credential yet.
   */
  const adminVerifyStudentPin = useCallback(
    async (phone: string, rawPin: string): Promise<boolean | null> => {
      const clean = phone.replace(/\D/g, '');
      const student = registeredStudentsRef.current.find(
        (s) => s.phone.replace(/\D/g, '') === clean
      );
      if (!student || !student.pinHash) return null;

      const pin = normalizePin(rawPin);
      if (!pin) return false;

      const ok = await verifyPin(pin, student.pinHash);

      // Transparently upgrade legacy credentials on a successful check.
      if (ok && needsHashUpgrade(student.pinHash)) {
        try {
          const upgraded: StudentProfile = { ...student, pinHash: await hashPin(pin) };
          delete (upgraded as StudentProfile & { pin?: string }).pin;
          setRegisteredStudents((prev) =>
            prev.map((s) => (s.phone.replace(/\D/g, '') === clean ? upgraded : s))
          );
          syncStudentToCloud(upgraded).catch(() => {});
          void updateStudentPinHash(phone, upgraded.pinHash || null).catch(() => {});
        } catch (err) {
          console.warn('[Security] PIN hash upgrade failed:', err);
        }
      }

      return ok;
    },
    []
  );

  const adminToggleBlockStudent = useCallback((phone: string) => {
    const clean = phone.replace(/\D/g, '');
    let nextBlocked = false;
    setRegisteredStudents((prev) =>
      prev.map((s) => {
        if (s.phone.replace(/\D/g, '') === clean) {
          nextBlocked = !s.isBlocked;
          const updated = { ...s, isBlocked: nextBlocked };
          syncStudentToCloud(updated).catch(() => {});
          // syncStudentToCloud's preferred path is the upsert_student_profile
          // RPC, which deliberately never writes is_blocked (so a student
          // can't clear their own block by re-registering) — but that also
          // means it silently drops THIS toggle. Write it directly too.
          void updateStudentBlockedStatus(phone, nextBlocked).catch(() => {});
          return updated;
        }
        return s;
      })
    );
    if (currentStudent?.phone.replace(/\D/g, '') === clean) {
      setCurrentStudent((prev) => (prev ? { ...prev, isBlocked: !prev.isBlocked } : null));
    }
  }, [currentStudent]);

  const adminAddCustomSeat = useCallback((seatData: Omit<Seat, 'id'>) => {
    const newSeat: Seat = {
      ...seatData,
      id: `seat_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
    };
    setSeats((prev) => {
      const next = [...prev, newSeat];
      broadcastSync({ seats: next });
      syncLibraryStateToCloud({ rooms, seats: next, notices, branchesConfig: allBranches }).catch(() => {});
      return next;
    });
  }, [rooms, notices, allBranches, broadcastSync]);

  const adminDeleteSeat = useCallback((seatId: string) => {
    setSeats((prev) => {
      const next = prev.filter((s) => s.id !== seatId);
      broadcastSync({ seats: next });
      syncLibraryStateToCloud({ rooms, seats: next, notices, branchesConfig: allBranches }).catch(() => {});
      return next;
    });
  }, [rooms, notices, allBranches, broadcastSync]);

  const adminToggleSeatFemaleReserved = useCallback((seatId: string) => {
    setSeats((prev) => {
      const next = prev.map((s) => (s.id === seatId ? { ...s, isFemaleReserved: !s.isFemaleReserved } : s));
      broadcastSync({ seats: next });
      syncLibraryStateToCloud({ rooms, seats: next, notices, branchesConfig: allBranches }).catch(() => {});
      return next;
    });
  }, [rooms, notices, allBranches, broadcastSync]);

  // Guidelines & Code of Conduct Rules CRUD
  const addRule = useCallback((ruleData: Omit<LibraryRule, 'id'>) => {
    const newRule: LibraryRule = {
      ...ruleData,
      id: `rule_${Date.now()}`,
    };
    setRules((prev) => {
      const next = [...prev, newRule];
      broadcastSync({ rules: next });
      syncLibraryStateToCloud({ rooms, seats, notices, branchesConfig: allBranches, rules: next, wifiFacilities }).catch(() => {});
      return next;
    });
  }, [rooms, seats, notices, allBranches, wifiFacilities, broadcastSync]);

  const updateRule = useCallback((ruleId: string, updates: Partial<LibraryRule>) => {
    setRules((prev) => {
      const next = prev.map((r) => (r.id === ruleId ? { ...r, ...updates } : r));
      broadcastSync({ rules: next });
      syncLibraryStateToCloud({ rooms, seats, notices, branchesConfig: allBranches, rules: next, wifiFacilities }).catch(() => {});
      return next;
    });
  }, [rooms, seats, notices, allBranches, wifiFacilities, broadcastSync]);

  const deleteRule = useCallback((ruleId: string) => {
    setRules((prev) => {
      const next = prev.filter((r) => r.id !== ruleId);
      broadcastSync({ rules: next });
      syncLibraryStateToCloud({ rooms, seats, notices, branchesConfig: allBranches, rules: next, wifiFacilities }).catch(() => {});
      return next;
    });
  }, [rooms, seats, notices, allBranches, wifiFacilities, broadcastSync]);

  // Wi-Fi & Facility Amenities Management
  const updateWifiFacility = useCallback((branchId: BranchId, updates: Partial<WifiFacilityConfig>) => {
    setWifiFacilities((prev) => {
      const next = {
        ...prev,
        [branchId]: {
          ...(prev[branchId] || INITIAL_WIFI_CONFIGS[branchId] || {
            branchId,
            ssid: '',
            password: '',
            speed: '',
            notes: '',
            amenities: [],
            helpdeskPhone: '',
          }),
          ...updates,
        },
      };
      broadcastSync({ wifiFacilities: next });
      syncLibraryStateToCloud({ rooms, seats, notices, branchesConfig: allBranches, rules, wifiFacilities: next }).catch(() => {});
      return next;
    });
  }, [rooms, seats, notices, allBranches, rules, broadcastSync]);

  const currentBranchWifi = useMemo(() => {
    return wifiFacilities[currentBranchId] || INITIAL_WIFI_CONFIGS[currentBranchId] || {
      branchId: currentBranchId,
      ssid: 'STUDY_CENTER_5G',
      password: 'study@2026#pass',
      speed: '100 Mbps',
      notes: '',
      amenities: [],
      helpdeskPhone: '',
    };
  }, [wifiFacilities, currentBranchId]);

  // Wi-Fi Networks Management (Add, Delete, Edit, Password change)
  const addWifiNetwork = useCallback((networkData: Omit<WifiNetwork, 'id'>) => {
    const newNetwork: WifiNetwork = {
      ...networkData,
      id: `wifi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setWifiNetworks((prev) => {
      const next = [newNetwork, ...prev];
      broadcastSync({ wifiNetworks: next });
      syncLibraryStateToCloud({
        rooms,
        seats,
        notices,
        branchesConfig: allBranches,
        rules,
        wifiFacilities,
        wifiNetworks: next,
      }).catch(() => {});
      return next;
    });

    if (newNetwork.isActive) {
      if (newNetwork.branchId === 'all') {
        (['science_library', 'central_library'] as BranchId[]).forEach((bid) => {
          updateWifiFacility(bid, {
            ssid: newNetwork.ssid,
            password: newNetwork.password,
            speed: newNetwork.speed,
            notes: newNetwork.notes,
          });
        });
      } else {
        updateWifiFacility(newNetwork.branchId, {
          ssid: newNetwork.ssid,
          password: newNetwork.password,
          speed: newNetwork.speed,
          notes: newNetwork.notes,
        });
      }
    }
  }, [rooms, seats, notices, allBranches, rules, wifiFacilities, broadcastSync, updateWifiFacility]);

  const updateWifiNetwork = useCallback((networkId: string, updates: Partial<WifiNetwork>) => {
    setWifiNetworks((prev) => {
      const next = prev.map((net) => (net.id === networkId ? { ...net, ...updates } : net));
      broadcastSync({ wifiNetworks: next });
      syncLibraryStateToCloud({
        rooms,
        seats,
        notices,
        branchesConfig: allBranches,
        rules,
        wifiFacilities,
        wifiNetworks: next,
      }).catch(() => {});

      const updatedNet = next.find((n) => n.id === networkId);
      if (updatedNet && updatedNet.isActive && (updates.password || updates.ssid || updates.speed || updates.notes)) {
        if (updatedNet.branchId === 'all') {
          (['science_library', 'central_library'] as BranchId[]).forEach((bid) => {
            updateWifiFacility(bid, {
              ssid: updatedNet.ssid,
              password: updatedNet.password,
              speed: updatedNet.speed,
              notes: updatedNet.notes,
            });
          });
        } else {
          updateWifiFacility(updatedNet.branchId, {
            ssid: updatedNet.ssid,
            password: updatedNet.password,
            speed: updatedNet.speed,
            notes: updatedNet.notes,
          });
        }
      }
      return next;
    });
  }, [rooms, seats, notices, allBranches, rules, wifiFacilities, broadcastSync, updateWifiFacility]);

  const deleteWifiNetwork = useCallback((networkId: string) => {
    setWifiNetworks((prev) => {
      const next = prev.filter((net) => net.id !== networkId);
      broadcastSync({ wifiNetworks: next });
      syncLibraryStateToCloud({
        rooms,
        seats,
        notices,
        branchesConfig: allBranches,
        rules,
        wifiFacilities,
        wifiNetworks: next,
      }).catch(() => {});
      return next;
    });
  }, [rooms, seats, notices, allBranches, rules, wifiFacilities, broadcastSync]);

  const setWifiNetworkPassword = useCallback((networkId: string, newPassword: string) => {
    updateWifiNetwork(networkId, { password: newPassword });
  }, [updateWifiNetwork]);

  // Data Backup & Restore
  const exportFullBackupJSON = useCallback(() => {
    const backupData = {
      app: 'Smart Library & BCS Study Center',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      branchesConfig: allBranches,
      rooms,
      seats,
      notices,
      rules,
      wifiFacilities,
      registeredStudents,
      attendanceRecords,
    };
    return JSON.stringify(backupData, null, 2);
  }, [allBranches, rooms, seats, notices, rules, wifiFacilities, registeredStudents, attendanceRecords]);

  const importFullBackupJSON = useCallback((jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.branchesConfig) {
        setAllBranches(data.branchesConfig);
        localStorage.setItem(STORAGE_KEYS.BRANCHES_CONFIG, JSON.stringify(data.branchesConfig));
      }
      let targetRooms = rooms;
      if (Array.isArray(data.rooms) && data.rooms.length > 0) {
        targetRooms = data.rooms as Room[];
        setRooms(targetRooms);
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(targetRooms));
      }
      if (Array.isArray(data.seats) && data.seats.length > 0) {
        const healed = reconcileSeatsWithRooms(targetRooms, data.seats as Seat[]);
        setSeats(healed);
        localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(healed));
      }
      if (Array.isArray(data.notices)) {
        setNotices(data.notices);
        localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(data.notices));
      }
      if (Array.isArray(data.rules)) {
        setRules(data.rules);
        localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(data.rules));
      }
      if (data.wifiFacilities && typeof data.wifiFacilities === 'object') {
        setWifiFacilities(data.wifiFacilities);
        localStorage.setItem(STORAGE_KEYS.WIFI_FACILITIES, JSON.stringify(data.wifiFacilities));
      }
      if (Array.isArray(data.registeredStudents)) {
        setRegisteredStudents(data.registeredStudents);
        localStorage.setItem(STORAGE_KEYS.REGISTERED_STUDENTS, JSON.stringify(data.registeredStudents));
      }
      if (Array.isArray(data.attendanceRecords)) {
        setAttendanceRecords(data.attendanceRecords);
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(data.attendanceRecords));
      }

      broadcastSync({
        rooms: data.rooms,
        seats: data.seats,
        notices: data.notices,
        rules: data.rules,
        wifiFacilities: data.wifiFacilities,
      });
      syncLibraryStateToCloud({
        rooms: data.rooms,
        seats: data.seats,
        notices: data.notices,
        branchesConfig: data.branchesConfig,
        rules: data.rules,
        wifiFacilities: data.wifiFacilities,
      }).catch(() => {});

      return { success: true, message: 'Entire database successfully restored!' };
    } catch (err) {
      return { success: false, message: 'Invalid backup file or incorrect JSON format.' };
    }
  }, [broadcastSync]);

  const syncStateToCloudManual = useCallback(async () => {
    const res = await syncLibraryStateToCloud({
      rooms,
      seats,
      notices,
      branchesConfig: allBranches,
      rules,
      wifiFacilities,
    });
    if (res.success) {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      setCloudLastSyncedAt(timeStr);
      return { success: true, message: `Successfully synced to cloud (${timeStr})` };
    }
    return { success: false, message: 'Cloud sync failed. However, local storage data is secure.' };
  }, [rooms, seats, notices, allBranches, rules, wifiFacilities]);

  const runDiagnostics = useCallback(async () => {
    return await runSupabaseDiagnostics(rooms, seats);
  }, [rooms, seats]);

  // Notices
  const addNotice = useCallback((noticeData: Omit<LibraryNotice, 'id'>) => {
    const newNotice: LibraryNotice = {
      ...noticeData,
      id: `notice_${Date.now()}`,
    };
    setNotices((prev) => {
      const next = [newNotice, ...prev];
      broadcastSync({ notices: next });
      syncLibraryStateToCloud({ rooms, seats, notices: next, branchesConfig: allBranches, rules, wifiFacilities }).catch(() => {});
      return next;
    });
  }, [rooms, seats, allBranches, rules, wifiFacilities, broadcastSync]);

  const updateNotice = useCallback((noticeId: string, updates: Partial<LibraryNotice>) => {
    setNotices((prev) => {
      const next = prev.map((n) => (n.id === noticeId ? { ...n, ...updates } : n));
      broadcastSync({ notices: next });
      syncLibraryStateToCloud({ rooms, seats, notices: next, branchesConfig: allBranches, rules, wifiFacilities }).catch(() => {});
      return next;
    });
  }, [rooms, seats, allBranches, rules, wifiFacilities, broadcastSync]);

  const deleteNotice = useCallback((noticeId: string) => {
    setNotices((prev) => {
      const next = prev.filter((n) => n.id !== noticeId);
      broadcastSync({ notices: next });
      syncLibraryStateToCloud({ rooms, seats, notices: next, branchesConfig: allBranches, rules, wifiFacilities }).catch(() => {});
      return next;
    });
  }, [rooms, seats, allBranches, rules, wifiFacilities, broadcastSync]);

  // Daily auto reset
  const triggerDailyAutoReset = useCallback(() => {
    const nowDate = new Date();
    const resetCutoff = getTodaysResetTimestamp(nowDate, bookingScheduleRef.current);
    setSeats((prev) => {
      const next = prev.map((s) => {
        // Protect seats booked recently after today's reset timestamp
        if (s.bookedAt && s.bookedAt > resetCutoff) {
          return s;
        }
        return {
          ...s,
          status: s.status === 'maintenance' ? ('maintenance' as const) : ('available' as const),
          occupantName: undefined,
          occupantPhone: undefined,
          occupantEmail: undefined,
          studentId: undefined,
          occupantGender: undefined,
          bookedAt: undefined,
          expectedLeaveAt: undefined,
          targetDurationHours: undefined,
          awaySince: undefined,
          awayDurationMinutes: undefined,
          awayReason: undefined,
          awayCustomReason: undefined,
          passCode: undefined,
          isSecondaryBooked: false,
          secondaryOccupantName: undefined,
          secondaryOccupantPhone: undefined,
          secondaryOccupantStudentId: undefined,
          secondaryOccupantGender: undefined,
          secondaryBookedAt: undefined,
          secondaryExpectedLeaveAt: undefined,
          secondaryPassCode: undefined,
        };
      });
      broadcastSync({ seats: next });
      syncLibraryStateToCloud({ rooms, seats: next, notices, branchesConfig: allBranches, rules, wifiFacilities }).catch(() => {});
      return next;
    });
  }, [rooms, notices, allBranches, rules, wifiFacilities, broadcastSync]);

  // Keep the ref the auto-reset-checker effect calls always pointed at the
  // latest triggerDailyAutoReset (see that effect for why a ref is used).
  useEffect(() => {
    triggerDailyAutoResetRef.current = triggerDailyAutoReset;
  }, [triggerDailyAutoReset]);

  const resetToDefaultData = useCallback(() => {
    localStorage.clear();
    setAllBranches(BRANCHES_DATA);
    setRooms(INITIAL_ROOMS);
    const initSeats = generateInitialSeats();
    setSeats(initSeats);
    setNotices(INITIAL_NOTICES);
    setRules(INITIAL_RULES);
    setWifiFacilities(INITIAL_WIFI_CONFIGS);
    setRegisteredStudents([]);
    setCurrentStudent(null);
    setAdminUser(null);
    broadcastSync({
      rooms: INITIAL_ROOMS,
      seats: initSeats,
      notices: INITIAL_NOTICES,
      rules: INITIAL_RULES,
      wifiFacilities: INITIAL_WIFI_CONFIGS,
    });
    syncLibraryStateToCloud({
      rooms: INITIAL_ROOMS,
      seats: initSeats,
      notices: INITIAL_NOTICES,
      branchesConfig: BRANCHES_DATA,
      rules: INITIAL_RULES,
      wifiFacilities: INITIAL_WIFI_CONFIGS,
    }).catch(() => {});
  }, [broadcastSync]);

  // Stats calculation
  const calculateStats = useCallback(
    (seatsList: Seat[]): LibraryStats => {
      const totalSeats = seatsList.length;
      const occupiedSeats = seatsList.filter((s) => s.status === 'occupied').length;
      const awaySeats = seatsList.filter((s) => s.status === 'away').length;
      const maintenanceSeats = seatsList.filter((s) => s.status === 'maintenance').length;
      const availableSeats = seatsList.filter((s) => s.status === 'available').length;
      const femaleSeats = seatsList.filter((s) => s.isFemaleReserved);
      const femaleOccupied = femaleSeats.filter((s) => s.status === 'occupied' || s.status === 'away').length;

      const activeOccupants = occupiedSeats + awaySeats;
      const usableSeats = totalSeats - maintenanceSeats;
      const occupancyRate = usableSeats > 0 ? Math.round((activeOccupants / usableSeats) * 100) : 0;

      const todayStr = new Date().toISOString().split('T')[0];
      const todayCheckIns = attendanceRecords.filter((a) => a.dateStr === todayStr).length;

      return {
        totalSeats,
        occupiedSeats,
        availableSeats,
        awaySeats,
        maintenanceSeats,
        occupancyRate,
        femaleSeatsCount: femaleSeats.length,
        femaleOccupiedCount: femaleOccupied,
        todayCheckIns,
      };
    },
    [attendanceRecords]
  );

  const branchStats = useMemo(() => calculateStats(branchSeats), [calculateStats, branchSeats]);
  const overallStats = useMemo(() => calculateStats(seats), [calculateStats, seats]);

  // Both flags derive from `adminUser`, which only `verifyAdminSession()` /
  // `loginAdmin()` can set — i.e. only a server-verified `admins` row.
  const isSuperAdminUser = useMemo(() => adminUser?.role === 'superadmin', [adminUser]);

  const isAdminLoggedIn = useMemo(() => Boolean(adminUser), [adminUser]);

  // Whether a student could book a seat RIGHT NOW, per today's configured
  // schedule. Recomputes every tick since currentTime updates every second.
  const isBookingOpenNow = useMemo(
    () => isBookingWindowOpen(currentTime, bookingSchedule),
    [currentTime, bookingSchedule]
  );

  const value = useMemo(
    () => ({
      currentBranchId,
      setCurrentBranchId,
      branchConfig,
      allBranches,
      updateBranchConfig,

      bookingSchedule,
      updateBookingSchedule,

      rooms,
      branchRooms,
      addRoom,
      updateRoom,
      deleteRoom,
      moveRoomOrder,
      setRoomOrder,

      seats,
      branchSeats,
      currentStudentSeat,
      bookSeat,
      leaveSeatTemporarily,
      returnFromAway,
      releaseSeat,
      secondaryBookSeat,
      releaseSecondaryBooking,

      rules,
      addRule,
      updateRule,
      deleteRule,

      wifiFacilities,
      currentBranchWifi,
      updateWifiFacility,
      wifiNetworks,
      addWifiNetwork,
      updateWifiNetwork,
      deleteWifiNetwork,
      setWifiNetworkPassword,

      adminForceReleaseSeat,
      adminToggleMaintenance,
      adminManuallyAssignSeat,
      adminResetStudentPin,
      adminVerifyStudentPin,
      adminToggleBlockStudent,
      adminAddCustomSeat,
      adminDeleteSeat,
      adminToggleSeatFemaleReserved,

      exportFullBackupJSON,
      importFullBackupJSON,
      syncStateToCloudManual,
      runDiagnostics,
      cloudLastSyncedAt,

      currentStudent,
      registeredStudents,
      loginStudent,
      logoutStudent,
      demoLogin,
      registerOrUpdateStudent,
      deleteRegisteredStudent,
      refreshStudentsFromCloud,
      signInWithGoogleAuth,
      isSupabaseReady: isSupabaseConfigured(),

      adminUser,
      isAdminLoggedIn,
      isSuperAdminUser,
      adminCheckPending,
      adminSetupRequired,
      loginAdmin,
      logoutAdmin,

      notices,
      addNotice,
      updateNotice,
      deleteNotice,

      attendanceRecords,

      branchStats,
      overallStats,

      triggerDailyAutoReset,
      resetToDefaultData,

      isBookingOpenNow,

      currentTime,
    }),
    [
      currentBranchId,
      setCurrentBranchId,
      branchConfig,
      allBranches,
      updateBranchConfig,
      bookingSchedule,
      updateBookingSchedule,
      rooms,
      branchRooms,
      addRoom,
      updateRoom,
      deleteRoom,
      moveRoomOrder,
      setRoomOrder,
      seats,
      branchSeats,
      currentStudentSeat,
      bookSeat,
      leaveSeatTemporarily,
      returnFromAway,
      releaseSeat,
      secondaryBookSeat,
      releaseSecondaryBooking,
      rules,
      addRule,
      updateRule,
      deleteRule,
      wifiFacilities,
      currentBranchWifi,
      updateWifiFacility,
      wifiNetworks,
      addWifiNetwork,
      updateWifiNetwork,
      deleteWifiNetwork,
      setWifiNetworkPassword,
      adminForceReleaseSeat,
      adminToggleMaintenance,
      adminManuallyAssignSeat,
      adminResetStudentPin,
      adminVerifyStudentPin,
      adminToggleBlockStudent,
      adminAddCustomSeat,
      adminDeleteSeat,
      adminToggleSeatFemaleReserved,
      exportFullBackupJSON,
      importFullBackupJSON,
      syncStateToCloudManual,
      runDiagnostics,
      cloudLastSyncedAt,
      currentStudent,
      registeredStudents,
      loginStudent,
      logoutStudent,
      demoLogin,
      registerOrUpdateStudent,
      deleteRegisteredStudent,
      refreshStudentsFromCloud,
      signInWithGoogleAuth,
      adminUser,
      isAdminLoggedIn,
      isSuperAdminUser,
      adminCheckPending,
      adminSetupRequired,
      loginAdmin,
      logoutAdmin,
      notices,
      addNotice,
      updateNotice,
      deleteNotice,
      attendanceRecords,
      branchStats,
      overallStats,
      triggerDailyAutoReset,
      resetToDefaultData,
      isBookingOpenNow,
      currentTime,
    ]
  );


  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
