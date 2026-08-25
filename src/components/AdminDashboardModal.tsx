import React, { useState, useRef } from 'react';
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
  Upload,
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
  ArrowUp,
  ArrowDown,
  Search,
  UserCheck,
  Phone,
  Calendar,
  Hash,
  Lock,
  KeyRound,
  Ban,
  ShieldAlert,
  Bell,
  Database,
  Cloud,
  Heart,
  Wrench,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Room, RoomCategory, Gender, BranchId, LibraryNotice } from '../types';

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
    moveRoomOrder,
    setRoomOrder,
    registeredStudents,
    deleteRegisteredStudent,
    refreshStudentsFromCloud,
    adminForceReleaseSeat,
    adminToggleMaintenance,
    adminManuallyAssignSeat,
    adminResetStudentPin,
    adminToggleBlockStudent,
    adminAddCustomSeat,
    adminDeleteSeat,
    adminToggleSeatFemaleReserved,
    notices,
    addNotice,
    deleteNotice,
    exportFullBackupJSON,
    importFullBackupJSON,
    syncStateToCloudManual,
    cloudLastSyncedAt,
    triggerDailyAutoReset,
    resetToDefaultData,
    attendanceRecords,
    branchStats,
    overallStats,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'rooms' | 'users' | 'seats' | 'notices' | 'backup' | 'attendance' | 'settings'>('rooms');

  // Room Form State (Add / Edit)
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomOrder, setRoomOrderInput] = useState<number>(1);
  const [roomCategory, setRoomCategory] = useState<RoomCategory>('general');
  const [roomPrefix, setRoomPrefix] = useState('R');
  const [roomCapacity, setRoomCapacity] = useState<number>(16);
  const [roomDesc, setRoomDesc] = useState('');
  const [roomHasAC, setRoomHasAC] = useState(true);
  const [roomIsSilent, setRoomIsSilent] = useState(true);

  // User directory search & filter state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);
  const [editingPinPhone, setEditingPinPhone] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState('');

  // Manual Seat Assign State
  const [assignSeatId, setAssignSeatId] = useState('');
  const [assignName, setAssignName] = useState('');
  const [assignPhone, setAssignPhone] = useState('');
  const [assignGender, setAssignGender] = useState<Gender>('male');
  const [assignHours, setAssignHours] = useState<number>(4);

  // Add Custom Seat State
  const [isAddingCustomSeat, setIsAddingCustomSeat] = useState(false);
  const [customSeatRoomId, setCustomSeatRoomId] = useState(branchRooms[0]?.id || '');
  const [customSeatNumber, setCustomSeatNumber] = useState('');
  const [customSeatFemale, setCustomSeatFemale] = useState(false);

  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeType, setNoticeType] = useState<LibraryNotice['type']>('urgent');

  // Backup state
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (!roomName.trim()) return;

    if (editingRoomId) {
      updateRoom(editingRoomId, {
        name: roomName.trim(),
        bengaliName: roomName.trim(),
        roomNumber: roomNumber.trim() || undefined,
        order: Number(roomOrder) || 1,
        category: roomCategory,
        seatPrefix: roomPrefix.trim().toUpperCase(),
        capacity: Number(roomCapacity),
        description: roomDesc.trim() || 'Study Hall equipped with high speed WiFi.',
        bengaliDescription: roomDesc.trim() || 'Quiet study hall with high speed WiFi.',
        hasAC: roomHasAC,
        isSilent: roomIsSilent,
      });
      setEditingRoomId(null);
    } else {
      addRoom({
        branchId: currentBranchId,
        name: roomName.trim(),
        bengaliName: roomName.trim(),
        roomNumber: roomNumber.trim() || `Room ${branchRooms.length + 1}`,
        order: Number(roomOrder) || branchRooms.length + 1,
        category: roomCategory,
        seatPrefix: roomPrefix.trim().toUpperCase(),
        capacity: Number(roomCapacity),
        description: roomDesc.trim() || 'Study Hall equipped with high speed WiFi.',
        bengaliDescription: roomDesc.trim() || 'Quiet study hall with high speed WiFi.',
        hasAC: roomHasAC,
        isSilent: roomIsSilent,
      });
      setIsAddingRoom(false);
    }

    // Reset Form
    setRoomName('');
    setRoomNumber('');
    setRoomOrderInput(branchRooms.length + 1);
    setRoomPrefix('R');
    setRoomCapacity(16);
    setRoomDesc('');
  };

  const startEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setRoomName(room.name);
    setRoomNumber(room.roomNumber || '');
    setRoomOrderInput(room.order ?? 1);
    setRoomCategory(room.category);
    setRoomPrefix(room.seatPrefix);
    setRoomCapacity(room.capacity);
    setRoomDesc(room.description);
    setRoomHasAC(room.hasAC);
    setRoomIsSilent(room.isSilent);
    setIsAddingRoom(true);
  };

  // Filtered Students
  const filteredStudents = registeredStudents.filter((s) => {
    const q = userSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.studentId && s.studentId.toLowerCase().includes(q)) ||
      (s.targetExam && s.targetExam.toLowerCase().includes(q))
    );
  });

  const handleSyncCloudUsers = async () => {
    setIsRefreshingUsers(true);
    await refreshStudentsFromCloud();
    setIsRefreshingUsers(false);
  };

  const handleSavePin = (phone: string) => {
    if (!newPinValue.trim()) return;
    adminResetStudentPin(phone, newPinValue.trim());
    setEditingPinPhone(null);
    setNewPinValue('');
  };

  // Handle Manual Seat Assign
  const handleManualAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSeatId || !assignName.trim() || !assignPhone.trim()) return;

    adminManuallyAssignSeat(
      assignSeatId,
      assignName.trim(),
      assignPhone.trim(),
      assignHours,
      assignGender
    );

    setAssignSeatId('');
    setAssignName('');
    setAssignPhone('');
  };

  // Handle Add Custom Seat
  const handleAddCustomSeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetRoom = branchRooms.find((r) => r.id === (customSeatRoomId || branchRooms[0]?.id));
    if (!targetRoom || !customSeatNumber.trim()) return;

    adminAddCustomSeat({
      roomId: targetRoom.id,
      branchId: currentBranchId,
      seatNumber: customSeatNumber.trim().toUpperCase(),
      status: 'available',
      isFemaleReserved: customSeatFemale,
    });

    setCustomSeatNumber('');
    setIsAddingCustomSeat(false);
  };

  // Handle Notice Post
  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    addNotice({
      title: noticeTitle.trim(),
      content: noticeContent.trim(),
      type: noticeType,
      branchId: currentBranchId,
      active: true,
      postedAt: new Date().toISOString(),
    });

    setNoticeTitle('');
    setNoticeContent('');
  };

  // Handle Cloud Sync Manual
  const handleManualCloudSync = async () => {
    setIsSyncingCloud(true);
    setSyncStatusMsg(null);
    const res = await syncStateToCloudManual();
    setIsSyncingCloud(false);
    setSyncStatusMsg(res.message);
    setTimeout(() => setSyncStatusMsg(null), 5000);
  };

  // Handle Export Backup
  const handleExportBackup = () => {
    const jsonStr = exportFullBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_center_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Import Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const res = importFullBackupJSON(content);
        setSyncStatusMsg(res.message);
        setTimeout(() => setSyncStatusMsg(null), 5000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranchConfig({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Admin Master Control Panel
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {branchConfig.name} • Manage Rooms, Seats, User PINs, Notices & Cloud Sync
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1 shrink-0 overflow-x-auto">
          <button
            id="tab-admin-rooms"
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'rooms'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Rooms ({branchRooms.length})</span>
          </button>

          <button
            id="tab-admin-seats"
            onClick={() => setActiveTab('seats')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'seats'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Armchair className="w-3.5 h-3.5 text-emerald-600" />
            <span>Seat Control</span>
          </button>

          <button
            id="tab-admin-users"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'users'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Students & PINs ({registeredStudents.length})</span>
          </button>

          <button
            id="tab-admin-notices"
            onClick={() => setActiveTab('notices')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'notices'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Notices ({notices.length})</span>
          </button>

          <button
            id="tab-admin-backup"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'backup'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-cyan-600" />
            <span>Cloud & Backup</span>
          </button>

          <button
            id="tab-admin-attendance"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'attendance'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Logs ({attendanceRecords.length})</span>
          </button>

          <button
            id="tab-admin-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'settings'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Branch Settings</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-600">
          
          {/* TAB 1: Room Management (Create Room, Assign Room Number, Serial Order) */}
          {activeTab === 'rooms' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Room & Serial Order Management
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Created and updated rooms sync automatically across all student devices in real-time
                  </p>
                </div>

                {!isAddingRoom && (
                  <button
                    id="btn-admin-add-room"
                    onClick={() => {
                      setEditingRoomId(null);
                      setRoomName('');
                      setRoomNumber(`Room ${branchRooms.length + 1}`);
                      setRoomOrderInput(branchRooms.length + 1);
                      setRoomPrefix(String.fromCharCode(65 + branchRooms.length));
                      setRoomCapacity(16);
                      setRoomDesc('');
                      setIsAddingRoom(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Room</span>
                  </button>
                )}
              </div>

              {/* Add / Edit Room Form Card */}
              {isAddingRoom && (
                <form
                  onSubmit={handleSaveRoom}
                  className="bg-slate-50 rounded-xl border border-blue-200 p-3.5 space-y-3 animate-fadeIn"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 text-xs">
                      {editingRoomId ? 'Edit Room Details' : 'Create New Room'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingRoom(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Room Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="e.g. Hall 3 - Silent Study"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Room Number / Code
                      </label>
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        placeholder="e.g. Room 103 or Hall C"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Display Order / Position
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={roomOrder}
                        onChange={(e) => setRoomOrderInput(Number(e.target.value))}
                        placeholder="1, 2, 3..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Category
                      </label>
                      <select
                        value={roomCategory}
                        onChange={(e) => setRoomCategory(e.target.value as RoomCategory)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="general">General Study Hall</option>
                        <option value="female_only">Female Reserved</option>
                        <option value="ac_hall">AC Hall</option>
                        <option value="silent_zone">Silent Zone</option>
                        <option value="discussion">Group Discussion</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Seat Prefix
                        </label>
                        <input
                          type="text"
                          required
                          value={roomPrefix}
                          onChange={(e) => setRoomPrefix(e.target.value)}
                          placeholder="A, B, C, R1"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono uppercase focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Seat Capacity
                        </label>
                        <input
                          type="number"
                          required
                          min={2}
                          max={60}
                          value={roomCapacity}
                          onChange={(e) => setRoomCapacity(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={roomDesc}
                        onChange={(e) => setRoomDesc(e.target.value)}
                        placeholder="Quiet, focused study atmosphere"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={roomHasAC}
                        onChange={(e) => setRoomHasAC(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0"
                      />
                      <span>Air Conditioned</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={roomIsSilent}
                        onChange={(e) => setRoomIsSilent(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0"
                      />
                      <span>Silent Zone</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAddingRoom(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                    >
                      {editingRoomId ? 'Update Room' : 'Save Room'}
                    </button>
                  </div>
                </form>
              )}

              {/* Rooms List Table with Serial Re-ordering */}
              <div className="space-y-2">
                {branchRooms.map((room, index) => {
                  const roomSeats = branchSeats.filter((s) => s.roomId === room.id);
                  const occCount = roomSeats.filter((s) => s.status === 'occupied' || s.status === 'away').length;

                  return (
                    <div
                      key={room.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Serial Badge */}
                        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-mono font-bold text-xs shrink-0 mt-0.5">
                          #{room.order ?? index + 1}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {room.name}
                            </span>
                            {room.roomNumber && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                                {room.roomNumber}
                              </span>
                            )}
                            {room.category === 'female_only' && (
                              <span className="px-1.5 py-0.2 rounded bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-semibold">
                                Female Reserved
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
                            <span>
                              Prefix: <strong className="text-slate-800 font-mono">{room.seatPrefix}-XX</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Capacity: <strong className="text-slate-800 font-mono">{room.capacity}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Occupancy: <strong className="text-emerald-700 font-mono">{occCount}/{roomSeats.length}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls: Move Up, Move Down, Edit, Delete */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 mr-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveRoomOrder(room.id, 'up')}
                            className="p-1.5 hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-[1px] h-4 bg-slate-200" />
                          <button
                            type="button"
                            disabled={index === branchRooms.length - 1}
                            onClick={() => moveRoomOrder(room.id, 'down')}
                            className="p-1.5 hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => startEditRoom(room)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                          title="Edit Room"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${room.name}" and all its seats?`)) {
                              deleteRoom(room.id);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Delete Room"
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

          {/* TAB 2: Seat Control & Custom Seat */}
          {activeTab === 'seats' && (
            <div className="space-y-3">
              {/* Add Custom Seat Form */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Add Custom Seat:</span>
                  </div>
                </div>

                <form onSubmit={handleAddCustomSeatSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Select Room</label>
                    <select
                      value={customSeatRoomId}
                      onChange={(e) => setCustomSeatRoomId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    >
                      {branchRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.seatPrefix})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Seat Code / Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A-17 or VIP-01"
                      value={customSeatNumber}
                      onChange={(e) => setCustomSeatNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono uppercase focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 text-xs">
                      <input
                        type="checkbox"
                        checked={customSeatFemale}
                        onChange={(e) => setCustomSeatFemale(e.target.checked)}
                        className="rounded border-slate-300 text-pink-600 focus:ring-0"
                      />
                      <span>Female Reserved</span>
                    </label>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      Add Seat
                    </button>
                  </div>
                </form>
              </div>

              {/* Manual Assign Section */}
              <form
                onSubmit={handleManualAssign}
                className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5"
              >
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Armchair className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Manually Assign Seat to Student:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Select Available Seat</label>
                    <select
                      value={assignSeatId}
                      onChange={(e) => setAssignSeatId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Choose Seat --</option>
                      {branchSeats
                        .filter((s) => s.status === 'available')
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.seatNumber} ({s.isFemaleReserved ? 'Female' : 'General'})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Student Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanvir"
                      value={assignName}
                      onChange={(e) => setAssignName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Mobile Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="017xxxxxxxx"
                      value={assignPhone}
                      onChange={(e) => setAssignPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!assignSeatId}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs disabled:opacity-40 shadow-xs transition-colors"
                    >
                      Assign Seat
                    </button>
                  </div>
                </div>
              </form>

              {/* All Seats Table with Live Admin Actions */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                  <span>Branch Seats List ({branchSeats.length} Seats)</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Booked: {branchSeats.filter((s) => s.status === 'occupied' || s.status === 'away').length} | Available: {branchSeats.filter((s) => s.status === 'available').length}
                  </span>
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] sticky top-0">
                      <tr>
                        <th className="p-2 font-semibold">Seat</th>
                        <th className="p-2 font-semibold">Status</th>
                        <th className="p-2 font-semibold">Occupant</th>
                        <th className="p-2 font-semibold">Zone</th>
                        <th className="p-2 font-semibold text-right">Admin Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {branchSeats.map((seat) => (
                        <tr key={seat.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-blue-700">
                            {seat.seatNumber}
                          </td>
                          <td className="p-2">
                            {seat.status === 'occupied' ? (
                              <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Studying
                              </span>
                            ) : seat.status === 'away' ? (
                              <span className="text-amber-700 font-semibold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Break
                              </span>
                            ) : seat.status === 'maintenance' ? (
                              <span className="text-rose-700 font-semibold text-[10px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                Maintenance
                              </span>
                            ) : (
                              <span className="text-slate-600 font-semibold text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                Available
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-slate-800">
                            {seat.occupantName ? (
                              <div>
                                <span className="font-medium">{seat.occupantName}</span>
                                <span className="block font-mono text-[10px] text-slate-400">{seat.occupantPhone}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">-</span>
                            )}
                          </td>
                          <td className="p-2">
                            <button
                              type="button"
                              onClick={() => adminToggleSeatFemaleReserved(seat.id)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                seat.isFemaleReserved
                                  ? 'bg-pink-50 border-pink-200 text-pink-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              {seat.isFemaleReserved ? 'Female' : 'General'}
                            </button>
                          </td>
                          <td className="p-2 text-right space-x-1">
                            {seat.status === 'occupied' || seat.status === 'away' ? (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Force release seat ${seat.seatNumber}?`)) {
                                    adminForceReleaseSeat(seat.id);
                                  }
                                }}
                                className="px-2 py-0.8 rounded border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-semibold text-[11px] transition-colors"
                              >
                                Release
                              </button>
                            ) : (
                              <button
                                onClick={() => adminToggleMaintenance(seat.id, 'Routine check')}
                                className="px-2 py-0.8 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[11px] transition-colors"
                              >
                                {seat.status === 'maintenance' ? 'Unblock' : 'Maintenance'}
                              </button>
                            )}

                            <button
                              onClick={() => {
                                if (window.confirm(`Delete seat ${seat.seatNumber}?`)) {
                                  adminDeleteSeat(seat.id);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Seat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* TAB 3: Registered Users Directory & PIN Management */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Registered Students & PIN Management
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Reset user PINs, manage block status, and refresh cloud directory
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncCloudUsers}
                    disabled={isRefreshingUsers}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold text-xs transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingUsers ? 'animate-spin' : ''}`} />
                    <span>Sync Users</span>
                  </button>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search by student name, phone, student ID or exam..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2.5 font-semibold">Student Name</th>
                      <th className="p-2.5 font-semibold">Phone Number</th>
                      <th className="p-2.5 font-semibold">Student ID</th>
                      <th className="p-2.5 font-semibold">PIN Status</th>
                      <th className="p-2.5 font-semibold">Account Status</th>
                      <th className="p-2.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => {
                        const cleanPhone = student.phone.replace(/\D/g, '');
                        const isSuperAdmin = cleanPhone === '01581624202' || student.role === 'superadmin';

                        return (
                          <tr key={student.id || student.phone} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-medium text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900">{student.name}</div>
                                  <div className="text-[10px] text-slate-400 capitalize">{student.gender || 'male'} • {student.targetExam || 'General'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-2.5 font-mono text-slate-700 font-medium">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {student.phone}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-600">
                              {student.studentId || `DU-${cleanPhone.slice(-4)}`}
                            </td>
                            <td className="p-2.5">
                              {editingPinPhone === student.phone ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="New PIN"
                                    value={newPinValue}
                                    onChange={(e) => setNewPinValue(e.target.value)}
                                    className="w-16 px-1.5 py-0.5 border border-blue-400 rounded text-xs font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSavePin(student.phone)}
                                    className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPinPhone(null)}
                                    className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]"
                                  >
                                    X
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                    student.pin ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {student.pin ? `PIN: ${student.pin}` : 'No PIN'}
                                  </span>
                                  {!isSuperAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPinPhone(student.phone);
                                        setNewPinValue(student.pin || '1234');
                                      }}
                                      className="text-blue-600 hover:underline text-[10px]"
                                      title="Reset PIN"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-2.5">
                              {isSuperAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                                  <ShieldCheck className="w-3 h-3 text-rose-600" />
                                  Super Admin
                                </span>
                              ) : student.isBlocked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px]">
                                  <Ban className="w-3 h-3" />
                                  Blocked
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-right space-x-1.5">
                              {!isSuperAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => adminToggleBlockStudent(student.phone)}
                                    className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition-colors ${
                                      student.isBlocked
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                        : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                                    }`}
                                  >
                                    {student.isBlocked ? 'Unblock' : 'Block'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Delete "${student.name}" (${student.phone}) from registry?`)) {
                                        deleteRegisteredStudent(student.phone);
                                      }
                                    }}
                                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Notice Board Control */}
          {activeTab === 'notices' && (
            <div className="space-y-3">
              <form onSubmit={handlePostNotice} className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Post Urgent Notice / Announcement:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Notice Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Weekly Exam Schedule & Hall Maintenance"
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Notice Category</label>
                    <select
                      value={noticeType}
                      onChange={(e) => setNoticeType(e.target.value as LibraryNotice['type'])}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="urgent">🔴 Urgent</option>
                      <option value="event">🎉 Special Event</option>
                      <option value="maintenance">🔧 Maintenance</option>
                      <option value="announcement">📢 General Announcement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Detailed Notice Description</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Write detailed notice contents here..."
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                  >
                    Publish Notice
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900">Active Notices ({notices.length})</h4>
                {notices.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-3 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          n.type === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {n.type.toUpperCase()}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{n.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{n.content}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteNotice(n.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Data Backup & Cloud Synchronization */}
          {activeTab === 'backup' && (
            <div className="space-y-3">
              {/* Cloud Sync Status */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Cloud Real-time Sync & Storage</h4>
                      <p className="text-[11px] text-slate-500">
                        {cloudLastSyncedAt
                          ? `Last synced: ${new Date(cloudLastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${new Date(cloudLastSyncedAt).toLocaleDateString()})`
                          : 'Automatic real-time sync active'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleManualCloudSync}
                    disabled={isSyncingCloud}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs disabled:opacity-60 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                    <span>{isSyncingCloud ? 'Syncing...' : 'Sync Cloud Now'}</span>
                  </button>
                </div>

                {syncStatusMsg && (
                  <div className="p-2 rounded-lg bg-white/80 border border-blue-200 text-blue-800 text-[11px] flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{syncStatusMsg}</span>
                  </div>
                )}
              </div>

              {/* JSON Backup & Restore Tools */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Export JSON Backup</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Download a full JSON snapshot of all rooms, seats, notices, and registered users to your device.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Full Backup</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>Restore from Backup (Import)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Restore previously downloaded backup JSON file to restore complete library state.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Select Backup JSON File</span>
                  </button>
                </div>
              </div>

              {/* Maintenance & Reset */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Maintenance & Reset Tools:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-800 text-xs">Nightly Auto-Reset</div>
                    <p className="text-[11px] text-slate-500">
                      Release all active seats to open them for the next study day.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Release all occupied seats and reset for the day?')) {
                          triggerDailyAutoReset();
                        }
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 font-semibold text-xs transition-colors"
                    >
                      Trigger Auto-Reset
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-800 text-xs">Restore Default Data</div>
                    <p className="text-[11px] text-slate-500">
                      Reset database to default initial structure and rooms.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Warning: This will restore default data. Continue?')) {
                          resetToDefaultData();
                        }
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors"
                    >
                      Restore Defaults
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Attendance History */}
          {activeTab === 'attendance' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Attendance Logs & History
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Today's check-ins and completed student sessions
                  </p>
                </div>

                <button
                  onClick={handleExportAttendance}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2 font-semibold">Date</th>
                      <th className="p-2 font-semibold">Student</th>
                      <th className="p-2 font-semibold">Phone</th>
                      <th className="p-2 font-semibold">Room & Seat</th>
                      <th className="p-2 font-semibold">Check-In</th>
                      <th className="p-2 font-semibold">Token Passcode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                    {attendanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50">
                        <td className="p-2 text-slate-500">{record.dateStr}</td>
                        <td className="p-2 font-sans font-medium text-slate-800">
                          {record.studentName}
                        </td>
                        <td className="p-2 text-slate-500">{record.studentPhone}</td>
                        <td className="p-2 text-blue-700">
                          {record.seatNumber} ({record.roomName.split('(')[0]})
                        </td>
                        <td className="p-2 text-emerald-700 font-sans">
                          {new Date(record.checkInTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-2 text-slate-500">{record.passCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: Branch Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-3">
              <form
                onSubmit={handleSaveSettings}
                className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3"
              >
                <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span>Branch Social & External Links:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Official Facebook Page URL
                    </label>
                    <input
                      type="url"
                      required
                      value={fbUrl}
                      onChange={(e) => setFbUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Facebook Page Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fbPageName}
                      onChange={(e) => setFbPageName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Follower Badge Text
                    </label>
                    <input
                      type="text"
                      value={fbFollowers}
                      onChange={(e) => setFbFollowers(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Memorizer App URL
                    </label>
                    <input
                      type="url"
                      value={memoUrl}
                      onChange={(e) => setMemoUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  {settingsSaved && (
                    <span className="text-emerald-700 text-xs font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Links successfully updated!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="ml-auto px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
                  >
                    Update Links
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
