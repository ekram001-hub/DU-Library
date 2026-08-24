import { BranchConfig, Room, Seat, LibraryNotice, StudentProfile } from '../types';

export const BRANCHES_DATA: Record<string, BranchConfig> = {
  science_library: {
    id: 'science_library',
    name: 'Science Library',
    bengaliName: 'Science Library',
    tagline: 'Seat Booking • 8:00 AM — 10:00 PM',
    bengaliTagline: 'Seat Booking • 8:00 AM — 10:00 PM',
    address: 'Science Lab Crossing, Mirpur Road, Dhaka',
    bengaliAddress: 'Science Lab Crossing, Mirpur Road, Dhaka',
    phone: '+880 1711-234567',
    email: 'science.library@studycenter.bd',
    facebookUrl: 'https://facebook.com',
    facebookPageName: 'Follow Facebook',
    facebookFollowers: '50K+ Readers',
    badge: '🧪 Science Library',
    themeColor: '#ea580c', // Vibrant Orange
    memorizerAppUrl: 'https://ais-dev-xeniqwh76n7spkxw2xk4sw-1047076485341.asia-southeast1.run.app',
  },
  central_library: {
    id: 'central_library',
    name: 'Central Library',
    bengaliName: 'Central Library',
    tagline: 'Seat Booking • 8:00 AM — 10:00 PM',
    bengaliTagline: 'Seat Booking • 8:00 AM — 10:00 PM',
    address: 'Nilkhet - Katabon Road, Dhaka',
    bengaliAddress: 'Nilkhet - Katabon Road, Dhaka',
    phone: '+880 1812-987654',
    email: 'central.library@studycenter.bd',
    facebookUrl: 'https://facebook.com',
    facebookPageName: 'Follow Facebook',
    facebookFollowers: '45K+ Readers',
    badge: '📚 Central Library',
    themeColor: '#e11d48', // Vibrant Red-Orange
    memorizerAppUrl: 'https://ais-dev-xeniqwh76n7spkxw2xk4sw-1047076485341.asia-southeast1.run.app',
  },
  bcs_study: {
    id: 'bcs_study',
    name: 'Science Library',
    bengaliName: 'Science Library',
    tagline: 'Seat Booking • 8:00 AM — 10:00 PM',
    bengaliTagline: 'Seat Booking • 8:00 AM — 10:00 PM',
    address: 'Science Lab Crossing, Dhaka',
    bengaliAddress: 'Science Lab Crossing, Dhaka',
    phone: '+880 1711-234567',
    email: 'contact@bcsstudycenter.bd',
    facebookUrl: 'https://facebook.com',
    facebookPageName: 'Follow Facebook',
    facebookFollowers: '48.5K Followers',
    badge: '🧪 Science Library',
    themeColor: '#ea580c',
    memorizerAppUrl: 'https://ais-dev-xeniqwh76n7spkxw2xk4sw-1047076485341.asia-southeast1.run.app',
  },
  fresh_study: {
    id: 'fresh_study',
    name: 'Central Library',
    bengaliName: 'Central Library',
    tagline: 'Seat Booking • 8:00 AM — 10:00 PM',
    bengaliTagline: 'Seat Booking • 8:00 AM — 10:00 PM',
    address: 'Nilkhet, Dhaka',
    bengaliAddress: 'Nilkhet, Dhaka',
    phone: '+880 1812-987654',
    email: 'help@freshstudylibrary.com',
    facebookUrl: 'https://facebook.com',
    facebookPageName: 'Follow Facebook',
    facebookFollowers: '32.1K Followers',
    badge: '📚 Central Library',
    themeColor: '#e11d48',
    memorizerAppUrl: 'https://ais-dev-xeniqwh76n7spkxw2xk4sw-1047076485341.asia-southeast1.run.app',
  },
};

export const INITIAL_ROOMS: Room[] = [
  // Science Library Rooms
  {
    id: 'sci_room_1',
    branchId: 'science_library',
    name: 'Room 1',
    bengaliName: 'Room 1',
    category: 'silent_zone',
    seatPrefix: 'R1',
    capacity: 48,
    description: 'High-speed Wi-Fi and quiet study environment',
    bengaliDescription: 'High-speed Wi-Fi and quiet study environment',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'sci_room_2',
    branchId: 'science_library',
    name: 'Room 2',
    bengaliName: 'Room 2',
    category: 'ac_hall',
    seatPrefix: 'R2',
    capacity: 48,
    description: 'Fully air-conditioned modern study zone',
    bengaliDescription: 'Fully air-conditioned modern study zone',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'sci_room_3',
    branchId: 'science_library',
    name: 'Room 3',
    bengaliName: 'Room 3',
    category: 'female_only',
    seatPrefix: 'R3',
    capacity: 36,
    description: 'Reserved safe and serene environment for female students',
    bengaliDescription: 'Reserved safe and serene environment for female students',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'sci_room_4',
    branchId: 'science_library',
    name: 'Room 4',
    bengaliName: 'Room 4',
    category: 'general',
    seatPrefix: 'R4',
    capacity: 36,
    description: 'General study and note practice hall',
    bengaliDescription: 'General study and note practice hall',
    hasAC: true,
    isSilent: true,
  },

  // Central Library Rooms
  {
    id: 'cen_room_1',
    branchId: 'central_library',
    name: 'Room 1',
    bengaliName: 'Room 1',
    category: 'silent_zone',
    seatPrefix: 'C1',
    capacity: 48,
    description: 'Central Library primary quiet study hall',
    bengaliDescription: 'Central Library primary quiet study hall',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'cen_room_2',
    branchId: 'central_library',
    name: 'Room 2',
    bengaliName: 'Room 2',
    category: 'ac_hall',
    seatPrefix: 'C2',
    capacity: 48,
    description: 'Air-conditioned executive study chamber',
    bengaliDescription: 'Air-conditioned executive study chamber',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'cen_room_3',
    branchId: 'central_library',
    name: 'Room 3',
    bengaliName: 'Room 3',
    category: 'female_only',
    seatPrefix: 'C3',
    capacity: 36,
    description: 'Reserved study zone for female students',
    bengaliDescription: 'Reserved study zone for female students',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'cen_room_4',
    branchId: 'central_library',
    name: 'Room 4',
    bengaliName: 'Room 4',
    category: 'discussion',
    seatPrefix: 'C4',
    capacity: 36,
    description: 'Group discussion and collaborative practice room',
    bengaliDescription: 'Group discussion and collaborative practice room',
    hasAC: true,
    isSilent: false,
  },

  // Fallbacks for bcs_study & fresh_study
  {
    id: 'bcs_room_1',
    branchId: 'bcs_study',
    name: 'Room 1',
    bengaliName: 'Room 1',
    category: 'silent_zone',
    seatPrefix: 'R1',
    capacity: 48,
    description: 'High-speed Wi-Fi and quiet study environment',
    bengaliDescription: 'High-speed Wi-Fi and quiet study environment',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'fresh_room_1',
    branchId: 'fresh_study',
    name: 'Room 1',
    bengaliName: 'Room 1',
    category: 'general',
    seatPrefix: 'FS1',
    capacity: 48,
    description: 'Central study floor',
    bengaliDescription: 'Central study floor',
    hasAC: true,
    isSilent: true,
  },
];

// Dummy accounts removed per user request
export const DEMO_STUDENTS: StudentProfile[] = [];

// Helper to generate initial seats
export function generateInitialSeats(): Seat[] {
  const seats: Seat[] = [];

  INITIAL_ROOMS.forEach((room) => {
    const isFemaleRoom = room.category === 'female_only';

    for (let i = 1; i <= room.capacity; i++) {
      const seatNumber = `${i}`;
      const seatId = `${room.id}_seat_${i}`;

      seats.push({
        id: seatId,
        roomId: room.id,
        branchId: room.branchId,
        seatNumber,
        status: 'available',
        isFemaleReserved: isFemaleRoom,
        isSpecialReserved: false,
      });
    }
  });

  return seats;
}

export const INITIAL_NOTICES: LibraryNotice[] = [
  {
    id: 'notice_1',
    title: 'Daily Auto-Reset Policy & Seat Booking Guidelines',
    bengaliTitle: 'Daily Auto-Reset Policy & Seat Booking Guidelines',
    content: 'All study center seats automatically reset every night at 11:59 PM. Please release your seat when you finish studying.',
    bengaliContent: 'All study center seats automatically reset every night at 11:59 PM. Please release your seat when you finish studying.',
    date: '2026-08-20',
    priority: 'urgent',
    targetBranch: 'all',
    author: 'Library Admin Desk',
  },
  {
    id: 'notice_2',
    title: 'Strict Silence Protocol in Silent Halls & AC Rooms',
    bengaliTitle: 'Strict Silence Protocol in Silent Halls & AC Rooms',
    content: 'Talking aloud or speaking on the phone is strictly prohibited in reading halls. Please keep phones on silent mode.',
    bengaliContent: 'Talking aloud or speaking on the phone is strictly prohibited in reading halls. Please keep phones on silent mode.',
    date: '2026-08-19',
    priority: 'guideline',
    targetBranch: 'all',
    author: 'Administration Desk',
  },
  {
    id: 'notice_3',
    title: 'High-Speed 5G Optical Fiber Wi-Fi Upgrade Completed',
    bengaliTitle: 'High-Speed 5G Optical Fiber Wi-Fi Upgrade Completed',
    content: 'Seamless high-speed optical fiber internet connection is available across all reading halls and rooms.',
    bengaliContent: 'Seamless high-speed optical fiber internet connection is available across all reading halls and rooms.',
    date: '2026-08-15',
    priority: 'info',
    targetBranch: 'all',
    author: 'IT Support Team',
  },
];

