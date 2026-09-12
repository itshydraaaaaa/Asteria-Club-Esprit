import { NextResponse } from "next/server";
import { getDashboardOverview, getRecentAuditLogs, getUpcomingEvents, getDepartmentsWithCounts, getTasksByAssignee, getTasksByDepartment, getAttendanceByUser } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const overview = await getDashboardOverview();
    let roleData: any = {};

    if (user.role === "BOARD") {
      const [recentAuditLogs, upcomingEvents, departmentBreakdown] = await Promise.all([
        getRecentAuditLogs(6),
        getUpcomingEvents(4),
        getDepartmentsWithCounts(),
      ]);
      roleData = { recentAuditLogs, upcomingEvents, departmentBreakdown };
    } else if (user.role === "HOD" && user.departmentId) {
      const [deptTasks, upcomingDeptEvents] = await Promise.all([
        getTasksByDepartment(user.departmentId),
        getUpcomingEvents(4, user.departmentId),
      ]);

      const deptTasksDone = deptTasks.filter((t: any) => t.status === "DONE").length;
      const deptTasksInProgress = deptTasks.filter((t: any) => t.status === "IN_PROGRESS").length;
      const deptTasksReview = deptTasks.filter((t: any) => t.status === "REVIEW").length;
      const deptTasksTodo = deptTasks.filter((t: any) => t.status === "TODO").length;

      roleData = {
        deptTaskStats: {
          total: deptTasks.length,
          done: deptTasksDone,
          inProgress: deptTasksInProgress,
          review: deptTasksReview,
          todo: deptTasksTodo,
        },
        upcomingDeptEvents,
        deptMembersCount: 0, // fetched via getDepartmentById when needed
      };
    } else {
      const [myTasks, myAttendanceRecords, myNextEvents] = await Promise.all([
        getTasksByAssignee(user.id),
        getAttendanceByUser(user.id),
        getUpcomingEvents(4, user.departmentId ?? undefined),
      ]);
      roleData = { myTasks, myAttendanceRecords, myNextEvents };
    }

    return NextResponse.json({ overview, roleData });
  } catch (error) {
    console.error("Error in GET /api/dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
