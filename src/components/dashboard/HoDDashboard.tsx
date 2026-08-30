"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLanguage } from "@/components/providers/LanguageProvider";
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
  const { language, t } = useLanguage();
  const isFr = language === "fr";

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
    <div className="space-y-6">
      {/* Department Header Banner */}
      <div className="rounded-3xl gradient-mesh-hero text-white p-6 sm:p-8 shadow-lg border border-teal-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-ast-light/20 text-ast-light border border-ast-light/30 text-xs font-semibold uppercase tracking-wider font-mono">
              <Award className="w-3.5 h-3.5" />
              {isFr ? "Opérations Chef de Département" : "Department Head Operations"}
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-wider text-white">
              {isFr ? `Pôle ${dept?.name || "Département"}` : `${dept?.name || "Department"} Hub`}
            </h2>
            <p className="font-body text-xs sm:text-sm text-teal-100/90 max-w-xl leading-relaxed">
              {dept?.description ||
                (isFr
                  ? "Gérez les programmes, les tâches, les membres de votre pôle et l'assiduité aux ateliers."
                  : "Manage your department curriculum, tasks, member roster, and workshop attendance.")}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/tasks">
              <Button variant="accent" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} className="font-bold">
                {isFr ? "Créer une Tâche" : "Create Task"}
              </Button>
            </Link>
            <Link href={`/departments/${dept?.id}`}>
              <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                {isFr ? "Page du Pôle" : "Department Page"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Task Velocity Grid with Animated Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 bg-surface/90 backdrop-blur-md">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft font-display">
            {t("tasks.col.todo", "To Do")}
          </p>
          <h4 className="font-display font-bold text-2xl sm:text-3xl text-ink mt-1">
            <AnimatedCounter value={taskStats.todo} />
          </h4>
          <span className="text-[10px] text-ink-faint font-body">{isFr ? "File d'attente" : "Sprint queue"}</span>
        </Card>

        <Card className="p-5 bg-surface/90 backdrop-blur-md">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ast-primary font-display">
            {t("tasks.col.inProgress", "In Progress")}
          </p>
          <h4 className="font-display font-bold text-2xl sm:text-3xl text-ast-primary mt-1">
            <AnimatedCounter value={taskStats.inProgress} />
          </h4>
          <span className="text-[10px] text-ink-faint font-body">{isFr ? "En production" : "Being crafted"}</span>
        </Card>

        <Card className="p-5 bg-surface/90 backdrop-blur-md">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 font-display">
            {t("tasks.col.review", "In Review")}
          </p>
          <h4 className="font-display font-bold text-2xl sm:text-3xl text-amber-700 mt-1">
            <AnimatedCounter value={taskStats.review} />
          </h4>
          <span className="text-[10px] text-ink-faint font-body">{isFr ? "Revue responsable" : "HoD feedback"}</span>
        </Card>

        <Card className="p-5 bg-surface/90 backdrop-blur-md">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 font-display">
            {t("tasks.col.done", "Completed")}
          </p>
          <h4 className="font-display font-bold text-2xl sm:text-3xl text-emerald-700 mt-1">
            <AnimatedCounter value={taskStats.done} />
          </h4>
          <span className="text-[10px] text-ink-faint font-body">{isFr ? "Validé" : "Production ready"}</span>
        </Card>
      </div>

      {/* Active Department Tasks & Member Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tasks list */}
        <Card className="lg:col-span-2 bg-surface/90 backdrop-blur-md">
          <CardHeader>
            <div>
              <CardTitle>{isFr ? "Tâches Actives du Pôle" : "Active Department Tasks"}</CardTitle>
              <p className="text-xs text-ink-soft font-body mt-0.5">
                {isFr ? "Tâches de sprint en cours assignées aux membres" : "Current sprint tasks assigned to members"}
              </p>
            </div>
            <Link href="/tasks">
              <Button variant="outline" size="sm" className="text-xs">
                {isFr ? "Vue Kanban" : "Kanban View"}
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {dept?.tasks?.length > 0 ? (
              dept.tasks.slice(0, 5).map((tItem: any) => (
                <div
                  key={tItem.id}
                  className="p-4 rounded-2xl border border-line bg-surface-alt/50 flex items-center justify-between gap-3 hover:border-ast-light/40 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={tItem.status} />
                      <PriorityBadge priority={tItem.priority} />
                    </div>
                    <h5 className="font-body font-bold text-xs text-ink">{tItem.title}</h5>
                    <p className="text-[11px] text-ink-soft line-clamp-1">
                      {tItem.description || (isFr ? "Aucune description fournie." : "No description provided.")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[10px] text-ink-faint font-mono">
                      {formatDate(tItem.dueDate)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={KanbanSquare}
                title={isFr ? "Aucune tâche dans ce pôle" : "No Tasks in Track"}
                description={isFr ? "Créez des tâches de sprint pour les membres de votre pôle." : "Create sprint tasks for your department members."}
              />
            )}
          </CardContent>
        </Card>

        {/* Department Member Roster */}
        <Card className="bg-surface/90 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-ast-primary" />
              <CardTitle>{isFr ? "Effectif du Pôle" : "Member Roster"} ({dept?.members?.length || 0})</CardTitle>
            </div>
            <Link href="/members" className="text-xs text-ast-primary font-semibold hover:underline">
              {t("nav.members", "Directory")}
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {dept?.members?.length > 0 ? (
              dept.members.map((m: any) => (
                <Link
                  key={m.id}
                  href={`/members/${m.id}`}
                  className="p-3 rounded-xl border border-line/60 bg-surface-alt/40 hover:bg-surface-alt flex items-center justify-between gap-3 transition-colors block"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                    <div>
                      <p className="font-body font-bold text-xs text-ink">{m.name}</p>
                      <p className="text-[10px] text-ink-soft">{m.email}</p>
                    </div>
                  </div>
                  {m.freelanceReady && (
                    <Badge variant="accent" size="sm" className="font-mono">
                      ★ Freelance
                    </Badge>
                  )}
                </Link>
              ))
            ) : (
              <EmptyState
                icon={Users}
                title={isFr ? "Aucun membre inscrit" : "No Members Enrolled"}
                description={isFr ? "Les candidats acceptés dans ce pôle apparaîtront ici." : "Accepted applicants assigned to this track will appear here."}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
