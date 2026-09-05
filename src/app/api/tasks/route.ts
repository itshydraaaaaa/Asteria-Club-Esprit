import { NextResponse } from "next/server";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { broadcastRealtime } from "@/lib/supabase/realtime";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const assigneeId = searchParams.get("assigneeId");
    const status = searchParams.get("status");

    const where: any = {};
    if (departmentId && departmentId !== "all") where.departmentId = departmentId;
    if (assigneeId && assigneeId !== "all") where.assigneeId = assigneeId;
    if (status && status !== "all") where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        department: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error in GET /api/tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, departmentId, assigneeId, priority, dueDate, status } = body;

    if (!title || !departmentId) {
      return NextResponse.json({ error: "Title and department are required" }, { status: 400 });
    }

    // Department check: regular members can only create tasks in their own department
    if (user.role === "MEMBER" && user.departmentId && departmentId !== user.departmentId) {
      return NextResponse.json(
        { error: "Forbidden: You can only create tasks in your own department" },
        { status: 403 }
      );
    }

    const task = await prisma.$transaction(async (tx) => {
      const createdTask = await tx.task.create({
        data: {
          title,
          description: description || "",
          departmentId,
          assigneeId: assigneeId || null,
          createdById: user.id,
          status: status || "TODO",
          priority: priority || "MEDIUM",
          dueDate: dueDate ? new Date(dueDate) : null,
        },
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

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "TASK_CREATED",
          details: `Created task "${createdTask.title}" in ${createdTask.department.name}`,
        },
      });

      return createdTask;
    });

    // Broadcast realtime event
    await broadcastRealtime("tasks_realtime", "task_updated", { taskId: task.id, action: "CREATED" });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/tasks:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
