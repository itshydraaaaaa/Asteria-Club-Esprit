import { NextResponse } from "next/server";
import { getCurrentUser, isExecutiveRole } from "@/lib/auth";
import { canViewActivityWorkspace } from "@/lib/planner/permissions";
import {
  getActivityById,
  getActivityComments,
  createActivityComment,
  deleteActivityComment,
  recordPlannerAuditLog,
} from "@/lib/planner/queries";
import { createNotification } from "@/lib/notifications";

export async function GET(
  _req: Request,
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
    if (!canViewActivityWorkspace(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rawComments = await getActivityComments(id);
    const comments = rawComments.map((c) => ({
      ...c,
      userId: c.authorId,
      user: c.author,
    }));
    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error("Error in GET /api/planner/activities/[id]/comments:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load comments" },
      { status: 500 }
    );
  }
}

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
    if (!canViewActivityWorkspace(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { body: commentBody } = body;

    if (!commentBody || !commentBody.trim()) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
    }

    const created = await createActivityComment({
      activityId: id,
      authorId: user.id,
      body: commentBody.trim(),
    });

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_COMMENT_CREATED",
      entityType: "ACTIVITY_COMMENT",
      entityId: created.id,
      details: `Posted comment on "${activity.title}"`,
    });

    if (activity.ownerId && activity.ownerId !== user.id) {
      await createNotification({
        userId: activity.ownerId,
        title: `Nouveau commentaire : ${activity.title}`,
        body: `${user.name} a commenté l'activité "${activity.title}".`,
        type: "ACTIVITY_COMMENT",
        link: `/planner/activities/${id}`,
      });
    }

    return NextResponse.json(
      {
        comment: {
          ...created,
          userId: created.authorId,
          user: created.author,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/planner/activities/[id]/comments:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to post comment" },
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

    const { searchParams } = new URL(req.url);
    let commentId = searchParams.get("commentId");
    if (!commentId) {
      try {
        const body = await req.json();
        commentId = body.commentId;
      } catch {
        // ignore
      }
    }
    if (!commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 }
      );
    }

    const comments = await getActivityComments(id);
    const target = comments.find((c) => c.id === commentId);
    if (!target) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (target.authorId !== user.id && !isExecutiveRole(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteActivityComment(commentId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/planner/activities/[id]/comments:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete comment" },
      { status: 500 }
    );
  }
}
