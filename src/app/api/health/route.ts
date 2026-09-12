import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const startTime = Date.now();
  let dbConnected = false;
  let latencyMs = 0;
  let dbError: string | null = null;

  try {
    const startPing = Date.now();
    const admin = getAdminClient();
    // Lightweight ping: select count from a small table
    const { error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .limit(1);
    latencyMs = Date.now() - startPing;
    if (error) throw error;
    dbConnected = true;
  } catch (err: any) {
    dbConnected = false;
    dbError = err?.message || "Database ping failed";
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  );
  const supabaseConfigured = Boolean(supabaseUrl && hasServiceKey);

  const status =
    dbConnected && supabaseConfigured
      ? "healthy"
      : dbConnected
      ? "degraded"
      : "unhealthy";

  return NextResponse.json({
    status,
    totalDurationMs: Date.now() - startTime,
    database: {
      connected: dbConnected,
      latencyMs,
      provider: "supabase-postgres",
      error: dbError,
    },
    supabase: {
      configured: supabaseConfigured,
      url: supabaseUrl || null,
      auth: supabaseConfigured,
      realtime: supabaseConfigured,
    },
    timestamp: new Date().toISOString(),
  });
}
