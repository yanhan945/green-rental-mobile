import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const SUPABASE_CONFIG_ERROR = "Supabase 未配置，请检查 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。";

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function createUnavailableSupabaseClient() {
  const error = { message: SUPABASE_CONFIG_ERROR };
  const subscription = { unsubscribe() {} };

  return {
    auth: {
      async signUp() {
        return { data: null, error };
      },
      async signInWithPassword() {
        return { data: null, error };
      },
      async signOut() {
        return { error: null };
      },
      async getSession() {
        return { data: { session: null }, error: null };
      },
      onAuthStateChange() {
        return { data: { subscription } };
      },
    },
    storage: {
      from() {
        return {
          async upload() {
            return { data: null, error };
          },
          getPublicUrl() {
            return { data: { publicUrl: "" } };
          },
        };
      },
    },
  };
}

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createUnavailableSupabaseClient();

export function requireSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }
  return supabase;
}
