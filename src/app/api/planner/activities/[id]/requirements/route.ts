import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  canViewActivityWorkspace,
  canEditActivity,
} from "@/lib/planner/permissions";
import {
  getActivityById,
  getActivityRequirements,
  createActivityRequirement,
  updateActivityRequirement,
  deleteActivityRequirement,
  getActiveResourceBookingSlots,
  getPlannerResources,
  recordPlannerAuditLog,
} from "@/lib/planner/queries";
import { detectResourceConflict } from "@/lib/planner/logic";

function mapStatusToDb(status?: string): string {
  if (!status) return "NEEDED";
  if (status === "PENDING") return "NEEDED";
  if (status === "BOOKED") return "CONFIRMED";
  if (status === "DELIVERED") return "READY";
  if (status === "REJECTED") return "NEEDED";
  return status;
}

function mapCategoryToDb(category?: string): string {
  if (!category) return "EQUIPMENT";
  const allowed = [
    "SPACE",
    "EQUIPMENT",
    "MATERIALS",
    "PEOPLE",
    "PURCHASE",
    "PERMISSION",
    "PROMOTION",
  ];
  if (allowed.includes(category)) return category;
  if (category === "CATERING" || category === "TRANSPORT") return "PURCHASE";
  if (category === "PRINTING") return "MATERIALS";
  if (category === "SECURITY") return "PERMISSION";
  return "EQUIPMENT";
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

    const [requirements, bookingSlots, resources] = await Promise.all([
      getActivityRequirements(id),
      getActiveResourceBookingSlots(),
      getPlannerResources(),
    ]);

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

    return NextResponse.json({
      requirements: requirements.map((r) => ({
        ...r,
        name: r.title,
        estimatedCost: r.estCost,
      })),
      resourceConflicts,
      resources: resources.map((r) => ({
        ...r,
        category: r.kind === "ROOM" ? "SPACE" : "EQUIPMENT",
        totalQuantity: r.capacity || 1,
      })),
    });
  } catch (error: any) {
    console.error("Error in GET /api/planner/activities/[id]/requirements:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load requirements" },
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
      category,
      name,
      title,
      quantity,
      resourceId,
      status,
      assignedToId,
      ownerId,
      estimatedCost,
      estCost,
      actualCost,
      notes,
    } = body;

    const reqTitle = (title || name || "").trim();
    if (!reqTitle) {
      return NextResponse.json(
        { error: "Requirement name is required" },
        { status: 400 }
      );
    }

    let conflictWarning: any = null;
    if (resourceId) {
      const bookingSlots = await getActiveResourceBookingSlots();
      const check = detectResourceConflict(
        {
          activityId: activity.id,
          resourceId,
          startsAt: activity.startsAt,
          endsAt: activity.endsAt,
        },
        bookingSlots
      );
      if (check.hasConflict) {
        conflictWarning = check;
      }
    }

    const requirement = await createActivityRequirement({
      activityId: id,
      category: mapCategoryToDb(category),
      title: reqTitle,
      quantity: Number(quantity || 1),
      resourceId: resourceId || null,
      status: mapStatusToDb(status),
      ownerId: ownerId || assignedToId || user.id,
      neededBy: activity.startsAt,
      estCost: Number(estCost ?? estimatedCost ?? 0),
      actualCost: Number(actualCost ?? 0),
      notes: notes || "",
    });

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_REQUIREMENT_CREATED",
      entityType: "ACTIVITY_REQUIREMENT",
      entityId: requirement.id,
      details: `Added requirement "${requirement.title}" (${requirement.category}, qty ${requirement.quantity}) to "${activity.title}"`,
    });

    return NextResponse.json(
      {
        requirement: {
          ...requirement,
          name: requirement.title,
          estimatedCost: requirement.estCost,
        },
        conflictWarning,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/planner/activities/[id]/requirements:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create requirement" },
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
    const {
      requirementId,
      category,
      name,
      title,
      quantity,
      resourceId,
      status,
      assignedToId,
      ownerId,
      estimatedCost,
      estCost,
      actualCost,
      notes,
    } = body;

    if (!requirementId) {
      return NextResponse.json(
        { error: "requirementId is required" },
        { status: 400 }
      );
    }

    const dbUpdates: Record<string, unknown> = {};
    if (category !== undefined) dbUpdates.category = mapCategoryToDb(category);
    if (title !== undefined || name !== undefined)
      dbUpdates.title = title ?? name;
    if (quantity !== undefined) dbUpdates.quantity = Number(quantity);
    if (resourceId !== undefined) dbUpdates.resource_id = resourceId || null;
    if (status !== undefined) dbUpdates.status = mapStatusToDb(status);
    if (ownerId !== undefined || assignedToId !== undefined)
      dbUpdates.owner_id = ownerId ?? assignedToId ?? null;
    if (estCost !== undefined || estimatedCost !== undefined)
      dbUpdates.est_cost = Number(estCost ?? estimatedCost ?? 0);
    if (actualCost !== undefined) dbUpdates.actual_cost = Number(actualCost);
    if (notes !== undefined) dbUpdates.notes = notes;

    const requirement = await updateActivityRequirement(
      requirementId,
      dbUpdates
    );

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_REQUIREMENT_UPDATED",
      entityType: "ACTIVITY_REQUIREMENT",
      entityId: requirement.id,
      details: `Updated requirement "${requirement.title}" (status: ${requirement.status}) on "${activity.title}"`,
    });

    return NextResponse.json({
      requirement: {
        ...requirement,
        name: requirement.title,
        estimatedCost: requirement.estCost,
      },
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/planner/activities/[id]/requirements:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update requirement" },
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
    let requirementId = searchParams.get("requirementId");
    if (!requirementId) {
      try {
        const body = await req.json();
        requirementId = body.requirementId;
      } catch {
        // ignore
      }
    }
    if (!requirementId) {
      return NextResponse.json(
        { error: "requirementId is required" },
        { status: 400 }
      );
    }

    await deleteActivityRequirement(requirementId);

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_REQUIREMENT_DELETED",
      entityType: "ACTIVITY_REQUIREMENT",
      entityId: requirementId,
      details: `Deleted requirement ${requirementId} from "${activity.title}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/planner/activities/[id]/requirements:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete requirement" },
      { status: 500 }
    );
  }
}
