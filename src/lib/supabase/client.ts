import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./types";

const DEFAULT_SUPABASE_URL = "https://asteria-club-esprit.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_CslYLGLgxIk7b_UZEPasIA_iPquc6r9";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      DEFAULT_SUPABASE_ANON_KEY
  );
}
