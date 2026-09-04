import { NextResponse } from "next/server";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "BOARD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const boardSeats = await prisma.boardSeat.findMany({
      include: { user: { select: SAFE_USER_SELECT } },
      orderBy: { order: "asc" },
    });

    const departments = await prisma.department.findMany({
      include: {
        hod: { select: SAFE_USER_SELECT },
        _count: { select: { members: true, tasks: true } },
      },
    });

    const auditLogs = await prisma.auditLog.findMany({
      include: { user: { select: SAFE_USER_SELECT } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      boardSeats,
      departments,
      auditLogs,
      currentCycle: {
        name: "Academic Year 2025-2026 · Semester 2",
        status: "ACTIVE",
        startDate: "2025-09-01",
        endDate: "2026-06-30",
      },
    });
  } catch (error) {
    console.error("Error in /api/admin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "BOARD") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action, payload } = await req.json();

    if (action === "CREATE_DEPARTMENT") {
      const { name, description, icon } = payload;
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      const dept = await prisma.department.create({
        data: { name, slug, description, icon },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "DEPARTMENT_CREATED",
          details: `Created new department: ${name}`,
        },
      });

      return NextResponse.json({ success: true, department: dept });
    }

    if (action === "ROLLOVER_CYCLE") {
      // Archive / create cycle audit record
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "CYCLE_ROLLOVER",
          details: `Initiated academic cycle rollover for: ${payload.cycleName}`,
        },
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
