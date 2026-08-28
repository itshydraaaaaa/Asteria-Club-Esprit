import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, justification } = await req.json();

    if (!eventId || !justification) {
      return NextResponse.json(
        { error: "Event ID and justification note are required" },
        { status: 400 }
      );
    }

    const record = await prisma.attendanceRecord.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
      update: {
        status: "EXCUSED",
        justification,
      },
      create: {
        eventId,
        userId: user.id,
        status: "EXCUSED",
        method: "MANUAL",
        justification,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Error submitting justification:", error);
    return NextResponse.json({ error: "Failed to submit justification" }, { status: 500 });
  }
}
