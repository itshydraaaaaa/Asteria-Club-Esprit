import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { BoardDashboard } from "@/components/dashboard/BoardDashboard";
import { HoDDashboard } from "@/components/dashboard/HoDDashboard";
import { MemberDashboard } from "@/components/dashboard/MemberDashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Clock } from "lucide-react";
import {
  getDashboardOverview,
  getRecentAuditLogs,
  getUpcomingEvents,
  getDepartmentsWithCounts,
  getTasksByAssignee,
  getTasksByDepartment,
  getAttendanceByUser,
} from "@/lib/supabase/queries";

async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) return null;

  const overview = await getDashboardOverview();
  let roleData: any = {};

  if (user.role === "BOARD") {
    const [recentAuditLogs, upcomingEvents, departmentBreakdown] = await Promise.all([
      getRecentAuditLogs(5),
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
      deptMembersCount: 0,
    };
  } else {
    const [myTasks, myAttendanceRecords, myNextEvents] = await Promise.all([
      getTasksByAssignee(user.id),
      getAttendanceByUser(user.id),
      getUpcomingEvents(4, user.departmentId ?? undefined),
    ]);
    roleData = { myTasks, myAttendanceRecords, myNextEvents };
  }

  return { overview, roleData };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const data = await getDashboardData();

  if (!data) return null;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        user={user}
        title="Dashboard"
        subtitle={
          user?.role === "BOARD"
            ? "Club-Wide Executive Overview & Operations"
            : user?.role === "HOD"
            ? `${user.departmentName || "Department"} Division Console`
            : "Personal Workspace & Sprint Tasks"
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {user?.role === "BOARD" && <BoardDashboard data={data} />}
        {user?.role === "HOD" && <HoDDashboard data={data} user={user} />}
        {user?.role === "MEMBER" && <MemberDashboard data={data} user={user} />}

        {user?.role === "APPLICANT" && (
          <div className="max-w-2xl mx-auto space-y-6 animate-vague-in">
            <Card className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8" />
              </div>
              <h2 className="font-display font-bold text-2xl uppercase tracking-wider text-ink">
                Application In Review
              </h2>
              <p className="font-body text-sm text-ink-soft max-w-md mx-auto">
                Thank you for applying to Asteria Club Esprit! Our Executive Board and Heads of Department are currently reviewing applicant portfolios.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <Link href="/apply">
                  <Button variant="outline" size="sm">
                    View Recruitment Form
                  </Button>
                </Link>
                <Link href="/announcements">
                  <Button variant="primary" size="sm">
                    Read Public Announcements
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
