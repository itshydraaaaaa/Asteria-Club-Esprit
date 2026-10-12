import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessPlanner } from "@/lib/planner/permissions";
import {
  getActivities,
  getActivityTypes,
  getActivityTemplates,
  getPlannerResources,
  getAdminContacts,
  getEmailTemplates,
  getPlannerSettings,
  getMyActivityTasks,
  getActivityTasks,
  getActivityFiles,
  getActivityEmails,
  getActivityRequirements,
  getActivityReport,
} from "@/lib/planner/queries";
import {
  computeAttentionFlags,
  evaluateActivityReadiness,
} from "@/lib/planner/logic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canAccessPlanner(user)) {
      return NextResponse.json(
        { error: "Forbidden: Executive Board or HoD role required" },
        { status: 403 }
      );
    }

    const [
      activities,
      activityTypes,
      templates,
      resources,
      adminContacts,
      emailTemplates,
      settings,
      myTasks,
    ] = await Promise.all([
      getActivities(),
      getActivityTypes(),
      getActivityTemplates(),
      getPlannerResources(),
      getAdminContacts(),
      getEmailTemplates(),
      getPlannerSettings(),
      getMyActivityTasks(user.id),
    ]);

    const now = new Date();

    const enrichedActivities = await Promise.all(
      activities.map(async (act) => {
        try {
          const [tasks, files, emails, requirements, report] = await Promise.all([
            getActivityTasks(act.id),
            getActivityFiles(act.id),
            getActivityEmails(act.id),
            getActivityRequirements(act.id),
            getActivityReport(act.id),
          ]);

          const att = computeAttentionFlags({
            tasks: tasks.map((t) => ({
              id: t.id,
              title: t.title,
              dueDate: t.dueDate,
              status: t.status,
            })),
            emails: emails.map((e) => ({
              id: e.id,
              office: e.office,
              sentAt: e.sentAt,
              status: e.status,
            })),
            requirements: requirements.map((r) => ({
              id: r.id,
              title: r.title,
              neededBy: r.neededBy,
              status: r.status,
            })),
            activities: [
              {
                id: act.id,
                title: act.title,
                status: act.status,
                createdAt: act.createdAt,
                startsAt: act.startsAt,
              },
            ],
            now,
          });

          const attentionFlags: Array<{
            type: string;
            severity: "WARNING" | "CRITICAL";
            messageFr: string;
            messageEn: string;
          }> = [];

          if (att.overdueTasks.length > 0) {
            attentionFlags.push({
              type: "OVERDUE_TASKS",
              severity: "CRITICAL",
              messageFr: `${att.overdueTasks.length} tâche(s) en retard`,
              messageEn: `${att.overdueTasks.length} overdue task(s)`,
            });
          }
          if (att.unrepliedEmails.length > 0) {
            attentionFlags.push({
              type: "UNREPLIED_EMAILS",
              severity: "WARNING",
              messageFr: `${att.unrepliedEmails.length} email(s) admin sans réponse`,
              messageEn: `${att.unrepliedEmails.length} admin email(s) awaiting reply`,
            });
          }
          if (att.unconfirmedUrgentRequirements.length > 0) {
            attentionFlags.push({
              type: "UNCONFIRMED_SPACE",
              severity: "CRITICAL",
              messageFr: `${att.unconfirmedUrgentRequirements.length} besoin(s) logistique(s) urgent(s) non confirmé(s)`,
              messageEn: `${att.unconfirmedUrgentRequirements.length} urgent requirement(s) unconfirmed`,
            });
          }
          if (
            !report &&
            act.status !== "CANCELLED" &&
            act.status !== "CLOSED" &&
            new Date(act.endsAt).getTime() + 48 * 3600 * 1000 < now.getTime()
          ) {
            attentionFlags.push({
              type: "MISSING_REPORT",
              severity: "WARNING",
              messageFr: "Rapport post-activité en attente (>48h)",
              messageEn: "Post-activity report overdue (>48h)",
            });
          }

          const readiness = evaluateActivityReadiness({
            activity: act,
            tasks: tasks.map((t) => ({
              status: t.status,
              dueDate: t.dueDate,
              isCompressed: t.isCompressed,
            })),
            emails: emails.map((e) => ({ office: e.office, status: e.status })),
            requirements: requirements.map((r) => ({
              category: r.category,
              status: r.status,
            })),
            hasReport: Boolean(report),
            now,
          });

          return {
            ...act,
            startAt: act.startsAt,
            endAt: act.endsAt,
            activityTypeId: act.typeId,
            activityType: act.type
              ? { ...act.type, nameFr: act.type.name }
              : null,
            description: act.idea || "",
            budgetRequested: act.budgetEstimate || 0,
            attentionFlags,
            readiness: {
              ...readiness,
              progressPercent: readiness.overallProgressPct,
              canPublishToEvents: readiness.canApproveActivity,
              checklist: {
                briefComplete: readiness.briefComplete,
                tasksReady: readiness.tasksOverdue === 0,
                adminEmailsApproved: readiness.canApproveActivity,
                logisticsConfirmed: readiness.canStartPromotion,
                reportSubmitted: readiness.hasReport,
              },
            },
            stats: {
              totalTasks: tasks.length,
              completedTasks: tasks.filter((t) => t.status === "DONE").length,
              overdueTasks: att.overdueTasks.length,
              totalFiles: files.length,
              totalEmails: emails.length,
              approvedEmails: emails.filter(
                (e) => e.status === "APPROVED" || e.status === "REPLIED"
              ).length,
              totalRequirements: requirements.length,
              fulfilledRequirements: requirements.filter((r) =>
                ["CONFIRMED", "READY", "RETURNED"].includes(r.status)
              ).length,
              hasReport: Boolean(report),
            },
          };
        } catch {
          return {
            ...act,
            startAt: act.startsAt,
            endAt: act.endsAt,
            activityTypeId: act.typeId,
            activityType: act.type
              ? { ...act.type, nameFr: act.type.name }
              : null,
            description: act.idea || "",
            budgetRequested: act.budgetEstimate || 0,
            attentionFlags: [],
            readiness: null,
            stats: {
              totalTasks: 0,
              completedTasks: 0,
              overdueTasks: 0,
              totalFiles: 0,
              totalEmails: 0,
              approvedEmails: 0,
              totalRequirements: 0,
              fulfilledRequirements: 0,
              hasReport: false,
            },
          };
        }
      })
    );

    const statusCounts: Record<string, number> = {};
    for (const act of enrichedActivities) {
      statusCounts[act.status] = (statusCounts[act.status] || 0) + 1;
    }

    const upcomingCount = enrichedActivities.filter(
      (a) =>
        a.status !== "CANCELLED" &&
        a.status !== "CLOSED" &&
        new Date(a.startsAt).getTime() >= now.getTime()
    ).length;

    const liveCount = enrichedActivities.filter((a) => a.status === "LIVE").length;
    const pendingApprovalsCount = enrichedActivities.filter((a) =>
      ["IDEA", "SUBMITTED", "BRIEF_APPROVED", "ADMIN_REQUESTS", "LOGISTICS_CONFIRMED"].includes(
        a.status
      )
    ).length;
    const attentionCount = enrichedActivities.filter(
      (a) => a.attentionFlags && a.attentionFlags.length > 0
    ).length;
    const closedCount = enrichedActivities.filter((a) => a.status === "CLOSED").length;

    return NextResponse.json({
      activities: enrichedActivities,
      activityTypes: activityTypes.map((t) => ({ ...t, nameFr: t.name })),
      templates: templates.map((tpl) => ({
        ...tpl,
        nameFr: tpl.name,
        defaultTasks: (tpl.tasks || []).map((t) => ({
          title: t.title,
          titleFr: t.title,
          description: "",
          descriptionFr: "",
          phase: t.section || "PREPARATION",
          priority: t.offset_days <= 3 ? "HIGH" : "MEDIUM",
          offsetDays: -Math.abs(t.offset_days),
          defaultRole: t.default_role,
        })),
        defaultRequirements: (tpl.requirements || []).map((r) => ({
          category: r.category,
          name: r.title,
          nameFr: r.title,
          quantity: r.quantity,
          estimatedCost: 0,
        })),
        defaultEmails: (tpl.requiredOffices || []).map((off) => ({
          category: off,
          offsetDays: -14,
          notes: `Demande officielle (${off})`,
        })),
      })),
      resources: resources.map((r) => ({
        ...r,
        category: r.kind === "ROOM" ? "SPACE" : "EQUIPMENT",
        totalQuantity: r.capacity || 1,
        location: "Campus ESPRIT",
      })),
      adminContacts: adminContacts.map((c) => ({
        ...c,
        officeName: c.name,
        officeCategory: c.office,
        recipientName: c.roleTitle,
      })),
      emailTemplates: emailTemplates.map((et) => ({
        ...et,
        name: `${et.office} (${et.language})`,
        category: et.office,
        subjectTemplate: et.subject,
        bodyTemplate: et.body,
      })),
      settings,
      myTasks: myTasks.map((t) => ({
        ...t,
        phase: t.section || "PREPARATION",
      })),
      metrics: {
        totalActivities: enrichedActivities.length,
        upcomingCount,
        liveCount,
        pendingApprovalsCount,
        attentionCount,
        closedCount,
        statusCounts,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/planner/overview:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load planner overview" },
      { status: 500 }
    );
  }
}
