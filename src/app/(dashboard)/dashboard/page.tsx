import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { BoardDashboard } from "@/components/dashboard/BoardDashboard";
import { HoDDashboard } from "@/components/dashboard/HoDDashboard";
import { MemberDashboard } from "@/components/dashboard/MemberDashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Sparkles, CheckCircle2, Clock, FileText } from "lucide-react";

async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Internal API fetch simulation via database direct query for fast SSR
  const { prisma } = await import("@/lib/db");

  const totalMembers = await prisma.user.count({ where: { status: "ACTIVE" } });
  const totalDepartments = await prisma.department.count();
  const pendingApplications = await prisma.application.count({ where: { status: "PENDING" } });

  const totalTasks = await prisma.task.count();
  const completedTasks = await prisma.task.count({ where: { status: "DONE" } });
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalEvents = await prisma.event.count();
  const totalAttendance = await prisma.attendanceRecord.count({ where: { status: "PRESENT" } });

  let roleData: any = {};

  if (user.role === "BOARD") {
    const recentAuditLogs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 5,
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
        tasks: {
          include: { assignee: true },
          orderBy: { createdAt: "desc" },
        },
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

  return {
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
  };
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
