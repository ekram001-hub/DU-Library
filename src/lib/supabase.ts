import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

// Default Supabase project URL & Public Anon Key from user configuration
const DEFAULT_SUPABASE_URL = 'https://mqrpjhyxfngngegetflb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcnBqaHl4Zm5nbmdlZ2V0ZmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMjg4MTEsImV4cCI6MjEwMjgwNDgxMX0.n0qjKmDlFO9beIh2R2Gv_SjYppmijlvPp2h-YehCOiM';

// Ready-to-execute SQL Script for Supabase SQL Editor
export const SUPABASE_SETUP_SQL = `-- =========================================================================
-- SMART STUDY CENTER & LIBRARY CLOUD SYNCHRONIZATION SCHEMA
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Click RUN
-- =========================================================================

-- 1. Create table for live seat reservations, rooms, rules, wifi & notices
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create table for registered student profiles & login PINs
CREATE TABLE IF NOT EXISTS public.students (
  phone TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  student_id TEXT,
  gender TEXT DEFAULT 'male',
  target_exam TEXT,
  pin TEXT,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 4. Clean up any previous policies to allow fresh permissive rules
DROP POLICY IF EXISTS "Allow public read system_config" ON public.system_config;
DROP POLICY IF EXISTS "Allow public write system_config" ON public.system_config;
DROP POLICY IF EXISTS "Allow public read students" ON public.students;
DROP POLICY IF EXISTS "Allow public write students" ON public.students;

-- 5. Create Permissive Policies for Web Clients (Public/Anon & Auth)
CREATE POLICY "Allow public read system_config"
  ON public.system_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public write system_config"
  ON public.system_config FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read students"
  ON public.students FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public write students"
  ON public.students FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Enable Realtime Replication for instant live seat status changes
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_config;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
`;

// Get credentials from environment or fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  localStorage.getItem('supabase_anon_key') ||
  DEFAULT_SUPABASE_ANON_KEY;

// Singleton client instance
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabaseInstance;
}

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseAnonKey && supabaseAnonKey.length > 20);
};

export const SUPABASE_PROJECT_URL = supabaseUrl;

/**
 * Fetch Student profile from Supabase by phone number (Auto-fill on return)
 */
export async function fetchStudentByPhone(phone: string): Promise<{
  name: string;
  phone: string;
  email?: string;
  studentId?: string;
  gender?: string;
  targetExam?: string;
  pin?: string;
  isBlocked?: boolean;
} | null> {
  try {
    const client = getSupabase();
    if (!client || !phone.trim()) return null;

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const { data, error } = await client
      .from('students')
      .select('*')
      .or(`phone.eq.${phone.trim()},phone.eq.${cleanPhone}`)
      .maybeSingle();

    if (error || !data) return null;

    return {
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      studentId: data.student_id || undefined,
      gender: data.gender || 'male',
      targetExam: data.target_exam || undefined,
      pin: data.pin || undefined,
      isBlocked: Boolean(data.is_blocked),
    };
  } catch (err) {
    console.warn('Supabase fetch student by phone error:', err);
    return null;
  }
}

/**
 * Backup / Sync Student profile to Supabase database by Phone number
 */
export async function syncStudentToCloud(student: {
  name: string;
  phone: string;
  email?: string;
  studentId?: string;
  gender?: string;
  targetExam?: string;
  pin?: string;
  isBlocked?: boolean;
}): Promise<{ success: boolean; error?: unknown }> {
  try {
    const client = getSupabase();
    if (!client) return { success: false };

    const { error } = await client.from('students').upsert(
      {
        phone: student.phone,
        name: student.name,
        email: student.email || null,
        student_id: student.studentId || null,
        gender: student.gender || 'male',
        target_exam: student.targetExam || null,
        pin: student.pin || null,
        is_blocked: Boolean(student.isBlocked),
        last_active: new Date().toISOString(),
      },
      { onConflict: 'phone' }
    );

    if (error) {
      console.warn('Supabase students table sync notice:', error.message);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.warn('Supabase sync exception:', err);
    return { success: false, error: err };
  }
}

/**
 * Fetch all registered students from Supabase (for Admin Directory)
 */
export async function fetchAllStudentsFromCloud(): Promise<Array<{
  phone: string;
  name: string;
  email?: string;
  student_id?: string;
  gender?: string;
  target_exam?: string;
  pin?: string;
  is_blocked?: boolean;
  created_at?: string;
  last_active?: string;
}>> {
  try {
    const client = getSupabase();
    if (!client) return [];

    const { data, error } = await client
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }
    return data;
  } catch (err) {
    console.warn('Supabase fetchAllStudents error:', err);
    return [];
  }
}

let realtimeChannel: ReturnType<SupabaseClient['channel']> | null = null;
let realtimeChannelStatus: string = 'DISCONNECTED';
let lastRealtimeEventAt: string | null = null;
let lastRealtimeError: string | null = null;

export type RealtimeStatePayload = {
  rooms?: unknown[];
  seats?: unknown[];
  notices?: unknown[];
  branchesConfig?: unknown;
  rules?: unknown[];
  wifiFacilities?: unknown;
  wifiNetworks?: unknown[];
};

const realtimeListeners = new Set<(payload: RealtimeStatePayload) => void>();

function notifyAllRealtimeListeners(payload: RealtimeStatePayload) {
  if (!payload || typeof payload !== 'object') return;
  lastRealtimeEventAt = new Date().toISOString();
  realtimeListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (e) {
      console.warn('[Supabase Realtime] Listener callback error:', e);
    }
  });
}

/**
 * Initialize / Get shared Supabase Realtime Channel
 */
export function getRealtimeChannel() {
  const client = getSupabase();
  if (!client) return null;
  if (!realtimeChannel) {
    realtimeChannel = client.channel('smart_library_realtime_sync', {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    // 1. Listen for Broadcast messages (Instant cross-device WebSocket)
    realtimeChannel.on(
      'broadcast',
      { event: 'STATE_CHANGED' },
      (event: { payload?: RealtimeStatePayload }) => {
        if (event && event.payload) {
          notifyAllRealtimeListeners(event.payload);
        }
      }
    );

    // 2. Also listen to Postgres table changes on system_config table
    realtimeChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'system_config', filter: 'key=eq.library_live_state' },
      (payload) => {
        if (payload.new && (payload.new as { value?: unknown }).value) {
          const val = (payload.new as { value: RealtimeStatePayload }).value;
          notifyAllRealtimeListeners(val);
        }
      }
    );

    realtimeChannel.subscribe((status, err) => {
      realtimeChannelStatus = status;
      if (err) {
        lastRealtimeError = err.message || String(err);
      }
      if (status === 'SUBSCRIBED') {
        console.log('[Supabase Realtime] Connected and listening for live seat & room updates.');
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('[Supabase Realtime] Channel Error:', err);
      }
    });
  }
  return realtimeChannel;
}

export interface SupabaseDiagnosticReport {
  timestamp: string;
  isConfigured: boolean;
  supabaseUrl: string;
  hasAnonKey: boolean;
  realtimeChannelStatus: string;
  lastRealtimeEventAt: string | null;
  lastRealtimeError: string | null;
  tables: {
    systemConfigAccessible: boolean;
    systemConfigStatus: string;
    systemConfigError?: string;
    cloudStateKeyPresent: boolean;
    cloudRoomsCount: number;
    cloudSeatsCount: number;
    cloudOccupiedSeatsCount: number;
    studentsTableAccessible: boolean;
    studentsCount: number;
  };
  renderedStateComparison?: {
    localSeatsCount: number;
    localOccupiedCount: number;
    localRoomsCount: number;
    cloudMatchesLocal: boolean;
    discrepancyReasons: string[];
  };
}

/**
 * Diagnostic tool to verify Supabase connections, tables, and realtime status
 */
export async function runSupabaseDiagnostics(localRooms?: unknown[], localSeats?: unknown[]): Promise<SupabaseDiagnosticReport> {
  const client = getSupabase();
  const report: SupabaseDiagnosticReport = {
    timestamp: new Date().toISOString(),
    isConfigured: isSupabaseConfigured(),
    supabaseUrl: supabaseUrl,
    hasAnonKey: Boolean(supabaseAnonKey && supabaseAnonKey.length > 20),
    realtimeChannelStatus: realtimeChannelStatus,
    lastRealtimeEventAt: lastRealtimeEventAt,
    lastRealtimeError: lastRealtimeError,
    tables: {
      systemConfigAccessible: false,
      systemConfigStatus: 'Testing...',
      cloudStateKeyPresent: false,
      cloudRoomsCount: 0,
      cloudSeatsCount: 0,
      cloudOccupiedSeatsCount: 0,
      studentsTableAccessible: false,
      studentsCount: 0,
    },
  };

  if (!client) {
    report.tables.systemConfigStatus = 'Client initialization failed';
    return report;
  }

  // 1. Test system_config table
  try {
    const { data: configData, error: configError } = await client
      .from('system_config')
      .select('key, value, updated_at')
      .eq('key', 'library_live_state')
      .maybeSingle();

    if (configError) {
      report.tables.systemConfigAccessible = false;
      report.tables.systemConfigStatus = `Error: ${configError.message} (Code: ${configError.code})`;
      report.tables.systemConfigError = configError.message;
    } else {
      report.tables.systemConfigAccessible = true;
      report.tables.systemConfigStatus = 'Connected & Queryable';
      if (configData && configData.value) {
        report.tables.cloudStateKeyPresent = true;
        const val = configData.value as { rooms?: unknown[]; seats?: Array<{ status?: string }> };
        report.tables.cloudRoomsCount = Array.isArray(val.rooms) ? val.rooms.length : 0;
        report.tables.cloudSeatsCount = Array.isArray(val.seats) ? val.seats.length : 0;
        report.tables.cloudOccupiedSeatsCount = Array.isArray(val.seats)
          ? val.seats.filter((s) => s.status === 'occupied' || s.status === 'away').length
          : 0;
      }
    }
  } catch (err: unknown) {
    report.tables.systemConfigStatus = `Exception: ${err instanceof Error ? err.message : String(err)}`;
  }

  // 2. Test students table
  try {
    const { data: studentsData, error: studentsError } = await client
      .from('students')
      .select('phone', { count: 'exact' });

    if (!studentsError && studentsData) {
      report.tables.studentsTableAccessible = true;
      report.tables.studentsCount = studentsData.length;
    }
  } catch {
    report.tables.studentsTableAccessible = false;
  }

  // 3. Compare with currently rendered local state
  if (Array.isArray(localRooms) && Array.isArray(localSeats)) {
    const localOccupied = (localSeats as Array<{ status?: string }>).filter(
      (s) => s.status === 'occupied' || s.status === 'away'
    ).length;

    const discrepancies: string[] = [];
    if (!report.tables.systemConfigAccessible) {
      discrepancies.push('Supabase table `system_config` is not accessible or missing RLS policy.');
    }
    if (!report.tables.cloudStateKeyPresent) {
      discrepancies.push('The cloud document `library_live_state` has not been synced to Supabase yet.');
    }
    if (report.tables.cloudSeatsCount !== localSeats.length) {
      discrepancies.push(
        `Seat count mismatch: Cloud has ${report.tables.cloudSeatsCount} seats, Local UI has ${localSeats.length} seats.`
      );
    }
    if (report.tables.cloudOccupiedSeatsCount !== localOccupied) {
      discrepancies.push(
        `Active booking mismatch: Cloud has ${report.tables.cloudOccupiedSeatsCount} active bookings, Local UI has ${localOccupied}.`
      );
    }
    if (realtimeChannelStatus !== 'SUBSCRIBED') {
      discrepancies.push(`Realtime subscription is currently "${realtimeChannelStatus}" (Expected: "SUBSCRIBED").`);
    }

    report.renderedStateComparison = {
      localSeatsCount: localSeats.length,
      localOccupiedCount: localOccupied,
      localRoomsCount: localRooms.length,
      cloudMatchesLocal: discrepancies.length === 0,
      discrepancyReasons: discrepancies,
    };
  }

  return report;
}

/**
 * Broadcast live state change to all clients via Supabase Realtime WebSocket
 */
export function broadcastStateViaSupabase(payload: {
  rooms?: unknown[];
  seats?: unknown[];
  notices?: unknown[];
  branchesConfig?: unknown;
  rules?: unknown[];
  wifiFacilities?: unknown;
}) {
  try {
    const channel = getRealtimeChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'STATE_CHANGED',
        payload,
      });
    }
  } catch (err) {
    console.warn('[Supabase Realtime] Broadcast error:', err);
  }
}

/**
 * Subscribe to Supabase Realtime state updates
 */
export function subscribeToSupabaseRealtime(
  callback: (payload: RealtimeStatePayload) => void
): () => void {
  try {
    getRealtimeChannel();
    realtimeListeners.add(callback);

    return () => {
      realtimeListeners.delete(callback);
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Subscribe error:', err);
    return () => {};
  }
}

/**
 * Sync / Backup full library configuration (Rooms, Seats, Notices, Rules, Wifi) to cloud storage
 */
export async function syncLibraryStateToCloud(payload: {
  rooms?: unknown[];
  seats?: unknown[];
  notices?: unknown[];
  branchesConfig?: unknown;
  rules?: unknown[];
  wifiFacilities?: unknown;
  wifiNetworks?: unknown[];
}): Promise<{ success: boolean; error?: unknown }> {
  try {
    // 1. Instantly broadcast to all connected clients in real-time
    broadcastStateViaSupabase(payload);

    const client = getSupabase();
    if (!client) return { success: false };

    // 2. Persist in system_config table in Supabase
    const { error } = await client.from('system_config').upsert(
      {
        key: 'library_live_state',
        value: payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

    if (error) {
      // Non-fatal if table not yet created
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Fetch library configuration (Rooms, Seats, Notices, Rules, Wifi) from cloud
 */
export async function fetchLibraryStateFromCloud(): Promise<{
  rooms?: unknown[];
  seats?: unknown[];
  notices?: unknown[];
  branchesConfig?: unknown;
  rules?: unknown[];
  wifiFacilities?: unknown;
  wifiNetworks?: unknown[];
} | null> {
  try {
    const client = getSupabase();
    if (!client) return null;

    const { data, error } = await client
      .from('system_config')
      .select('value')
      .eq('key', 'library_live_state')
      .single();

    if (error || !data) return null;
    return data.value;
  } catch (err) {
    return null;
  }
}

/**
 * Sign In with Google OAuth via Supabase using popup window flow for iframe compatibility
 */
export async function signInWithGoogle(): Promise<{ error: Error | null; data?: unknown }> {
  const client = getSupabase();
  if (!client) {
    return {
      error: new Error('Supabase anon key is missing. Please provide VITE_SUPABASE_ANON_KEY.'),
    };
  }

  try {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: true,
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;

    if (data?.url) {
      const popup = window.open(
        data.url,
        'google_oauth_popup',
        'width=500,height=600,menubar=no,toolbar=no,location=no,status=no'
      );
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // If popup blocked, attempt direct location assignment
        window.location.href = data.url;
      }
    }

    return { data, error: null };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { error };
  }
}

/**
 * Sign out from Supabase
 */
export async function signOutSupabase(): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) return { error: null };

  try {
    const { error } = await client.auth.signOut();
    return { error };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { error };
  }
}

/**
 * Get current logged in Supabase user
 */
export async function getCurrentSupabaseUser(): Promise<SupabaseUser | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data } = await client.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}
