import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const departmentId = searchParams.get("departmentId");
    const userId = searchParams.get("userId");
    const user = await getCurrentUser();

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (userId) where.userId = userId;

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        event: {
          include: {
            department: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
            avatarUrl: true,
            department: true,
          },
        },
      },
      orderBy: { checkedInAt: "desc" },
    });

    // Calculate aggregated metrics
    const totalPastEvents = await prisma.event.count({
      where: {
        startTime: { lte: new Date() },
      },
    });

    const totalAttendanceCount = await prisma.attendanceRecord.count({
      where: {
        status: "PRESENT",
      },
    });

    return NextResponse.json({
      records,
      stats: {
        totalPastEvents,
        totalAttendanceCount,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}
