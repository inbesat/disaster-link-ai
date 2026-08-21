import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_AUTH_CONFIG } from "./config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.",
    );
  }
  return { supabaseUrl, supabaseAnonKey };
}

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getEnv();

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: SUPABASE_AUTH_CONFIG.autoRefreshToken,
      persistSession: SUPABASE_AUTH_CONFIG.persistSession,
      detectSessionInUrl: SUPABASE_AUTH_CONFIG.detectSessionInUrl,
    },
  });
}
