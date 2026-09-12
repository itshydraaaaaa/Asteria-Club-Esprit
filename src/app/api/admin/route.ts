import { NextResponse } from "next/server";
import { getBoardSeats, getDepartmentsWithCounts, getRecentAuditLogs, createAuditLog, createDepartment } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_ACADEMIC_CYCLE } from "@/lib/constants";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "BOARD") {
      return NextResponse.json({ error: "Forbidden: Board access required" }, { status: 403 });
    }

    const [boardSeats, departments, auditLogs] = await Promise.all([
      getBoardSeats(),
      getDepartmentsWithCounts(),
      getRecentAuditLogs(20),
    ]);

    const normalizedBoardSeats = (boardSeats || []).map((seat: any) => ({
      ...seat,
      user: seat.user
        ? {
            ...seat.user,
            avatarUrl: seat.user.avatar_url || seat.user.avatarUrl,
          }
        : null,
    }));

    const normalizedAuditLogs = (auditLogs || []).map((log: any) => ({
      ...log,
      createdAt: log.created_at || log.createdAt,
      userId: log.user_id || log.userId,
      user: log.user
        ? {
            ...log.user,
            avatarUrl: log.user.avatar_url || log.user.avatarUrl,
          }
        : null,
    }));

    return NextResponse.json({
      boardSeats: normalizedBoardSeats,
      departments,
      auditLogs: normalizedAuditLogs,
      currentCycle: DEFAULT_ACADEMIC_CYCLE,
    });
  } catch (error) {
    console.error("Error in /api/admin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "BOARD") {
      return NextResponse.json({ error: "Forbidden: Board access required" }, { status: 403 });
    }

    const { action, payload } = await req.json();

    if (action === "CREATE_DEPARTMENT") {
      const { name, description, icon } = payload;
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      const dept = await createDepartment({ name, slug, description, icon });

      await createAuditLog({
        user_id: user.id,
        action: "DEPARTMENT_CREATED",
        details: `Created new department: ${name}`,
      });

      return NextResponse.json({ success: true, department: dept });
    }

    if (action === "ROLLOVER_CYCLE") {
      await createAuditLog({
        user_id: user.id,
        action: "CYCLE_ROLLOVER",
        details: `Initiated academic cycle rollover for: ${payload.cycleName}`,
      });

      return NextResponse.json({
        success: true,
        message: `Cycle ${payload.cycleName} successfully updated.`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin POST error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
