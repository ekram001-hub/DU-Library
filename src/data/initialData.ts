import { BranchConfig, Room, Seat, LibraryNotice, StudentProfile } from '../types';

export const BRANCHES_DATA: Record<string, BranchConfig> = {
  science_library: {
    id: 'science_library',
    name: 'সাইন্স লাইব্রেরি',
    bengaliName: 'সাইন্স লাইব্রেরি',
    tagline: 'সিট বুকিং • সকাল ৮:০০ — রাত ১০:০০',
    bengaliTagline: 'সিট বুকিং • সকাল ৮:০০ — রাত ১০:০০',
    address: 'সাইন্স ল্যাব মোড়, মিরপুর রোড, ঢাকা',
    bengaliAddress: 'সাইন্স ল্যাব মোড়, মিরপুর রোড, ঢাকা',
    phone: '+880 1711-234567',
    email: 'science.library@studycenter.bd',
    facebookUrl: 'https://facebook.com',
    facebookPageName: 'Follow Facebook',
    facebookFollowers: '50K+ Readers',
    badge: '🧪 সাইন্স লাইব্রেরি',
    themeColor: '#ea580c', // Vibrant Orange
    memorizerAppUrl: 'https://ais-dev-xeniqwh76n7spkxw2xk4sw-1047076485341.asia-southeast1.run.app',
  },
  central_library: {
    id: 'central_library',
    name: 'সেন্ট্রাল লাইব্রেরি',
    bengaliName: 'সেন্ট্রাল লাইব্রেরি',
    tagline: 'সিট বুকিং • সকাল ৮:০০ — রাত ১০:০০',
    bengaliTagline: 'সিট বুকিং • সকাল ৮:০০ — রাত ১০:০০',
    address: 'নীলক্ষেত - কাটাবন রোড, ঢাকা',
    bengaliAddress: 'নীলক্ষেত - কাটাবন রোড, ঢাকা',
    phone: '+880 1812-987654',
    email: 'central.library@studycenter.bd',
    facebookUrl: 'https://facebook.com',
    facebookPageName: 'Follow Facebook',
    facebookFollowers: '45K+ Readers',
    badge: '📚 সেন্ট্রাল লাইব্রেরি',
    themeColor: '#e11d48', // Vibrant Red-Orange
    memorizerAppUrl: 'https://ais-dev-xeniqwh76n7spkxw2xk4sw-1047076485341.asia-southeast1.run.app',
  },
  bcs_study: {
    id: 'bcs_study',
    name: 'সাইন্স লাইব্রেরি',
    bengaliName: 'সাইন্স লাইব্রেরি',
    tagline: 'সিট বুকিং • সকাল ৮:০০ — রাত ১০:০০',
    bengaliTagline: 'সিট বুকিং • সকাল ৮:০০ — রাত ১০:০০',
    address: 'সাইন্স ল্যাব মোড়, ঢাকা',
    bengaliAddress: 'সাইন্স ল্যাব মোড়, ঢাকা',
    phone: '+880 1711-234567',
    email: 'contact@bcsstudycenter.bd',
    facebookUrl: 'https://facebook.com',
    facebookPageName: 'Follow Facebook',
    facebookFollowers: '48.5K Followers',
    badge: '🧪 সাইন্স লাইব্রেরি',
    themeColor: '#ea580c',
    memorizerAppUrl: 'https://ais-dev-xeniqwh76n7spkxw2xk4sw-1047076485341.asia-southeast1.run.app',
  },
  fresh_study: {
    id: 'fresh_study',
    name: 'সেন্ট্রাল লাইব্রেরি',
    bengaliName: 'সেন্ট্রাল লাইব্রেরি',
    tagline: 'সিট বুকিং • সকাল ৮:০০ — রাত ১০:০০',
    bengaliTagline: 'সিট বুকিং • সকাল ৮:০০ — রাত ১০:০০',
    address: 'নীলক্ষেত, ঢাকা',
    bengaliAddress: 'নীলক্ষেত, ঢাকা',
    phone: '+880 1812-987654',
    email: 'help@freshstudylibrary.com',
    facebookUrl: 'https://facebook.com',
    facebookPageName: 'Follow Facebook',
    facebookFollowers: '32.1K Followers',
    badge: '📚 সেন্ট্রাল লাইব্রেরি',
    themeColor: '#e11d48',
    memorizerAppUrl: 'https://ais-dev-xeniqwh76n7spkxw2xk4sw-1047076485341.asia-southeast1.run.app',
  },
};

export const INITIAL_ROOMS: Room[] = [
  // Science Library Rooms
  {
    id: 'sci_room_1',
    branchId: 'science_library',
    name: 'রুম ১',
    bengaliName: 'রুম ১',
    category: 'silent_zone',
    seatPrefix: 'R1',
    capacity: 48,
    description: 'উচ্চগতির ওয়াইফাই ও নিরিবিলি পরিবেশ সমৃদ্ধ প্রধান রিডিং রুম',
    bengaliDescription: 'উচ্চগতির ওয়াইফাই ও নিরিবিলি পরিবেশ সমৃদ্ধ প্রধান রিডিং রুম',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'sci_room_2',
    branchId: 'science_library',
    name: 'রুম ২',
    bengaliName: 'রুম ২',
    category: 'ac_hall',
    seatPrefix: 'R2',
    capacity: 48,
    description: 'সম্পূর্ণ শীতাতপ নিয়ন্ত্রিত আধুনিক স্টাডি জোন',
    bengaliDescription: 'সম্পূর্ণ শীতাতপ নিয়ন্ত্রিত আধুনিক স্টাডি জোন',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'sci_room_3',
    branchId: 'science_library',
    name: 'রুম ৩',
    bengaliName: 'রুম ৩',
    category: 'female_only',
    seatPrefix: 'R3',
    capacity: 36,
    description: 'নারী শিক্ষার্থীদের জন্য সংরক্ষিত নিরাপদ ও শান্ত পরিবেশ',
    bengaliDescription: 'নারী শিক্ষার্থীদের জন্য সংরক্ষিত নিরাপদ ও শান্ত পরিবেশ',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'sci_room_4',
    branchId: 'science_library',
    name: 'রুম ৪',
    bengaliName: 'রুম ৪',
    category: 'general',
    seatPrefix: 'R4',
    capacity: 36,
    description: 'জেনারেল স্টাডি ও নোট প্র্যাকটিস এরিয়া',
    bengaliDescription: 'জেনারেল স্টাডি ও নোট প্র্যাকটিস এরিয়া',
    hasAC: true,
    isSilent: true,
  },

  // Central Library Rooms
  {
    id: 'cen_room_1',
    branchId: 'central_library',
    name: 'রুম ১',
    bengaliName: 'রুম ১',
    category: 'silent_zone',
    seatPrefix: 'C1',
    capacity: 48,
    description: 'কেন্দ্রীয় লাইব্রেরির প্রধান স্টাডি হল',
    bengaliDescription: 'কেন্দ্রীয় লাইব্রেরির প্রধান স্টাডি হল',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'cen_room_2',
    branchId: 'central_library',
    name: 'রুম ২',
    bengaliName: 'রুম ২',
    category: 'ac_hall',
    seatPrefix: 'C2',
    capacity: 48,
    description: 'এসি এক্সিকিউটিভ চেম্বার',
    bengaliDescription: 'এসি এক্সিকিউটিভ চেম্বার',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'cen_room_3',
    branchId: 'central_library',
    name: 'রুম ৩',
    bengaliName: 'রুম ৩',
    category: 'female_only',
    seatPrefix: 'C3',
    capacity: 36,
    description: 'মহিলা সংরক্ষিত স্টাডি কর্নার',
    bengaliDescription: 'মহিলা সংরক্ষিত স্টাডি কর্নার',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'cen_room_4',
    branchId: 'central_library',
    name: 'রুম ৪',
    bengaliName: 'রুম ৪',
    category: 'discussion',
    seatPrefix: 'C4',
    capacity: 36,
    description: 'গ্রুপ স্টাডি ও প্র্যাকটিস রুম',
    bengaliDescription: 'গ্রুপ স্টাডি ও প্র্যাকটিস রুম',
    hasAC: true,
    isSilent: false,
  },

  // Fallbacks for bcs_study & fresh_study
  {
    id: 'bcs_room_1',
    branchId: 'bcs_study',
    name: 'রুম ১',
    bengaliName: 'রুম ১',
    category: 'silent_zone',
    seatPrefix: 'R1',
    capacity: 48,
    description: 'উচ্চগতির ওয়াইফাই ও নিরিবিলি পরিবেশ',
    bengaliDescription: 'উচ্চগতির ওয়াইফাই ও নিরিবিলি পরিবেশ',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'fresh_room_1',
    branchId: 'fresh_study',
    name: 'রুম ১',
    bengaliName: 'রুম ১',
    category: 'general',
    seatPrefix: 'FS1',
    capacity: 48,
    description: 'কেন্দ্রীয় স্টাডি ফ্লোর',
    bengaliDescription: 'কেন্দ্রীয় স্টাডি ফ্লোর',
    hasAC: true,
    isSilent: true,
  },
];

export const DEMO_STUDENTS: StudentProfile[] = [
  {
    id: 'stu_demo_1',
    name: 'Ekram Bhuiyan',
    phone: '01712345678',
    email: 'ryanekram001@gmail.com',
    studentId: 'STU-2026',
    gender: 'male',
    role: 'student',
    targetExam: 'BCS & Bank Recruitment',
    institution: 'University of Dhaka',
  },
  {
    id: 'stu_demo_2',
    name: 'Nusrat Jahan',
    phone: '01898765432',
    email: 'nusrat.study@gmail.com',
    studentId: 'FSL-2026-44',
    gender: 'female',
    role: 'student',
    targetExam: 'Combined 9 Bank Officer',
    institution: 'Jahangirnagar University',
  },
  {
    id: 'stu_demo_3',
    name: 'Tanvir Ahmed',
    phone: '01911223344',
    email: 'tanvir.du@yahoo.com',
    studentId: 'BCS-47-1102',
    gender: 'male',
    role: 'student',
    targetExam: '47th BCS Cadre',
    institution: 'University of Dhaka',
  },
];

// Helper to generate initial seats
export function generateInitialSeats(): Seat[] {
  const seats: Seat[] = [];
  const now = Date.now();

  INITIAL_ROOMS.forEach((room) => {
    const isFemaleRoom = room.category === 'female_only';

    for (let i = 1; i <= room.capacity; i++) {
      const seatNumber = `${i}`;
      const seatId = `${room.id}_seat_${i}`;

      let status: Seat['status'] = 'available';
      let occupantName: string | undefined;
      let occupantPhone: string | undefined;
      let studentId: string | undefined;
      let occupantGender: Seat['occupantGender'];
      let bookedAt: number | undefined;
      let expectedLeaveAt: number | undefined;
      let targetDurationHours: number | undefined;
      let awaySince: number | undefined;
      let awayDurationMinutes: number | undefined;
      let awayReason: Seat['awayReason'];
      let passCode: string | undefined;

      seats.push({
        id: seatId,
        roomId: room.id,
        branchId: room.branchId,
        seatNumber,
        status,
        occupantName,
        occupantPhone,
        studentId,
        occupantGender,
        bookedAt,
        expectedLeaveAt,
        targetDurationHours,
        awaySince,
        awayDurationMinutes,
        awayReason,
        isFemaleReserved: isFemaleRoom,
        isSpecialReserved: false,
        passCode,
      });
    }
  });

  return seats;
}

export const INITIAL_NOTICES: LibraryNotice[] = [
  {
    id: 'notice_1',
    title: 'Daily Auto-Reset Policy & Seat Booking Guidelines',
    bengaliTitle: 'দৈনিক অটো-রিসেট ও সিট বুকিং নির্দেশিকা',
    content: 'সকল স্টাডি সেন্টার সিট প্রতিদিন রাত ১১:৫৯ মিনিটে স্বয়ংক্রিয়ভাবে রিসেট হয়। পড়ার শেষে সিট রিলিজ করুন।',
    bengaliContent: 'সকল স্টাডি সেন্টার সিট প্রতিদিন রাত ১১:৫৯ মিনিটে স্বয়ংক্রিয়ভাবে রিসেট হয়। পড়ার শেষে সিট রিলিজ করুন।',
    date: '2026-08-20',
    priority: 'urgent',
    targetBranch: 'all',
    author: 'Library Admin Desk',
  },
  {
    id: 'notice_2',
    title: 'Strict Silence Protocol in Silent Halls & AC Rooms',
    bengaliTitle: 'রিডিং রুমে পিন-ড্রপ নীরবতা বজায় রাখার নিয়মাবলী',
    content: 'রিডিং রুমে কথা বলা বা ফোনে উচ্চস্বরে কথা বলা কঠোরভাবে নিষিদ্ধ। ফোনের রিংগার সাইলেন্ট রাখুন।',
    bengaliContent: 'রিডিং রুমে কথা বলা বা ফোনে উচ্চস্বরে কথা বলা কঠোরভাবে নিষিদ্ধ। ফোনের রিংগার সাইলেন্ট রাখুন।',
    date: '2026-08-19',
    priority: 'guideline',
    targetBranch: 'all',
    author: 'Administration Desk',
  },
  {
    id: 'notice_3',
    title: 'High-Speed 5G Optical Fiber Wi-Fi Upgrade Completed',
    bengaliTitle: 'হাই-স্পিড অপটিক্যাল ফাইবার ওয়াইফাই সংযোগ চালু',
    content: 'লাইব্রেরির প্রতিটি রুমে নিরবচ্ছিন্ন হাই স্পিড ইন্টারনেট সেবা চালু রয়েছে।',
    bengaliContent: 'লাইব্রেরির প্রতিটি রুমে নিরবচ্ছিন্ন হাই স্পিড ইন্টারনেট সেবা চালু রয়েছে।',
    date: '2026-08-15',
    priority: 'info',
    targetBranch: 'all',
    author: 'IT Support Team',
  },
];

