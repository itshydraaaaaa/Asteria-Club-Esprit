import { NextResponse } from "next/server";
import { getEvents, createEvent, checkEventConflict, upsertRSVP, createAuditLog } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId") || undefined;
    const scope = searchParams.get("scope") || undefined;
    const user = await getCurrentUser();

    const events = await getEvents({
      department_id: departmentId,
      scope,
      user_id: user?.id,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error in GET /api/events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "BOARD" && user.role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, startTime, endTime, location, departmentId, recurrenceRule, checkInCode } = body;

    if (!title || !startTime || !endTime || !location) {
      return NextResponse.json({ error: "Missing required event fields" }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const conflictingEvents = await checkEventConflict(location, departmentId || null, start, end);

    const generatedCode =
      checkInCode || `AST-${Math.floor(1000 + Math.random() * 9000)}`;

    const event = await createEvent({
      title,
      description: description || "",
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      location,
      department_id: departmentId || null,
      recurrence_rule: recurrenceRule || null,
      check_in_code: generatedCode,
      created_by_id: user.id,
    });

    // Auto RSVP GOING for the creator
    await upsertRSVP({ event_id: event.id, user_id: user.id, status: "GOING" });

    await createAuditLog({
      user_id: user.id,
      action: "EVENT_CREATED",
      details: `Created event "${title}" scheduled for ${start.toLocaleDateString()}`,
    });

    return NextResponse.json(
      { event, conflictWarning: conflictingEvents.length > 0 ? conflictingEvents : null },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/events:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
