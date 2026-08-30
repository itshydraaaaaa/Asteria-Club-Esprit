"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLanguage } from "@/components/providers/LanguageProvider";
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
  CalendarCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface MemberDashboardProps {
  data: any;
  user: any;
}

export function MemberDashboard({ data, user }: MemberDashboardProps) {
  const { language, t } = useLanguage();
  const isFr = language === "fr";

  const { roleData } = data;
  const myTasks = roleData?.myTasks || [];
  const nextEvents = roleData?.myNextEvents || [];
  const attendanceRecords = roleData?.myAttendanceRecords || [];

  const completedTasks = myTasks.filter((tItem: any) => tItem.status === "DONE").length;
  const presentRecords = attendanceRecords.filter((r: any) => r.status === "PRESENT").length;
  const totalAttendanceRecords = attendanceRecords.length;
  const attendanceRate =
    totalAttendanceRecords > 0
      ? Math.round((presentRecords / totalAttendanceRecords) * 100)
      : null;

  const FREELANCE_THRESHOLD = 5;
  const remainingTasks = Math.max(0, FREELANCE_THRESHOLD - completedTasks);

  return (
    <div className="space-y-6">
      {/* Member Hero Banner */}
      <div className="rounded-3xl gradient-mesh-hero text-white p-6 sm:p-8 shadow-lg border border-teal-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-ast-light/20 text-ast-light border border-ast-light/30 text-xs font-semibold uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              {isFr
                ? `Espace Membre · ${user?.departmentName || "Division Générale"}`
                : `Member Hub · ${user?.departmentName || "General Division"}`}
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-wider text-white">
              {isFr ? `Bienvenue, ${user?.name}` : `Welcome back, ${user?.name}`}
            </h2>
            <p className="font-body text-xs sm:text-sm text-teal-100/90 max-w-xl leading-relaxed">
              {isFr
                ? "Suivez vos livrables de sprint, confirmez vos inscriptions aux événements, scannez vos présences et progressez vers la qualification Asteria Freelance."
                : "Track your assigned sprint tickets, confirm event RSVPs, scan attendance QR codes, and advance toward Asteria Freelance Readiness."}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/attendance">
              <Button variant="accent" size="sm" leftIcon={<QrCode className="w-4 h-4" />} className="font-bold">
                {isFr ? "Check-In Session" : "Event Check-In"}
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                {isFr ? "Calendrier" : "View Calendar"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Member Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-surface/90 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-display">
                {isFr ? "Mes Tâches Assignées" : "My Assigned Tasks"}
              </p>
              <h4 className="font-display font-bold text-2xl sm:text-3xl text-ink mt-1">
                <AnimatedCounter value={myTasks.length} />
              </h4>
              <p className="text-xs text-ink-soft font-body mt-1">
                {completedTasks} {isFr ? "terminées" : "completed"}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-ast-primary shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-surface/90 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-display">
                {isFr ? "Taux d'Assiduité" : "Attendance Health"}
              </p>
              <h4 className="font-display font-bold text-2xl sm:text-3xl text-ast-primary mt-1">
                {attendanceRate !== null ? (
                  <AnimatedCounter value={attendanceRate} suffix="%" />
                ) : (
                  <span className="text-base text-ink-soft font-body">{isFr ? "Aucune session" : "No sessions yet"}</span>
                )}
              </h4>
              <p className="text-xs text-emerald-700 font-body mt-1 font-semibold">
                {attendanceRate !== null && attendanceRate >= 75
                  ? (isFr ? "Excellente Assiduité" : "Good Standing")
                  : attendanceRate !== null
                  ? (isFr ? "Action Requise" : "Action Required")
                  : (isFr ? "Nouveau Membre" : "New Member")}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-surface/90 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-display">
                {isFr ? "Pôle Freelance" : "Freelance Division"}
              </p>
              <h4 className="font-display font-bold text-base sm:text-lg text-ink mt-1">
                {user?.freelanceReady ? (isFr ? "Qualifié ★" : "Qualified ★") : (isFr ? "En Formation" : "In Training")}
              </h4>
              <p className="text-xs text-ink-soft font-body mt-1">
                {user?.freelanceReady
                  ? (isFr ? "Éligible aux contrats rémunérés" : "Eligible for paid client contracts")
                  : remainingTasks === 0
                  ? (isFr ? "Éligible à la revue du Bureau" : "Eligible for Board review")
                  : (isFr
                      ? `Encore ${remainingTasks} tâche${remainingTasks > 1 ? "s" : ""} pour se qualifier`
                      : `Complete ${remainingTasks} more task${remainingTasks > 1 ? "s" : ""} to qualify`)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-ast-light/20 border border-ast-light/40 text-ast-primary shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* My Tasks & Next Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks list */}
        <Card className="lg:col-span-2 bg-surface/90 backdrop-blur-md">
          <CardHeader>
            <div>
              <CardTitle>{isFr ? "Mes Tâches de Sprint" : "My Sprint Tasks"}</CardTitle>
              <p className="text-xs text-ink-soft font-body mt-0.5">
                {isFr ? "Tâches en cours assignées à votre profil" : "Tasks currently assigned to you across departments"}
              </p>
            </div>
            <Link href="/tasks">
              <Button variant="outline" size="sm" className="text-xs">
                {isFr ? "Ouvrir Kanban" : "Open Kanban"}
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {myTasks.length > 0 ? (
              myTasks.map((tItem: any) => (
                <div
                  key={tItem.id}
                  className="p-4 rounded-2xl border border-line bg-surface-alt/50 flex items-center justify-between gap-4 hover:border-ast-light/40 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={tItem.status} />
                      <PriorityBadge priority={tItem.priority} />
                      {tItem.department && (
                        <span className="text-[10px] text-ast-primary font-mono font-bold">
                          • {tItem.department.name}
                        </span>
                      )}
                    </div>
                    <h5 className="font-body font-bold text-xs text-ink">{tItem.title}</h5>
                    <p className="text-[11px] text-ink-soft line-clamp-1">
                      {tItem.description || (isFr ? "Aucune description." : "No description.")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-ink-faint font-mono block">
                      {isFr ? "Échéance :" : "Due:"} {formatDate(tItem.dueDate)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Layers}
                title={isFr ? "Aucun ticket en attente" : "No Pending Sprint Tickets"}
                description={isFr ? "Consultez le tableau Kanban pour récupérer des tickets ouverts." : "Check the Kanban board to pick up open items from your department lead."}
              />
            )}
          </CardContent>
        </Card>

        {/* Next Scheduled Events */}
        <Card className="bg-surface/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle>{isFr ? "Sessions à Venir" : "Upcoming Sessions"}</CardTitle>
            <Link href="/calendar" className="text-xs text-ast-primary font-semibold hover:underline">
              {isFr ? "Calendrier" : "Calendar"}
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextEvents.length > 0 ? (
              nextEvents.map((evt: any) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl border border-line bg-surface-alt/50 hover:border-ast-light/40 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={evt.departmentId ? "accent" : "primary"} size="sm">
                      {evt.department ? evt.department.name : (isFr ? "Tout le Club" : "Club-Wide")}
                    </Badge>
                    <span className="text-[10px] text-ink-faint font-mono">
                      {formatDate(evt.startTime)}
                    </span>
                  </div>
                  <h5 className="font-body font-bold text-xs text-ink">{evt.title}</h5>
                  <p className="text-[11px] text-ink-soft font-body">📍 {evt.location}</p>
                  <div className="pt-2 border-t border-line/60 flex items-center justify-between">
                    <Link href="/attendance">
                      <Button size="sm" variant="outline" className="text-[11px] py-1">
                        {isFr ? "Présence" : "Check In"}
                      </Button>
                    </Link>
                    <span className="text-[10px] font-mono font-bold text-ast-primary">
                      Code: {evt.checkInCode}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={CalendarCheck}
                title={isFr ? "Aucune session planifiée" : "No Scheduled Sessions"}
                description={isFr ? "Les prochains ateliers apparaîtront ici." : "Upcoming workshops and general assemblies will be listed here."}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
