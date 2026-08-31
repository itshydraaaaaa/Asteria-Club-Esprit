"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge, PriorityBadge, RoleBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";
import Link from "next/link";
import {
  Users,
  KanbanSquare,
  Calendar,
  Megaphone,
  Award,
  Sparkles,
  ArrowLeft,
  Code2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DepartmentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [department, setDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"roster" | "tasks" | "events" | "announcements">("roster");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/departments/${id}`)
      .then((res) => res.json())
      .then((res) => setDepartment(res.department))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-ink-soft">
        <div className="animate-spin w-8 h-8 border-2 border-teal-900 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="font-display text-xs uppercase tracking-wider">Loading Department Hub...</p>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-8 text-center">
        <p className="text-ink-soft">Department not found.</p>
        <Link href="/departments" className="mt-4 inline-block text-teal-900 font-bold">
          ← Back to Departments
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={`${department.name} Hub`}
        subtitle="Department roster, sprint tasks, sessions, and curricula"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 animate-vague-in">
        {/* Navigation back */}
        <Link
          href="/departments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-teal-900 transition-colors font-body"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Departments & Org Chart
        </Link>

        {/* Hero Card */}
        <div className="rounded-2xl bg-gradient-to-r from-teal-900 to-surface-dark2 text-white p-6 sm:p-8 shadow-md border border-teal-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-400/20 text-teal-300 border border-teal-400/30 text-xs font-semibold uppercase tracking-wider">
                <Code2 className="w-3.5 h-3.5" />
                Technical Division
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-wider text-white">
                {department.name}
              </h2>
              <p className="font-body text-xs sm:text-sm text-teal-100/90 max-w-2xl leading-relaxed">
                {department.description}
              </p>
            </div>

            {/* HoD Profile Card */}
            {department.hod && (
              <div className="p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center gap-3 flex-shrink-0">
                <Avatar name={department.hod.name} src={department.hod.avatarUrl} size="lg" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-teal-300 font-display">
                    Head of Department
                  </span>
                  <h4 className="font-body font-bold text-sm text-white">
                    {department.hod.name}
                  </h4>
                  <p className="text-[11px] text-teal-100/80">{department.hod.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Department Module Tabs */}
        <Tabs
          tabs={[
            { id: "roster", label: "Member Roster", count: department.members?.length, icon: <Users className="w-3.5 h-3.5" /> },
            { id: "tasks", label: "Sprint Tasks", count: department.tasks?.length, icon: <KanbanSquare className="w-3.5 h-3.5" /> },
            { id: "events", label: "Sessions & Workshops", count: department.events?.length, icon: <Calendar className="w-3.5 h-3.5" /> },
            { id: "announcements", label: "Announcements", count: department.announcements?.length, icon: <Megaphone className="w-3.5 h-3.5" /> },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
        />

        {/* Tab 1: Member Roster */}
        {activeTab === "roster" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-vague-in">
            {department.members?.map((member: any) => {
              let skills = [];
              try {
                skills = JSON.parse(member.skills || "[]");
              } catch {
                skills = [];
              }
              return (
                <Card key={member.id} hoverable className="p-5">
                  <div className="flex items-start gap-3.5">
                    <Avatar name={member.name} src={member.avatarUrl} size="lg" />
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-body font-bold text-sm text-ink truncate">
                          {member.name}
                        </h4>
                        <RoleBadge role={member.role} />
                      </div>
                      <p className="text-xs text-ink-soft font-body truncate mt-0.5">
                        {member.email}
                      </p>
                      {member.freelanceReady && (
                        <span className="inline-block text-[10px] font-bold text-teal-900 bg-teal-400/30 px-1.5 py-0.5 rounded mt-2">
                          ★ Asteria Freelance PreLaunch Ready
                        </span>
                      )}
                    </div>
                  </div>

                  {skills.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-line/60 flex flex-wrap gap-1">
                      {skills.map((s: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-surface-alt text-ink-soft px-2 py-0.5 rounded border border-line"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-line/60 flex justify-end">
                    <Link href={`/members/${member.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        View Full Profile →
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Tab 2: Sprint Tasks */}
        {activeTab === "tasks" && (
          <Card className="animate-vague-in">
            <CardHeader>
              <CardTitle>Active Department Tasks</CardTitle>
              <Link href="/tasks">
                <Button size="sm" variant="primary">
                  Open Kanban Board
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="divide-y divide-line/60">
              {department.tasks?.map((t: any) => (
                <div key={t.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <h5 className="font-body font-bold text-sm text-ink">{t.title}</h5>
                    <p className="text-xs text-ink-soft">{t.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-ink-faint block font-body">
                      Due {formatDate(t.dueDate)}
                    </span>
                    {t.assignee && (
                      <span className="text-xs text-teal-900 font-semibold mt-1 block">
                        👤 {t.assignee.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Events */}
        {activeTab === "events" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-vague-in">
            {department.events?.map((evt: any) => (
              <Card key={evt.id} hoverable className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="accent" size="sm">
                    {department.name}
                  </Badge>
                  <span className="text-xs text-ink-faint font-body">
                    {formatDate(evt.startTime)}
                  </span>
                </div>
                <h4 className="font-body font-bold text-sm text-ink">{evt.title}</h4>
                <p className="text-xs text-ink-soft leading-relaxed">{evt.description}</p>
                <div className="pt-3 border-t border-line/60 flex items-center justify-between text-xs text-ink-soft">
                  <span>📍 {evt.location}</span>
                  <span className="font-mono text-teal-900 font-bold bg-teal-50 px-2 py-0.5 rounded">
                    {evt.checkInCode}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Tab 4: Announcements */}
        {activeTab === "announcements" && (
          <div className="space-y-4 animate-vague-in">
            {department.announcements?.map((ann: any) => (
              <Card key={ann.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900 font-body">
                    📢 Department Feed
                  </span>
                  <span className="text-xs text-ink-faint font-body">
                    {formatDate(ann.createdAt)}
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm uppercase tracking-wider text-ink">
                  {ann.title}
                </h4>
                <p className="font-body text-xs text-ink-soft leading-relaxed">
                  {ann.body}
                </p>
                {ann.author && (
                  <div className="pt-3 border-t border-line/60 flex items-center gap-2 text-xs text-ink-soft">
                    <span>Posted by <strong>{ann.author.name}</strong></span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
