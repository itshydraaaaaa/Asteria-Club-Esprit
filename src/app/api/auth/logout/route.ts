import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("Supabase auth sign-out error:", err);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("asteria_session_token");

  // Explicitly clear all Supabase auth cookies (single, chunked, or project-specific)
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    for (const c of allCookies) {
      if (c.name.startsWith("sb-") || c.name.includes("auth-token")) {
        response.cookies.delete(c.name);
      }
    }
  } catch (err) {
    console.warn("Failed to delete auth cookies in logout route:", err);
  }

  return response;
}
