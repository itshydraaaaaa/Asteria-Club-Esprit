"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  Users,
  KanbanSquare,
  Calendar,
  CheckCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface HoDDashboardProps {
  data: any;
  user: any;
}

export function HoDDashboard({ data, user }: HoDDashboardProps) {
  const { overview, roleData } = data;
  const dept = roleData?.department;
  const taskStats = roleData?.deptTaskStats || {
    total: 0,
    done: 0,
    inProgress: 0,
    review: 0,
    todo: 0,
  };

  return (
    <div className="space-y-6 animate-vague-in">
      {/* Department Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-900 to-teal-800 text-white p-6 sm:p-8 shadow-md border border-teal-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-400/20 text-teal-300 border border-teal-400/30 text-xs font-semibold uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" />
              Department Head Operations
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-wider text-white">
              {dept?.name || "Department"} Hub
            </h2>
            <p className="font-body text-xs sm:text-sm text-teal-100/90 mt-1 max-w-xl">
              {dept?.description || "Manage your department curriculum, tasks, member roster, and workshop attendance."}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/tasks">
              <Button variant="accent" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Create Task
              </Button>
            </Link>
            <Link href={`/departments/${dept?.id}`}>
              <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Department Page
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Task Velocity Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft font-body">
            To Do
          </p>
          <h4 className="font-display font-bold text-2xl text-ink mt-1">
            {taskStats.todo}
          </h4>
          <span className="text-[10px] text-ink-faint font-body">Queued for sprint</span>
        </Card>

        <Card className="p-4 bg-surface">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-900 font-body">
            In Progress
          </p>
          <h4 className="font-display font-bold text-2xl text-teal-900 mt-1">
            {taskStats.inProgress}
          </h4>
          <span className="text-[10px] text-ink-faint font-body">Being worked on</span>
        </Card>

        <Card className="p-4 bg-surface">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 font-body">
            In Review
          </p>
          <h4 className="font-display font-bold text-2xl text-amber-700 mt-1">
            {taskStats.review}
          </h4>
          <span className="text-[10px] text-ink-faint font-body">Awaiting HoD feedback</span>
        </Card>

        <Card className="p-4 bg-surface">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 font-body">
            Completed
          </p>
          <h4 className="font-display font-bold text-2xl text-emerald-700 mt-1">
            {taskStats.done}
          </h4>
          <span className="text-[10px] text-ink-faint font-body">Production ready</span>
        </Card>
      </div>

      {/* Active Department Tasks & Member Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tasks list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Active Department Tasks</CardTitle>
              <p className="text-xs text-ink-soft font-body mt-0.5">
                Current sprint tasks assigned to members
              </p>
            </div>
            <Link href="/tasks">
              <Button variant="outline" size="sm">
                Kanban View
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {dept?.tasks?.length > 0 ? (
              dept.tasks.slice(0, 5).map((t: any) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-line bg-surface-alt/40 flex items-center justify-between gap-3 hover:border-teal-400/40 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <h5 className="font-body font-bold text-xs text-ink">
                      {t.title}
                    </h5>
                    <p className="text-[11px] text-ink-soft line-clamp-1">
                      {t.description || "No description provided."}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] text-ink-faint font-body">
                      {formatDate(t.dueDate)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-soft text-center py-4">No active tasks in department.</p>
            )}
          </CardContent>
        </Card>

        {/* Department Member Roster */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-900" />
              <CardTitle>Member Roster ({dept?.members?.length || 0})</CardTitle>
            </div>
            <Link href="/members" className="text-xs text-teal-900 font-semibold hover:underline">
              Directory
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {dept?.members?.map((m: any) => (
              <Link
                key={m.id}
                href={`/members/${m.id}`}
                className="p-2.5 rounded-xl border border-line/60 bg-surface-alt/30 hover:bg-surface-alt flex items-center justify-between gap-3 transition-colors block"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                  <div>
                    <p className="font-body font-bold text-xs text-ink">{m.name}</p>
                    <p className="text-[10px] text-ink-soft">{m.email}</p>
                  </div>
                </div>
                {m.freelanceReady && (
                  <Badge variant="accent" size="sm">
                    ★ Freelance
                  </Badge>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
