import { NextResponse } from "next/server";
import { getCurrentUser, isExecutiveRole } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { createNotifications } from "@/lib/notifications";

export async function GET(req: Request) {
  return runDailyPlannerCron(req);
}

export async function POST(req: Request) {
  return runDailyPlannerCron(req);
}

async function runDailyPlannerCron(req: Request) {
  try {
    // Allow execution via CRON_SECRET header OR an authenticated Executive Board user
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    let isAuthorizedCron = false;

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorizedCron = true;
    } else {
      const user = await getCurrentUser();
      if (user && isExecutiveRole(user.role)) {
        isAuthorizedCron = true;
      }
    }

    if (!isAuthorizedCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getAdminClient();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

    // Fetch recent notifications in last 24h for deduplication
    const { data: recentNotifs } = await (admin as any)
      .from("notifications")
      .select("user_id, type, link")
      .gte("created_at", twentyFourHoursAgo);

    const recentKeys = new Set(
      (recentNotifs || []).map(
        (n: any) => `${n.user_id}:${n.type}:${n.link || ""}`
      )
    );

    const toDispatch: {
      userId: string;
      title: string;
      body: string;
      type: string;
      link: string;
    }[] = [];

    const addDeduplicated = (item: {
      userId: string;
      title: string;
      body: string;
      type: string;
      link: string;
    }) => {
      const key = `${item.userId}:${item.type}:${item.link}`;
      if (!recentKeys.has(key)) {
        recentKeys.add(key);
        toDispatch.push(item);
      }
    };

    // 1. Check overdue and due-soon planner tasks
    const { data: plannerTasks } = await (admin as any)
      .from("tasks")
      .select(`
        id, title, status, due_date, assignee_id, activity_id,
        activities:activity_id (id, title, status, owner_id)
      `)
      .not("activity_id", "is", null)
      .neq("status", "DONE")
      .not("due_date", "is", null)
      .lte("due_date", fortyEightHoursFromNow);

    for (const t of plannerTasks || []) {
      const act = t.activities;
      if (!act || act.status === "CANCELLED" || act.status === "CLOSED") continue;
      const targetUserId = t.assignee_id || act.owner_id;
      if (!targetUserId) continue;

      const dueTime = new Date(t.due_date).getTime();
      const link = `/planner/activities/${act.id}`;

      if (dueTime < now.getTime()) {
        addDeduplicated({
          userId: targetUserId,
          title: `Tâche en retard : ${t.title}`,
          body: `La tâche "${t.title}" pour l'activité "${act.title}" a dépassé son échéance.`,
          type: "TASK_OVERDUE",
          link,
        });
      } else {
        addDeduplicated({
          userId: targetUserId,
          title: `Échéance proche (48h) : ${t.title}`,
          body: `La tâche "${t.title}" pour "${act.title}" arrive à échéance dans moins de 48h.`,
          type: "TASK_DUE_SOON",
          link,
        });
      }
    }

    // 2. Check activities missing post-activity reports (>48h after end_at)
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    const { data: pastActivities } = await (admin as any)
      .from("activities")
      .select(`
        id, title, owner_id, end_at, status,
        activity_reports (id)
      `)
      .neq("status", "CANCELLED")
      .neq("status", "CLOSED")
      .lte("end_at", fortyEightHoursAgo);

    for (const act of pastActivities || []) {
      const hasReport =
        Array.isArray(act.activity_reports)
          ? act.activity_reports.length > 0
          : Boolean(act.activity_reports);

      if (!hasReport && act.owner_id) {
        addDeduplicated({
          userId: act.owner_id,
          title: `Rapport post-activité requis : ${act.title}`,
          body: `L'activité "${act.title}" est terminée depuis plus de 48h. Veuillez soumettre le rapport de clôture.`,
          type: "REPORT_PENDING",
          link: `/planner/activities/${act.id}`,
        });
      }
    }

    // 3. Check sent admin emails awaiting reply for >72h
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();
    const { data: pendingEmails } = await (admin as any)
      .from("activity_emails")
      .select(`
        id, rendered_subject, sent_at, activity_id,
        activities:activity_id (id, title, owner_id, status)
      `)
      .eq("status", "SENT")
      .lte("sent_at", seventyTwoHoursAgo);

    for (const em of pendingEmails || []) {
      const act = em.activities;
      if (!act || act.status === "CANCELLED" || act.status === "CLOSED") continue;
      if (act.owner_id) {
        addDeduplicated({
          userId: act.owner_id,
          title: `Relance email administratif : ${act.title}`,
          body: `L'email "${em.rendered_subject}" est sans réponse depuis plus de 72h.`,
          type: "EMAIL_FOLLOW_UP",
          link: `/planner/activities/${act.id}`,
        });
      }
    }

    const dispatchedCount = await createNotifications(toDispatch);

    return NextResponse.json({
      success: true,
      dispatchedCount,
      checkedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error("Error in /api/planner/cron:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to run planner cron" },
      { status: 500 }
    );
  }
}
