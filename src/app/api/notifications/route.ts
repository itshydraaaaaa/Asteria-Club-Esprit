import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/notifications
 * Lists notifications for the authenticated user and calculates unread count.
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);

    const { data, error } = await (supabase as any)
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    const notifications = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      body: row.body,
      type: row.type,
      link: row.link,
      isRead: row.is_read,
      createdAt: row.created_at,
    }));

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error("GET /api/notifications unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Marks one notification or all notifications as read.
 * Body options:
 *   { all: true } -> marks all notifications for the authenticated user as read
 *   { id: "uuid", isRead: true } -> marks a specific notification
 */
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const supabase = await createClient();

    if (body.all === true) {
      // Mark all read for this user
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
      }

      return NextResponse.json({ success: true, markedAll: true });
    }

    if (body.id) {
      const isRead = body.isRead !== undefined ? Boolean(body.isRead) : true;
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ is_read: isRead })
        .eq("id", body.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
      }

      return NextResponse.json({ success: true, id: body.id, isRead });
    }

    return NextResponse.json(
      { error: "Provide either { all: true } or { id: string }" },
      { status: 400 }
    );
  } catch (err) {
    console.error("PATCH /api/notifications unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
