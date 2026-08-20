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
} | null> {
  try {
    const client = getSupabase();
    if (!client || !phone.trim()) return null;

    const { data, error } = await client
      .from('students')
      .select('*')
      .eq('phone', phone.trim())
      .single();

    if (error || !data) return null;

    return {
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      studentId: data.student_id || undefined,
      gender: data.gender || 'male',
      targetExam: data.target_exam || undefined,
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
        last_active: new Date().toISOString(),
      },
      { onConflict: 'phone' }
    );

    if (error) {
      console.warn('Supabase students table sync notice (table may need creation):', error.message);
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

/**
 * Sign In with Google OAuth via Supabase
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
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
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
