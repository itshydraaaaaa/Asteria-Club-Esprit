import { NextResponse } from "next/server";
import { getTasks, createTask, createAuditLog } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { broadcastRealtime } from "@/lib/supabase/realtime";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const department_id = searchParams.get("departmentId") ?? undefined;
    const assignee_id = searchParams.get("assigneeId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const tasks = await getTasks({ department_id, assignee_id, status });
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

    const task = await createTask({
      title,
      description: description || "",
      department_id: departmentId,
      assignee_id: assigneeId || null,
      created_by_id: user.id,
      status: status || "TODO",
      priority: priority || "MEDIUM",
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    });

    // Fetch department name for audit log
    const deptName = (task as any).departments?.name ?? departmentId;
    await createAuditLog({
      user_id: user.id,
      action: "TASK_CREATED",
      details: `Created task "${title}" in ${deptName}`,
    });

    await broadcastRealtime("tasks_realtime", "task_updated", { taskId: task.id, action: "CREATED" });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/tasks:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
