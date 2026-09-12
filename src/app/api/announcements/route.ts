import { NextResponse } from "next/server";
import { getAnnouncements, createAnnouncement, createAuditLog } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { broadcastRealtime } from "@/lib/supabase/realtime";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId") || undefined;
    const scope = searchParams.get("scope") || undefined;

    const announcements = await getAnnouncements({ scope, department_id: departmentId });
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

    const announcement = await createAnnouncement({
      title,
      body: content,
      scope,
      department_id: scope === "DEPARTMENT" ? departmentId : null,
      author_id: user.id,
      is_pinned: isPinned,
    });

    await createAuditLog({
      user_id: user.id,
      action: "ANNOUNCEMENT_POSTED",
      details: `Published announcement: "${title}" (Scope: ${scope})`,
    });

    await broadcastRealtime("announcements_realtime", "announcement_updated", {
      announcementId: announcement.id,
      scope,
    });

    return NextResponse.json(
      { announcement, discordSynced: syncDiscord },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/announcements:", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
