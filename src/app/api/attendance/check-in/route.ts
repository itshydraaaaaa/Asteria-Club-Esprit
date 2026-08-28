import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
    let event;
    if (code) {
      event = await prisma.event.findFirst({
        where: {
          checkInCode: { equals: code.trim().toUpperCase() },
        },
      });
    } else if (eventId) {
      event = await prisma.event.findUnique({
        where: { id: eventId },
      });
    }

    if (!event) {
      return NextResponse.json(
        { error: "Invalid check-in code. No active event matches this code." },
        { status: 404 }
      );
    }

    // Register check-in
    const record = await prisma.attendanceRecord.upsert({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: user.id,
        },
      },
      update: {
        status: "PRESENT",
        method,
        checkedInAt: new Date(),
      },
      create: {
        eventId: event.id,
        userId: user.id,
        status: "PRESENT",
        method,
        checkedInAt: new Date(),
      },
      include: {
        event: true,
        user: true,
      },
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
