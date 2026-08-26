import React, { useState, useRef, useEffect } from 'react';
import {
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
  Users,
  Facebook,
  CheckCircle2,
  FileText,
  ArrowUp,
  ArrowDown,
  Search,
  Phone,
  Ban,
  Bell,
  Database,
  Cloud,
  LogOut,
  Building2,
  Home,
  Grid,
  Check,
  X,
  Lock,
  Sparkles,
  ExternalLink,
  GraduationCap,
  BookOpen,
  Activity,
  Terminal,
  Wifi,
  VolumeX,
  Heart,
  Clock,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Room, RoomCategory, Gender, BranchId, LibraryNotice, LibraryRule, WifiFacilityConfig } from '../types';
import { SupabaseDiagnosticReport } from '../lib/supabase';

interface AdminPageProps {
  onBackToPortal: () => void;
  onOpenSeats: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onBackToPortal,
  onOpenSeats,
}) => {
  const {
    currentBranchId,
    setCurrentBranchId,
    branchConfig,
    allBranches,
    updateBranchConfig,
    branchRooms,
    branchSeats,
    addRoom,
    updateRoom,
    deleteRoom,
    moveRoomOrder,
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
    updateNotice,
    deleteNotice,
    rules,
    addRule,
    updateRule,
    deleteRule,
    wifiFacilities,
    updateWifiFacility,
    exportFullBackupJSON,
    importFullBackupJSON,
    syncStateToCloudManual,
    runDiagnostics,
    cloudLastSyncedAt,
    triggerDailyAutoReset,
    resetToDefaultData,
    attendanceRecords,
    isAdminLoggedIn,
    adminUser,
    loginAdmin,
    logoutAdmin,
    signInWithGoogleAuth,
    currentStudent,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<
    'rooms' | 'seats' | 'users' | 'guidelines' | 'wifi' | 'notices' | 'backup' | 'attendance' | 'settings'
  >('rooms');

  // Admin Login State for unauthenticated state
  const [adminEmailOrPin, setAdminEmailOrPin] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
  const [customSeatRoomId, setCustomSeatRoomId] = useState(branchRooms[0]?.id || '');
  const [customSeatNumber, setCustomSeatNumber] = useState('');
  const [customSeatFemale, setCustomSeatFemale] = useState(false);

  // Guidelines / Code of Conduct Form State
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleBengaliTitle, setRuleBengaliTitle] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleBengaliDesc, setRuleBengaliDesc] = useState('');
  const [ruleCategory, setRuleCategory] = useState<LibraryRule['category']>('general');
  const [ruleIcon, setRuleIcon] = useState('📌');
  const [ruleBranchTarget, setRuleBranchTarget] = useState<'all' | BranchId>('all');
  const [ruleOrder, setRuleOrder] = useState<number>(1);

  // Wi-Fi & Facilities Form State
  const currentBranchWifi = wifiFacilities?.[currentBranchId] || {
    branchId: currentBranchId,
    ssid: currentBranchId === 'science_library' ? 'SCIENCE_LIB_5G_FAST' : 'CENTRAL_LIB_5G_PLUS',
    password: 'study@2026#pass',
    speed: '100 Mbps Dedicated Fiber',
    notes: 'Optimized for online video lectures and research. High-volume torrents and unapproved downloads are restricted.',
    amenities: [
      'Individual desk LED lamps and power sockets',
      'Filtered hot, cold, and ambient drinking water',
      'Quiet prayer room with ablution facility',
      'Coffee and tea refreshment lounge',
      '24/7 IPS and generator power backup',
    ],
    helpdeskPhone: branchConfig.phone || '01581624202',
  };

  const [wifiSsid, setWifiSsid] = useState(currentBranchWifi.ssid);
  const [wifiPassword, setWifiPassword] = useState(currentBranchWifi.password);
  const [wifiSpeed, setWifiSpeed] = useState(currentBranchWifi.speed || '100 Mbps Dedicated Fiber');
  const [wifiNotes, setWifiNotes] = useState(currentBranchWifi.notes);
  const [wifiHelpdesk, setWifiHelpdesk] = useState(currentBranchWifi.helpdeskPhone || branchConfig.phone);
  const [wifiAmenitiesList, setWifiAmenitiesList] = useState<string[]>(currentBranchWifi.amenities || []);
  const [newAmenityInput, setNewAmenityInput] = useState('');
  const [wifiSavedSuccess, setWifiSavedSuccess] = useState(false);

  // Synchronize Wi-Fi inputs when branch changes
  useEffect(() => {
    const config = wifiFacilities?.[currentBranchId] || {
      branchId: currentBranchId,
      ssid: currentBranchId === 'science_library' ? 'SCIENCE_LIB_5G_FAST' : 'CENTRAL_LIB_5G_PLUS',
      password: 'study@2026#pass',
      speed: '100 Mbps Dedicated Fiber',
      notes: 'Optimized for online video lectures and research.',
      amenities: [
        'Individual desk LED lamps and power sockets',
        'Filtered hot, cold, and ambient drinking water',
        'Quiet prayer room with ablution facility',
        'Coffee and tea refreshment lounge',
        '24/7 IPS and generator power backup',
      ],
      helpdeskPhone: branchConfig.phone || '01581624202',
    };
    setWifiSsid(config.ssid);
    setWifiPassword(config.password);
    setWifiSpeed(config.speed || '100 Mbps Dedicated Fiber');
    setWifiNotes(config.notes);
    setWifiHelpdesk(config.helpdeskPhone || branchConfig.phone);
    setWifiAmenitiesList(config.amenities || []);
    setWifiSavedSuccess(false);
  }, [currentBranchId, wifiFacilities, branchConfig.phone]);

  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeType, setNoticeType] = useState<LibraryNotice['type']>('urgent');
  const [noticePriority, setNoticePriority] = useState<LibraryNotice['priority']>('urgent');
  const [noticeTargetBranch, setNoticeTargetBranch] = useState<'all' | BranchId>('all');
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);

  // Backup & Diagnostic state
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<SupabaseDiagnosticReport | null>(null);
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Branch Settings State
  const [fbUrl, setFbUrl] = useState(branchConfig.facebookUrl);
  const [fbPageName, setFbPageName] = useState(branchConfig.facebookPageName);
  const [fbFollowers, setFbFollowers] = useState(branchConfig.facebookFollowers);
  const [phoneContact, setPhoneContact] = useState(branchConfig.phone);
  const [memoUrl, setMemoUrl] = useState(branchConfig.memorizerAppUrl);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Metrics
  const totalBranchSeats = branchSeats.length;
  const occupiedBranchSeats = branchSeats.filter((s) => s.status === 'occupied').length;
  const awayBranchSeats = branchSeats.filter((s) => s.status === 'away').length;
  const availableBranchSeats = branchSeats.filter((s) => s.status === 'available').length;
  const maintenanceBranchSeats = branchSeats.filter((s) => s.status === 'maintenance').length;
  const femaleReservedSeats = branchSeats.filter((s) => s.isFemaleReserved).length;

  // Handle Admin Manual Login
  const handleAdminFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const success = loginAdmin(adminEmailOrPin, adminPassword || adminEmailOrPin);
    if (!success) {
      setAuthError('Invalid Admin credentials. Use admin password (01581624202 or admin123) or authorized Google account.');
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      await signInWithGoogleAuth();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Google Sign-In failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

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
    if (!customSeatRoomId || !customSeatNumber.trim()) return;

    adminAddCustomSeat(
      customSeatRoomId,
      customSeatNumber.trim().toUpperCase(),
      customSeatFemale
    );

    setCustomSeatNumber('');
    setCustomSeatFemale(false);
  };

  // Handle Add/Edit Rule Submit
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleTitle.trim() || !ruleDescription.trim()) return;

    if (editingRuleId) {
      updateRule(editingRuleId, {
        title: ruleTitle.trim(),
        bengaliTitle: ruleBengaliTitle.trim() || ruleTitle.trim(),
        description: ruleDescription.trim(),
        bengaliDescription: ruleBengaliDesc.trim() || ruleDescription.trim(),
        category: ruleCategory,
        icon: ruleIcon || '📌',
        branchId: ruleBranchTarget,
        order: Number(ruleOrder) || 1,
      });
      setEditingRuleId(null);
    } else {
      addRule({
        title: ruleTitle.trim(),
        bengaliTitle: ruleBengaliTitle.trim() || ruleTitle.trim(),
        description: ruleDescription.trim(),
        bengaliDescription: ruleBengaliDesc.trim() || ruleDescription.trim(),
        category: ruleCategory,
        icon: ruleIcon || '📌',
        branchId: ruleBranchTarget,
        order: Number(ruleOrder) || rules.length + 1,
      });
    }

    setRuleTitle('');
    setRuleBengaliTitle('');
    setRuleDescription('');
    setRuleBengaliDesc('');
    setRuleCategory('general');
    setRuleIcon('📌');
    setRuleBranchTarget('all');
    setRuleOrder(1);
    setIsAddingRule(false);
  };

  const handleStartEditRule = (rule: LibraryRule) => {
    setEditingRuleId(rule.id);
    setRuleTitle(rule.title);
    setRuleBengaliTitle(rule.bengaliTitle || '');
    setRuleDescription(rule.description);
    setRuleBengaliDesc(rule.bengaliDescription || '');
    setRuleCategory(rule.category || 'general');
    setRuleIcon(rule.icon || '📌');
    setRuleBranchTarget(rule.branchId || 'all');
    setRuleOrder(rule.order || 1);
    setIsAddingRule(true);
  };

  const handleCancelRuleEdit = () => {
    setEditingRuleId(null);
    setRuleTitle('');
    setRuleBengaliTitle('');
    setRuleDescription('');
    setRuleBengaliDesc('');
    setRuleCategory('general');
    setRuleIcon('📌');
    setRuleBranchTarget('all');
    setRuleOrder(1);
    setIsAddingRule(false);
  };

  // Handle Save Wi-Fi & Amenities Config
  const handleSaveWifiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateWifiFacility(currentBranchId, {
      branchId: currentBranchId,
      ssid: wifiSsid.trim(),
      password: wifiPassword.trim(),
      speed: wifiSpeed.trim() || '100 Mbps Dedicated Fiber',
      notes: wifiNotes.trim(),
      amenities: wifiAmenitiesList.filter((a) => a.trim().length > 0),
      helpdeskPhone: wifiHelpdesk.trim() || branchConfig.phone,
    });
    setWifiSavedSuccess(true);
    setTimeout(() => setWifiSavedSuccess(false), 4000);
  };

  const handleAddAmenityItem = () => {
    if (!newAmenityInput.trim()) return;
    setWifiAmenitiesList([...wifiAmenitiesList, newAmenityInput.trim()]);
    setNewAmenityInput('');
  };

  const handleRemoveAmenityItem = (indexToRemove: number) => {
    setWifiAmenitiesList(wifiAmenitiesList.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle Post / Edit Notice
  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    if (editingNoticeId) {
      updateNotice(editingNoticeId, {
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        type: noticeType,
        priority: noticePriority,
        targetBranch: noticeTargetBranch,
        branchId: noticeTargetBranch,
        active: true,
      });
      setEditingNoticeId(null);
    } else {
      addNotice({
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        type: noticeType,
        priority: noticePriority,
        targetBranch: noticeTargetBranch,
        branchId: noticeTargetBranch,
        active: true,
        postedAt: new Date().toISOString(),
        author: adminUser?.name || 'Library Admin',
      });
    }

    setNoticeTitle('');
    setNoticeContent('');
    setNoticeType('urgent');
    setNoticePriority('urgent');
    setNoticeTargetBranch('all');
  };

  const handleStartEditNotice = (n: LibraryNotice) => {
    setEditingNoticeId(n.id);
    setNoticeTitle(n.title);
    setNoticeContent(n.content);
    setNoticeType(n.type || 'urgent');
    setNoticePriority(n.priority || (n.type === 'urgent' ? 'urgent' : 'info'));
    setNoticeTargetBranch(n.targetBranch || n.branchId || 'all');
  };

  const handleCancelNoticeEdit = () => {
    setEditingNoticeId(null);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticeType('urgent');
    setNoticePriority('urgent');
    setNoticeTargetBranch('all');
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

  // Run Real-time & Cloud Diagnostics
  const handleRunLiveDiagnostics = async () => {
    setIsRunningDiag(true);
    try {
      const report = await runDiagnostics();
      setDiagnosticReport(report);
    } catch (err: unknown) {
      console.error('Diagnostic error:', err);
    } finally {
      setIsRunningDiag(false);
    }
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

  // =========================================================================
  // VIEW: Unauthenticated Admin Screen
  // =========================================================================
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
        {/* Top Header */}
        <header className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur-md">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide">
                  Smart Library Admin Portal
                </h1>
                <p className="text-[11px] text-slate-400">
                  Authentication Required
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBackToPortal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
              <button
                type="button"
                onClick={onOpenSeats}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-700/80 text-emerald-200 border border-emerald-700/50 text-xs font-semibold transition-all cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Live Seats</span>
              </button>
            </div>
          </div>
        </header>

        {/* Login Container */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Admin Control Room
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Sign in with your administrator credentials or authorized Google email to manage rooms, seats, students, and cloud backups.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* Quick Google Sign In */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all flex items-center justify-center gap-2.5 shadow-md disabled:opacity-60 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign In with Admin Google Account</span>
              </button>

              <div className="relative flex items-center justify-center py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <span className="relative px-3 bg-slate-800/90 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Or Master Password
                </span>
              </div>

              {/* Password / PIN Form */}
              <form onSubmit={handleAdminFormLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Admin Phone, Email, or Identifier
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01581624202 or admin"
                    value={adminEmailOrPin}
                    onChange={(e) => setAdminEmailOrPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Master Password / Admin PIN
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                  Unlock Admin Dashboard
                </button>
              </form>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-800 py-3 text-center text-xs text-slate-500">
          Smart Library Management System • Secure Admin Console
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW: Full Authenticated Dedicated Admin Page
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-['Poppins',_sans-serif] selection:bg-rose-500 selection:text-white">
      
      {/* Top Fixed Admin Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800 px-3 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Brand & Branch Selector */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                    Admin Master Panel
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Super Admin
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  {branchConfig.name} • Full System Layout & Access Control
                </p>
              </div>
            </div>

            {/* Branch Switcher Selector */}
            <div className="flex items-center p-0.5 bg-slate-800 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setCurrentBranchId('science_library')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentBranchId === 'science_library'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Science Library
              </button>
              <button
                type="button"
                onClick={() => setCurrentBranchId('central_library')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentBranchId === 'central_library'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Central Library
              </button>
            </div>
          </div>

          {/* Action Buttons: Return to Portal, Live Seats, Sign Out */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleManualCloudSync}
              disabled={isSyncingCloud}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer disabled:opacity-60"
              title="Sync with Supabase Cloud Realtime"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isSyncingCloud ? 'Syncing...' : 'Cloud Sync'}</span>
            </button>

            <button
              type="button"
              onClick={onBackToPortal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer"
              title="Return to Public Home Portal"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span>Home Portal</span>
            </button>

            <button
              type="button"
              onClick={onOpenSeats}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Open Live Student Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Live Seat Grid</span>
            </button>

            <button
              type="button"
              onClick={logoutAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-semibold transition-all cursor-pointer"
              title="Sign Out of Admin Mode"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        
        {/* Top Summary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Rooms</p>
              <p className="text-lg font-bold text-slate-900 font-mono">{branchRooms.length}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Total Seats</p>
              <p className="text-lg font-bold text-slate-900 font-mono">{totalBranchSeats}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Armchair className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Occupied</p>
              <p className="text-lg font-bold text-rose-600 font-mono">{occupiedBranchSeats + awayBranchSeats}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Available</p>
              <p className="text-lg font-bold text-emerald-600 font-mono">{availableBranchSeats}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Female Zone</p>
              <p className="text-lg font-bold text-purple-600 font-mono">{femaleReservedSeats}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500">Students</p>
              <p className="text-lg font-bold text-indigo-600 font-mono">{registeredStudents.length}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
          <button
            id="tab-admin-rooms"
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Rooms & Serial Order ({branchRooms.length})</span>
          </button>

          <button
            id="tab-admin-seats"
            onClick={() => setActiveTab('seats')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'seats'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Armchair className="w-4 h-4" />
            <span>Live Seat Management</span>
          </button>

          <button
            id="tab-admin-users"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Registry ({registeredStudents.length})</span>
          </button>

          <button
            id="tab-admin-guidelines"
            onClick={() => setActiveTab('guidelines')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'guidelines'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Guidelines & Code of Conduct ({rules.length})</span>
          </button>

          <button
            id="tab-admin-wifi"
            onClick={() => setActiveTab('wifi')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'wifi'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Wi-Fi & Amenities</span>
          </button>

          <button
            id="tab-admin-notices"
            onClick={() => setActiveTab('notices')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'notices'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notice Board ({notices.length})</span>
          </button>

          <button
            id="tab-admin-backup"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Cloud Sync & Backup</span>
          </button>

          <button
            id="tab-admin-attendance"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Attendance Logs ({attendanceRecords.length})</span>
          </button>

          <button
            id="tab-admin-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Branch Settings</span>
          </button>
        </div>

        {/* Tab Content Cards */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
          
          {/* ================================================================= */}
          {/* TAB 1: ROOMS & LAYOUT BUILDER */}
          {/* ================================================================= */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Room & Serial Order Management ({branchConfig.name})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Created and updated rooms sync automatically across all student devices in real-time.
                  </p>
                </div>

                {!isAddingRoom && (
                  <button
                    id="btn-admin-add-room"
                    type="button"
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
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Room</span>
                  </button>
                )}
              </div>

              {/* Add / Edit Room Form Card */}
              {isAddingRoom && (
                <form
                  onSubmit={handleSaveRoom}
                  className="bg-slate-50 rounded-2xl border border-blue-200 p-4 sm:p-5 space-y-4 animate-fadeIn"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <span className="font-bold text-slate-900 text-sm">
                      {editingRoomId ? 'Edit Room Configuration' : 'Create New Room'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingRoom(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Room Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="e.g. Hall 3 - Silent Study"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Room Number / Code
                      </label>
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        placeholder="e.g. Room 103 or Hall C"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Display Order / Position
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={roomOrder}
                        onChange={(e) => setRoomOrderInput(Number(e.target.value))}
                        placeholder="1, 2, 3..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Category
                      </label>
                      <select
                        value={roomCategory}
                        onChange={(e) => setRoomCategory(e.target.value as RoomCategory)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="general">General Study Hall</option>
                        <option value="female_only">Female Reserved Zone</option>
                        <option value="ac_hall">AC Hall</option>
                        <option value="silent_zone">Silent Zone</option>
                        <option value="discussion">Group Discussion</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Seat Prefix
                        </label>
                        <input
                          type="text"
                          required
                          value={roomPrefix}
                          onChange={(e) => setRoomPrefix(e.target.value)}
                          placeholder="A, B, C, R1"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono uppercase focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Capacity
                        </label>
                        <input
                          type="number"
                          required
                          min={2}
                          max={80}
                          value={roomCapacity}
                          onChange={(e) => setRoomCapacity(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={roomDesc}
                        onChange={(e) => setRoomDesc(e.target.value)}
                        placeholder="Quiet, focused study atmosphere with AC"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={roomHasAC}
                        onChange={(e) => setRoomHasAC(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0"
                      />
                      <span>Air Conditioned</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={roomIsSilent}
                        onChange={(e) => setRoomIsSilent(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-0"
                      />
                      <span>Strict Silent Zone</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAddingRoom(false)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                    >
                      {editingRoomId ? 'Update Room' : 'Save Room'}
                    </button>
                  </div>
                </form>
              )}

              {/* Rooms List Table with Serial Re-ordering */}
              <div className="space-y-2.5">
                {branchRooms.map((room, index) => {
                  const roomSeats = branchSeats.filter((s) => s.roomId === room.id);
                  const occCount = roomSeats.filter((s) => s.status === 'occupied' || s.status === 'away').length;

                  return (
                    <div
                      key={room.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-mono font-bold text-xs shrink-0 mt-0.5">
                          #{room.order ?? index + 1}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {room.name}
                            </span>
                            {room.roomNumber && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                                {room.roomNumber}
                              </span>
                            )}
                            {room.category === 'female_only' && (
                              <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-semibold">
                                Female Reserved
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-slate-500 text-xs">
                            <span>
                              Prefix: <strong className="text-slate-800 font-mono">{room.seatPrefix}-XX</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Capacity: <strong className="text-slate-800 font-mono">{room.capacity} seats</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Occupancy: <strong className="text-emerald-700 font-mono">{occCount}/{roomSeats.length}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls: Move Up, Move Down, Edit, Delete */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveRoomOrder(room.id, 'up')}
                            className="p-2 hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-[1px] h-4 bg-slate-200" />
                          <button
                            type="button"
                            disabled={index === branchRooms.length - 1}
                            onClick={() => moveRoomOrder(room.id, 'down')}
                            className="p-2 hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => startEditRoom(room)}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                          title="Edit Room"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete "${room.name}" and all its seats?`)) {
                              deleteRoom(room.id);
                            }
                          }}
                          className="p-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
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

          {/* ================================================================= */}
          {/* TAB 2: SEAT CONTROLS & MANUAL ASSIGN */}
          {/* ================================================================= */}
          {activeTab === 'seats' && (
            <div className="space-y-4">
              
              {/* Form 1: Add Custom Seat */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Add Individual Custom Seat:</span>
                </div>

                <form onSubmit={handleAddCustomSeatSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Select Room</label>
                    <select
                      value={customSeatRoomId}
                      onChange={(e) => setCustomSeatRoomId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    >
                      {branchRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.seatPrefix})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Seat Code / Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A-17 or VIP-01"
                      value={customSeatNumber}
                      onChange={(e) => setCustomSeatNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono uppercase focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 text-xs">
                      <input
                        type="checkbox"
                        checked={customSeatFemale}
                        onChange={(e) => setCustomSeatFemale(e.target.checked)}
                        className="rounded border-slate-300 text-pink-600 focus:ring-0"
                      />
                      <span>Female Reserved Zone</span>
                    </label>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Add Seat
                    </button>
                  </div>
                </form>
              </div>

              {/* Form 2: Manual Student Assignment */}
              <form
                onSubmit={handleManualAssign}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3"
              >
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Armchair className="w-4 h-4 text-emerald-600" />
                  <span>Manually Assign Seat to Student:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Select Available Seat</label>
                    <select
                      value={assignSeatId}
                      onChange={(e) => setAssignSeatId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500"
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
                    <label className="block text-[11px] text-slate-500 mb-1">Student Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanvir"
                      value={assignName}
                      onChange={(e) => setAssignName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Mobile Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="017xxxxxxxx"
                      value={assignPhone}
                      onChange={(e) => setAssignPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!assignSeatId}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs disabled:opacity-40 shadow-xs transition-colors cursor-pointer"
                    >
                      Assign Seat
                    </button>
                  </div>
                </div>
              </form>

              {/* All Seats Table with Live Admin Actions */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center justify-between">
                  <span>Branch Seats Inventory ({branchSeats.length} Seats)</span>
                  <span className="text-xs font-normal text-slate-500">
                    Booked: {branchSeats.filter((s) => s.status === 'occupied' || s.status === 'away').length} | Available: {branchSeats.filter((s) => s.status === 'available').length}
                  </span>
                </h4>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[480px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs sticky top-0">
                      <tr>
                        <th className="p-3 font-semibold">Seat</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold">Occupant</th>
                        <th className="p-3 font-semibold">Zone</th>
                        <th className="p-3 font-semibold text-right">Admin Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {branchSeats.map((seat) => (
                        <tr key={seat.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-blue-700">
                            {seat.seatNumber}
                          </td>
                          <td className="p-3">
                            {seat.status === 'occupied' ? (
                              <span className="text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Studying
                              </span>
                            ) : seat.status === 'away' ? (
                              <span className="text-amber-700 font-semibold text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                On Break
                              </span>
                            ) : seat.status === 'maintenance' ? (
                              <span className="text-rose-700 font-semibold text-xs bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                Maintenance
                              </span>
                            ) : (
                              <span className="text-slate-600 font-semibold text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                Available
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-800">
                            {seat.occupantName ? (
                              <div>
                                <span className="font-semibold">{seat.occupantName}</span>
                                <span className="block font-mono text-[11px] text-slate-400">{seat.occupantPhone}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => adminToggleSeatFemaleReserved(seat.id)}
                              className={`px-2 py-0.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                                seat.isFemaleReserved
                                  ? 'bg-pink-50 border-pink-200 text-pink-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              {seat.isFemaleReserved ? 'Female Reserved' : 'General'}
                            </button>
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            {seat.status === 'occupied' || seat.status === 'away' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Force release seat ${seat.seatNumber}?`)) {
                                    adminForceReleaseSeat(seat.id);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs transition-colors cursor-pointer"
                              >
                                Release
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => adminToggleMaintenance(seat.id, 'Routine check')}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs transition-colors cursor-pointer"
                              >
                                {seat.status === 'maintenance' ? 'Unblock' : 'Maintenance'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete seat ${seat.seatNumber}?`)) {
                                  adminDeleteSeat(seat.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

          {/* ================================================================= */}
          {/* TAB 3: REGISTERED STUDENTS & PIN MANAGEMENT */}
          {/* ================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Registered Students & PIN Security Control
                  </h3>
                  <p className="text-xs text-slate-500">
                    Search students, reset security PINs, manage block lists, and refresh records from the cloud database.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSyncCloudUsers}
                  disabled={isRefreshingUsers}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingUsers ? 'animate-spin' : ''}`} />
                  <span>Refresh from Cloud</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search by student name, phone, student ID or target exam..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs">
                    <tr>
                      <th className="p-3 font-semibold">Student Name</th>
                      <th className="p-3 font-semibold">Phone Number</th>
                      <th className="p-3 font-semibold">Student ID</th>
                      <th className="p-3 font-semibold">PIN Security</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => {
                        const cleanPhone = student.phone.replace(/\D/g, '');
                        const isSuperAdmin = cleanPhone === '01581624202' || student.role === 'superadmin';

                        return (
                          <tr key={student.id || student.phone} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-medium text-slate-900">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                                  {student.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900">{student.name}</div>
                                  <div className="text-[11px] text-slate-400 capitalize">{student.gender || 'male'} • {student.targetExam || 'General'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 font-mono text-slate-700 font-medium">
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {student.phone}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-600">
                              {student.studentId || `DU-${cleanPhone.slice(-4)}`}
                            </td>
                            <td className="p-3">
                              {editingPinPhone === student.phone ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="New PIN"
                                    value={newPinValue}
                                    onChange={(e) => setNewPinValue(e.target.value)}
                                    className="w-20 px-2 py-1 border border-blue-400 rounded-lg text-xs font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSavePin(student.phone)}
                                    className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPinPhone(null)}
                                    className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer"
                                  >
                                    X
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold ${
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
                                      className="text-blue-600 hover:underline text-xs font-medium cursor-pointer"
                                      title="Reset PIN"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              {isSuperAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                                  Super Admin
                                </span>
                              ) : student.isBlocked ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs">
                                  <Ban className="w-3.5 h-3.5" />
                                  Blocked
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-1.5">
                              {!isSuperAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => adminToggleBlockStudent(student.phone)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
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
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
                        <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                          No registered users found matching search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB: GUIDELINES & CODE OF CONDUCT */}
          {/* ================================================================= */}
          {activeTab === 'guidelines' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span>Guidelines & Code of Conduct Management</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create, edit, and organize library discipline rules and conduct policies visible to all students.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isAddingRule && !editingRuleId) {
                      setIsAddingRule(false);
                    } else {
                      handleCancelRuleEdit();
                      setIsAddingRule(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer self-start sm:self-auto transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingRule ? 'Close Form' : 'Add New Guideline'}</span>
                </button>
              </div>

              {/* Add / Edit Rule Form */}
              {isAddingRule && (
                <form onSubmit={handleSaveRule} className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>{editingRuleId ? 'Edit Guideline / Rule' : 'Create New Library Rule'}</span>
                    </h4>
                    {editingRuleId && (
                      <button
                        type="button"
                        onClick={handleCancelRuleEdit}
                        className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Rule Title (English) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Absolute Silence & Phone Etiquette"
                        value={ruleTitle}
                        onChange={(e) => setRuleTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Rule Title (বাংলা)
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: পূর্ণ নীরবতা ও মোবাইল শিষ্টাচার"
                        value={ruleBengaliTitle}
                        onChange={(e) => setRuleBengaliTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Detailed Description (English) *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Mobile phones must strictly be set to silent or vibration mode inside study chambers..."
                        value={ruleDescription}
                        onChange={(e) => setRuleDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Detailed Description (বাংলা)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="স্টাডি রুমের ভেতর মোবাইল ফোন সম্পূর্ণ সাইলেন্ট বা ভাইব্রেশন মোডে রাখতে হবে..."
                        value={ruleBengaliDesc}
                        onChange={(e) => setRuleBengaliDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                      <select
                        value={ruleCategory}
                        onChange={(e) => setRuleCategory(e.target.value as LibraryRule['category'])}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="silence">🔇 Silence / Noise</option>
                        <option value="away">⏳ Break & Away Policy</option>
                        <option value="female">🌸 Female Zone</option>
                        <option value="cleanliness">🧹 Cleanliness & Safety</option>
                        <option value="general">📌 General Guideline</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Icon / Emoji</label>
                      <select
                        value={ruleIcon}
                        onChange={(e) => setRuleIcon(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500 font-mono"
                      >
                        <option value="🔇">🔇 Silence (Mute)</option>
                        <option value="⏳">⏳ Timer / Clock</option>
                        <option value="🌸">🌸 Flower / Female</option>
                        <option value="🔒">🔒 Lock / Security</option>
                        <option value="📌">📌 Pin / Important</option>
                        <option value="💡">💡 Lamp / Study</option>
                        <option value="☕">☕ Coffee / Refresh</option>
                        <option value="⚡">⚡ Power / Backup</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Target Branch</label>
                      <select
                        value={ruleBranchTarget}
                        onChange={(e) => setRuleBranchTarget(e.target.value as 'all' | BranchId)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="all">🌐 All Branches</option>
                        <option value="science_library">🔬 Science Library Only</option>
                        <option value="central_library">🏛️ Central Library Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Display Serial Order</label>
                      <input
                        type="number"
                        min={1}
                        value={ruleOrder}
                        onChange={(e) => setRuleOrder(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleCancelRuleEdit}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer transition-colors"
                    >
                      {editingRuleId ? 'Update Guideline' : 'Save Guideline'}
                    </button>
                  </div>
                </form>
              )}

              {/* Guidelines List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Active Guidelines & Code of Conduct ({rules.length})
                  </h4>
                  <span className="text-xs text-slate-400">
                    Changes reflect immediately in the public Guidelines Modal.
                  </span>
                </div>

                {rules.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5">
                    {rules
                      .slice()
                      .sort((a, b) => (a.order || 99) - (b.order || 99))
                      .map((rule, idx) => (
                        <div
                          key={rule.id}
                          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-xs"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-lg">{rule.icon || '📌'}</span>
                              <span className="font-bold text-slate-900 text-sm">
                                {idx + 1}. {rule.title}
                              </span>
                              {rule.bengaliTitle && (
                                <span className="text-xs text-slate-500 font-medium">
                                  ({rule.bengaliTitle})
                                </span>
                              )}
                              {rule.category && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                  {rule.category}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                {rule.branchId === 'all' || !rule.branchId
                                  ? '🌐 All Branches'
                                  : rule.branchId === 'science_library'
                                  ? '🔬 Science Branch'
                                  : '🏛️ Central Branch'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed pl-7">
                              {rule.description}
                            </p>

                            {rule.bengaliDescription && (
                              <p className="text-xs text-slate-500 leading-relaxed pl-7 italic">
                                {rule.bengaliDescription}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditRule(rule)}
                              className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Guideline"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete rule "${rule.title}"?`)) {
                                  deleteRule(rule.id);
                                }
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Guideline"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
                    No guidelines created yet. Click "Add New Guideline" to create center rules.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB: WI-FI & CENTER FACILITY AMENITIES */}
          {/* ================================================================= */}
          {activeTab === 'wifi' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-blue-600" />
                    <span>Wi-Fi Network & Center Amenities ({branchConfig.name})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure high-speed optical fiber Wi-Fi credentials, bandwidth notes, and study center amenities.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                    Active Branch: {branchConfig.name}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveWifiConfig} className="bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200 space-y-5">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Wi-Fi Network Credentials & Bandwidth</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Wi-Fi Network Name (SSID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="e.g. SCIENCE_LIB_5G_FAST"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Wi-Fi Password *
                    </label>
                    <input
                      type="text"
                      required
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="e.g. study@2026#pass"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-emerald-700 font-mono font-semibold text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dedicated Speed / Bandwidth
                    </label>
                    <input
                      type="text"
                      value={wifiSpeed}
                      onChange={(e) => setWifiSpeed(e.target.value)}
                      placeholder="e.g. 100 Mbps Dedicated Fiber"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Wi-Fi Usage Policy / Note
                    </label>
                    <textarea
                      rows={2}
                      value={wifiNotes}
                      onChange={(e) => setWifiNotes(e.target.value)}
                      placeholder="Optimized for online video lectures and research. High-volume torrents restricted."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Helpdesk / Network Support Phone
                    </label>
                    <input
                      type="text"
                      value={wifiHelpdesk}
                      onChange={(e) => setWifiHelpdesk(e.target.value)}
                      placeholder="e.g. 01581624202"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Center Amenities List Manager */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-900">
                      Center Facility Amenities (Visible to Students in Modal)
                    </label>
                    <span className="text-xs text-slate-400">
                      {wifiAmenitiesList.length} items configured
                    </span>
                  </div>

                  {/* Add New Amenity Item Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Individual desk LED lamps and power sockets"
                      value={newAmenityInput}
                      onChange={(e) => setNewAmenityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAmenityItem();
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddAmenityItem}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Add Item
                    </button>
                  </div>

                  {/* List of current amenities */}
                  <div className="space-y-2">
                    {wifiAmenitiesList.map((amenity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 text-slate-700 flex-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{amenity}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAmenityItem(idx)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  {wifiSavedSuccess ? (
                    <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Wi-Fi & Facility settings saved and synchronized with Cloud!
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Settings apply immediately for {branchConfig.name}.
                    </span>
                  )}

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Save Wi-Fi & Amenities
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB: NOTICES & ANNOUNCEMENTS */}
          {/* ================================================================= */}
          {activeTab === 'notices' && (
            <div className="space-y-4">
              <form onSubmit={handlePostNotice} className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-600" />
                    <span>{editingNoticeId ? 'Edit Active Announcement:' : 'Publish Notice / Urgent Announcement:'}</span>
                  </div>
                  {editingNoticeId && (
                    <button
                      type="button"
                      onClick={handleCancelNoticeEdit}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Notice Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Weekly Model Test & Extended Study Hours"
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Category & Urgency</label>
                    <select
                      value={noticeType}
                      onChange={(e) => {
                        const val = e.target.value as LibraryNotice['type'];
                        setNoticeType(val);
                        setNoticePriority(val === 'urgent' ? 'urgent' : 'info');
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="urgent">🔴 Urgent Announcement</option>
                      <option value="event">🎉 Special Event</option>
                      <option value="maintenance">🔧 Maintenance & Upgrades</option>
                      <option value="announcement">📢 General Bulletin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Detailed Message Content *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Write detailed announcement here..."
                      value={noticeContent}
                      onChange={(e) => setNoticeContent(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Target Branch</label>
                      <select
                        value={noticeTargetBranch}
                        onChange={(e) => setNoticeTargetBranch(e.target.value as 'all' | BranchId)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="all">🌐 All Branches</option>
                        <option value="science_library">🔬 Science Library Only</option>
                        <option value="central_library">🏛️ Central Library Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Priority Style</label>
                      <select
                        value={noticePriority}
                        onChange={(e) => setNoticePriority(e.target.value as LibraryNotice['priority'])}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="urgent">🔴 Urgent Banner</option>
                        <option value="info">🔵 Informational Notice</option>
                        <option value="guideline">🟢 Guideline Tip</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  {editingNoticeId && (
                    <button
                      type="button"
                      onClick={handleCancelNoticeEdit}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer transition-colors"
                  >
                    {editingNoticeId ? 'Update Notice' : 'Publish Notice'}
                  </button>
                </div>
              </form>

              <div className="space-y-2.5">
                <h4 className="text-sm font-bold text-slate-900">Active Notice Board ({notices.length})</h4>
                {notices.length > 0 ? (
                  notices.map((n) => (
                    <div key={n.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-3 shadow-xs">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            n.priority === 'urgent' || n.type === 'urgent'
                              ? 'bg-rose-100 text-rose-700'
                              : n.priority === 'info'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {(n.type || n.priority || 'ANNOUNCEMENT').toUpperCase()}
                          </span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{n.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {n.targetBranch === 'all' || !n.targetBranch
                              ? '🌐 All Branches'
                              : n.targetBranch === 'science_library'
                              ? '🔬 Science Branch'
                              : '🏛️ Central Branch'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditNotice(n)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                          title="Edit Notice"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteNotice(n.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
                    No active notices published.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: DATA BACKUP & CLOUD RECOVERY */}
          {/* ================================================================= */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Cloud Sync Status */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Cloud Real-time Sync & Storage (Supabase)</h4>
                      <p className="text-xs text-slate-500">
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
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs disabled:opacity-60 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                    <span>{isSyncingCloud ? 'Syncing...' : 'Sync Cloud Now'}</span>
                  </button>
                </div>

                {syncStatusMsg && (
                  <div className="p-3 rounded-xl bg-white/90 border border-blue-200 text-blue-800 text-xs flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{syncStatusMsg}</span>
                  </div>
                )}
              </div>

              {/* Supabase Realtime & State Diagnostic Inspector */}
              <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Realtime & Database State Diagnostics</span>
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          LIVE INSPECTOR
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        Verify realtime WebSocket subscriptions, database table accessibility, and inspect discrepancies with currently rendered local state.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunLiveDiagnostics}
                    disabled={isRunningDiag}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Terminal className={`w-3.5 h-3.5 ${isRunningDiag ? 'animate-spin' : ''}`} />
                    <span>{isRunningDiag ? 'Running Test...' : 'Run Diagnostics Now'}</span>
                  </button>
                </div>

                {diagnosticReport ? (
                  <div className="space-y-3 font-mono text-xs">
                    {/* Status Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                        <div className="text-[11px] text-slate-400 uppercase">Realtime Channel</div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              diagnosticReport.realtimeChannelStatus === 'SUBSCRIBED'
                                ? 'bg-emerald-400 animate-pulse'
                                : 'bg-rose-400'
                            }`}
                          />
                          <span className="font-bold text-white">
                            {diagnosticReport.realtimeChannelStatus}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                        <div className="text-[11px] text-slate-400 uppercase">`system_config` Table</div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              diagnosticReport.tables.systemConfigAccessible
                                ? 'bg-emerald-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          <span className="font-bold text-white truncate">
                            {diagnosticReport.tables.systemConfigAccessible ? 'Accessible & Ready' : 'Permission / Table Error'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                        <div className="text-[11px] text-slate-400 uppercase">State Match</div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              diagnosticReport.renderedStateComparison?.cloudMatchesLocal
                                ? 'bg-emerald-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          <span className="font-bold text-white">
                            {diagnosticReport.renderedStateComparison?.cloudMatchesLocal
                              ? '100% In Sync'
                              : 'Mismatch Detected'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Details */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-slate-300 font-semibold flex items-center justify-between">
                        <span>Comparison: Cloud vs Currently Rendered Screen</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          Tested at {new Date(diagnosticReport.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                        <div>
                          <span className="text-slate-500 block">Rendered Rooms:</span>
                          <span className="font-bold text-white">{diagnosticReport.renderedStateComparison?.localRoomsCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Cloud Rooms:</span>
                          <span className="font-bold text-white">{diagnosticReport.tables.cloudRoomsCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Rendered Bookings:</span>
                          <span className="font-bold text-amber-300">{diagnosticReport.renderedStateComparison?.localOccupiedCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Cloud Bookings:</span>
                          <span className="font-bold text-amber-300">{diagnosticReport.tables.cloudOccupiedSeatsCount}</span>
                        </div>
                      </div>

                      {/* Discrepancy Warnings */}
                      {diagnosticReport.renderedStateComparison?.discrepancyReasons &&
                        diagnosticReport.renderedStateComparison.discrepancyReasons.length > 0 && (
                          <div className="mt-2 p-2.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-200 text-xs space-y-1">
                            <div className="font-bold text-amber-300">Potential Discrepancy Reasons:</div>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                              {diagnosticReport.renderedStateComparison.discrepancyReasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {diagnosticReport.tables.systemConfigError && (
                        <div className="mt-2 p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
                          <div className="font-bold text-rose-300">Supabase Error Message:</div>
                          <div className="text-[11px] font-mono mt-0.5">{diagnosticReport.tables.systemConfigError}</div>
                          <div className="text-[11px] text-rose-400 mt-1 font-sans">
                            Run the SQL table script in Supabase SQL editor to enable the `system_config` table and public RLS permissions.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                    Click &quot;Run Diagnostics Now&quot; to test your Supabase subscription, inspect cloud vs rendered seat counts, and detect synchronization issues.
                  </div>
                )}
              </div>

              {/* JSON Backup & Restore Tools */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Export JSON Backup Snapshot</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Download a full JSON snapshot of all rooms, seats, notices, and registered users to your computer.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Full Backup File (.json)</span>
                  </button>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    <span>Restore from Backup (Import)</span>
                  </div>
                  <p className="text-xs text-slate-500">
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
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Select Backup JSON File to Restore</span>
                  </button>
                </div>
              </div>

              {/* Maintenance & Reset */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Maintenance & Factory Reset Tools:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-800 text-xs">Nightly Auto-Reset</div>
                    <p className="text-xs text-slate-500">
                      Release all active seats to open them for the next study day.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Release all occupied seats and reset for the day?')) {
                          triggerDailyAutoReset();
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Trigger Daily Reset Now
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-800 text-xs">Restore Factory Defaults</div>
                    <p className="text-xs text-slate-500">
                      Reset database to default initial structure and rooms.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Warning: This will restore default data. Continue?')) {
                          resetToDefaultData();
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Restore Default Database
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 6: ATTENDANCE LOGS */}
          {/* ================================================================= */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Daily Attendance Logs & History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time student check-in audit logs and access tokens.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportAttendance}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Export to CSV Spreadsheet</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs">
                    <tr>
                      <th className="p-3 font-semibold">Date</th>
                      <th className="p-3 font-semibold">Student Name</th>
                      <th className="p-3 font-semibold">Phone</th>
                      <th className="p-3 font-semibold">Room & Seat</th>
                      <th className="p-3 font-semibold">Check-In</th>
                      <th className="p-3 font-semibold">Pass Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-mono text-xs">
                    {attendanceRecords.length > 0 ? (
                      attendanceRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-slate-500">{record.dateStr}</td>
                          <td className="p-3 font-sans font-semibold text-slate-800">
                            {record.studentName}
                          </td>
                          <td className="p-3 text-slate-500">{record.studentPhone}</td>
                          <td className="p-3 text-blue-700">
                            {record.seatNumber} ({record.roomName.split('(')[0]})
                          </td>
                          <td className="p-3 text-emerald-700 font-sans">
                            {new Date(record.checkInTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-3 text-slate-500">{record.passCode}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                          No attendance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 7: BRANCH SETTINGS */}
          {/* ================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <form
                onSubmit={handleSaveSettings}
                className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4"
              >
                <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span>Branch Social & External Links ({branchConfig.name}):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Official Facebook Page URL
                    </label>
                    <input
                      type="url"
                      required
                      value={fbUrl}
                      onChange={(e) => setFbUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Facebook Page Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fbPageName}
                      onChange={(e) => setFbPageName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Follower Badge Text
                    </label>
                    <input
                      type="text"
                      value={fbFollowers}
                      onChange={(e) => setFbFollowers(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Memorizer App URL
                    </label>
                    <input
                      type="url"
                      value={memoUrl}
                      onChange={(e) => setMemoUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  {settingsSaved && (
                    <span className="text-emerald-700 text-xs font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Links successfully updated!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="ml-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Update Links
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 bg-white border-t border-slate-200 py-4 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
          <div>
            Smart Library Master Control Panel • {branchConfig.name}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToPortal}
              className="hover:text-slate-800 font-medium transition-colors cursor-pointer"
            >
              Home Portal
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={onOpenSeats}
              className="hover:text-slate-800 font-medium transition-colors cursor-pointer"
            >
              Seat Grid
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
