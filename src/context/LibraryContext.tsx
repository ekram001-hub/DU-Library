import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
} from '../types';
import {
  BRANCHES_DATA,
  INITIAL_ROOMS,
  INITIAL_NOTICES,
  DEMO_STUDENTS,
  generateInitialSeats,
} from '../data/initialData';

interface LibraryContextType {
  currentBranchId: BranchId;
  setCurrentBranchId: (branchId: BranchId) => void;
  branchConfig: BranchConfig;
  allBranches: Record<string, BranchConfig>;
  updateBranchConfig: (branchId: BranchId, updates: Partial<BranchConfig>) => void;

  rooms: Room[];
  branchRooms: Room[];
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;

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

  // Student Auth
  currentStudent: StudentProfile | null;
  loginStudent: (student: StudentProfile) => void;
  logoutStudent: () => void;
  demoLogin: (demoStudentId: string) => void;
  registerOrUpdateStudent: (data: Omit<StudentProfile, 'id' | 'role'>) => void;

  // Admin Auth
  adminUser: AdminUser | null;
  isAdminLoggedIn: boolean;
  loginAdmin: (email: string, pass: string) => boolean;
  logoutAdmin: () => void;

  // Notices
  notices: LibraryNotice[];
  addNotice: (notice: Omit<LibraryNotice, 'id'>) => void;
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
  ADMIN_USER: 'smart_library_admin_user_v2',
  NOTICES: 'smart_library_notices_v2',
  ATTENDANCE: 'smart_library_attendance_v2',
  LAST_RESET_DATE: 'smart_library_last_reset_date_v2',
};

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Current Branch
  const [currentBranchId, setCurrentBranchIdState] = useState<BranchId>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BRANCH);
    return saved === 'fresh_study' ? 'fresh_study' : 'bcs_study';
  });

  const setCurrentBranchId = useCallback((id: BranchId) => {
    setCurrentBranchIdState(id);
    localStorage.setItem(STORAGE_KEYS.BRANCH, id);
  }, []);

  // 2. Branches config
  const [allBranches, setAllBranches] = useState<Record<string, BranchConfig>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BRANCHES_CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
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
      return next;
    });
  }, []);

  // 3. Rooms
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved rooms', e);
      }
    }
    return INITIAL_ROOMS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }, [rooms]);

  // 4. Seats
  const [seats, setSeats] = useState<Seat[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SEATS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved seats', e);
      }
    }
    return generateInitialSeats();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seats));
  }, [seats]);

  // 5. Current Student
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved student', e);
      }
    }
    return DEMO_STUDENTS[0]; // Default to Tanvir Ahmed for instant rich experience
  });

  useEffect(() => {
    if (currentStudent) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, JSON.stringify(currentStudent));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
    }
  }, [currentStudent]);

  // 6. Admin User
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved admin', e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(adminUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
    }
  }, [adminUser]);

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
        branchId: 'bcs_study',
        branchName: 'BCS Study Center',
        studentName: 'Saiful Islam',
        studentPhone: '01715000000',
        studentId: 'BCS-47-101',
        gender: 'male',
        seatNumber: 'A-01',
        roomName: 'Main Silent Hall (Room 1)',
        checkInTime: Date.now() - 2.5 * 3600 * 1000,
        dateStr: todayStr,
        passCode: 'PASS-BCS-08191',
      },
      {
        id: 'att_sample_2',
        branchId: 'bcs_study',
        branchName: 'BCS Study Center',
        studentName: 'Farhana Akter',
        studentPhone: '01877000000',
        studentId: 'BCS-47-301',
        gender: 'female',
        seatNumber: 'FC-01',
        roomName: "Women's Reserved Zone (Room 3)",
        checkInTime: Date.now() - 2 * 3600 * 1000,
        dateStr: todayStr,
        passCode: 'PASS-BCS-08301',
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  // 9. Live Digital Clock (1s tick)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 10. Auto-Reset Checker for night expiry / daily reset
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE);

    if (lastReset && lastReset !== todayStr) {
      // Auto-reset overnight bookings
      console.log('New calendar day detected! Performing nightly seat auto-reset...');
      triggerDailyAutoReset();
    }
    localStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, todayStr);
  }, []);

  // Computed: Branch Config
  const branchConfig = useMemo(() => {
    return allBranches[currentBranchId] || BRANCHES_DATA[currentBranchId];
  }, [allBranches, currentBranchId]);

  // Computed: Branch Rooms
  const branchRooms = useMemo(() => {
    return rooms.filter((r) => r.branchId === currentBranchId);
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
      const seat = seats.find((s) => s.id === seatId);
      if (!seat) {
        return { success: false, message: 'Seat not found / সিট পাওয়া যায়নি' };
      }

      if (seat.status !== 'available') {
        return {
          success: false,
          message: 'Seat is no longer available / এই সিটটি ইতোমধ্যে দখল হয়ে গেছে',
        };
      }

      // Check Female Reserved Area rule
      if (seat.isFemaleReserved && studentDetails.gender !== 'female') {
        return {
          success: false,
          message: 'This area is strictly reserved for female students / এটি মহিলা সংরক্ষিত কর্নার। শুধুমাত্র নারী শিক্ষার্থীরা বুক করতে পারবেন।',
        };
      }

      const room = rooms.find((r) => r.id === seat.roomId);
      const roomName = room ? room.name : 'Study Room';
      const branchName = allBranches[seat.branchId]?.name || 'Study Center';

      const now = Date.now();
      const durationMs = studentDetails.targetHours * 3600 * 1000;
      const expectedLeave = now + durationMs;
      const passCode = `PASS-${seat.branchId === 'bcs_study' ? 'BCS' : 'FSL'}-${Math.floor(
        10000 + Math.random() * 90000
      )}`;

      // Update seat
      setSeats((prev) =>
        prev.map((s) => {
          if (s.id === seatId) {
            return {
              ...s,
              status: 'occupied',
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
        })
      );

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
        message: 'Seat successfully booked! / সিট বুকিং সফল হয়েছে!',
        passCode,
      };
    },
    [seats, rooms, allBranches]
  );

  // Leave Seat Temporarily (Break)
  const leaveSeatTemporarily = useCallback(
    (seatId: string, durationMinutes: number, reason: AwayReason, customReason?: string) => {
      const now = Date.now();
      setSeats((prev) =>
        prev.map((s) => {
          if (s.id === seatId) {
            return {
              ...s,
              status: 'away',
              awaySince: now,
              awayDurationMinutes: durationMinutes,
              awayReason: reason,
              awayCustomReason: customReason,
            };
          }
          return s;
        })
      );
    },
    []
  );

  // Return from away
  const returnFromAway = useCallback((seatId: string) => {
    setSeats((prev) =>
      prev.map((s) => {
        if (s.id === seatId) {
          return {
            ...s,
            status: 'occupied',
            awaySince: undefined,
            awayDurationMinutes: undefined,
            awayReason: undefined,
            awayCustomReason: undefined,
          };
        }
        return s;
      })
    );
  }, []);

  // Release Seat
  const releaseSeat = useCallback((seatId: string) => {
    const now = Date.now();
    setSeats((prev) =>
      prev.map((s) => {
        if (s.id === seatId) {
          return {
            ...s,
            status: 'available',
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
          };
        }
        return s;
      })
    );

    // Update attendance checkout time
    setAttendanceRecords((prev) =>
      prev.map((record) => {
        if (record.seatNumber && !record.checkOutTime) {
          return {
            ...record,
            checkOutTime: now,
            durationMinutes: Math.round((now - record.checkInTime) / 60000),
          };
        }
        return record;
      })
    );
  }, []);

  // Admin Actions
  const adminForceReleaseSeat = useCallback((seatId: string) => {
    releaseSeat(seatId);
  }, [releaseSeat]);

  const adminToggleMaintenance = useCallback((seatId: string, note?: string) => {
    setSeats((prev) =>
      prev.map((s) => {
        if (s.id === seatId) {
          const nextStatus = s.status === 'maintenance' ? 'available' : 'maintenance';
          return {
            ...s,
            status: nextStatus,
            maintenanceNote: nextStatus === 'maintenance' ? note || 'Under maintenance / মেরামত চলছে' : undefined,
            occupantName: undefined,
            occupantPhone: undefined,
            studentId: undefined,
            bookedAt: undefined,
          };
        }
        return s;
      })
    );
  }, []);

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

      setSeats((prev) =>
        prev.map((s) => {
          if (s.id === seatId) {
            return {
              ...s,
              status: 'occupied',
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
        })
      );
    },
    []
  );

  // Student Auth
  const loginStudent = useCallback((student: StudentProfile) => {
    setCurrentStudent(student);
  }, []);

  const logoutStudent = useCallback(() => {
    setCurrentStudent(null);
  }, []);

  const demoLogin = useCallback((demoStudentId: string) => {
    const student = DEMO_STUDENTS.find((s) => s.id === demoStudentId);
    if (student) {
      setCurrentStudent(student);
    }
  }, []);

  const registerOrUpdateStudent = useCallback((data: Omit<StudentProfile, 'id' | 'role'>) => {
    const newStudent: StudentProfile = {
      ...data,
      id: `stu_${Date.now()}`,
      role: 'student',
    };
    setCurrentStudent(newStudent);
  }, []);

  // Admin Auth
  const loginAdmin = useCallback((email: string, pass: string): boolean => {
    // Standard secure demo admin credentials: admin@studycenter.com / admin123 or bcsadmin / admin
    const normalizedEmail = email.trim().toLowerCase();
    if (
      (normalizedEmail === 'admin@studycenter.com' || normalizedEmail === 'admin' || normalizedEmail === 'bcsadmin') &&
      (pass === 'admin123' || pass === 'admin' || pass === 'study123')
    ) {
      const admin: AdminUser = {
        id: 'admin_master_1',
        name: 'Library Super Admin (মুসাফির হোসেন)',
        email: normalizedEmail,
        role: 'superadmin',
        branchAccess: 'all',
      };
      setAdminUser(admin);
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(() => {
    setAdminUser(null);
  }, []);

  // Rooms CRUD
  const addRoom = useCallback((roomData: Omit<Room, 'id'>) => {
    const newRoomId = `room_${Date.now()}`;
    const newRoom: Room = {
      ...roomData,
      id: newRoomId,
    };

    setRooms((prev) => [...prev, newRoom]);

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

    setSeats((prev) => [...prev, ...newSeats]);
  }, []);

  const updateRoom = useCallback((roomId: string, updates: Partial<Room>) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const updated = { ...r, ...updates };
          return updated;
        }
        return r;
      })
    );

    // If capacity changed or prefix changed, refresh seat prefixes or add/remove seats
    if (updates.seatPrefix || updates.capacity !== undefined || updates.category !== undefined) {
      setSeats((prev) => {
        const roomSeats = prev.filter((s) => s.roomId === roomId);
        const otherSeats = prev.filter((s) => s.roomId !== roomId);
        const room = rooms.find((r) => r.id === roomId);
        if (!room) return prev;

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

        return [...otherSeats, ...updatedRoomSeats];
      });
    }
  }, [rooms]);

  const deleteRoom = useCallback((roomId: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    setSeats((prev) => prev.filter((s) => s.roomId !== roomId));
  }, []);

  // Notices
  const addNotice = useCallback((noticeData: Omit<LibraryNotice, 'id'>) => {
    const newNotice: LibraryNotice = {
      ...noticeData,
      id: `notice_${Date.now()}`,
    };
    setNotices((prev) => [newNotice, ...prev]);
  }, []);

  const deleteNotice = useCallback((noticeId: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== noticeId));
  }, []);

  // Daily auto reset
  const triggerDailyAutoReset = useCallback(() => {
    setSeats((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.status === 'maintenance' ? 'maintenance' : 'available',
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
      }))
    );
  }, []);

  const resetToDefaultData = useCallback(() => {
    localStorage.clear();
    setAllBranches(BRANCHES_DATA);
    setRooms(INITIAL_ROOMS);
    setSeats(generateInitialSeats());
    setNotices(INITIAL_NOTICES);
    setCurrentStudent(DEMO_STUDENTS[0]);
    setAdminUser(null);
  }, []);

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

  const value = useMemo(
    () => ({
      currentBranchId,
      setCurrentBranchId,
      branchConfig,
      allBranches,
      updateBranchConfig,

      rooms,
      branchRooms,
      addRoom,
      updateRoom,
      deleteRoom,

      seats,
      branchSeats,
      currentStudentSeat,
      bookSeat,
      leaveSeatTemporarily,
      returnFromAway,
      releaseSeat,

      adminForceReleaseSeat,
      adminToggleMaintenance,
      adminManuallyAssignSeat,

      currentStudent,
      loginStudent,
      logoutStudent,
      demoLogin,
      registerOrUpdateStudent,

      adminUser,
      isAdminLoggedIn: !!adminUser,
      loginAdmin,
      logoutAdmin,

      notices,
      addNotice,
      deleteNotice,

      attendanceRecords,

      branchStats,
      overallStats,

      triggerDailyAutoReset,
      resetToDefaultData,

      currentTime,
    }),
    [
      currentBranchId,
      setCurrentBranchId,
      branchConfig,
      allBranches,
      updateBranchConfig,
      rooms,
      branchRooms,
      addRoom,
      updateRoom,
      deleteRoom,
      seats,
      branchSeats,
      currentStudentSeat,
      bookSeat,
      leaveSeatTemporarily,
      returnFromAway,
      releaseSeat,
      adminForceReleaseSeat,
      adminToggleMaintenance,
      adminManuallyAssignSeat,
      currentStudent,
      loginStudent,
      logoutStudent,
      demoLogin,
      registerOrUpdateStudent,
      adminUser,
      loginAdmin,
      logoutAdmin,
      notices,
      addNotice,
      deleteNotice,
      attendanceRecords,
      branchStats,
      overallStats,
      triggerDailyAutoReset,
      resetToDefaultData,
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
