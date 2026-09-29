import { NextResponse } from "next/server";
import { findEventByCheckInCode, upsertAttendance } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { broadcastRealtime } from "@/lib/supabase/realtime";
import { getAdminClient } from "@/lib/supabase/admin";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientIp = getClientIp(req);
    // Rate limit: Max 10 attempts per minute per user/IP to mitigate code brute-forcing
    const checkRate = checkRateLimit(`checkin:${user.id}_${clientIp}`, 10, 60 * 1000);
    if (!checkRate.allowed) {
      return NextResponse.json(
        { error: `Too many check-in attempts. Please wait ${checkRate.resetInSeconds} seconds before retrying.` },
        { status: 429 }
      );
    }

    const { code, method = "CODE" } = await req.json();

    const cleanCode = typeof code === "string" ? code.trim() : "";
    if (!cleanCode) {
      return NextResponse.json({ error: "Valid event check-in code is required." }, { status: 400 });
    }

    // Find the target event strictly by valid check-in code
    const event = await findEventByCheckInCode(cleanCode);

    if (!event) {
      return NextResponse.json(
        { error: "Invalid check-in code. No active event matches this code." },
        { status: 404 }
      );
    }

    // Time-window enforcement: allow check-in between 30 mins before start and 2 hours after end
    const now = Date.now();
    const eventStart = new Date(event.start_time).getTime();
    const eventEnd = new Date(event.end_time).getTime();
    const windowStart = eventStart - 30 * 60 * 1000;
    const windowEnd = eventEnd + 2 * 60 * 60 * 1000;

    if (now < windowStart) {
      return NextResponse.json(
        { error: "Check-in is not yet open. You can check in starting 30 minutes before the event begins." },
        { status: 400 }
      );
    }

    if (now > windowEnd) {
      return NextResponse.json(
        { error: "Check-in window has closed for this event." },
        { status: 400 }
      );
    }

    const record = await upsertAttendance({
      event_id: event.id,
      user_id: user.id,
      status: "PRESENT",
      method,
      checked_in_at: new Date().toISOString(),
    });

    await broadcastRealtime("attendance_realtime", "attendance_updated", {
      recordId: record.id,
      eventId: event.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully checked in to "${event.title}"!`,
      record,
    });
  } catch (error) {
    console.error("Error checking in:", error);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }
}
