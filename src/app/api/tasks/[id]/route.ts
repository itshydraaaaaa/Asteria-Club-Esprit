import { NextResponse } from "next/server";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { broadcastRealtime } from "@/lib/supabase/realtime";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isPrivileged = user.role === "BOARD" || user.role === "HOD";
    const isAssignee = existingTask.assigneeId === user.id;

    // Only assignee or BOARD/HOD can change status
    if (body.status !== undefined && !isAssignee && !isPrivileged) {
      return NextResponse.json(
        { error: "Forbidden: Only the task assignee or leadership can update status" },
        { status: 403 }
      );
    }

    // Only BOARD or HOD can reassign, change department, or change priority/title/description
    if (
      (body.assigneeId !== undefined ||
        body.departmentId !== undefined ||
        body.title !== undefined ||
        body.priority !== undefined ||
        body.dueDate !== undefined) &&
      !isPrivileged
    ) {
      return NextResponse.json(
        { error: "Forbidden: Only Board and HoDs can modify task assignments or core details" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (body.title !== undefined && isPrivileged) updateData.title = body.title;
    if (body.description !== undefined && (isPrivileged || isAssignee)) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined && isPrivileged) updateData.priority = body.priority;
    if (body.assigneeId !== undefined && isPrivileged) updateData.assigneeId = body.assigneeId || null;
    if (body.departmentId !== undefined && isPrivileged) updateData.departmentId = body.departmentId;
    if (body.dueDate !== undefined && isPrivileged) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        assignee: { select: SAFE_USER_SELECT },
        createdBy: { select: SAFE_USER_SELECT },
        comments: {
          include: {
            user: { select: SAFE_USER_SELECT },
          },
        },
      },
    });

    await broadcastRealtime("tasks_realtime", "task_updated", { taskId: id, action: "UPDATED" });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error in PATCH /api/tasks/[id]:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "BOARD" && user.role !== "HOD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.task.delete({ where: { id } });

    await broadcastRealtime("tasks_realtime", "task_updated", { taskId: id, action: "DELETED" });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/tasks/[id]:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
