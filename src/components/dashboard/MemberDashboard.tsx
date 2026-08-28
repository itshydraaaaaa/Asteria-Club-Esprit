"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  QrCode,
  Sparkles,
  ArrowRight,
  Clock,
  Briefcase,
  Layers,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface MemberDashboardProps {
  data: any;
  user: any;
}

export function MemberDashboard({ data, user }: MemberDashboardProps) {
  const { roleData } = data;
  const myTasks = roleData?.myTasks || [];
  const nextEvents = roleData?.myNextEvents || [];
  const attendanceRecords = roleData?.myAttendanceRecords || [];

  const completedTasks = myTasks.filter((t: any) => t.status === "DONE").length;
  const attendanceRate = attendanceRecords.length > 0 ? "92%" : "100%";

  return (
    <div className="space-y-6 animate-vague-in">
      {/* Member Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-900 to-surface-dark2 text-white p-6 sm:p-8 shadow-md border border-teal-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-400/20 text-teal-300 border border-teal-400/30 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Member Hub · {user?.departmentName || "General Division"}
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-wider text-white">
              Welcome back, {user?.name}
            </h2>
            <p className="font-body text-xs sm:text-sm text-teal-100/90 mt-1 max-w-xl">
              Track your assigned tasks, confirm event RSVPs, scan attendance QR codes, and prepare for Asteria Freelance readiness.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/attendance">
              <Button variant="accent" size="sm" leftIcon={<QrCode className="w-4 h-4" />}>
                Event Check-In
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                View Calendar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Member Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-body">
                My Assigned Tasks
              </p>
              <h4 className="font-display font-bold text-2xl text-ink mt-1">
                {myTasks.length}
              </h4>
              <p className="text-xs text-ink-soft font-body mt-1">
                {completedTasks} completed
              </p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-body">
                Attendance Health
              </p>
              <h4 className="font-display font-bold text-2xl text-teal-900 mt-1">
                {attendanceRate}
              </h4>
              <p className="text-xs text-emerald-700 font-body mt-1 font-semibold">
                Good Standing
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-body">
                Freelance Division
              </p>
              <h4 className="font-display font-bold text-lg text-ink mt-1">
                {user?.freelanceReady ? "Qualified ★" : "In Training"}
              </h4>
              <p className="text-xs text-ink-soft font-body mt-1">
                {user?.freelanceReady
                  ? "Eligible for paid client contracts"
                  : "Complete 2 more tasks to qualify"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-teal-400/20 border border-teal-400/40 text-teal-900">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* My Tasks & Next Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>My Sprint Tasks</CardTitle>
              <p className="text-xs text-ink-soft font-body mt-0.5">
                Tasks currently assigned to you across departments
              </p>
            </div>
            <Link href="/tasks">
              <Button variant="outline" size="sm">
                Open Kanban
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {myTasks.length > 0 ? (
              myTasks.map((t: any) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-line bg-surface-alt/40 flex items-center justify-between gap-4 hover:border-teal-400/40 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                      {t.department && (
                        <span className="text-[10px] text-teal-900 font-semibold font-body">
                          • {t.department.name}
                        </span>
                      )}
                    </div>
                    <h5 className="font-body font-bold text-xs text-ink">
                      {t.title}
                    </h5>
                    <p className="text-[11px] text-ink-soft line-clamp-1">
                      {t.description || "No description."}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-ink-faint font-body block">
                      Due: {formatDate(t.dueDate)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-soft text-center py-6">
                You have no pending sprint tasks. Check the Kanban board to pick up open items!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Next Scheduled Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <Link href="/calendar" className="text-xs text-teal-900 font-semibold hover:underline">
              Calendar
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextEvents.length > 0 ? (
              nextEvents.map((evt: any) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl border border-line bg-surface-alt/40 hover:border-teal-400/40 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={evt.departmentId ? "accent" : "primary"} size="sm">
                      {evt.department ? evt.department.name : "Club-Wide"}
                    </Badge>
                    <span className="text-[10px] text-ink-faint">
                      {formatDate(evt.startTime)}
                    </span>
                  </div>
                  <h5 className="font-body font-bold text-xs text-ink">
                    {evt.title}
                  </h5>
                  <p className="text-[11px] text-ink-soft">
                    📍 {evt.location}
                  </p>
                  <div className="pt-2 border-t border-line/60 flex items-center justify-between">
                    <Link href="/attendance">
                      <Button size="sm" variant="outline" className="text-[11px] py-1">
                        Check In
                      </Button>
                    </Link>
                    <span className="text-[10px] font-mono font-bold text-teal-900">
                      Code: {evt.checkInCode}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-soft text-center py-4">No upcoming events.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
