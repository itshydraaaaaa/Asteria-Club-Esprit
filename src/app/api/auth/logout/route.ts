import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("Supabase auth sign-out error:", err);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
