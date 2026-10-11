import { NextResponse } from "next/server";
import { getCurrentUser, isExecutiveRole } from "@/lib/auth";
import {
  canViewActivityWorkspace,
  canEditActivity,
} from "@/lib/planner/permissions";
import {
  getActivityById,
  getActivityReport,
  upsertActivityReport,
  getLinkedEventAttendanceStats,
  updateActivity,
  recordPlannerAuditLog,
} from "@/lib/planner/queries";
import { canTransitionToClosed } from "@/lib/planner/logic";
import { createNotification } from "@/lib/notifications";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const activity = await getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!canViewActivityWorkspace(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [rawReport, rawStats] = await Promise.all([
      getActivityReport(id),
      activity.eventId
        ? getLinkedEventAttendanceStats(activity.eventId)
        : Promise.resolve(null),
    ]);

    const attendanceStats = rawStats
      ? {
          presentCount: rawStats.presentCount,
          lateCount: 0,
          absentCount: 0,
          excusedCount: 0,
          actualAttendance: rawStats.presentCount,
          goingRsvpCount: rawStats.rsvpGoingCount,
        }
      : null;

    const objRes = (rawReport?.objectivesResult || {}) as Record<string, any>;
    const report = rawReport
      ? {
          ...rawReport,
          expectedAttendance:
            objRes.expectedAttendance ?? activity.expectedAttendance ?? 30,
          actualAttendance: rawReport.attendanceCount,
          presentCount: objRes.presentCount ?? rawReport.attendanceCount,
          lateCount: objRes.lateCount ?? 0,
          absentCount: objRes.absentCount ?? 0,
          excusedCount: objRes.excusedCount ?? 0,
          objectivesAchieved: objRes.objectivesAchieved ?? "",
          whatWentWell: rawReport.wentWell ?? "",
          whatFailed: rawReport.problemsEncountered ?? "",
          recommendations: rawReport.toImprove ?? "",
          budgetAllocated:
            objRes.budgetAllocated ??
            activity.budgetEstimate ??
            0,
          budgetVarianceNotes: objRes.budgetVarianceNotes ?? "",
        }
      : null;

    return NextResponse.json({ report, attendanceStats });
  } catch (error: any) {
    console.error("Error in GET /api/planner/activities/[id]/report:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load activity report" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleUpsertReport(req, context);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleUpsertReport(req, context);
}

async function handleUpsertReport(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const activity = await getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!canEditActivity(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      syncAttendance,
      expectedAttendance,
      actualAttendance,
      presentCount,
      lateCount,
      absentCount,
      excusedCount,
      summary,
      objectivesAchieved,
      whatWentWell,
      whatFailed,
      problemsEncountered,
      lessonsLearned,
      recommendations,
      budgetAllocated,
      budgetActual,
      budgetVarianceNotes,
      mediaLinks,
      closeActivity,
      closureSkipReason,
    } = body;

    let rawStats = null;
    if (activity.eventId) {
      rawStats = await getLinkedEventAttendanceStats(activity.eventId);
    }

    const finalPresent =
      syncAttendance && rawStats
        ? rawStats.presentCount
        : presentCount !== undefined
        ? Number(presentCount)
        : rawStats?.presentCount ?? 0;

    const finalLate = lateCount !== undefined ? Number(lateCount) : 0;
    const finalAbsent = absentCount !== undefined ? Number(absentCount) : 0;
    const finalExcused = excusedCount !== undefined ? Number(excusedCount) : 0;

    const finalActual =
      syncAttendance && rawStats
        ? rawStats.presentCount
        : actualAttendance !== undefined
        ? Number(actualAttendance)
        : finalPresent + finalLate;

    const expectedVal =
      expectedAttendance !== undefined
        ? Number(expectedAttendance)
        : activity.expectedAttendance ?? 30;

    const budgetAllocVal =
      budgetAllocated !== undefined
        ? Number(budgetAllocated)
        : activity.budgetEstimate || 0;

    const savedReport = await upsertActivityReport({
      activityId: id,
      summary: summary ?? "",
      attendanceCount: finalActual,
      objectivesResult: {
        expectedAttendance: expectedVal,
        presentCount: finalPresent,
        lateCount: finalLate,
        absentCount: finalAbsent,
        excusedCount: finalExcused,
        objectivesAchieved: objectivesAchieved ?? "",
        budgetAllocated: budgetAllocVal,
        budgetVarianceNotes: budgetVarianceNotes ?? "",
      },
      budgetActual:
        budgetActual !== undefined ? Number(budgetActual) : 0,
      wentWell: whatWentWell ?? "",
      problemsEncountered: problemsEncountered ?? whatFailed ?? "",
      toImprove: recommendations ?? "",
      lessonsLearned: lessonsLearned ?? "",
      mediaLinks: Array.isArray(mediaLinks) ? mediaLinks : [],
      submittedBy: user.id,
    });

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_REPORT_SUBMITTED",
      entityType: "ACTIVITY_REPORT",
      entityId: id,
      details: `Submitted post-activity report for "${activity.title}" (Actual attendance: ${savedReport.attendanceCount}/${expectedVal})`,
    });

    let updatedActivity = activity;
    if (closeActivity && activity.status !== "CLOSED") {
      const gate = canTransitionToClosed(true, closureSkipReason);

      if (!gate.allowed) {
        return NextResponse.json(
          { error: gate.reason, report: savedReport },
          { status: 400 }
        );
      }

      updatedActivity = await updateActivity(id, {
        status: "CLOSED",
        closed_without_report_reason: closureSkipReason || null,
      });

      await recordPlannerAuditLog({
        userId: user.id,
        action: "ACTIVITY_CLOSED",
        entityType: "ACTIVITY",
        entityId: id,
        details: `Closed activity "${activity.title}" with post-activity report.`,
      });
    }

    if (activity.ownerId && activity.ownerId !== user.id) {
      await createNotification({
        userId: activity.ownerId,
        title: `Rapport d'activité soumis : ${activity.title}`,
        body: `${user.name} a mis à jour le bilan post-activité pour "${activity.title}".`,
        type: "ACTIVITY_REPORT_SUBMITTED",
        link: `/planner/activities/${id}`,
      });
    }

    const attendanceStats = rawStats
      ? {
          presentCount: rawStats.presentCount,
          lateCount: 0,
          absentCount: 0,
          excusedCount: 0,
          actualAttendance: rawStats.presentCount,
          goingRsvpCount: rawStats.rsvpGoingCount,
        }
      : null;

    return NextResponse.json({
      report: {
        ...savedReport,
        expectedAttendance: expectedVal,
        actualAttendance: savedReport.attendanceCount,
        presentCount: finalPresent,
        lateCount: finalLate,
        absentCount: finalAbsent,
        excusedCount: finalExcused,
        objectivesAchieved: objectivesAchieved ?? "",
        whatWentWell: savedReport.wentWell ?? "",
        whatFailed: savedReport.problemsEncountered ?? "",
        recommendations: savedReport.toImprove ?? "",
        budgetAllocated: budgetAllocVal,
        budgetVarianceNotes: budgetVarianceNotes ?? "",
      },
      activity: updatedActivity,
      attendanceStats,
    });
  } catch (error: any) {
    console.error("Error in POST /api/planner/activities/[id]/report:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save activity report" },
      { status: 500 }
    );
  }
}
