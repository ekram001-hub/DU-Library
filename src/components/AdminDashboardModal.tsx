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
    if (!roomName.trim()) return;

    if (editingRoomId) {
      updateRoom(editingRoomId, {
        name: roomName.trim(),
        bengaliName: roomName.trim(),
        category: roomCategory,
        seatPrefix: roomPrefix.trim(),
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
        category: roomCategory,
        seatPrefix: roomPrefix.trim(),
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
    setRoomPrefix('R');
    setRoomCapacity(16);
    setRoomDesc('');
  };

  const startEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setRoomName(room.name);
    setRoomCategory(room.category);
    setRoomPrefix(room.seatPrefix);
    setRoomCapacity(room.capacity);
    setRoomDesc(room.description);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Admin Control Panel
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Admin Access
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {branchConfig.name} • Manage Rooms, Capacity & Overrides
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
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'rooms'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Rooms & Capacity ({branchRooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('seats')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'seats'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>Seat Control</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'attendance'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Attendance Log ({attendanceRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              activeTab === 'settings'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings & Reset</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-600">
          {/* TAB 1: Room Management */}
          {activeTab === 'rooms' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Study Rooms & Capacity
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Create rooms, adjust capacities, and seat prefixes
                  </p>
                </div>

                {!isAddingRoom && (
                  <button
                    onClick={() => {
                      setEditingRoomId(null);
                      setRoomName('');
                      setRoomPrefix('R');
                      setRoomCapacity(16);
                      setIsAddingRoom(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Room</span>
                  </button>
                )}
              </div>

              {/* Add / Edit Room Form Card */}
              {isAddingRoom && (
                <form
                  onSubmit={handleSaveRoom}
                  className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-semibold text-slate-900 text-xs">
                      {editingRoomId ? 'Edit Room' : 'Create New Room'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingRoom(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Room Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="e.g. Executive AC Hall 3"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
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
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Prefix
                        </label>
                        <input
                          type="text"
                          required
                          value={roomPrefix}
                          onChange={(e) => setRoomPrefix(e.target.value)}
                          placeholder="A, B, FC"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-700 mb-1">
                          Capacity
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
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={roomDesc}
                        onChange={(e) => setRoomDesc(e.target.value)}
                        placeholder="Quiet study hall with high-speed WiFi."
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
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs"
                    >
                      {editingRoomId ? 'Update Room' : 'Save Room'}
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
                      className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-xs">
                            {room.name}
                          </span>
                          {room.category === 'female_only' && (
                            <span className="px-1.5 py-0.2 rounded bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-medium">
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

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          onClick={() => startEditRoom(room)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
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

          {/* TAB 2: Seat Control & Maintenance */}
          {activeTab === 'seats' && (
            <div className="space-y-3">
              {/* Manual Assign Section */}
              <form
                onSubmit={handleManualAssign}
                className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2.5"
              >
                <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
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
                    <label className="block text-[10px] text-slate-500 mb-0.5">Mobile Number</label>
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
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs disabled:opacity-40 shadow-xs transition-colors"
                    >
                      Assign Seat
                    </button>
                  </div>
                </div>
              </form>

              {/* Occupied Seats Table with Force Release Button */}
              <div>
                <h4 className="text-xs font-semibold text-slate-900 mb-1.5">
                  Active Occupied Seats ({branchSeats.filter((s) => s.status === 'occupied' || s.status === 'away').length})
                </h4>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-2 font-medium">Seat</th>
                        <th className="p-2 font-medium">Student</th>
                        <th className="p-2 font-medium">Phone</th>
                        <th className="p-2 font-medium">Status</th>
                        <th className="p-2 font-medium">Check-In</th>
                        <th className="p-2 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {branchSeats
                        .filter((s) => s.status === 'occupied' || s.status === 'away')
                        .map((seat) => (
                          <tr key={seat.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-semibold text-blue-700">
                              {seat.seatNumber}
                            </td>
                            <td className="p-2 text-slate-800 font-medium">
                              {seat.occupantName}
                            </td>
                            <td className="p-2 font-mono text-slate-500">
                              {seat.occupantPhone}
                            </td>
                            <td className="p-2">
                              {seat.status === 'away' ? (
                                <span className="text-amber-700 font-medium text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  On Break
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-medium text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Studying
                                </span>
                              )}
                            </td>
                            <td className="p-2 font-mono text-slate-500 text-[11px]">
                              {seat.bookedAt
                                ? new Date(seat.bookedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'N/A'}
                            </td>
                            <td className="p-2 text-right">
                              <button
                                onClick={() => {
                                  if (window.confirm(`Force release seat ${seat.seatNumber}?`)) {
                                    adminForceReleaseSeat(seat.id);
                                  }
                                }}
                                className="px-2 py-0.8 rounded border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-medium text-[11px] transition-colors"
                              >
                                Release
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
                  <h4 className="text-xs font-semibold text-slate-900">
                    Attendance Logs & History
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Today's check-in sessions and completed visits
                  </p>
                </div>

                <button
                  onClick={handleExportAttendance}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2 font-medium">Date</th>
                      <th className="p-2 font-medium">Student</th>
                      <th className="p-2 font-medium">Phone</th>
                      <th className="p-2 font-medium">Room & Seat</th>
                      <th className="p-2 font-medium">Check-In</th>
                      <th className="p-2 font-medium">Token Passcode</th>
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

          {/* TAB 4: Settings & System Reset */}
          {activeTab === 'settings' && (
            <div className="space-y-3">
              {/* Branch Config Form */}
              <form
                onSubmit={handleSaveSettings}
                className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-3"
              >
                <div className="font-semibold text-slate-800 text-xs flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span>Branch Social & External Link Settings:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 mb-1">
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
                    <label className="block text-[10px] font-medium text-slate-600 mb-1">
                      Facebook Page Display Name
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
                    <label className="block text-[10px] font-medium text-slate-600 mb-1">
                      Followers Badge Text
                    </label>
                    <input
                      type="text"
                      value={fbFollowers}
                      onChange={(e) => setFbFollowers(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 mb-1">
                      Memorizer Learning App URL
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
                      Settings updated successfully!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="ml-auto px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-xs"
                  >
                    Update Links
                  </button>
                </div>
              </form>


              {/* Maintenance Tools Card */}
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2.5">
                <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Maintenance & System Controls:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                    <div className="font-semibold text-slate-800 text-xs">
                      Nightly Auto-Reset
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Release all active bookings and breaks ready for next morning.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Reset and release all seats now?')) {
                          triggerDailyAutoReset();
                        }
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 font-medium text-xs transition-colors"
                    >
                      Trigger Auto-Reset
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                    <div className="font-semibold text-slate-800 text-xs">
                      Restore Default Data
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Reset the application to initial demo structure and seats.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Warning: This will reload default demo data. Continue?')) {
                          resetToDefaultData();
                        }
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-medium text-xs transition-colors"
                    >
                      Restore Defaults
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

