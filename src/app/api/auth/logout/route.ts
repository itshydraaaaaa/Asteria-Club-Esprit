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
  return response;
}
