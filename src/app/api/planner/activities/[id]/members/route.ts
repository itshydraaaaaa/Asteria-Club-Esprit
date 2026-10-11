import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canEditActivity } from "@/lib/planner/permissions";
import {
  getActivityById,
  upsertActivityMember,
  removeActivityMember,
  recordPlannerAuditLog,
} from "@/lib/planner/queries";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const activity = await getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!canEditActivity(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const profileId = body.profileId || body.userId;
    const rawRole = body.role || body.roleInActivity || "CONTRIBUTOR";
    if (!profileId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const role: "OWNER" | "CO_OWNER" | "CONTRIBUTOR" =
      rawRole === "OWNER" || rawRole === "LEAD"
        ? "OWNER"
        : rawRole === "CO_OWNER" || rawRole === "CO_LEAD"
        ? "CO_OWNER"
        : "CONTRIBUTOR";

    const member = await upsertActivityMember(id, profileId, role);

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_MEMBER_ASSIGNED",
      entityType: "ACTIVITY",
      entityId: id,
      details: `Assigned user ${member.profile?.name || profileId} as ${role} on "${activity.title}"`,
    });

    if (profileId !== user.id) {
      await createNotification({
        userId: profileId,
        title: `Équipe d'organisation : ${activity.title}`,
        body: `${user.name} vous a ajouté à l'équipe de "${activity.title}" (${role}).`,
        type: "ACTIVITY_TEAM_ADDED",
        link: `/planner/activities/${id}`,
      });
    }

    const refreshed = await getActivityById(id);
    return NextResponse.json({
      member: {
        ...member,
        userId: member.profileId,
        roleInActivity: member.role,
        user: member.profile,
      },
      members: (refreshed?.members || []).map((m) => ({
        ...m,
        userId: m.profileId,
        roleInActivity: m.role,
        user: m.profile,
      })),
    });
  } catch (error: any) {
    console.error("Error in POST /api/planner/activities/[id]/members:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to assign member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const activity = await getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!canEditActivity(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("userId") || searchParams.get("profileId");
    if (!userId) {
      try {
        const body = await req.json();
        userId = body.userId || body.profileId;
      } catch {
        // ignore
      }
    }
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await removeActivityMember(id, userId);

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_MEMBER_REMOVED",
      entityType: "ACTIVITY",
      entityId: id,
      details: `Removed user ${userId} from "${activity.title}"`,
    });

    const refreshed = await getActivityById(id);
    return NextResponse.json({
      success: true,
      members: (refreshed?.members || []).map((m) => ({
        ...m,
        userId: m.profileId,
        roleInActivity: m.role,
        user: m.profile,
      })),
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/planner/activities/[id]/members:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to remove member" },
      { status: 500 }
    );
  }
}
