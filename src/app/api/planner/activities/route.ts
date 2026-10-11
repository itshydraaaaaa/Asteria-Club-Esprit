import { NextResponse } from "next/server";
import { getCurrentUser, isExecutiveRole } from "@/lib/auth";
import { canAccessPlanner } from "@/lib/planner/permissions";
import {
  getActivities,
  getActivityById,
  createActivity,
  instantiateActivityFromTemplate,
  createActivityTask,
  createActivityRequirement,
  createActivityEmail,
  upsertActivityMember,
  getEmailTemplates,
  getAdminContacts,
  recordPlannerAuditLog,
  getActivityTasks,
  getActivityEmails,
  getActivityRequirements,
  getActivityReport,
} from "@/lib/planner/queries";
import {
  evaluateActivityReadiness,
  renderEmailTemplate,
} from "@/lib/planner/logic";
import { ActivityStatus } from "@/lib/planner/types";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canAccessPlanner(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") as ActivityStatus) ?? undefined;
    const departmentId = searchParams.get("departmentId") ?? undefined;
    const typeId =
      searchParams.get("typeId") ??
      searchParams.get("activityTypeId") ??
      undefined;
    const search = searchParams.get("search")?.toLowerCase().trim() ?? undefined;

    let activities = await getActivities({
      status,
      departmentId,
      typeId,
    });

    if (search) {
      activities = activities.filter(
        (a) =>
          a.title.toLowerCase().includes(search) ||
          (a.idea || "").toLowerCase().includes(search) ||
          (a.location || "").toLowerCase().includes(search) ||
          (a.owner?.name || "").toLowerCase().includes(search)
      );
    }

    const now = new Date();
    const enriched = await Promise.all(
      activities.map(async (act) => {
        try {
          const [tasks, emails, requirements, report] = await Promise.all([
            getActivityTasks(act.id),
            getActivityEmails(act.id),
            getActivityRequirements(act.id),
            getActivityReport(act.id),
          ]);

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
            readiness: {
              ...readiness,
              progressPercent: readiness.overallProgressPct,
              canPublishToEvents: readiness.canApproveActivity,
            },
            taskCount: tasks.length,
            completedTaskCount: tasks.filter((t) => t.status === "DONE").length,
          };
        } catch {
          return {
            ...act,
            startAt: act.startsAt,
            endAt: act.endsAt,
            activityTypeId: act.typeId,
            readiness: null,
            taskCount: 0,
            completedTaskCount: 0,
          };
        }
      })
    );

    return NextResponse.json({ activities: enriched });
  } catch (error: any) {
    console.error("Error in GET /api/planner/activities:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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

    const body = await req.json();
    const {
      title,
      description,
      idea,
      objectives,
      activityTypeId,
      typeId,
      templateId,
      ownerId,
      departmentId,
      audienceScope,
      audience,
      expectedAttendance,
      startAt,
      startsAt,
      endAt,
      endsAt,
      location,
      format,
      facilitators,
      budgetRequested,
      budgetEstimate,
      status,
      members,
      customTasks,
      customRequirements,
      customEmails,
      defaultEmailLanguage,
    } = body;

    const finalTypeId = typeId || activityTypeId;
    const finalStartsAt = startsAt || startAt;
    const finalEndsAt = endsAt || endAt;

    if (!title || !finalTypeId || !finalStartsAt || !finalEndsAt) {
      return NextResponse.json(
        { error: "Title, activity type, start time, and end time are required" },
        { status: 400 }
      );
    }

    if (new Date(finalEndsAt).getTime() <= new Date(finalStartsAt).getTime()) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    if (!isExecutiveRole(user.role) && user.role === "HOD") {
      if (departmentId && user.departmentId && departmentId !== user.departmentId) {
        return NextResponse.json(
          { error: "HoDs can only create activities for their own department" },
          { status: 403 }
        );
      }
    }

    // Idempotency guard within 30s
    const existingList = await getActivities();
    const recentDuplicate = existingList.find(
      (a) =>
        a.ownerId === (ownerId || user.id) &&
        a.title.trim().toLowerCase() === title.trim().toLowerCase() &&
        new Date(a.startsAt).getTime() === new Date(finalStartsAt).getTime() &&
        Date.now() - new Date(a.createdAt).getTime() < 30_000
    );
    if (recentDuplicate) {
      return NextResponse.json(
        { activity: recentDuplicate, deduplicated: true },
        { status: 200 }
      );
    }

    const resolvedDeptId =
      departmentId ||
      (!isExecutiveRole(user.role) ? user.departmentId : null) ||
      null;

    const slugBase = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    const normalizedObjectives = Array.isArray(objectives)
      ? objectives.filter((s: any) => typeof s === "string" && s.trim())
      : typeof objectives === "string" && objectives.trim()
      ? objectives
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    const activity = await createActivity({
      title: title.trim(),
      slug,
      typeId: finalTypeId,
      departmentId: resolvedDeptId,
      ownerId: ownerId || user.id,
      status: status === "SUBMITTED" ? "SUBMITTED" : "IDEA",
      idea: (idea || description || "").trim() || null,
      objectives: normalizedObjectives,
      audience: (audience || audienceScope || "").trim() || null,
      expectedAttendance: Number(expectedAttendance || 0),
      format: format || "IN_PERSON",
      location: (location || "").trim() || null,
      startsAt: new Date(finalStartsAt).toISOString(),
      endsAt: new Date(finalEndsAt).toISOString(),
      budgetEstimate: Number(budgetEstimate ?? budgetRequested ?? 0),
      facilitators: (facilitators || "").trim() || null,
      templateId: null,
      userId: user.id,
    });

    if (Array.isArray(members)) {
      for (const m of members) {
        const uid = m.profileId || m.userId;
        if (uid && uid !== activity.ownerId) {
          try {
            await upsertActivityMember(
              activity.id,
              uid,
              m.role === "CO_OWNER" || m.roleInActivity === "CO_LEAD"
                ? "CO_OWNER"
                : "CONTRIBUTOR"
            );
          } catch {
            // ignore
          }
        }
      }
    }

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_CREATED",
      entityType: "ACTIVITY",
      entityId: activity.id,
      details: `Created activity "${activity.title}" (${activity.status}).`,
    });

    if (activity.ownerId && activity.ownerId !== user.id) {
      await createNotification({
        userId: activity.ownerId,
        title: `Nouvelle activité assignée : ${activity.title}`,
        body: `${user.name} vous a désigné comme responsable de l'activité "${activity.title}".`,
        type: "ACTIVITY_ASSIGNED",
        link: `/planner/activities/${activity.id}`,
      });
    }

    const fullActivity = await getActivityById(activity.id);

    return NextResponse.json(
      {
        activity: fullActivity || activity,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/planner/activities:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create activity" },
      { status: 500 }
    );
  }
}
