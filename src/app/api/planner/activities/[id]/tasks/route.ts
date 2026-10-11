import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  canViewActivityWorkspace,
  canEditActivity,
} from "@/lib/planner/permissions";
import {
  getActivityById,
  getActivityTasks,
  createActivityTask,
  updateActivityTask,
  deleteActivityTask,
  recordPlannerAuditLog,
} from "@/lib/planner/queries";
import { createNotification } from "@/lib/notifications";
import { broadcastRealtime } from "@/lib/supabase/realtime";

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

    const tasks = await getActivityTasks(id);
    return NextResponse.json({
      tasks: tasks.map((t) => ({
        ...t,
        phase: t.section || "PREPARATION",
      })),
    });
  } catch (error: any) {
    console.error("Error in GET /api/planner/activities/[id]/tasks:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch activity tasks" },
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
    if (!canEditActivity(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      departmentId,
      assigneeId,
      priority,
      dueDate,
      phase,
      section,
      offsetDays,
      status,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    const task = await createActivityTask({
      activityId: id,
      title: title.trim(),
      description: description || "",
      departmentId: departmentId || activity.departmentId || user.departmentId || null,
      assigneeId: assigneeId || null,
      createdById: user.id,
      status: status || "TODO",
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      section: phase || section || "PREPARATION",
      offsetDays: typeof offsetDays === "number" ? Math.abs(offsetDays) : null,
      isCompressed: false,
    });

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_TASK_CREATED",
      entityType: "ACTIVITY_TASK",
      entityId: task.id,
      details: `Created task "${task.title}" (${task.section}) for "${activity.title}"`,
    });

    if (task.assigneeId && task.assigneeId !== user.id) {
      await createNotification({
        userId: task.assigneeId,
        title: `Nouvelle tâche assignée : ${task.title}`,
        body: `Vous avez été assigné à la tâche "${task.title}" pour l'activité "${activity.title}".`,
        type: "TASK_ASSIGNED",
        link: `/planner/activities/${id}`,
      });
    }

    try {
      await broadcastRealtime("tasks_realtime", "task_updated", {
        taskId: task.id,
        action: "CREATED",
      });
    } catch {
      // ignore
    }

    return NextResponse.json(
      { task: { ...task, phase: task.section || "PREPARATION" } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/planner/activities/[id]/tasks:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create task" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const body = await req.json();
    const {
      taskId,
      title,
      description,
      status,
      priority,
      assigneeId,
      departmentId,
      dueDate,
      phase,
      section,
    } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const currentTasks = await getActivityTasks(id);
    const targetTask = currentTasks.find((t) => t.id === taskId);
    if (!targetTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!canEditActivity(user, activity) && targetTask.assigneeId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dbUpdates: Record<string, unknown> = {};
    if (title !== undefined) dbUpdates.title = title;
    if (description !== undefined) dbUpdates.description = description;
    if (status !== undefined) dbUpdates.status = status;
    if (priority !== undefined) dbUpdates.priority = priority;
    if (assigneeId !== undefined) dbUpdates.assignee_id = assigneeId || null;
    if (departmentId !== undefined) dbUpdates.department_id = departmentId || null;
    if (dueDate !== undefined) {
      dbUpdates.due_date = dueDate ? new Date(dueDate).toISOString() : null;
    }
    if (phase !== undefined || section !== undefined) {
      dbUpdates.section = phase || section;
    }

    const task = await updateActivityTask(taskId, dbUpdates);

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_TASK_UPDATED",
      entityType: "ACTIVITY_TASK",
      entityId: task.id,
      details: `Updated task "${task.title}" (status: ${task.status}) on "${activity.title}"`,
    });

    if (
      assigneeId &&
      assigneeId !== targetTask.assigneeId &&
      assigneeId !== user.id
    ) {
      await createNotification({
        userId: assigneeId,
        title: `Tâche assignée : ${task.title}`,
        body: `Vous êtes maintenant responsable de la tâche "${task.title}" (${activity.title}).`,
        type: "TASK_ASSIGNED",
        link: `/planner/activities/${id}`,
      });
    }

    try {
      await broadcastRealtime("tasks_realtime", "task_updated", {
        taskId: task.id,
        action: "UPDATED",
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      task: { ...task, phase: task.section || "PREPARATION" },
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/planner/activities/[id]/tasks:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update task" },
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
    let taskId = searchParams.get("taskId");
    if (!taskId) {
      try {
        const body = await req.json();
        taskId = body.taskId;
      } catch {
        // ignore
      }
    }
    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    await deleteActivityTask(taskId);

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_TASK_DELETED",
      entityType: "ACTIVITY_TASK",
      entityId: taskId,
      details: `Deleted task ${taskId} from "${activity.title}"`,
    });

    try {
      await broadcastRealtime("tasks_realtime", "task_updated", {
        taskId,
        action: "DELETED",
      });
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/planner/activities/[id]/tasks:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}
