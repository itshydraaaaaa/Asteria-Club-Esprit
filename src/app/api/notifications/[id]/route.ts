import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const isRead = body.isRead !== undefined ? Boolean(body.isRead) : true;

    const supabase = await createClient();
    const { error } = await (supabase as any)
      .from("notifications")
      .update({ is_read: isRead })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error(`Error updating notification ${id}:`, error);
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id, isRead });
  } catch (err) {
    console.error("PATCH /api/notifications/[id] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
