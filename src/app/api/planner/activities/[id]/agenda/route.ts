import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  canViewActivityWorkspace,
  canEditActivity,
} from "@/lib/planner/permissions";
import {
  getActivityById,
  getActivityAgendaItems,
  createActivityAgendaItem,
  updateActivityAgendaItem,
  deleteActivityAgendaItem,
  recordPlannerAuditLog,
} from "@/lib/planner/queries";
import { detectAgendaConflicts } from "@/lib/planner/logic";

function mapAgendaForUi(items: any[]) {
  return items.map((a) => {
    const st = new Date(a.startsAt);
    const et = new Date(st.getTime() + (a.durationMin || 30) * 60000);
    return {
      ...a,
      startTime: st.toISOString(),
      endTime: et.toISOString(),
      description: a.notes || "",
      speakerUser: a.lead,
    };
  });
}

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

    const rawAgenda = await getActivityAgendaItems(id);
    const rawConflicts = detectAgendaConflicts(
      rawAgenda.map((a) => ({
        id: a.id,
        title: a.title,
        startsAt: a.startsAt,
        durationMin: a.durationMin,
      })),
      activity.startsAt,
      activity.endsAt
    );

    return NextResponse.json({
      agenda: mapAgendaForUi(rawAgenda),
      agendaConflicts: rawConflicts.map((w) => ({
        ...w,
        messageFr: w.message,
        messageEn: w.message,
      })),
    });
  } catch (error: any) {
    console.error("Error in GET /api/planner/activities/[id]/agenda:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load agenda" },
      { status: 500 }
    );
  }
}

export async function POST(
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
      title,
      description,
      notes,
      startTime,
      startsAt,
      endTime,
      durationMin,
      speaker,
      speakerId,
      leadId,
      location,
      sortOrder,
    } = body;

    const finalStartsAt = startsAt || startTime;
    if (!title || !finalStartsAt) {
      return NextResponse.json(
        { error: "Title and start time are required" },
        { status: 400 }
      );
    }

    let computedDuration = Number(durationMin || 0);
    if (!computedDuration && endTime) {
      computedDuration = Math.round(
        (new Date(endTime).getTime() - new Date(finalStartsAt).getTime()) /
          60000
      );
    }
    if (computedDuration <= 0) {
      return NextResponse.json(
        { error: "Agenda item duration must be positive (end time after start time)" },
        { status: 400 }
      );
    }

    const existingItems = await getActivityAgendaItems(id);
    const nextOrder =
      sortOrder !== undefined ? Number(sortOrder) : existingItems.length + 1;

    const item = await createActivityAgendaItem({
      activityId: id,
      title: title.trim(),
      startsAt: new Date(finalStartsAt).toISOString(),
      durationMin: computedDuration,
      speaker: speaker || null,
      leadId: leadId || speakerId || null,
      location: location || activity.location || null,
      sortOrder: nextOrder,
      notes: notes || description || "",
    });

    const allItems = await getActivityAgendaItems(id);
    const rawConflicts = detectAgendaConflicts(
      allItems.map((a) => ({
        id: a.id,
        title: a.title,
        startsAt: a.startsAt,
        durationMin: a.durationMin,
      })),
      activity.startsAt,
      activity.endsAt
    );

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_AGENDA_CREATED",
      entityType: "ACTIVITY_AGENDA",
      entityId: item.id,
      details: `Added agenda slot "${item.title}" to "${activity.title}"`,
    });

    return NextResponse.json(
      {
        item,
        agenda: mapAgendaForUi(allItems),
        agendaConflicts: rawConflicts.map((w) => ({
          ...w,
          messageFr: w.message,
          messageEn: w.message,
        })),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/planner/activities/[id]/agenda:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to add agenda item" },
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
    const activity = await getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!canEditActivity(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    if (Array.isArray(body.orderedIds)) {
      for (let idx = 0; idx < body.orderedIds.length; idx++) {
        await updateActivityAgendaItem(body.orderedIds[idx], {
          sort_order: idx + 1,
        });
      }
      const allItems = await getActivityAgendaItems(id);
      const rawConflicts = detectAgendaConflicts(
        allItems.map((a) => ({
          id: a.id,
          title: a.title,
          startsAt: a.startsAt,
          durationMin: a.durationMin,
        })),
        activity.startsAt,
        activity.endsAt
      );
      return NextResponse.json({
        agenda: mapAgendaForUi(allItems),
        agendaConflicts: rawConflicts.map((w) => ({
          ...w,
          messageFr: w.message,
          messageEn: w.message,
        })),
      });
    }

    const { itemId, title, startTime, startsAt, endTime, durationMin, speaker, location, notes, description } =
      body;
    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const dbUpdates: Record<string, unknown> = {};
    if (title !== undefined) dbUpdates.title = title;
    const nextStart = startsAt || startTime;
    if (nextStart) dbUpdates.starts_at = new Date(nextStart).toISOString();
    if (durationMin !== undefined) {
      dbUpdates.duration_min = Number(durationMin);
    } else if (nextStart && endTime) {
      dbUpdates.duration_min = Math.max(
        5,
        Math.round(
          (new Date(endTime).getTime() - new Date(nextStart).getTime()) / 60000
        )
      );
    }
    if (speaker !== undefined) dbUpdates.speaker = speaker;
    if (location !== undefined) dbUpdates.location = location;
    if (notes !== undefined || description !== undefined)
      dbUpdates.notes = notes ?? description;

    const item = await updateActivityAgendaItem(itemId, dbUpdates);
    const allItems = await getActivityAgendaItems(id);
    const rawConflicts = detectAgendaConflicts(
      allItems.map((a) => ({
        id: a.id,
        title: a.title,
        startsAt: a.startsAt,
        durationMin: a.durationMin,
      })),
      activity.startsAt,
      activity.endsAt
    );

    return NextResponse.json({
      item,
      agenda: mapAgendaForUi(allItems),
      agendaConflicts: rawConflicts.map((w) => ({
        ...w,
        messageFr: w.message,
        messageEn: w.message,
      })),
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/planner/activities/[id]/agenda:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update agenda item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(req.url);
    let itemId = searchParams.get("itemId");
    if (!itemId) {
      try {
        const body = await req.json();
        itemId = body.itemId;
      } catch {
        // ignore
      }
    }
    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    await deleteActivityAgendaItem(itemId);

    const allItems = await getActivityAgendaItems(id);
    const rawConflicts = detectAgendaConflicts(
      allItems.map((a) => ({
        id: a.id,
        title: a.title,
        startsAt: a.startsAt,
        durationMin: a.durationMin,
      })),
      activity.startsAt,
      activity.endsAt
    );

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_AGENDA_DELETED",
      entityType: "ACTIVITY_AGENDA",
      entityId: itemId,
      details: `Deleted agenda slot ${itemId} from "${activity.title}"`,
    });

    return NextResponse.json({
      success: true,
      agenda: mapAgendaForUi(allItems),
      agendaConflicts: rawConflicts.map((w) => ({
        ...w,
        messageFr: w.message,
        messageEn: w.message,
      })),
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/planner/activities/[id]/agenda:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete agenda item" },
      { status: 500 }
    );
  }
}
