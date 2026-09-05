import { NextResponse } from "next/server";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { broadcastRealtime } from "@/lib/supabase/realtime";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const scope = searchParams.get("scope");

    const where: any = {};
    if (scope === "CLUB") {
      where.scope = "CLUB";
    } else if (departmentId && departmentId !== "all") {
      where.OR = [{ scope: "CLUB" }, { departmentId }];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        department: true,
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Error in GET /api/announcements:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
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
    const { title, body: content, scope = "CLUB", departmentId, isPinned = false, syncDiscord = false } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        body: content,
        scope,
        departmentId: scope === "DEPARTMENT" ? departmentId : null,
        authorId: user.id,
        isPinned,
      },
      include: {
        department: true,
        author: { select: SAFE_USER_SELECT },
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ANNOUNCEMENT_POSTED",
        details: `Published announcement: "${title}" (Scope: ${scope})`,
      },
    });

    await broadcastRealtime("announcements_realtime", "announcement_updated", {
      announcementId: announcement.id,
      scope,
    });

    return NextResponse.json({
      announcement,
      discordSynced: syncDiscord,
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/announcements:", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
