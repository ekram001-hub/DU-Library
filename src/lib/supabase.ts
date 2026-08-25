import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

// Default Supabase project URL & Public Anon Key from user configuration
const DEFAULT_SUPABASE_URL = 'https://mqrpjhyxfngngegetflb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcnBqaHl4Zm5nbmdlZ2V0ZmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMjg4MTEsImV4cCI6MjEwMjgwNDgxMX0.n0qjKmDlFO9beIh2R2Gv_SjYppmijlvPp2h-YehCOiM';

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
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
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
    realtimeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Supabase Realtime] Connected and listening for live seat & room updates.');
      }
    });
  }
  return realtimeChannel;
}

/**
 * Broadcast live state change to all clients via Supabase Realtime WebSocket
 */
export function broadcastStateViaSupabase(payload: {
  rooms?: unknown[];
  seats?: unknown[];
  notices?: unknown[];
  branchesConfig?: unknown;
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
  callback: (payload: {
    rooms?: unknown[];
    seats?: unknown[];
    notices?: unknown[];
    branchesConfig?: unknown;
  }) => void
): () => void {
  try {
    const channel = getRealtimeChannel();
    if (!channel) return () => {};

    const handler = (data: { payload: { rooms?: unknown[]; seats?: unknown[]; notices?: unknown[]; branchesConfig?: unknown } }) => {
      if (data?.payload) {
        callback(data.payload);
      }
    };

    channel.on('broadcast', { event: 'STATE_CHANGED' }, handler);

    return () => {
      // Unsubscribe listener
      channel.unsubscribe();
      realtimeChannel = null;
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Subscribe error:', err);
    return () => {};
  }
}

/**
 * Sync / Backup full library configuration (Rooms, Seats, Notices) to cloud storage
 */
export async function syncLibraryStateToCloud(payload: {
  rooms?: unknown[];
  seats?: unknown[];
  notices?: unknown[];
  branchesConfig?: unknown;
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
 * Fetch library configuration (Rooms, Seats, Notices) from cloud
 */
export async function fetchLibraryStateFromCloud(): Promise<{
  rooms?: unknown[];
  seats?: unknown[];
  notices?: unknown[];
  branchesConfig?: unknown;
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
