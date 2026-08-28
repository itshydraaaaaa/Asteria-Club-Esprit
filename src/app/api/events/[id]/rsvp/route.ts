import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!["GOING", "MAYBE", "DECLINED"].includes(status)) {
      return NextResponse.json({ error: "Invalid RSVP status" }, { status: 400 });
    }

    const rsvp = await prisma.rSVP.upsert({
      where: {
        eventId_userId: {
          eventId: id,
          userId: user.id,
        },
      },
      update: {
        status,
      },
      create: {
        eventId: id,
        userId: user.id,
        status,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ rsvp });
  } catch (error) {
    console.error("Error in RSVP:", error);
    return NextResponse.json({ error: "Failed to update RSVP" }, { status: 500 });
  }
}
