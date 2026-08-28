"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge, RoleBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { AmbientCanvas } from "@/components/ui/AmbientCanvas";
import { EmptyState } from "@/components/ui/EmptyState";
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
  CalendarCheck,
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
      rawValue: overview.totalMembers,
      change: "Enrolled in technical tracks",
      icon: Users,
      color: "text-ast-primary bg-teal-50 border-teal-200",
    },
    {
      label: "Active Departments",
      rawValue: overview.totalDepartments,
      change: "4 technical tracks",
      icon: Layers,
      color: "text-teal-700 bg-teal-50 border-teal-200",
    },
    {
      label: "Task Completion Velocity",
      rawValue: overview.taskCompletionRate,
      suffix: "%",
      change: `${overview.completedTasks}/${overview.totalTasks} sprint tickets completed`,
      icon: CheckCircle2,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Pending Applications",
      rawValue: overview.pendingApplications,
      change: "Recruits awaiting review",
      icon: UserPlus,
      color: "text-amber-700 bg-amber-50 border-amber-200",
      href: "/applications",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Hero Banner with Ambient 3D Canvas */}
      <div className="rounded-3xl gradient-mesh-hero text-white p-6 sm:p-10 shadow-lg relative overflow-hidden border border-teal-700/50">
        <AmbientCanvas particleCount={30} className="absolute inset-0 pointer-events-none opacity-60" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-ast-light/20 text-ast-light border border-ast-light/30 text-xs font-semibold uppercase tracking-wider font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            Executive Board Console
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-4xl uppercase tracking-wider text-white">
            Asteria Club Esprit
          </h2>
          <p className="font-body text-xs sm:text-sm text-teal-100/90 leading-relaxed">
            Welcome to the club executive operating system. Oversee departmental sprints, monitor member attendance health, review talent recruitment, and graduate creators into <strong>Asteria Freelance</strong>.
          </p>
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <Link href="/tasks">
              <Button variant="accent" size="sm" className="font-bold shadow-md">
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
      </div>

      {/* KPI Cards Grid with Animated Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} hoverable className="p-5 bg-surface/90 backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-display">
                    {stat.label}
                  </p>
                  <h4 className="font-display font-bold text-2xl sm:text-3xl text-ink mt-2">
                    <AnimatedCounter value={stat.rawValue} suffix={stat.suffix || ""} />
                  </h4>
                  <p className="text-xs text-ink-soft font-body mt-1">
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-2xl border ${stat.color} shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              {stat.href && (
                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-ast-primary font-semibold font-body">
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
        <Card className="lg:col-span-2 bg-surface/90 backdrop-blur-md">
          <CardHeader>
            <div>
              <CardTitle>Departments & Training Tracks</CardTitle>
              <p className="text-xs text-ink-soft font-body mt-0.5">
                Roster distribution and sprint tasks per division
              </p>
            </div>
            <Link href="/departments" className="text-xs text-ast-primary font-semibold hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {roleData?.departmentBreakdown?.map((dept: any) => (
              <div
                key={dept.id}
                className="p-4 rounded-2xl border border-line bg-surface-alt/50 hover:bg-surface-alt hover:border-ast-light/40 transition-all flex items-center justify-between gap-4"
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
                    <span className="font-mono font-bold text-sm text-ink block">
                      {dept._count?.members || 0}
                    </span>
                    <span className="text-[10px] text-ink-soft uppercase font-mono">
                      Members
                    </span>
                  </div>
                  <div>
                    <span className="font-mono font-bold text-sm text-ast-primary block">
                      {dept._count?.tasks || 0}
                    </span>
                    <span className="text-[10px] text-ink-soft uppercase font-mono">
                      Tasks
                    </span>
                  </div>
                  <Link href={`/departments/${dept.id}`}>
                    <Button variant="secondary" size="sm" className="text-xs">
                      Hub
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Club Events */}
        <Card className="bg-surface/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Next Scheduled Sessions</CardTitle>
            <Link href="/calendar" className="text-xs text-ast-primary font-semibold hover:underline">
              Calendar
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {roleData?.upcomingEvents?.length > 0 ? (
              roleData.upcomingEvents.map((evt: any) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl border border-line bg-surface-alt/50 hover:border-ast-light/40 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={evt.department ? "accent" : "primary"} size="sm">
                      {evt.department ? evt.department.name : "Club-Wide"}
                    </Badge>
                    <span className="text-[10px] text-ink-faint font-mono">
                      {formatDate(evt.startTime)}
                    </span>
                  </div>
                  <h5 className="font-body font-bold text-xs text-ink line-clamp-1">
                    {evt.title}
                  </h5>
                  <p className="text-[11px] text-ink-soft font-body line-clamp-1">
                    📍 {evt.location}
                  </p>
                  <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-soft">
                    <span>{evt.rsvps?.length || 0} Attending</span>
                    <span className="font-mono text-ast-primary font-bold bg-teal-50 px-1.5 py-0.5 rounded text-[10px]">
                      {evt.checkInCode}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={CalendarCheck}
                title="No Upcoming Events"
                description="Schedule club workshops or assemblies on the calendar."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security & Operation Audit Log */}
      <Card className="bg-surface/90 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-ast-primary" />
            <CardTitle>System Activity & Audit Log</CardTitle>
          </div>
          <Link href="/admin" className="text-xs text-ast-primary font-semibold hover:underline">
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
                      <span className="font-mono text-[11px] bg-surface-alt px-1.5 py-0.5 rounded border border-line text-ast-primary">
                        {log.action}
                      </span>
                    </p>
                    <p className="text-xs text-ink-soft font-body mt-0.5">{log.details}</p>
                  </div>
                </div>
                <span className="text-[11px] text-ink-faint whitespace-nowrap font-mono">
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
