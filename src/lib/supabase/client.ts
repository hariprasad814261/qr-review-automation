import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  process.env.STORAGE_URL || 
  "https://mock-supabase.local";

const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.STORAGE_ANON_KEY || 
  "mock-anon-key";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
