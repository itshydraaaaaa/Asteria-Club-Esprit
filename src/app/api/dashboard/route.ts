import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const totalMembers = await prisma.user.count({ where: { status: "ACTIVE" } });
    const totalDepartments = await prisma.department.count();
    const pendingApplications = await prisma.application.count({ where: { status: "PENDING" } });

    const totalTasks = await prisma.task.count();
    const completedTasks = await prisma.task.count({ where: { status: "DONE" } });
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalEvents = await prisma.event.count();
    const totalAttendance = await prisma.attendanceRecord.count({ where: { status: "PRESENT" } });

    // Role-specific data aggregation
    let roleData: any = {};

    if (user.role === "BOARD") {
      const recentAuditLogs = await prisma.auditLog.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      });

      const upcomingEvents = await prisma.event.findMany({
        where: { startTime: { gte: new Date() } },
        include: { department: true, rsvps: true },
        orderBy: { startTime: "asc" },
        take: 4,
      });

      const departmentBreakdown = await prisma.department.findMany({
        include: {
          _count: {
            select: { members: true, tasks: true },
          },
        },
      });

      roleData = {
        recentAuditLogs,
        upcomingEvents,
        departmentBreakdown,
      };
    } else if (user.role === "HOD" && user.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: user.departmentId },
        include: {
          members: { where: { status: "ACTIVE" } },
          tasks: true,
          events: {
            where: { startTime: { gte: new Date() } },
            orderBy: { startTime: "asc" },
            take: 4,
          },
        },
      });

      const deptTasks = dept?.tasks || [];
      const deptTasksDone = deptTasks.filter((t) => t.status === "DONE").length;
      const deptTasksInProgress = deptTasks.filter((t) => t.status === "IN_PROGRESS").length;
      const deptTasksReview = deptTasks.filter((t) => t.status === "REVIEW").length;
      const deptTasksTodo = deptTasks.filter((t) => t.status === "TODO").length;

      roleData = {
        department: dept,
        deptTaskStats: {
          total: deptTasks.length,
          done: deptTasksDone,
          inProgress: deptTasksInProgress,
          review: deptTasksReview,
          todo: deptTasksTodo,
        },
        deptMembersCount: dept?.members.length || 0,
        upcomingDeptEvents: dept?.events || [],
      };
    } else {
      // Member data
      const myTasks = await prisma.task.findMany({
        where: { assigneeId: user.id },
        include: { department: true },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      });

      const myNextEvents = await prisma.event.findMany({
        where: {
          startTime: { gte: new Date() },
          OR: [
            { departmentId: null },
            ...(user.departmentId ? [{ departmentId: user.departmentId }] : []),
          ],
        },
        include: {
          department: true,
          rsvps: { where: { userId: user.id } },
        },
        orderBy: { startTime: "asc" },
        take: 4,
      });

      const myAttendanceRecords = await prisma.attendanceRecord.findMany({
        where: { userId: user.id },
        include: { event: true },
        orderBy: { checkedInAt: "desc" },
      });

      roleData = {
        myTasks,
        myNextEvents,
        myAttendanceRecords,
      };
    }

    return NextResponse.json({
      overview: {
        totalMembers,
        totalDepartments,
        pendingApplications,
        taskCompletionRate,
        totalTasks,
        completedTasks,
        totalEvents,
        totalAttendance,
      },
      roleData,
    });
  } catch (error) {
    console.error("Error in GET /api/dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
