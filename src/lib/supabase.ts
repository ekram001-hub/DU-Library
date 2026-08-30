import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
// Single source of truth for the database migration: the exact same file lives
// in `supabase/01_security_core.sql` so it can be opened, reviewed and run
// directly from the repository, and it is also handed to the admin console's
// "Copy SQL" button through SUPABASE_SETUP_SQL below.
import SECURITY_CORE_SQL from '../../supabase/01_security_core.sql?raw';

// Default Supabase project URL & Public Anon Key from user configuration.
//
// SECURITY NOTE: the "anon" key is designed to be public — it ships in the
// browser bundle by design and is NOT a secret. Real security comes from
// Supabase Row Level Security (RLS) policies, NOT from hiding the anon key.
// Prefer setting VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY via environment
// variables (see .env.example) so you can rotate the project without editing
// source code.
const DEFAULT_SUPABASE_URL = 'https://mqrpjhyxfngngegetflb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcnBqaHl4Zm5nbmdlZ2V0ZmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMjg4MTEsImV4cCI6MjEwMjgwNDgxMX0.n0qjKmDlFO9beIh2R2Gv_SjYppmijlvPp2h-YehCOiM';

/**
 * Ready-to-execute migration script.
 *
 * The text is imported verbatim from `supabase/01_security_core.sql`, so the
 * repository, this constant and the admin console's "Copy SQL" button can
 * never drift apart. It:
 *   - hashes student PINs (`pin_hash`) and drops the plaintext `pin` column,
 *   - creates the `admins` allow-list + `public.is_admin()`,
 *   - replaces the old `USING (true)` RLS policies with least-privilege ones,
 *   - removes `students` from the Realtime publication.
 */
export const SUPABASE_SETUP_SQL: string = SECURITY_CORE_SQL;

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


/* ========================================================================== */
/*  STUDENT PROFILES                                                           */
/* ========================================================================== */
/*  Two rules apply to every function in this section:                       */
/*    * a raw PIN is never accepted, returned or persisted — only the         */
/*      PBKDF2-SHA256 credential produced by `hashPin()` (see lib/crypto.ts); */
/*    * writes go through the `upsert_student_profile` RPC, which validates    */
/*      the hash shape server-side and cannot touch `is_blocked`.             */
/* ========================================================================== */

const PIN_HASH_COLUMN = 'pin_hash';

/** True when a Postgres error means "this object does not exist yet". */
function isMissingSchemaObject(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  if (!e) return false;
  // 42P01 undefined_table, 42883 undefined_function, 42703 undefined_column
  if (e.code === '42P01' || e.code === '42883' || e.code === '42703') return true;
  return /does not exist/i.test(e.message || '');
}

/** True when a Postgres error is a Row Level Security rejection. */
function isRowLevelSecurityError(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  if (!e) return false;
  if (e.code === '42501') return true;
  return /row-level security|row level security/i.test(e.message || '');
}

export interface CloudStudentRow {
  phone: string;
  name: string;
  email?: string;
  student_id?: string;
  gender?: string;
  target_exam?: string;
  /** PBKDF2-SHA256 credential. NEVER a plaintext PIN. */
  pin_hash?: string;
  is_blocked?: boolean;
  created_at?: string;
  last_active?: string;
}

/**
 * Look up a student by phone for the "welcome back" auto-fill.
 *
 * Prefers the `lookup_student_by_phone` RPC, which is SECURITY DEFINER and
 * deliberately omits the e-mail address and the PIN hash. Falls back to a
 * direct select on pre-migration projects, but never asks for the credential
 * column.
 */
export async function fetchStudentByPhone(phone: string): Promise<{
  name: string;
  phone: string;
  studentId?: string;
  gender?: string;
  targetExam?: string;
  isBlocked?: boolean;
} | null> {
  try {
    const client = getSupabase();
    if (!client || !phone.trim()) return null;

    const cleanPhone = phone.trim().replace(/\D/g, '');

    const rpc = await client.rpc('lookup_student_by_phone', { p_phone: cleanPhone });
    if (!rpc.error) {
      const row = (Array.isArray(rpc.data) ? rpc.data[0] : rpc.data) as
        | {
            name?: string;
            phone?: string;
            student_id?: string;
            gender?: string;
            target_exam?: string;
            is_blocked?: boolean;
          }
        | null
        | undefined;
      if (!row || !row.phone) return null;
      return {
        name: row.name || 'Registered Student',
        phone: row.phone,
        studentId: row.student_id || undefined,
        gender: row.gender || 'male',
        targetExam: row.target_exam || undefined,
        isBlocked: Boolean(row.is_blocked),
      };
    }

    if (!isMissingSchemaObject(rpc.error) && !isRowLevelSecurityError(rpc.error)) {
      console.warn('Supabase lookup_student_by_phone error:', rpc.error.message);
      return null;
    }

    // Legacy fallback (RPC not deployed yet).
    const { data, error } = await client
      .from('students')
      .select('name, phone, student_id, gender, target_exam, is_blocked')
      .or(`phone.eq.${phone.trim()},phone.eq.${cleanPhone}`)
      .maybeSingle();

    if (error || !data) return null;

    return {
      name: data.name,
      phone: data.phone,
      studentId: data.student_id || undefined,
      gender: data.gender || 'male',
      targetExam: data.target_exam || undefined,
      isBlocked: Boolean(data.is_blocked),
    };
  } catch (err) {
    console.warn('Supabase fetch student by phone error:', err);
    return null;
  }
}

/**
 * Backup / sync a student profile to Supabase, keyed by phone number.
 *
 * `pinHash` must already be hashed — passing a raw PIN here is a bug and the
 * database will reject it with the `students_pin_hash_format_chk` constraint.
 */
export async function syncStudentToCloud(student: {
  name: string;
  phone: string;
  email?: string;
  studentId?: string;
  gender?: string;
  targetExam?: string;
  pinHash?: string;
  isBlocked?: boolean;
}): Promise<{ success: boolean; error?: unknown }> {
  try {
    const client = getSupabase();
    if (!client) return { success: false };

    // Preferred path: validated, SECURITY DEFINER RPC.
    const rpc = await client.rpc('upsert_student_profile', {
      p_name: student.name,
      p_phone: student.phone,
      p_email: student.email || null,
      p_student_id: student.studentId || null,
      p_gender: student.gender || 'male',
      p_target_exam: student.targetExam || null,
      p_pin_hash: student.pinHash || null,
    });

    if (!rpc.error) return { success: true };

    if (!isMissingSchemaObject(rpc.error) && !isRowLevelSecurityError(rpc.error)) {
      console.warn('Supabase upsert_student_profile error:', rpc.error.message);
      return { success: false, error: rpc.error };
    }

    // Legacy fallback for projects that have not run the migration yet.
    const { error } = await client.from('students').upsert(
      {
        phone: student.phone,
        name: student.name,
        email: student.email || null,
        student_id: student.studentId || null,
        gender: student.gender || 'male',
        target_exam: student.targetExam || null,
        [PIN_HASH_COLUMN]: student.pinHash || null,
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
 * Update only the stored credential for one student (admin PIN reset).
 */
export async function updateStudentPinHash(
  phone: string,
  pinHash: string | null
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const client = getSupabase();
    if (!client) return { success: false };
    const cleanPhone = phone.trim().replace(/\D/g, '');

    const { error } = await client
      .from('students')
      .update({ [PIN_HASH_COLUMN]: pinHash, last_active: new Date().toISOString() })
      .or(`phone.eq.${cleanPhone},phone.eq.${phone.trim()}`);

    if (error) {
      if (isRowLevelSecurityError(error)) {
        console.warn(
          'Supabase refused the PIN update: the signed-in account is not in the `admins` table.'
        );
      } else {
        console.warn('Supabase updateStudentPinHash error:', error.message);
      }
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.warn('Supabase updateStudentPinHash exception:', err);
    return { success: false, error: err };
  }
}

/**
 * Admin block/unblock. `upsert_student_profile` deliberately never writes
 * `is_blocked` (see 01_security_core.sql) so a student can't clear their own
 * block by re-registering — but that also means routing this through the
 * same RPC silently drops the admin's toggle. This talks to the `students`
 * table directly instead, which the `students_admin_update` RLS policy
 * already allows for a signed-in admin (`public.is_admin()`).
 */
export async function updateStudentBlockedStatus(
  phone: string,
  isBlocked: boolean
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const client = getSupabase();
    if (!client) return { success: false };
    const cleanPhone = phone.trim().replace(/\D/g, '');

    const { error } = await client
      .from('students')
      .update({ is_blocked: isBlocked, last_active: new Date().toISOString() })
      .or(`phone.eq.${cleanPhone},phone.eq.${phone.trim()}`);

    if (error) {
      if (isRowLevelSecurityError(error)) {
        console.warn(
          'Supabase refused the block/unblock: the signed-in account is not in the `admins` table.'
        );
      } else {
        console.warn('Supabase updateStudentBlockedStatus error:', error.message);
      }
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.warn('Supabase updateStudentBlockedStatus exception:', err);
    return { success: false, error: err };
  }
}

/**
 * Admin "delete student" from the registry. Without this, deleteRegisteredStudent
 * only ever touched the admin's own local/localStorage list — the row stayed
 * in Postgres and `refreshStudentsFromCloud()` (or a fresh browser) would
 * bring the "deleted" student straight back. The `students_admin_delete` RLS
 * policy already permits this for a signed-in admin (`public.is_admin()`).
 */
export async function deleteStudentFromCloud(
  phone: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const client = getSupabase();
    if (!client) return { success: false };
    const cleanPhone = phone.trim().replace(/\D/g, '');

    const { error } = await client
      .from('students')
      .delete()
      .or(`phone.eq.${cleanPhone},phone.eq.${phone.trim()}`);

    if (error) {
      if (isRowLevelSecurityError(error)) {
        console.warn(
          'Supabase refused the delete: the signed-in account is not in the `admins` table.'
        );
      } else {
        console.warn('Supabase deleteStudentFromCloud error:', error.message);
      }
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.warn('Supabase deleteStudentFromCloud exception:', err);
    return { success: false, error: err };
  }
}

/**
 * Fetch all registered students from Supabase (Admin Directory only).
 *
 * After the security migration this is gated by RLS: only a JWT whose e-mail
 * is present in the `admins` table gets any rows back.
 */
export async function fetchAllStudentsFromCloud(): Promise<CloudStudentRow[]> {
  try {
    const client = getSupabase();
    if (!client) return [];

    const { data, error } = await client
      .from('students')
      .select(
        'phone, name, email, student_id, gender, target_exam, pin_hash, is_blocked, created_at, last_active'
      )
      .order('created_at', { ascending: false });

    if (error) {
      if (isRowLevelSecurityError(error)) {
        console.warn('Supabase students directory is admin-only (RLS).');
      } else if (!isMissingSchemaObject(error)) {
        console.warn('Supabase fetchAllStudents error:', error.message);
      }
      return [];
    }
    return (data || []) as CloudStudentRow[];
  } catch (err) {
    console.warn('Supabase fetchAllStudents error:', err);
    return [];
  }
}

/* ========================================================================== */
/*  SERVER-SIDE ADMIN AUTHORIZATION                                            */
/* ========================================================================== */
/*  The decision "is this user an administrator?" is made by Postgres, not by  */
/*  this bundle. The browser presents a Supabase-signed JWT, and the RLS       */
/*  policy on `admins` only returns a row when that JWT's e-mail matches.      */
/*  Editing `localStorage` or a variable in DevTools cannot produce a valid    */
/*  signature, so it can no longer grant admin access.                         */
/* ========================================================================== */

export interface AdminRecord {
  email: string;
  name: string | null;
  role: 'admin' | 'superadmin';
  branch_access: string;
}

export type AdminCheckResult =
  | { status: 'granted'; admin: AdminRecord }
  | { status: 'denied'; message: string }
  | { status: 'not_configured'; message: string }
  | { status: 'no_session'; message: string };

/**
 * Ask the database whether the *currently signed-in* Supabase user is an
 * administrator.
 */
export async function checkAdminAccess(email?: string | null): Promise<AdminCheckResult> {
  const client = getSupabase();
  if (!client) {
    return { status: 'no_session', message: 'Supabase is not configured.' };
  }

  try {
    const { data: sessionData } = await client.auth.getSession();
    const sessionEmail = (sessionData?.session?.user?.email || email || '').trim().toLowerCase();
    if (!sessionEmail) {
      return {
        status: 'no_session',
        message: 'Sign in with an administrator account first.',
      };
    }

    const { data, error } = await client
      .from('admins')
      .select('email, name, role, branch_access')
      .ilike('email', sessionEmail)
      .maybeSingle();

    if (error) {
      if (isMissingSchemaObject(error)) {
        return {
          status: 'not_configured',
          message:
            'The `admins` table does not exist yet. Run supabase/01_security_core.sql in the Supabase SQL editor.',
        };
      }
      return { status: 'denied', message: error.message };
    }

    // RLS returned no row => this JWT's e-mail is not on the allow-list.
    if (!data) {
      return {
        status: 'denied',
        message: 'This account is not on the administrator allow-list.',
      };
    }

    return {
      status: 'granted',
      admin: {
        email: String(data.email || sessionEmail).toLowerCase(),
        name: (data.name as string | null) ?? null,
        role: data.role === 'superadmin' ? 'superadmin' : 'admin',
        branch_access: (data.branch_access as string) || 'all',
      },
    };
  } catch (err) {
    return {
      status: 'denied',
      message: err instanceof Error ? err.message : 'Administrator check failed.',
    };
  }
}

/**
 * Password sign-in against Supabase Auth. The password is never compared in
 * this bundle and there is no client-side password list any more.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: SupabaseUser | null; error: string | null }> {
  const client = getSupabase();
  if (!client) return { user: null, error: 'Supabase is not configured.' };

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { user: null, error: error.message };
    return { user: data.user, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : 'Sign-in failed.',
    };
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
  /**
   * Is server-side authorization in place, and does it accept this session?
   * `configured: false` means the `admins` table is missing, i.e. the security
   * migration has not been run yet.
   */
  adminAuthorization: {
    configured: boolean;
    granted: boolean;
    status: string;
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
    adminAuthorization: {
      configured: false,
      granted: false,
      status: 'Checking...',
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

  // 2. Is server-side admin authorization active for this session?
  try {
    const adminCheck = await checkAdminAccess();
    report.adminAuthorization = {
      configured: adminCheck.status !== 'not_configured',
      granted: adminCheck.status === 'granted',
      status:
        adminCheck.status === 'granted'
          ? `Server-verified admin (${adminCheck.admin.email})`
          : adminCheck.status === 'not_configured'
            ? 'admins table missing - run 01_security_core.sql'
            : adminCheck.status === 'no_session'
              ? 'No signed-in Supabase session'
              : 'Signed in, but not on the admins allow-list',
    };
  } catch (err) {
    report.adminAuthorization = {
      configured: true,
      granted: false,
      status: `Check failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // 3. Test students table
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

  // 4. Compare with currently rendered local state
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
