import { BranchConfig, Room, Seat, LibraryNotice, StudentProfile } from '../types';

export const BRANCHES_DATA: Record<string, BranchConfig> = {
  bcs_study: {
    id: 'bcs_study',
    name: 'BCS Study Center',
    bengaliName: 'বিসিএস স্টাডি সেন্টার',
    tagline: 'Premier Dedicated Study Hub for BCS & Govt Job Aspirants',
    bengaliTagline: 'বিসিএস ও সরকারি চাকরির প্রস্তুতি শিক্ষার্থীদের সেরা অধ্যয়ন কেন্দ্র',
    address: 'Nilkhet - Katabon Road, Dhaka-1205 (Opposite Dhaka University)',
    bengaliAddress: 'নীলক্ষেত - কাটাবন রোড, ঢাকা-১২০৫ (ঢাকা বিশ্ববিদ্যালয়ের বিপরীতে)',
    phone: '+880 1711-234567',
    email: 'contact@bcsstudycenter.bd',
    facebookUrl: 'https://facebook.com/BCSStudyCenterOfficial',
    facebookPageName: 'BCS Study Center Official',
    facebookFollowers: '48.5K Followers • Verified Page',
    badge: '🎓 BCS & Govt Job Hub',
    themeColor: '#0284c7', // Sky / Blue
    memorizerAppUrl: 'https://ais-dev-xeniqwh76n7spkxw2xk4sw-1047076485341.asia-southeast1.run.app',
  },
  fresh_study: {
    id: 'fresh_study',
    name: 'Fresh Study Library',
    bengaliName: 'ফ্রেশ স্টাডি লাইব্রেরি',
    tagline: 'Peaceful, Modern & Tech-Enabled 24/7 Smart Study Space',
    bengaliTagline: 'শান্ত, আধুনিক ও নিরিবিলি ২৪/৭ স্মার্ট স্টাডি লাইব্রেরি',
    address: 'Farmgate, Green Road, Tejgaon, Dhaka-1215',
    bengaliAddress: 'ফার্মগেট, গ্রিন রোড, তেজগাঁও, ঢাকা-১২১৫',
    phone: '+880 1812-987654',
    email: 'help@freshstudylibrary.com',
    facebookUrl: 'https://facebook.com/FreshStudyLibraryBD',
    facebookPageName: 'Fresh Study Library BD',
    facebookFollowers: '32.1K Followers • Active Community',
    badge: '📖 Modern Silent Library',
    themeColor: '#059669', // Emerald
    memorizerAppUrl: 'https://ais-dev-xeniqwh76n7spkxw2xk4sw-1047076485341.asia-southeast1.run.app',
  },
};

export const INITIAL_ROOMS: Room[] = [
  // BCS Study Center Rooms
  {
    id: 'bcs_room_1',
    branchId: 'bcs_study',
    name: 'Main Silent Hall (Room 1)',
    bengaliName: 'প্রধান নীরব অধ্যয়ন কক্ষ (রুম ১)',
    category: 'silent_zone',
    seatPrefix: 'A',
    capacity: 20,
    description: 'Pin-drop silence hall with high-speed WiFi, dedicated LED study lamp & individual charging ports.',
    bengaliDescription: 'সম্পূর্ণ নীরব পরিবেশ, দ্রুতগতির ওয়াইফাই, আলাদা চার্জিং পোর্ট ও ব্যক্তিগত রিডিং ল্যাম্প সুবিধা।',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'bcs_room_2',
    branchId: 'bcs_study',
    name: 'AC Premium Reading Room (Room 2)',
    bengaliName: 'এসি প্রিমিয়াম রিডিং রুম (রুম ২)',
    category: 'ac_hall',
    seatPrefix: 'B',
    capacity: 16,
    description: 'Centrally air-conditioned executive study desks with ergonomic high-back chairs.',
    bengaliDescription: 'সেন্ট্রাল এয়ার কন্ডিশনড এক্সিকিউটিভ ডেস্ক এবং আরামদায়ক চেয়ার।',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'bcs_room_3',
    branchId: 'bcs_study',
    name: "Women's Reserved Zone (Room 3)",
    bengaliName: 'মহিলা সংরক্ষিত কর্নার (রুম ৩)',
    category: 'female_only',
    seatPrefix: 'FC',
    capacity: 14,
    description: "Private, safe & quiet dedicated study hall exclusively for female students & aspirants.",
    bengaliDescription: 'নারী শিক্ষার্থীদের জন্য সম্পূর্ণ নিরাপদ, মার্জিত ও সংরক্ষিত অধ্যয়ন ফ্লোর।',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'bcs_room_4',
    branchId: 'bcs_study',
    name: 'Group Discussion & Mock Room (Room 4)',
    bengaliName: 'গ্রুপ ডিসকাশন ও মক টেস্ট রুম (রুম ৪)',
    category: 'discussion',
    seatPrefix: 'D',
    capacity: 12,
    description: 'Sound-isolated room for collective problem solving, viva practice & mock test discussions.',
    bengaliDescription: 'বিসিএস ভাইভা প্র্যাকটিস, গ্রুপ ডিসকাশন ও আলোচনার জন্য বিশেষ কক্ষ।',
    hasAC: true,
    isSilent: false,
  },

  // Fresh Study Library Rooms
  {
    id: 'fresh_room_1',
    branchId: 'fresh_study',
    name: 'Central Study Floor (Hall A)',
    bengaliName: 'কেন্দ্রীয় অধ্যয়ন ফ্লোর (হল এ)',
    category: 'general',
    seatPrefix: 'FS-A',
    capacity: 18,
    description: 'Spacious study hall with wide wooden cubicles, filtered water & continuous power backup.',
    bengaliDescription: 'প্রশস্ত কাঠের কিউবিকল, ফিল্টার্ড পানির সুবিধা এবং নিরবচ্ছিন্ন বিদ্যুৎ ব্যাকআপ।',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'fresh_room_2',
    branchId: 'fresh_study',
    name: 'Executive AC Chamber (Hall B)',
    bengaliName: 'এক্সিকিউটিভ এসি চেম্বার (হল বি)',
    category: 'ac_hall',
    seatPrefix: 'FS-B',
    capacity: 14,
    description: 'Chilled ambient room designed for deep concentration with noise isolation.',
    bengaliDescription: 'গভীর মনোযোগ ও নিরবচ্ছিন্ন স্টাডির জন্য তৈরি সাউন্ড-আইসোলেটেড চেম্বার।',
    hasAC: true,
    isSilent: true,
  },
  {
    id: 'fresh_room_3',
    branchId: 'fresh_study',
    name: "Women's Comfort Zone (Hall C)",
    bengaliName: 'মহিলা কমফোর্ট জোন (হল সি)',
    category: 'female_only',
    seatPrefix: 'FS-W',
    capacity: 12,
    description: "Dedicated peaceful area reserved strictly for female readers & job candidates.",
    bengaliDescription: 'মহিলা প্রার্থীদের জন্য সংরক্ষিত শান্ত পরিবেশ ও নিরিবিলি সিট ব্যবস্থা।',
    hasAC: true,
    isSilent: true,
  },
];

export const DEMO_STUDENTS: StudentProfile[] = [
  {
    id: 'stu_demo_1',
    name: 'Tanvir Ahmed',
    phone: '01712345678',
    email: 'tanvir.bcs@gmail.com',
    studentId: 'BCS-47-8910',
    gender: 'male',
    role: 'student',
    targetExam: '47th BCS Cadre & Bangladesh Bank AD',
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
    targetExam: 'Combined 9 Bank Officer & 46th BCS Written',
    institution: 'Jahangirnagar University',
  },
  {
    id: 'stu_demo_3',
    name: 'Mahmudul Hasan',
    phone: '01911223344',
    email: 'mahmud.du@yahoo.com',
    studentId: 'BCS-47-1102',
    gender: 'male',
    role: 'student',
    targetExam: '47th BCS & BPSC Non-Cadre',
    institution: 'Rajshahi University',
  },
];

// Helper to generate initial seats
export function generateInitialSeats(): Seat[] {
  const seats: Seat[] = [];
  const now = Date.now();

  INITIAL_ROOMS.forEach((room) => {
    const isFemaleRoom = room.category === 'female_only';

    for (let i = 1; i <= room.capacity; i++) {
      const seatNumPadded = i < 10 ? `0${i}` : `${i}`;
      const seatNumber = `${room.seatPrefix}-${seatNumPadded}`;
      const seatId = `${room.id}_seat_${i}`;

      // Create realistic initial states:
      // In Room 1: A-01 to A-04 occupied, A-05 away, A-06 onwards available
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

      if (room.id === 'bcs_room_1') {
        if (i === 1) {
          status = 'occupied';
          occupantName = 'Saiful Islam';
          occupantPhone = '01715******';
          studentId = 'BCS-47-101';
          occupantGender = 'male';
          bookedAt = now - 2.5 * 3600 * 1000; // 2.5 hours ago
          targetDurationHours = 6;
          expectedLeaveAt = bookedAt + 6 * 3600 * 1000;
          passCode = 'PASS-BCS-08191';
        } else if (i === 2) {
          status = 'occupied';
          occupantName = 'Arifur Rahman';
          occupantPhone = '01822******';
          studentId = 'BCS-47-102';
          occupantGender = 'male';
          bookedAt = now - 1.2 * 3600 * 1000;
          targetDurationHours = 4;
          expectedLeaveAt = bookedAt + 4 * 3600 * 1000;
          passCode = 'PASS-BCS-08192';
        } else if (i === 3) {
          status = 'away';
          occupantName = 'Kamrul Hasan';
          occupantPhone = '01933******';
          studentId = 'BCS-47-103';
          occupantGender = 'male';
          bookedAt = now - 3 * 3600 * 1000;
          targetDurationHours = 8;
          expectedLeaveAt = bookedAt + 8 * 3600 * 1000;
          awaySince = now - 8 * 60 * 1000; // 8 mins ago
          awayDurationMinutes = 30; // 30 min break
          awayReason = 'Prayer';
          passCode = 'PASS-BCS-08193';
        } else if (i === 4) {
          status = 'occupied';
          occupantName = 'Mehedi Hasan';
          occupantPhone = '01644******';
          studentId = 'BCS-47-104';
          occupantGender = 'male';
          bookedAt = now - 45 * 60 * 1000;
          targetDurationHours = 4;
          expectedLeaveAt = bookedAt + 4 * 3600 * 1000;
          passCode = 'PASS-BCS-08194';
        }
      } else if (room.id === 'bcs_room_2') {
        if (i === 1) {
          status = 'occupied';
          occupantName = 'Zubair Hossain';
          occupantPhone = '01511******';
          studentId = 'BCS-47-201';
          occupantGender = 'male';
          bookedAt = now - 1.5 * 3600 * 1000;
          targetDurationHours = 6;
          expectedLeaveAt = bookedAt + 6 * 3600 * 1000;
          passCode = 'PASS-BCS-08201';
        } else if (i === 2) {
          status = 'away';
          occupantName = 'Rakib Chowdhury';
          occupantPhone = '01788******';
          studentId = 'BCS-47-202';
          occupantGender = 'male';
          bookedAt = now - 2 * 3600 * 1000;
          targetDurationHours = 5;
          expectedLeaveAt = bookedAt + 5 * 3600 * 1000;
          awaySince = now - 12 * 60 * 1000;
          awayDurationMinutes = 45;
          awayReason = 'Lunch';
          passCode = 'PASS-BCS-08202';
        }
      } else if (room.id === 'bcs_room_3') {
        // Female zone
        if (i === 1) {
          status = 'occupied';
          occupantName = 'Farhana Akter';
          occupantPhone = '01877******';
          studentId = 'BCS-47-301';
          occupantGender = 'female';
          bookedAt = now - 2 * 3600 * 1000;
          targetDurationHours = 6;
          expectedLeaveAt = bookedAt + 6 * 3600 * 1000;
          passCode = 'PASS-BCS-08301';
        } else if (i === 2) {
          status = 'occupied';
          occupantName = 'Sumaiya Binte Islam';
          occupantPhone = '01966******';
          studentId = 'BCS-47-302';
          occupantGender = 'female';
          bookedAt = now - 1 * 3600 * 1000;
          targetDurationHours = 4;
          expectedLeaveAt = bookedAt + 4 * 3600 * 1000;
          passCode = 'PASS-BCS-08302';
        } else if (i === 3) {
          status = 'away';
          occupantName = 'Tasnim Sultana';
          occupantPhone = '01755******';
          studentId = 'BCS-47-303';
          occupantGender = 'female';
          bookedAt = now - 2.5 * 3600 * 1000;
          targetDurationHours = 6;
          expectedLeaveAt = bookedAt + 6 * 3600 * 1000;
          awaySince = now - 5 * 60 * 1000;
          awayDurationMinutes = 20;
          awayReason = 'Prayer';
          passCode = 'PASS-BCS-08303';
        }
      } else if (room.id === 'fresh_room_1') {
        if (i === 1) {
          status = 'occupied';
          occupantName = 'Ashraful Haque';
          occupantPhone = '01811******';
          studentId = 'FSL-2026-101';
          occupantGender = 'male';
          bookedAt = now - 3 * 3600 * 1000;
          targetDurationHours = 8;
          expectedLeaveAt = bookedAt + 8 * 3600 * 1000;
          passCode = 'PASS-FSL-09101';
        } else if (i === 2) {
          status = 'away';
          occupantName = 'Nazmul Huda';
          occupantPhone = '01722******';
          studentId = 'FSL-2026-102';
          occupantGender = 'male';
          bookedAt = now - 1.8 * 3600 * 1000;
          targetDurationHours = 5;
          expectedLeaveAt = bookedAt + 5 * 3600 * 1000;
          awaySince = now - 10 * 60 * 1000;
          awayDurationMinutes = 30;
          awayReason = 'Tea';
          passCode = 'PASS-FSL-09102';
        }
      } else if (room.id === 'fresh_room_3') {
        if (i === 1) {
          status = 'occupied';
          occupantName = 'Sadia Afrin';
          occupantPhone = '01944******';
          studentId = 'FSL-2026-301';
          occupantGender = 'female';
          bookedAt = now - 2 * 3600 * 1000;
          targetDurationHours = 6;
          expectedLeaveAt = bookedAt + 6 * 3600 * 1000;
          passCode = 'PASS-FSL-09301';
        }
      }

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
    bengaliTitle: 'দৈনিক অটো-রিসেট পলিসি ও সিট বুকিং সংক্রান্ত বিশেষ নির্দেশনা',
    content: 'All study center seats are cleared nightly at 11:59 PM to ensure fair access for morning learners. Please release your seat whenever leaving permanently.',
    bengaliContent: 'প্রতিদিন রাত ১১:৫৯ মিনিটে সকল সিট স্বয়ংক্রিয়ভাবে রিসেট হয় যাতে সকালের শিক্ষার্থীরা নতুন করে সিট বুক করতে পারেন। লাইব্রেরি ত্যাগের সময় অবশ্যই সিট রিলিজ করুন।',
    date: '2026-08-20',
    priority: 'urgent',
    targetBranch: 'all',
    author: 'Chief Librarian',
  },
  {
    id: 'notice_2',
    title: 'Strict Silence Protocol in Silent Halls & AC Rooms',
    bengaliTitle: 'সাইলেন্ট হল ও এসি রুমে মোবাইল সাইলেন্ট ও নীরবতা বজায় রাখুন',
    content: 'Phone calls and whisper conversations are strictly prohibited inside Silent Rooms (A & B halls). Use the cafeteria/lounge for urgent calls.',
    bengaliContent: 'নীরব অধ্যয়ন কক্ষে ও এসি হলে মোবাইল ফোন বাধ্যতামূলক সাইলেন্ট রাখুন। ফোনে কথা বলার জন্য লাউঞ্জ বা করিডোর ব্যবহার করুন।',
    date: '2026-08-19',
    priority: 'guideline',
    targetBranch: 'all',
    author: 'Administration Desk',
  },
  {
    id: 'notice_3',
    title: '47th BCS Preliminary Special Mock Test Series Schedule',
    bengaliTitle: '৪৭তম বিসিএস প্রিলিমিনারি স্পেশাল মক টেস্ট শিডিউল',
    content: 'Mock tests will be held every Friday and Monday at Room 4 (Discussion Corner). Registered members can book discussion seats.',
    bengaliContent: 'প্রতি শুক্র ও সোমবার রুম ৪-এ বিসিএস মডেল টেস্ট ও স্পেশাল ভাইভা মক সেশন অনুষ্ঠিত হবে।',
    date: '2026-08-18',
    priority: 'info',
    targetBranch: 'bcs_study',
    author: 'BCS Exam Committee',
  },
  {
    id: 'notice_4',
    title: "High-Speed 5G Optical Fiber Wi-Fi Upgrade Completed",
    bengaliTitle: 'উচ্চগতির ৫জি অপটিক্যাল ফাইবার ওয়াইফাই সংযোগ সচল',
    content: 'High-speed seamless internet is now active with backup ISP. Check the notice board for latest Wi-Fi password.',
    bengaliContent: 'নিরবচ্ছিন্ন পড়াশোনার স্বার্থে হাই-স্পিড অপটিক্যাল ফাইবার সংযোগ আপগ্রেড করা হয়েছে। পাসওয়ার্ড নোটিশ বোর্ডে দেওয়া আছে।',
    date: '2026-08-15',
    priority: 'info',
    targetBranch: 'fresh_study',
    author: 'IT Support Team',
  },
];
