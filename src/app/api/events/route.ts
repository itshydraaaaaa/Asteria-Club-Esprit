import { NextResponse } from "next/server";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const scope = searchParams.get("scope"); // "club", "my", "all"
    const user = await getCurrentUser();

    const where: any = {};

    if (scope === "club") {
      where.departmentId = null;
    } else if (scope === "department" && departmentId && departmentId !== "all") {
      where.departmentId = departmentId;
    } else if (scope === "my" && user) {
      where.OR = [
        { departmentId: null },
        ...(user.departmentId ? [{ departmentId: user.departmentId }] : []),
        { rsvps: { some: { userId: user.id, status: "GOING" } } },
      ];
    } else if (departmentId && departmentId !== "all") {
      where.OR = [{ departmentId: null }, { departmentId }];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        department: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
        },
        attendanceRecords: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
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
    const {
      title,
      description,
      startTime,
      endTime,
      location,
      departmentId,
      recurrenceRule,
      checkInCode,
    } = body;

    if (!title || !startTime || !endTime || !location) {
      return NextResponse.json({ error: "Missing required event fields" }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Check for scheduling conflicts in the same location or department/club-wide
    const conflictingEvents = await prisma.event.findMany({
      where: {
        OR: [
          {
            location: { equals: location },
            startTime: { lt: end },
            endTime: { gt: start },
          },
          {
            departmentId: departmentId || null,
            startTime: { lt: end },
            endTime: { gt: start },
          },
        ],
      },
    });

    const generatedCode =
      checkInCode ||
      `AST-${Math.floor(1000 + Math.random() * 9000)}`;

    const event = await prisma.event.create({
      data: {
        title,
        description: description || "",
        startTime: start,
        endTime: end,
        location,
        departmentId: departmentId || null,
        recurrenceRule: recurrenceRule || null,
        checkInCode: generatedCode,
        createdById: user.id,
      },
      include: {
        department: true,
        createdBy: { select: SAFE_USER_SELECT },
        rsvps: true,
      },
    });

    // Auto RSVP GOING for the creator
    await prisma.rSVP.create({
      data: {
        eventId: event.id,
        userId: user.id,
        status: "GOING",
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "EVENT_CREATED",
        details: `Created event "${event.title}" scheduled for ${start.toLocaleDateString()}`,
      },
    });

    return NextResponse.json({
      event,
      conflictWarning: conflictingEvents.length > 0 ? conflictingEvents : null,
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/events:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
