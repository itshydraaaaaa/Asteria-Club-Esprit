import { NextResponse } from "next/server";
import { getCurrentUser, isExecutiveRole } from "@/lib/auth";
import {
  canViewActivityWorkspace,
  canEditActivity,
  canApproveOrPublishActivity,
} from "@/lib/planner/permissions";
import {
  getActivityById,
  updateActivity,
  getActivityTasks,
  getActivityRequirements,
  getActivityEmails,
  getActivityAgendaItems,
  getActivityReport,
  getActivityComments,
  getActivityFiles,
  getActivityAuditLogs,
  getActiveResourceBookingSlots,
  getLinkedEventAttendanceStats,
  getActivityTypes,
  getActivityTemplates,
  getPlannerResources,
  getAdminContacts,
  getEmailTemplates,
  getPlannerSettings,
  rescheduleActivityTasks,
  syncActivityToEventsBridge,
  handleCancelledActivityEvent,
  recordPlannerAuditLog,
} from "@/lib/planner/queries";
import {
  evaluateActivityReadiness,
  detectAgendaConflicts,
  detectResourceConflict,
  validateStatusTransition,
  canTransitionToApproved,
  canTransitionToPromotion,
  canTransitionToClosed,
} from "@/lib/planner/logic";
import { ActivityStatus } from "@/lib/planner/types";
import { createNotification, createNotifications } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

const TAB_MAP: Record<string, string> = {
  brief: "BRIEF",
  plan: "TASKS",
  logistics: "LOGISTICS",
  emails: "EMAILS",
  agenda: "AGENDA",
  files: "FILES",
  report: "REPORT",
};

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

    const [
      tasks,
      requirements,
      emails,
      agenda,
      report,
      comments,
      files,
      auditLogs,
      bookingSlots,
      activityTypes,
      templates,
      resources,
      adminContacts,
      emailTemplates,
      settings,
    ] = await Promise.all([
      getActivityTasks(id),
      getActivityRequirements(id),
      getActivityEmails(id),
      getActivityAgendaItems(id),
      getActivityReport(id),
      getActivityComments(id),
      getActivityFiles(id),
      getActivityAuditLogs(id),
      getActiveResourceBookingSlots(),
      getActivityTypes(),
      getActivityTemplates(),
      getPlannerResources(),
      getAdminContacts(),
      getEmailTemplates(),
      getPlannerSettings(),
    ]);

    const rawAttendance = activity.eventId
      ? await getLinkedEventAttendanceStats(activity.eventId)
      : null;

    const attendanceStats = rawAttendance
      ? {
          presentCount: rawAttendance.presentCount,
          lateCount: 0,
          absentCount: 0,
          excusedCount: 0,
          goingRsvpCount: rawAttendance.rsvpGoingCount,
          actualAttendance: rawAttendance.presentCount,
        }
      : null;

    const readinessRaw = evaluateActivityReadiness({
      activity,
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
      agendaCount: agenda.length,
      hasReport: Boolean(report),
    });

    const readiness = {
      ...readinessRaw,
      progressPercent: readinessRaw.overallProgressPct,
      canPublishToEvents: readinessRaw.canApproveActivity,
      checklist: {
        briefComplete: readinessRaw.briefComplete,
        tasksReady: readinessRaw.tasksOverdue === 0,
        adminEmailsApproved: readinessRaw.canApproveActivity,
        logisticsConfirmed: readinessRaw.canStartPromotion,
        reportSubmitted: readinessRaw.hasReport,
      },
      blockers: readinessRaw.blockers.map((b) => ({
        ...b,
        tab: TAB_MAP[b.tab] || "BRIEF",
        messageFr: b.title,
        messageEn: b.title,
      })),
    };

    const rawAgendaWarnings = detectAgendaConflicts(
      agenda.map((a) => ({
        id: a.id,
        title: a.title,
        startsAt: a.startsAt,
        durationMin: a.durationMin,
      })),
      activity.startsAt,
      activity.endsAt
    );

    const agendaConflicts = rawAgendaWarnings.map((w) => ({
      ...w,
      messageFr: w.message,
      messageEn: w.message,
    }));

    const resourceConflicts: Record<string, any> = {};
    for (const reqItem of requirements) {
      if (reqItem.resourceId) {
        const conflict = detectResourceConflict(
          {
            activityId: activity.id,
            resourceId: reqItem.resourceId,
            startsAt: activity.startsAt,
            endsAt: activity.endsAt,
          },
          bookingSlots
        );
        if (conflict.hasConflict) {
          resourceConflicts[reqItem.id] = {
            hasConflict: true,
            resourceName: reqItem.resource?.name || "Resource",
            requestedQuantity: reqItem.quantity,
            availableQuantity: 0,
            totalQuantity: reqItem.resource?.capacity || 1,
            overlappingActivities: conflict.conflictingSlot
              ? [
                  {
                    activityId: conflict.conflictingSlot.activityId,
                    activityTitle: conflict.conflictingSlot.activityTitle,
                    quantity: 1,
                  },
                ]
              : [],
          };
        }
      }
    }

    const totalActualSpend = requirements.reduce(
      (s, r) => s + Number(r.actualCost || 0),
      0
    );

    const normalizedActivity = {
      ...activity,
      startAt: activity.startsAt,
      endAt: activity.endsAt,
      activityTypeId: activity.typeId,
      activityType: activity.type
        ? { ...activity.type, nameFr: activity.type.name }
        : null,
      description: activity.idea || "",
      objectives: Array.isArray(activity.objectives)
        ? activity.objectives.join("\n")
        : String(activity.objectives || ""),
      deliverables: Array.isArray(activity.objectives) ? activity.objectives : [],
      audienceScope: activity.audience || "CLUB",
      budgetRequested: activity.budgetEstimate || 0,
      budgetApproved: activity.budgetEstimate || 0,
      budgetSpent: totalActualSpend,
      members: (activity.members || []).map((m) => ({
        ...m,
        userId: m.profileId,
        roleInActivity: m.role,
        user: m.profile,
      })),
    };

    return NextResponse.json({
      activity: normalizedActivity,
      tasks: tasks.map((t) => ({
        ...t,
        phase: t.section || "PREPARATION",
        offsetDays:
          typeof t.offsetDays === "number" ? -Math.abs(t.offsetDays) : null,
        wasShifted: false,
      })),
      requirements: requirements.map((r) => ({
        ...r,
        name: r.title,
        estimatedCost: r.estCost,
        status:
          r.status === "CONFIRMED"
            ? "BOOKED"
            : r.status === "READY"
            ? "DELIVERED"
            : r.status === "NEEDED"
            ? "PENDING"
            : r.status,
      })),
      emails: emails.map((e) => ({
        ...e,
        adminContactId: e.contactId,
        adminContact: e.contact
          ? {
              ...e.contact,
              officeName: e.contact.name,
              officeCategory: e.contact.office,
            }
          : null,
        language: "fr",
        renderedSubject: e.subject,
        renderedBody: e.body,
        replySummary: e.replyNotes,
        ccEmails: e.ccEmails ? e.ccEmails.split(",") : [],
      })),
      agenda: agenda.map((a) => {
        const st = new Date(a.startsAt);
        const et = new Date(st.getTime() + (a.durationMin || 30) * 60000);
        return {
          ...a,
          startTime: st.toISOString(),
          endTime: et.toISOString(),
          description: a.notes || "",
          speakerUser: a.lead,
        };
      }),
      agendaConflicts,
      report: report
        ? {
            ...report,
            expectedAttendance: activity.expectedAttendance || 30,
            actualAttendance: report.attendanceCount,
            presentCount: report.attendanceCount,
            lateCount: 0,
            absentCount: 0,
            excusedCount: 0,
            objectivesAchieved:
              (report.objectivesResult as any)?.text || report.summary || "",
            whatWentWell: report.wentWell || "",
            whatFailed: report.problemsEncountered || "",
            recommendations: report.toImprove || "",
            budgetAllocated: activity.budgetEstimate || 0,
          }
        : null,
      comments: comments.map((c) => ({
        ...c,
        userId: c.authorId,
        user: c.author,
      })),
      files: files.map((f) => ({
        ...f,
        downloadUrl: f.fileUrl,
        uploadedBy: f.uploader,
      })),
      auditLogs: auditLogs.map((l: any) => ({
        id: l.id,
        action: l.action,
        details: l.details,
        createdAt: l.created_at,
      })),
      attendanceStats,
      readiness,
      resourceConflicts,
      lookup: {
        activityTypes: activityTypes.map((t) => ({ ...t, nameFr: t.name })),
        templates,
        resources: resources.map((r) => ({
          ...r,
          category: r.kind === "ROOM" ? "SPACE" : "EQUIPMENT",
          totalQuantity: r.capacity || 1,
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
        })),
        settings,
      },
      permissions: {
        canEdit: canEditActivity(user, activity),
        canApproveOrPublish: canApproveOrPublishActivity(user, activity),
        isBoard: isExecutiveRole(user.role),
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/planner/activities/[id]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load activity workspace" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await getActivityById(id);
    if (!existing) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    if (!canEditActivity(user, existing)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const isBoard = isExecutiveRole(user.role);

    // 1. Handle explicit PUBLISH_TO_CALENDAR action
    if (body.action === "PUBLISH_TO_CALENDAR") {
      if (!canApproveOrPublishActivity(user, existing)) {
        return NextResponse.json(
          { error: "Only Executive Board or authorized HoDs can publish activities to the calendar" },
          { status: 403 }
        );
      }

      const [tasks, emails, requirements, report] = await Promise.all([
        getActivityTasks(id),
        getActivityEmails(id),
        getActivityRequirements(id),
        getActivityReport(id),
      ]);

      const readiness = evaluateActivityReadiness({
        activity: existing,
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
      });

      if (!readiness.canApproveActivity && !(isBoard && body.forceOverride)) {
        return NextResponse.json(
          {
            error:
              readiness.blockers[0]?.description ||
              "Activity is not ready for publication. Resolve mandatory blockers or use Board override.",
            blockers: readiness.blockers,
          },
          { status: 400 }
        );
      }

      if (
        ["IDEA", "SUBMITTED", "BRIEF_APPROVED", "ADMIN_REQUESTS", "LOGISTICS_CONFIRMED"].includes(
          existing.status
        )
      ) {
        await updateActivity(id, { status: "APPROVED" });
      }

      const eventId = await syncActivityToEventsBridge(id);

      await recordPlannerAuditLog({
        userId: user.id,
        action: "ACTIVITY_PUBLISHED_TO_CALENDAR",
        entityType: "ACTIVITY",
        entityId: id,
        details: `Published activity "${existing.title}" to Club Calendar (eventId: ${eventId})`,
      });

      const refreshed = await getActivityById(id);
      return NextResponse.json({
        activity: refreshed,
        syncResult: { eventId, created: !existing.eventId },
      });
    }

    const nextStartsAt = body.startsAt || body.startAt;
    const nextEndsAt = body.endsAt || body.endAt;

    if (nextStartsAt && nextEndsAt) {
      if (new Date(nextEndsAt).getTime() <= new Date(nextStartsAt).getTime()) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }
    }

    const startChanged =
      nextStartsAt &&
      new Date(nextStartsAt).getTime() !== new Date(existing.startsAt).getTime();

    // 2. Validate status transition
    if (body.status && body.status !== existing.status) {
      const targetStatus = body.status as ActivityStatus;
      const transitionCheck = validateStatusTransition(
        existing.status,
        targetStatus
      );

      if (!transitionCheck.valid && !isBoard) {
        return NextResponse.json(
          { error: transitionCheck.reason || "Invalid status transition" },
          { status: 400 }
        );
      }

      const [emails, requirements, report] = await Promise.all([
        getActivityEmails(id),
        getActivityRequirements(id),
        getActivityReport(id),
      ]);

      if (targetStatus === "APPROVED" && !(isBoard && body.forceOverride)) {
        const gate = canTransitionToApproved(
          emails.map((e) => ({ office: e.office, status: e.status }))
        );
        if (!gate.allowed) {
          return NextResponse.json({ error: gate.reason }, { status: 400 });
        }
      }

      if (targetStatus === "PROMOTION" && !(isBoard && body.forceOverride)) {
        const gate = canTransitionToPromotion(
          requirements.map((r) => ({ category: r.category, status: r.status }))
        );
        if (!gate.allowed) {
          return NextResponse.json({ error: gate.reason }, { status: 400 });
        }
      }

      if (targetStatus === "CLOSED") {
        const gate = canTransitionToClosed(
          Boolean(report),
          body.closureSkipReason ?? existing.closureSkipReason
        );
        if (!gate.allowed) {
          return NextResponse.json({ error: gate.reason }, { status: 400 });
        }
      }
    }

    // 3. Build db updates
    const dbUpdates: Record<string, unknown> = {};
    if (body.title !== undefined) dbUpdates.title = body.title;
    if (body.description !== undefined || body.idea !== undefined) {
      dbUpdates.idea = body.idea ?? body.description;
    }
    if (body.objectives !== undefined || body.deliverables !== undefined) {
      const rawObj = body.deliverables ?? body.objectives;
      dbUpdates.objectives = Array.isArray(rawObj)
        ? rawObj
        : String(rawObj || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (body.status !== undefined) dbUpdates.status = body.status;
    if (body.ownerId !== undefined) dbUpdates.owner_id = body.ownerId;
    if (body.departmentId !== undefined)
      dbUpdates.department_id = body.departmentId || null;
    if (body.audienceScope !== undefined || body.audience !== undefined) {
      dbUpdates.audience = body.audience ?? body.audienceScope;
    }
    if (body.expectedAttendance !== undefined) {
      dbUpdates.expected_attendance = Number(body.expectedAttendance);
    }
    if (nextStartsAt) {
      dbUpdates.starts_at = new Date(nextStartsAt).toISOString();
    }
    if (nextEndsAt) {
      dbUpdates.ends_at = new Date(nextEndsAt).toISOString();
    }
    if (body.location !== undefined) dbUpdates.location = body.location;
    if (body.facilitators !== undefined)
      dbUpdates.facilitators = body.facilitators;
    if (body.budgetRequested !== undefined || body.budgetEstimate !== undefined) {
      dbUpdates.budget_estimate = Number(
        body.budgetEstimate ?? body.budgetRequested ?? 0
      );
    }
    if (body.closureSkipReason !== undefined) {
      dbUpdates.closure_skip_reason = body.closureSkipReason;
    }

    const updated = await updateActivity(id, dbUpdates);

    // 4. Reschedule tasks if startsAt changed
    let rescheduleSummary: { updatedCount: number } | null = null;
    if (startChanged) {
      rescheduleSummary = await rescheduleActivityTasks({
        activityId: id,
        newStartDate: updated.startsAt,
        oldStartDate: existing.startsAt,
        userId: user.id,
      });

      const tasks = await getActivityTasks(id);
      const assigneeIds = Array.from(
        new Set(
          tasks
            .filter(
              (t) =>
                t.assigneeId && t.assigneeId !== user.id && t.status !== "DONE"
            )
            .map((t) => t.assigneeId as string)
        )
      );
      if (assigneeIds.length > 0) {
        await createNotifications(
          assigneeIds.map((uid) => ({
            userId: uid,
            title: `Date modifiée : ${updated.title}`,
            body: `L'activité "${updated.title}" a été reprogrammée. Vos échéances de tâches ont été recalculées.`,
            type: "ACTIVITY_RESCHEDULED",
            link: `/planner/activities/${id}`,
          }))
        );
      }
    }

    // 5. Status side effects
    let syncedEventId: string | null = null;
    if (body.status && body.status !== existing.status) {
      await recordPlannerAuditLog({
        userId: user.id,
        action: "ACTIVITY_STATUS_CHANGED",
        entityType: "ACTIVITY",
        entityId: id,
        details: `Status of "${updated.title}" changed: ${existing.status} -> ${updated.status}`,
      });

      if (
        ["APPROVED", "LOGISTICS_READY", "PROMOTION", "LIVE"].includes(
          updated.status
        )
      ) {
        syncedEventId = await syncActivityToEventsBridge(id);
      } else if (updated.status === "CANCELLED") {
        await handleCancelledActivityEvent(id);
      }

      if (updated.ownerId && updated.ownerId !== user.id) {
        await createNotification({
          userId: updated.ownerId,
          title: `Statut d'activité mis à jour : ${updated.title}`,
          body: `Le statut de "${updated.title}" est passé de ${existing.status} à ${updated.status}.`,
          type: "ACTIVITY_STATUS_CHANGED",
          link: `/planner/activities/${id}`,
        });
      }
    } else if (
      updated.eventId &&
      ["APPROVED", "LOGISTICS_READY", "PROMOTION", "LIVE"].includes(
        updated.status
      )
    ) {
      syncedEventId = await syncActivityToEventsBridge(id);
    } else {
      await recordPlannerAuditLog({
        userId: user.id,
        action: "ACTIVITY_UPDATED",
        entityType: "ACTIVITY",
        entityId: id,
        details: `Updated brief/details for "${updated.title}"`,
      });
    }

    const finalActivity = await getActivityById(id);

    return NextResponse.json({
      activity: finalActivity || updated,
      rescheduleSummary,
      syncResult: syncedEventId ? { eventId: syncedEventId } : null,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/planner/activities/[id]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update activity" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isExecutiveRole(user.role)) {
      return NextResponse.json(
        { error: "Only Executive Board can delete activities" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const existing = await getActivityById(id);
    if (!existing) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    if (existing.eventId) {
      await handleCancelledActivityEvent(id);
    }

    const supabase = await createClient();
    const { error } = await (supabase as any)
      .from("activities")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_DELETED",
      entityType: "ACTIVITY",
      entityId: id,
      details: `Deleted activity "${existing.title}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/planner/activities/[id]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete activity" },
      { status: 500 }
    );
  }
}
