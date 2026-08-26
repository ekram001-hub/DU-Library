import { BranchConfig, Room, Seat, LibraryNotice, StudentProfile, LibraryRule, WifiFacilityConfig } from '../types';

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
};

export const INITIAL_ROOMS: Room[] = [
  // Science Library Rooms (Total: 168 Seats)
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

  // Central Library Rooms (Total: 168 Seats)
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

export const INITIAL_RULES: LibraryRule[] = [
  {
    id: 'rule_1',
    category: 'silence',
    icon: 'volume-x',
    title: 'Absolute Silence & Phone Etiquette (নীরবতা ও ফোন সাইলেন্ট)',
    bengaliTitle: 'সম্পূর্ণ নীরবতা ও ফোন সাইলেন্ট নীতিমালা',
    description: 'Mobile phones must strictly be set to silent or vibration mode inside study chambers. Whispering, phone calls, or audible alarms are strictly prohibited. Use the common lounge for urgent calls.',
    bengaliDescription: 'স্টাডি হলে সবসময় মোবাইল ফোন সাইলেন্ট বা ভাইব্রেশন মোডে রাখুন। হলে কথা বলা, ফিসফিস করা বা জোরে শব্দ করা সম্পূর্ণ নিষিদ্ধ। জরুরি প্রয়োজনে লাউঞ্জে যান।',
  },
  {
    id: 'rule_2',
    category: 'away',
    icon: 'clock',
    title: 'Away Timer & Break Seat Policy (বিরতি টাইমার ও সিট নীতি)',
    bengaliTitle: 'বিরতি টাইমার ও সিট নীতি',
    description: 'Always activate the Away Timer when stepping out for prayers, meals, or short breaks (15-60 mins). Break seats show Orange with a live timer. Other students can secondary-book an orange seat (turns Blue) during your break. When you leave for the day, please click "Release Seat".',
    bengaliDescription: 'নামাজ, খাবার বা চা বিরতিতে যাওয়ার সময় অ্যাপে "Take Break" চাপুন (সিট কমলা ও টাইমার দেখাবে)। বিরতিকালীন সময়ে অন্য কেউ চাইলে সেকেন্ডারি বুকিং (নীল রঙ) নিতে পারে। দিনশেষে অবশ্যই "Release Seat" চাপুন।',
  },
  {
    id: 'rule_3',
    category: 'female',
    icon: 'heart',
    title: 'Female-Reserved Zone (মহিলা শিক্ষার্থীদের সংরক্ষিত এলাকা)',
    bengaliTitle: 'মহিলা শিক্ষার্থীদের সংরক্ষিত কর্নার',
    description: 'Dedicated female sections are strictly reserved for female students to ensure utmost safety, privacy, and a comfortable study environment.',
    bengaliDescription: 'মহিলা কর্নারের আসনগুলো শুধুমাত্র নারী শিক্ষার্থীদের পড়ার জন্য সংরক্ষিত। এতে পূর্ণ নিরাপত্তা ও শান্ত পরিবেশ বজায় থাকে।',
  },
  {
    id: 'rule_4',
    category: 'cleanliness',
    icon: 'lock',
    title: 'Personal Belongings & Desk Cleanliness (টেবিল পরিচ্ছন্নতা ও মালামাল)',
    bengaliTitle: 'টেবিল পরিচ্ছন্নতা ও মালামালের নিরাপত্তা',
    description: 'Keep your study desk neat and tidy. Food waste must be placed in designated lounge bins. The study center maintains 24/7 CCTV surveillance for security.',
    bengaliDescription: 'পড়ার টেবিল সবসময় পরিষ্কার রাখুন। খাবারের প্যাকেট বা ময়লা লাউঞ্জের ডাস্টবিনে ফেলুন। পুরো স্টাডি সেন্টার সার্বক্ষণিক সিসিটিভি ক্যামেরার আওতাধীন।',
  },
  {
    id: 'rule_5',
    category: 'general',
    icon: 'shield',
    title: 'Fair Usage & Library Pass Code (সততা ও পাসকোড যাচাই)',
    bengaliTitle: 'সততা ও পাসকোড যাচাই',
    description: 'Ensure you check in with your registered phone number and PIN. Admins and supervisors may verify digital library passes during routine inspection.',
    bengaliDescription: 'আপনার রেজিস্টার্ড মোবাইল নম্বর ও পিন দিয়ে সিট বুক করুন। দায়িত্বপ্রাপ্ত কর্মকর্তা যে কোনো সময় আপনার ডিজিটাল পাসকোড যাচাই করতে পারেন।',
  },
];

export const INITIAL_WIFI_CONFIGS: Record<string, WifiFacilityConfig> = {
  science_library: {
    branchId: 'science_library',
    ssid: 'SCIENCE_LIB_5G_FAST',
    password: 'study@2026#pass',
    speed: '100 Mbps Optical Fiber (Dual-Band 5G)',
    notes: 'Optimized for online video lectures, BCS research, and e-learning portals.',
    amenities: [
      'Individual desk LED lamps and power sockets',
      'Filtered hot, cold, and ambient drinking water',
      'Quiet prayer room with ablution facility',
      'Coffee, tea, and refreshment lounge',
      '24/7 IPS and generator power backup',
      'High-speed dual-band 5G Wi-Fi zone',
      'Ergonomic cushioned study chairs',
    ],
    helpdeskPhone: '+880 1711-234567',
  },
  central_library: {
    branchId: 'central_library',
    ssid: 'CENTRAL_LIB_5G_PLUS',
    password: 'study@2026#pass',
    speed: '150 Mbps Dedicated Optical Fiber',
    notes: 'Optimized for high-speed study material downloads and quiet research.',
    amenities: [
      'Individual dedicated power sockets at all seats',
      'Continuous RO-purified drinking water',
      'Separate prayer zone with wudu area',
      'Lounge & discussion area',
      '24/7 instant generator power backup',
      'High-speed uninterrupted optical fiber Wi-Fi',
      'Soundproof air-conditioned reading halls',
    ],
    helpdeskPhone: '+880 1812-987654',
  },
};

