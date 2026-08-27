export type BranchId = 'science_library' | 'central_library';

export type RoomCategory = 'general' | 'female_only' | 'ac_hall' | 'silent_zone' | 'discussion';

export type SeatStatus = 'available' | 'occupied' | 'away' | 'maintenance' | 'reserved';

export type Gender = 'male' | 'female' | 'other';

export type AwayReason = 'Prayer' | 'Lunch' | 'Tea' | 'Rest' | 'Emergency' | 'Custom';

export interface BranchConfig {
  id: BranchId;
  name: string;
  bengaliName: string;
  tagline: string;
  bengaliTagline: string;
  address: string;
  bengaliAddress: string;
  phone: string;
  email: string;
  facebookUrl: string;
  facebookPageName: string;
  facebookFollowers: string;
  badge: string;
  themeColor: string;
  memorizerAppUrl: string;
}

export interface Room {
  id: string;
  branchId: BranchId;
  name: string;
  bengaliName: string;
  category: RoomCategory;
  seatPrefix: string;
  capacity: number;
  description: string;
  bengaliDescription: string;
  hasAC: boolean;
  isSilent: boolean;
  roomNumber?: string; // e.g. "Room 101", "1", "Executive-1"
  order?: number; // serial / ordering (1, 2, 3...)
}

export interface Seat {
  id: string;
  roomId: string;
  branchId: BranchId;
  seatNumber: string; // e.g., A-01, B-12
  status: SeatStatus;
  occupantName?: string;
  occupantPhone?: string;
  occupantEmail?: string;
  studentId?: string;
  occupantGender?: Gender;
  bookedAt?: number; // timestamp (ms)
  expectedLeaveAt?: number; // timestamp (ms)
  targetDurationHours?: number;
  awaySince?: number; // timestamp (ms)
  awayDurationMinutes?: number;
  awayReason?: AwayReason;
  awayCustomReason?: string;
  isFemaleReserved: boolean;
  isSpecialReserved?: boolean;
  passCode?: string;
  maintenanceNote?: string;
  // Secondary booking during temporary break
  isSecondaryBooked?: boolean;
  secondaryOccupantName?: string;
  secondaryOccupantPhone?: string;
  secondaryOccupantStudentId?: string;
  secondaryOccupantGender?: Gender;
  secondaryBookedAt?: number;
  secondaryExpectedLeaveAt?: number;
  secondaryPassCode?: string;
}

export interface LibraryRule {
  id: string;
  title: string;
  bengaliTitle?: string;
  description: string;
  bengaliDescription?: string;
  icon?: string; // e.g. "volume-x", "clock", "heart", "lock", "shield"
  category?: 'silence' | 'away' | 'female' | 'cleanliness' | 'general';
  branchId?: 'all' | BranchId;
  order?: number;
}

export interface WifiNetwork {
  id: string;
  branchId: 'all' | BranchId;
  ssid: string;
  password: string;
  speed?: string;
  notes?: string;
  band?: '5 GHz' | '2.4 GHz' | 'Dual Band';
  isActive?: boolean;
  createdAt?: string;
}

export interface WifiFacilityConfig {
  branchId: BranchId;
  ssid: string;
  password: string;
  speed: string;
  notes: string;
  amenities: string[];
  helpdeskPhone: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  studentId: string;
  gender: Gender;
  role: 'student' | 'admin' | 'superadmin';
  avatar?: string;
  institution?: string;
  targetExam?: string; // e.g., 47th BCS, Bank PO, Primary, Medical
  pin?: string; // 4-6 digit security PIN for phone login
  isProfileComplete?: boolean; // True once student completes dedicated information submission page
  isBlocked?: boolean;
  registeredAt?: string;
  lastActive?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
  branchAccess: 'all' | BranchId;
}

export interface LibraryNotice {
  id: string;
  title: string;
  bengaliTitle?: string;
  content: string;
  bengaliContent?: string;
  date?: string;
  postedAt?: string;
  type?: 'urgent' | 'event' | 'maintenance' | 'announcement';
  priority?: 'urgent' | 'info' | 'guideline';
  targetBranch?: 'all' | BranchId;
  branchId?: 'all' | BranchId;
  active?: boolean;
  author?: string;
}

export interface AttendanceRecord {
  id: string;
  branchId: BranchId;
  branchName: string;
  studentName: string;
  studentPhone: string;
  studentId: string;
  gender: Gender;
  seatNumber: string;
  roomName: string;
  checkInTime: number; // timestamp
  checkOutTime?: number; // timestamp
  dateStr: string; // YYYY-MM-DD
  durationMinutes?: number;
  passCode: string;
}

export interface LibraryStats {
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  awaySeats: number;
  maintenanceSeats: number;
  occupancyRate: number;
  femaleSeatsCount: number;
  femaleOccupiedCount: number;
  todayCheckIns: number;
}
