import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Armchair,
  Layers,
  Settings,
  RefreshCw,
  Download,
  AlertTriangle,
  RotateCcw,
  Users,
  Facebook,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  FileText,
  BarChart3,
  Sliders,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Room, RoomCategory, Gender, BranchId } from '../types';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentBranchId,
    branchConfig,
    allBranches,
    updateBranchConfig,
    branchRooms,
    branchSeats,
    addRoom,
    updateRoom,
    deleteRoom,
    adminForceReleaseSeat,
    adminToggleMaintenance,
    adminManuallyAssignSeat,
    triggerDailyAutoReset,
    resetToDefaultData,
    attendanceRecords,
    branchStats,
    overallStats,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'rooms' | 'seats' | 'attendance' | 'settings'>('rooms');

  // Room Form State (Add / Edit)
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomBengaliName, setRoomBengaliName] = useState('');
  const [roomCategory, setRoomCategory] = useState<RoomCategory>('general');
  const [roomPrefix, setRoomPrefix] = useState('R');
  const [roomCapacity, setRoomCapacity] = useState<number>(16);
  const [roomDesc, setRoomDesc] = useState('');
  const [roomHasAC, setRoomHasAC] = useState(true);
  const [roomIsSilent, setRoomIsSilent] = useState(true);

  // Manual Seat Assign State
  const [assignSeatId, setAssignSeatId] = useState('');
  const [assignName, setAssignName] = useState('');
  const [assignPhone, setAssignPhone] = useState('');
  const [assignGender, setAssignGender] = useState<Gender>('male');
  const [assignHours, setAssignHours] = useState<number>(4);

  // Branch Settings State
  const [fbUrl, setFbUrl] = useState(branchConfig.facebookUrl);
  const [fbPageName, setFbPageName] = useState(branchConfig.facebookPageName);
  const [fbFollowers, setFbFollowers] = useState(branchConfig.facebookFollowers);
  const [phoneContact, setPhoneContact] = useState(branchConfig.phone);
  const [memoUrl, setMemoUrl] = useState(branchConfig.memorizerAppUrl);
  const [settingsSaved, setSettingsSaved] = useState(false);

  if (!isOpen) return null;

  // Handle Room Create / Update
  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !roomBengaliName.trim()) return;

    if (editingRoomId) {
      updateRoom(editingRoomId, {
        name: roomName.trim(),
        bengaliName: roomBengaliName.trim(),
        category: roomCategory,
        seatPrefix: roomPrefix.trim(),
        capacity: Number(roomCapacity),
        description: roomDesc.trim() || 'Study Hall equipped with high speed WiFi.',
        bengaliDescription: roomDesc.trim() || 'শান্ত ও সুসজ্জিত অধ্যয়ন কক্ষ।',
        hasAC: roomHasAC,
        isSilent: roomIsSilent,
      });
      setEditingRoomId(null);
    } else {
      addRoom({
        branchId: currentBranchId,
        name: roomName.trim(),
        bengaliName: roomBengaliName.trim(),
        category: roomCategory,
        seatPrefix: roomPrefix.trim(),
        capacity: Number(roomCapacity),
        description: roomDesc.trim() || 'Study Hall equipped with high speed WiFi.',
        bengaliDescription: roomDesc.trim() || 'শান্ত ও সুসজ্জিত অধ্যয়ন কক্ষ।',
        hasAC: roomHasAC,
        isSilent: roomIsSilent,
      });
      setIsAddingRoom(false);
    }

    // Reset Form
    setRoomName('');
    setRoomBengaliName('');
    setRoomPrefix('R');
    setRoomCapacity(16);
    setRoomDesc('');
  };

  const startEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setRoomName(room.name);
    setRoomBengaliName(room.bengaliName);
    setRoomCategory(room.category);
    setRoomPrefix(room.seatPrefix);
    setRoomCapacity(room.capacity);
    setRoomDesc(room.bengaliDescription);
    setRoomHasAC(room.hasAC);
    setRoomIsSilent(room.isSilent);
    setIsAddingRoom(true);
  };

  // Handle Manual Assign
  const handleManualAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSeatId || !assignName.trim() || !assignPhone.trim()) return;

    adminManuallyAssignSeat(assignSeatId, assignName.trim(), assignPhone.trim(), assignHours, assignGender);
    setAssignSeatId('');
    setAssignName('');
    setAssignPhone('');
    alert('শিক্ষার্থীকে সফলভাবে সিটে নিযুক্ত করা হয়েছে!');
  };

  // Handle Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranchConfig(currentBranchId, {
      facebookUrl: fbUrl,
      facebookPageName: fbPageName,
      facebookFollowers: fbFollowers,
      phone: phoneContact,
      memorizerAppUrl: memoUrl,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Export Attendance to CSV
  const handleExportAttendance = () => {
    const headers = ['ID', 'Branch', 'Student Name', 'Student ID', 'Phone', 'Seat Number', 'Room Name', 'Date', 'Pass Code'];
    const rows = attendanceRecords.map((a) => [
      a.id,
      a.branchName,
      `"${a.studentName}"`,
      a.studentId,
      a.studentPhone,
      a.seatNumber,
      `"${a.roomName}"`,
      a.dateStr,
      a.passCode,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `study_center_attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-b border-rose-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  অ্যাডমিন কন্ট্রোল সেন্টার ও সিস্টেম কনফিগারেশন
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  MASTER ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {branchConfig.bengaliName} • Capacity, Rooms & Override Tools
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-1.5 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'rooms'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>রুম ও ক্যাপাসিটি ব্যবস্থাপনা ({branchRooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('seats')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'seats'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>সিট কন্ট্রোল ও মেরামত</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'attendance'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>অ্যাটেনডেন্স ও হিস্ট্রি ({attendanceRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>সোশ্যাল লিঙ্ক ও সিস্টেম রিসেট</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-300 scrollbar-thin">
          {/* TAB 1: Room Management */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">
                    স্টাডি রুম তালিকা ও আসন সংখ্যা
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    রুম যোগ করুন, ধারণক্ষমতা ও সিরিয়াল প্রেফিক্স পরিবর্তন করুন
                  </p>
                </div>

                {!isAddingRoom && (
                  <button
                    onClick={() => {
                      setEditingRoomId(null);
                      setRoomName('');
                      setRoomBengaliName('');
                      setRoomPrefix('R');
                      setRoomCapacity(16);
                      setIsAddingRoom(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>নতুন রুম যোগ করুন</span>
                  </button>
                )}
              </div>

              {/* Add / Edit Room Form Card */}
              {isAddingRoom && (
                <form
                  onSubmit={handleSaveRoom}
                  className="bg-slate-950/90 rounded-xl border border-sky-500/40 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-sky-400">
                      {editingRoomId ? 'রুম তথ্য সম্পাদনা (Edit Room)' : 'নতুন স্টাডি রুম তৈরি করুন'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingRoom(false)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        রুমের নাম (বাংলায়)*
                      </label>
                      <input
                        type="text"
                        required
                        value={roomBengaliName}
                        onChange={(e) => setRoomBengaliName(e.target.value)}
                        placeholder="যেমন: এক্সিকিউটিভ এসি হল ৩"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Room Name (English)*
                      </label>
                      <input
                        type="text"
                        required
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="e.g., Executive AC Hall 3"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        ক্যাটাগরি / ধরন
                      </label>
                      <select
                        value={roomCategory}
                        onChange={(e) => setRoomCategory(e.target.value as RoomCategory)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                      >
                        <option value="general">সাধারণ স্টাডি হল (General)</option>
                        <option value="female_only">🌸 মহিলা সংরক্ষিত (Female Only)</option>
                        <option value="ac_hall">❄️ এয়ার কন্ডিশন্ড হল (AC Hall)</option>
                        <option value="silent_zone">🤫 পিন-ড্রপ নীরব জোন (Silent Zone)</option>
                        <option value="discussion">👥 গ্রুপ ডিসকাশন ও মক কর্নার</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          সিট প্রেফিক্স (Prefix)
                        </label>
                        <input
                          type="text"
                          required
                          value={roomPrefix}
                          onChange={(e) => setRoomPrefix(e.target.value)}
                          placeholder="A, B, FC"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          ধারণক্ষমতা (Capacity)
                        </label>
                        <input
                          type="number"
                          required
                          min={2}
                          max={60}
                          value={roomCapacity}
                          onChange={(e) => setRoomCapacity(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roomHasAC}
                        onChange={(e) => setRoomHasAC(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-sky-600 focus:ring-0"
                      />
                      <span>❄️ এসি সুবিধা আছে</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roomIsSilent}
                        onChange={(e) => setRoomIsSilent(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-sky-600 focus:ring-0"
                      />
                      <span>🤫 নীরব এলাকা (Silent Zone)</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddingRoom(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold"
                    >
                      {editingRoomId ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                    </button>
                  </div>
                </form>
              )}

              {/* Rooms List Table */}
              <div className="space-y-2">
                {branchRooms.map((room) => {
                  const roomSeats = branchSeats.filter((s) => s.roomId === room.id);
                  const occCount = roomSeats.filter((s) => s.status === 'occupied' || s.status === 'away').length;

                  return (
                    <div
                      key={room.id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">
                            {room.bengaliName}
                          </span>
                          <span className="text-slate-500">({room.name})</span>
                          {room.category === 'female_only' && (
                            <span className="px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 text-[10px] font-bold">
                              মহিলা সংরক্ষিত
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                          <span>
                            প্রেফিক্স: <strong className="text-sky-400 font-mono">{room.seatPrefix}-XX</strong>
                          </span>
                          <span>•</span>
                          <span>
                            মোট সিট: <strong className="text-white font-mono">{room.capacity}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            বর্তমান অকুপেন্সি: <strong className="text-emerald-400 font-mono">{occCount}/{roomSeats.length}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => startEditRoom(room)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="সম্পাদনা করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`আপনি কি নিশ্চিতভাবে "${room.bengaliName}" এবং এর অন্তর্ভুক্ত সকল সিট ডিলিট করতে চান?`)) {
                              deleteRoom(room.id);
                            }
                          }}
                          className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300"
                          title="রুম ডিলিট করুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Seat Control & Maintenance */}
          {activeTab === 'seats' && (
            <div className="space-y-4">
              {/* Manual Assign Section */}
              <form
                onSubmit={handleManualAssign}
                className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3"
              >
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <Armchair className="w-4 h-4 text-emerald-400" />
                  <span>ম্যানুয়ালি কোনো শিক্ষার্থীকে সরাসরি সিট বরাদ্দ করুন:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">সিট নির্বাচন</label>
                    <select
                      value={assignSeatId}
                      onChange={(e) => setAssignSeatId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
                    >
                      <option value="">-- ফাঁকা সিট নির্বাচন করুন --</option>
                      {branchSeats
                        .filter((s) => s.status === 'available')
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.seatNumber} ({s.isFemaleReserved ? 'মহিলা' : 'সাধারণ'})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">শিক্ষার্থীর নাম</label>
                    <input
                      type="text"
                      required
                      placeholder="নাম লিখুন"
                      value={assignName}
                      onChange={(e) => setAssignName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">মোবাইল</label>
                    <input
                      type="tel"
                      required
                      placeholder="017xxxxxxxx"
                      value={assignPhone}
                      onChange={(e) => setAssignPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!assignSeatId}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-40"
                    >
                      সিট এসাইন করুন
                    </button>
                  </div>
                </div>
              </form>

              {/* Occupied Seats Table with Force Release Button */}
              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-2">
                  সকল সক্রিয় বুকিং তালিকা ({branchSeats.filter((s) => s.status === 'occupied' || s.status === 'away').length})
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">সিট</th>
                        <th className="p-2.5">শিক্ষার্থীর নাম</th>
                        <th className="p-2.5">ফোন নম্বর</th>
                        <th className="p-2.5">স্ট্যাটাস</th>
                        <th className="p-2.5">প্রবেশ সময়</th>
                        <th className="p-2.5 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {branchSeats
                        .filter((s) => s.status === 'occupied' || s.status === 'away')
                        .map((seat) => (
                          <tr key={seat.id} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold font-mono text-sky-400">
                              {seat.seatNumber}
                            </td>
                            <td className="p-2.5 text-slate-200 font-medium">
                              {seat.occupantName}
                            </td>
                            <td className="p-2.5 font-mono text-slate-400">
                              {seat.occupantPhone}
                            </td>
                            <td className="p-2.5">
                              {seat.status === 'away' ? (
                                <span className="text-amber-400 font-bold">বিরতিতে</span>
                              ) : (
                                <span className="text-emerald-400 font-medium">অধ্যয়নরত</span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-slate-400">
                              {seat.bookedAt
                                ? new Date(seat.bookedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'N/A'}
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => {
                                  if (window.confirm(`সিট ${seat.seatNumber} জোরপূর্বক ফাঁকা করতে চান?`)) {
                                    adminForceReleaseSeat(seat.id);
                                  }
                                }}
                                className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold text-[10px]"
                              >
                                ফাঁকা করুন
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Attendance History */}
          {activeTab === 'attendance' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">
                    দৈনিক উপস্থিতি ও লগ রেকর্ড (Attendance Logs)
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    আজকের মোট উপস্থিতি ও সম্পন্ন হওয়া স্টাডি সেশন হিস্ট্রি
                  </p>
                </div>

                <button
                  onClick={handleExportAttendance}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs border border-slate-700 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">তারিখ</th>
                      <th className="p-2.5">শিক্ষার্থী</th>
                      <th className="p-2.5">মোবাইল</th>
                      <th className="p-2.5">রুম ও সিট</th>
                      <th className="p-2.5">প্রবেশ সময়</th>
                      <th className="p-2.5">টোকেন পাসকোড</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
                    {attendanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 text-slate-400">{record.dateStr}</td>
                        <td className="p-2.5 font-sans font-semibold text-slate-200">
                          {record.studentName}
                        </td>
                        <td className="p-2.5 text-slate-400">{record.studentPhone}</td>
                        <td className="p-2.5 text-sky-300">
                          {record.seatNumber} ({record.roomName.split('(')[0]})
                        </td>
                        <td className="p-2.5 text-emerald-400 font-sans">
                          {new Date(record.checkInTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-2.5 text-slate-400">{record.passCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Settings & System Reset */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Branch Config Form */}
              <form
                onSubmit={handleSaveSettings}
                className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3"
              >
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-blue-400" />
                  <span>অফিসিয়াল সোশ্যাল পেজ ও অ্যাপ লিংক কনফিগারেশন:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Official Facebook Page URL
                    </label>
                    <input
                      type="url"
                      required
                      value={fbUrl}
                      onChange={(e) => setFbUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Facebook Page Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fbPageName}
                      onChange={(e) => setFbPageName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Followers Badge Text
                    </label>
                    <input
                      type="text"
                      value={fbFollowers}
                      onChange={(e) => setFbFollowers(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Memorizer Learning App URL
                    </label>
                    <input
                      type="url"
                      value={memoUrl}
                      onChange={(e) => setMemoUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  {settingsSaved && (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      সেটিংস সংরক্ষিত হয়েছে!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="ml-auto px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
                  >
                    লিঙ্ক আপডেট করুন
                  </button>
                </div>
              </form>

              {/* Maintenance Tools Card */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-rose-500/30 space-y-3">
                <div className="font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>সিস্টেম অটো-রিসেট ও ডেটা ম্যানেজমেন্ট:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                    <div className="font-semibold text-slate-200 text-xs">
                      🌙 দৈনিক নাইট অটো-রিসেট (Nightly Auto-Reset)
                    </div>
                    <p className="text-[11px] text-slate-400">
                      পরবর্তী দিনের জন্য সমস্ত বুকড ও বিরতিতে থাকা সিটগুলো তাৎক্ষণিকভাবে রিলিজ করুন।
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('আপনি কি আজকের সমস্ত সিট রিসেট করে ফাঁকা করতে চান?')) {
                          triggerDailyAutoReset();
                          alert('সমস্ত সিট সফলভাবে ফাঁকা করা হয়েছে!');
                        }
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 font-bold text-xs border border-amber-500/30"
                    >
                      এখনই অটো-রিসেট কার্যকর করুন
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                    <div className="font-semibold text-slate-200 text-xs">
                      🔄 সম্পূর্ণ ফ্রেশ ডেমো ডেটা রিস্টোর
                    </div>
                    <p className="text-[11px] text-slate-400">
                      অ্যাপের সকল কাস্টম ডেটা ও পরিবর্তন মুছে প্রাথমিক অবস্থায় ফিরিয়ে আনুন।
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('সতর্কতা: এটি ব্রাউজারের সকল কাস্টম ডেটা মুছে প্রাথমিক ডেমো ডেটা লোড করবে। নিশ্চিত?')) {
                          resetToDefaultData();
                          alert('সিস্টেম রিসেট সম্পন্ন হয়েছে!');
                        }
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold text-xs border border-rose-500/30"
                    >
                      ফ্যাক্টরি রিসেট করুন
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
