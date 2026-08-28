"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge, RoleBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  Users,
  Layers,
  Calendar,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Award,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BoardDashboardProps {
  data: any;
}

export function BoardDashboard({ data }: BoardDashboardProps) {
  const { overview, roleData } = data;

  const stats = [
    {
      label: "Active Members",
      value: overview.totalMembers,
      change: "+18% this cycle",
      icon: Users,
      color: "text-teal-900 bg-teal-50 border-teal-200",
    },
    {
      label: "Active Departments",
      value: overview.totalDepartments,
      change: "4 technical tracks",
      icon: Layers,
      color: "text-teal-700 bg-teal-50 border-teal-200",
    },
    {
      label: "Task Completion Rate",
      value: `${overview.taskCompletionRate}%`,
      change: `${overview.completedTasks}/${overview.totalTasks} completed`,
      icon: CheckCircle2,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Pending Applications",
      value: overview.pendingApplications,
      change: "Needs review",
      icon: UserPlus,
      color: "text-amber-700 bg-amber-50 border-amber-200",
      href: "/applications",
    },
  ];

  return (
    <div className="space-y-6 animate-vague-in">
      {/* Top Banner with Asteria Brand Styling */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-900 via-surface-dark2 to-teal-900 text-white p-6 sm:p-8 shadow-md relative overflow-hidden border border-teal-800">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-400/20 text-teal-300 border border-teal-400/30 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            President & Executive Board Console
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-wider text-white">
            Asteria Club Esprit
          </h2>
          <p className="font-body text-sm text-teal-100/90 mt-2 leading-relaxed">
            Welcome to the club executive operations dashboard. Oversee departmental sprints, monitor member attendance, review onboarding pipelines, and curate talent into Asteria Freelance.
          </p>
          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <Link href="/tasks">
              <Button variant="accent" size="sm">
                Open Kanban Board
              </Button>
            </Link>
            <Link href="/departments">
              <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                View Org Chart
              </Button>
            </Link>
            <Link href="/applications">
              <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Review Applications ({overview.pendingApplications})
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient watermark pattern */}
        <div className="absolute right-0 bottom-0 top-0 w-80 opacity-10 pointer-events-none flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
            <polygon points="50 5, 60 38, 95 50, 60 62, 50 95, 40 62, 5 50, 40 38" />
          </svg>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} hoverable className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-body">
                    {stat.label}
                  </p>
                  <h4 className="font-display font-bold text-2xl text-ink mt-2">
                    {stat.value}
                  </h4>
                  <p className="text-xs text-ink-soft font-body mt-1">
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              {stat.href && (
                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-teal-900 font-semibold font-body">
                  <Link href={stat.href} className="inline-flex items-center gap-1 hover:underline">
                    Action Required <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Department Breakdown & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Track Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Departments & Training Tracks</CardTitle>
              <p className="text-xs text-ink-soft font-body mt-0.5">
                Roster distribution and task progress per division
              </p>
            </div>
            <Link href="/departments" className="text-xs text-teal-900 font-semibold hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {roleData?.departmentBreakdown?.map((dept: any) => (
              <div
                key={dept.id}
                className="p-4 rounded-xl border border-line bg-surface-alt/40 hover:bg-surface-alt transition-colors flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ink">
                    {dept.name}
                  </h4>
                  <p className="text-xs text-ink-soft font-body mt-0.5 line-clamp-1">
                    {dept.description}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-right flex-shrink-0">
                  <div>
                    <span className="font-display font-bold text-sm text-ink block">
                      {dept._count.members}
                    </span>
                    <span className="text-[10px] text-ink-soft uppercase font-body">
                      Members
                    </span>
                  </div>
                  <div>
                    <span className="font-display font-bold text-sm text-teal-900 block">
                      {dept._count.tasks}
                    </span>
                    <span className="text-[10px] text-ink-soft uppercase font-body">
                      Tasks
                    </span>
                  </div>
                  <Link href={`/departments/${dept.id}`}>
                    <Button variant="secondary" size="sm">
                      Hub
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Club Events */}
        <Card>
          <CardHeader>
            <CardTitle>Next Scheduled Events</CardTitle>
            <Link href="/calendar" className="text-xs text-teal-900 font-semibold hover:underline">
              Calendar
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {roleData?.upcomingEvents?.length > 0 ? (
              roleData.upcomingEvents.map((evt: any) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl border border-line bg-surface-alt/40 hover:border-teal-400/40 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={evt.department ? "accent" : "primary"} size="sm">
                      {evt.department ? evt.department.name : "Club-Wide"}
                    </Badge>
                    <span className="text-[10px] text-ink-faint font-body">
                      {formatDate(evt.startTime)}
                    </span>
                  </div>
                  <h5 className="font-body font-bold text-xs text-ink mt-2 line-clamp-1">
                    {evt.title}
                  </h5>
                  <p className="text-[11px] text-ink-soft font-body mt-0.5 line-clamp-1">
                    📍 {evt.location}
                  </p>
                  <div className="mt-2 pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-soft">
                    <span>{evt.rsvps?.length || 0} Attending</span>
                    <span className="font-mono text-teal-900 font-bold bg-teal-50 px-1.5 py-0.5 rounded text-[10px]">
                      {evt.checkInCode}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-soft text-center py-4">No upcoming events scheduled.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security & Operation Audit Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-900" />
            <CardTitle>Recent Club Activity & Audit Log</CardTitle>
          </div>
          <Link href="/admin" className="text-xs text-teal-900 font-semibold hover:underline">
            Admin View
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-line/60">
            {roleData?.recentAuditLogs?.map((log: any) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={log.user?.name || "System"} src={log.user?.avatarUrl} size="sm" />
                  <div>
                    <p className="text-xs font-bold font-body text-ink">
                      {log.user?.name || "System"}{" "}
                      <span className="font-normal text-ink-soft">performed</span>{" "}
                      <span className="font-mono text-[11px] bg-surface-alt px-1.5 py-0.5 rounded border border-line">
                        {log.action}
                      </span>
                    </p>
                    <p className="text-xs text-ink-soft font-body mt-0.5">{log.details}</p>
                  </div>
                </div>
                <span className="text-[11px] text-ink-faint whitespace-nowrap font-body">
                  {formatDate(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
