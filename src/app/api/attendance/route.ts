import { NextResponse } from "next/server";
import { getAttendanceRecords, countEvents } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || undefined;
    const userId = searchParams.get("userId") || undefined;

    const records = await getAttendanceRecords({ event_id: eventId, user_id: userId });

    // Aggregate: count past events and total attendance
    const admin = getAdminClient();
    const { count: totalPastEvents } = await admin
      .from("events")
      .select("*", { count: "exact", head: true })
      .lte("start_time", new Date().toISOString());

    const { count: totalAttendanceCount } = await admin
      .from("attendance_records")
      .select("*", { count: "exact", head: true })
      .eq("status", "PRESENT");

    const mappedRecords = records.map((r: any) => ({
      ...r,
      eventId: r.event_id || r.eventId,
      userId: r.user_id || r.userId,
      checkedInAt: r.checked_in_at || r.checkedInAt,
      event: r.events || r.event,
    }));

    return NextResponse.json({
      records: mappedRecords,
      stats: {
        totalPastEvents: totalPastEvents || 0,
        totalAttendanceCount: totalAttendanceCount || 0,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}
