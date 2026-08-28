import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://asteria-club-esprit.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  "";

// Client-side Supabase instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey || "sb_publishable_placeholder");

// Server-side / Admin Supabase instance
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || "sb_secret_placeholder",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
