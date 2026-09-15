import { NextResponse } from "next/server";
import { getEvents, createEvent, checkEventConflict, upsertRSVP, createAuditLog } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";

function extractImageUrl(description?: string | null, rawImageUrl?: string | null): { cleanDescription: string; imageUrl: string | null } {
  if (rawImageUrl) return { cleanDescription: description || "", imageUrl: rawImageUrl };
  if (!description) return { cleanDescription: "", imageUrl: null };
  const imgMatch = description.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/) || description.match(/\[image:\s*(https?:\/\/[^\s\]]+)\]/);
  if (imgMatch) {
    return {
      cleanDescription: description.replace(imgMatch[0], "").trim(),
      imageUrl: imgMatch[1],
    };
  }
  return { cleanDescription: description, imageUrl: null };
}

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

    const mappedEvents = events.map((e: any) => {
      const { cleanDescription, imageUrl } = extractImageUrl(e.description, e.image_url);

      return {
        ...e,
        // Support both camelCase and snake_case
        checkInCode: e.check_in_code || e.checkInCode || "",
        startTime: e.start_time || e.startTime,
        endTime: e.end_time || e.endTime,
        departmentId: e.department_id || e.departmentId,
        department: e.departments || e.department,
        createdById: e.created_by_id || e.createdById,
        recurrenceRule: e.recurrence_rule || e.recurrenceRule,
        imageUrl,
        cleanDescription,
        rsvps: (e.rsvps || []).map((r: any) => ({
          ...r,
          eventId: r.event_id || r.eventId,
          userId: r.user_id || r.userId,
        })),
        attendanceRecords: (e.attendance_records || []).map((a: any) => ({
          ...a,
          eventId: a.event_id || a.eventId,
          userId: a.user_id || a.userId,
          checkedInAt: a.checked_in_at || a.checkedInAt,
        })),
      };
    });

    return NextResponse.json({ events: mappedEvents });
  } catch (error) {
    console.error("Error in GET /api/events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Please log in to schedule events." }, { status: 401 });
    }
    if (user.role !== "BOARD" && user.role !== "HOD") {
      return NextResponse.json(
        { error: "Forbidden: Only Board members and Department Heads (HOD) can schedule events." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, startTime, endTime, location, departmentId, recurrenceRule, checkInCode, imageUrl } = body;

    if (!title || !startTime || !endTime || !location) {
      return NextResponse.json(
        { error: "Missing required event fields: Title, Start Time, End Time, and Location are required." },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date format provided for start or end time." }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: "Event end time must be after start time." }, { status: 400 });
    }

    const conflictingEvents = await checkEventConflict(location, departmentId || null, start, end);

    const generatedCode =
      (checkInCode && checkInCode.trim()) || `AST-${Math.floor(1000 + Math.random() * 9000)}`;

    let fullDescription = description || "";
    if (imageUrl) {
      fullDescription = fullDescription ? `${fullDescription}\n\n[image: ${imageUrl}]` : `[image: ${imageUrl}]`;
    }

    const event = await createEvent({
      title: title.trim(),
      description: fullDescription,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      location: location.trim(),
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
      details: `Created event "${title.trim()}" scheduled for ${start.toLocaleDateString()}`,
    });

    return NextResponse.json(
      {
        event: {
          ...event,
          checkInCode: event.check_in_code || generatedCode,
          startTime: event.start_time,
          endTime: event.end_time,
          imageUrl: imageUrl || null,
        },
        conflictWarning: conflictingEvents.length > 0 ? conflictingEvents : null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/events:", error);
    return NextResponse.json({ error: error?.message || "Failed to create event" }, { status: 500 });
  }
}
