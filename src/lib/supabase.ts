import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

// Default Supabase project URL from user configuration
const DEFAULT_SUPABASE_URL = 'https://mqrpjhyxfngngegetflb.supabase.co';

// Get credentials from environment or fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Singleton client instance
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseAnonKey) {
    // Check if user stored a temporary anon key in localStorage for dev/testing
    const localKey = localStorage.getItem('supabase_anon_key');
    if (localKey) {
      if (!supabaseInstance) {
        supabaseInstance = createClient(supabaseUrl, localKey);
      }
      return supabaseInstance;
    }
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    (import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY.length > 10) ||
    Boolean(localStorage.getItem('supabase_anon_key'))
  );
};

export const SUPABASE_PROJECT_URL = supabaseUrl;

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
