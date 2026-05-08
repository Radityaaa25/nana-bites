import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const hasSupabaseAdminConfig = Boolean(supabaseUrl && supabaseServiceKey);

// Strict check for runtime safety
if (!supabaseUrl || !supabaseAnonKey) {
  // We only throw if we are NOT in the build process to avoid breaking CI/CD
  if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV) {
     console.warn('Supabase environment variables are missing!');
  }
}

// Public client — safe for browser, respects RLS
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

// Admin client — server-side only, bypasses RLS
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceKey || 'placeholder', 
  { auth: { persistSession: false } }
);
