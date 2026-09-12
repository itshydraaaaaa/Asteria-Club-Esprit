import { NextResponse } from "next/server";
import { findEventByCheckInCode, upsertAttendance } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { broadcastRealtime } from "@/lib/supabase/realtime";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, method = "QR", eventId } = await req.json();

    if (!code && !eventId) {
      return NextResponse.json({ error: "Check-in code or event ID is required" }, { status: 400 });
    }

    // Find the target event
    let event: any = null;
    if (code) {
      event = await findEventByCheckInCode(code);
    } else if (eventId) {
      const admin = getAdminClient();
      const { data } = await admin.from("events").select("*").eq("id", eventId).single();
      event = data;
    }

    if (!event) {
      return NextResponse.json(
        { error: "Invalid check-in code. No active event matches this code." },
        { status: 404 }
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
