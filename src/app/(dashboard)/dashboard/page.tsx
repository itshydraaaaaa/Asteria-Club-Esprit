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

  const isExecutive =
    user.role === "PRESIDENT" ||
    user.role === "VICE_PRESIDENT" ||
    user.role === "BOARD";

  if (isExecutive) {
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

  const isExecutive =
    user?.role === "PRESIDENT" ||
    user?.role === "VICE_PRESIDENT" ||
    user?.role === "BOARD";

  return (
    <div className="flex-1 flex flex-col">
      <Header
        user={user}
        title="Dashboard"
        subtitle={
          user?.role === "PRESIDENT"
            ? "Executive Presidency Console & Club-Wide Leadership"
            : user?.role === "VICE_PRESIDENT"
            ? "Executive Vice-Presidency & Operational Governance"
            : user?.role === "BOARD"
            ? "Club-Wide Executive Overview & Operations"
            : user?.role === "HOD"
            ? `${user.departmentName || "Department"} Division Console`
            : user?.role === "WAITING_FOR_INTERVIEW"
            ? "Recruitment Portal — Interview Stage"
            : "Personal Workspace & Sprint Tasks"
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {isExecutive && <BoardDashboard data={data} />}
        {user?.role === "HOD" && <HoDDashboard data={data} user={user} />}
        {user?.role === "MEMBER" && <MemberDashboard data={data} user={user} />}

        {user?.role === "WAITING_FOR_INTERVIEW" && (
          <div className="max-w-2xl mx-auto space-y-6 animate-vague-in">
            <Card className="p-8 text-center space-y-5 border-amber-200/80 bg-gradient-to-b from-amber-50/40 to-surface">
              <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-200/60 text-amber-900">
                  Admissible aux Entretiens · Cycle 2026-2027
                </span>
                <h2 className="font-display font-bold text-2xl uppercase tracking-wider text-ink">
                  En Attente d&apos;Entretien
                </h2>
                <p className="font-body text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
                  Félicitations <strong>{user.name}</strong> ! Votre dossier a été retenu pour l&apos;étape des entretiens.
                  Votre compte de membre a été provisionné avec succès.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-line text-left text-xs space-y-2 max-w-md mx-auto">
                <p className="font-bold text-ink">📋 Préparation de votre entretien :</p>
                <ul className="list-disc pl-5 text-ink-soft space-y-1">
                  <li>Pôle souhaité : <strong className="text-teal-900">{user.departmentName || "Général"}</strong></li>
                  <li>Préparez vos réalisations passées ou projets GitHub / portfolio.</li>
                  <li>Surveillez votre boîte mail pour l&apos;horaire exact de votre convocation.</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link href="/announcements">
                  <Button variant="primary" size="sm">
                    Consulter les Annonces du Club
                  </Button>
                </Link>
                <Link href="/departments">
                  <Button variant="outline" size="sm">
                    Découvrir les Pôles
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}

        {user?.role === "DECLINED" && (
          <div className="max-w-2xl mx-auto space-y-6 animate-vague-in">
            <Card className="p-8 text-center space-y-4 border-rose-200 bg-surface">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8" />
              </div>
              <h2 className="font-display font-bold text-xl uppercase tracking-wider text-ink">
                Candidature Non Retenue
              </h2>
              <p className="font-body text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
                Merci sincèrement pour l&apos;intérêt que vous portez à <strong>Asteria Club Esprit</strong>.
                En raison d&apos;un nombre très élevé de candidatures et de places limitées par pôle, nous n&apos;avons pas pu retenir votre dossier pour cette session.
              </p>
              <p className="text-xs text-ink-faint">
                Nous vous encourageons vivement à continuer de développer vos compétences et à retenter votre chance au prochain cycle de recrutement !
              </p>
              <div className="pt-3 flex justify-center gap-3">
                <Link href="/announcements">
                  <Button variant="outline" size="sm">
                    Suivre les Événements Publics
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}

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
