import { NextResponse } from "next/server";
import {
  getEventById,
  updateEvent,
  deleteEvent,
  updateAnnouncementByEventId,
  createAuditLog,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
    }

    const isLeadership =
      user?.role === "PRESIDENT" ||
      user?.role === "VICE_PRESIDENT" ||
      user?.role === "BOARD";
    const isOrganizer = user?.id && event.createdById === user.id;
    const isHost = user?.id && event.hostId === user.id;
    const isDeptHod =
      user?.role === "HOD" && user?.departmentId === event.departmentId;
    const canViewCode = Boolean(isLeadership || isOrganizer || isHost || isDeptHod);

    return NextResponse.json({
      event: {
        ...event,
        checkInCode: canViewCode ? event.checkInCode : "",
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/events/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé : Veuillez vous connecter." }, { status: 401 });
    }

    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
    }

    const isLeadership =
      user.role === "PRESIDENT" ||
      user.role === "VICE_PRESIDENT" ||
      user.role === "BOARD";
    const isHost = event.hostId === user.id;
    const isCreator = event.createdById === user.id;
    const isDeptHod = user.role === "HOD" && user.departmentId === event.departmentId;

    if (!isLeadership && !isHost && !isCreator && !isDeptHod) {
      return NextResponse.json(
        { error: "Interdit : Vous n'avez pas l'autorisation de modifier cet événement." },
        { status: 403 }
      );
    }

    const body = await req.json();

    // HOD restrictions
    if (user.role === "HOD" && !isLeadership) {
      if (body.departmentId && body.departmentId !== user.departmentId) {
        return NextResponse.json(
          { error: "Interdit : Vous ne pouvez pas déplacer cet événement vers un autre département." },
          { status: 403 }
        );
      }
      if (body.audienceScope && body.audienceScope !== "DEPARTMENT") {
        return NextResponse.json(
          { error: "Interdit : Les responsables de département ne peuvent pas modifier la portée en dehors de leur département." },
          { status: 403 }
        );
      }
    }

    // Host validation if changing host
    if (body.hostId && body.hostId !== event.hostId) {
      const admin = getAdminClient();
      const { data: newHost } = await (admin as any)
        .from("profiles")
        .select("id, role, department_id")
        .eq("id", body.hostId)
        .single();

      if (!newHost) {
        return NextResponse.json({ error: "Hôte désigné introuvable." }, { status: 400 });
      }

      const hostIsBoard =
        newHost.role === "PRESIDENT" ||
        newHost.role === "VICE_PRESIDENT" ||
        newHost.role === "BOARD";
      const hostIsHod =
        newHost.role === "HOD" && (body.departmentId || event.departmentId) && newHost.department_id === (body.departmentId || event.departmentId);

      if (!hostIsBoard && !hostIsHod) {
        return NextResponse.json(
          { error: "Hôte non éligible : Seuls les membres du Bureau et le Responsable du Département peuvent être hôtes de session." },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, any> = {};
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.description !== undefined) updates.description = body.description;
    if (body.type !== undefined) updates.type = body.type;
    if (body.audienceScope !== undefined) updates.audience_scope = body.audienceScope;
    if (body.startTime !== undefined) updates.start_time = body.startTime;
    if (body.endTime !== undefined) updates.end_time = body.endTime;
    if (body.location !== undefined) updates.location = body.location.trim();
    if (body.departmentId !== undefined) updates.department_id = body.departmentId || null;
    if (body.hostId !== undefined) updates.host_id = body.hostId;
    if (body.attendanceRequired !== undefined) updates.attendance_required = Boolean(body.attendanceRequired);
    if (body.checkInWindowStartMin !== undefined) updates.check_in_window_start_min = Number(body.checkInWindowStartMin);
    if (body.checkInWindowEndMin !== undefined) updates.check_in_window_end_min = Number(body.checkInWindowEndMin);
    if (body.lateThresholdMin !== undefined) updates.late_threshold_min = Number(body.lateThresholdMin);
    if (body.isGeofenceEnabled !== undefined) updates.is_geofence_enabled = Boolean(body.isGeofenceEnabled);
    if (body.geofenceLat !== undefined) updates.geofence_lat = body.geofenceLat ? Number(body.geofenceLat) : null;
    if (body.geofenceLng !== undefined) updates.geofence_lng = body.geofenceLng ? Number(body.geofenceLng) : null;
    if (body.geofenceRadiusM !== undefined) updates.geofence_radius_m = Number(body.geofenceRadiusM);
    if (body.recurrenceRule !== undefined) updates.recurrence_rule = body.recurrenceRule;
    if (body.checkInCode !== undefined) updates.check_in_code = body.checkInCode.trim();

    const updatedEvent = await updateEvent(id, updates);

    // Sync to linked announcement if title, dates or location changed
    if (body.title || body.startTime || body.location || body.description) {
      try {
        const start = new Date(updatedEvent.startTime);
        const formattedDate = start.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const formattedTime = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

        await updateAnnouncementByEventId(id, {
          title: `📅 [Événement] ${updatedEvent.title}`,
          body: `L'événement **${updatedEvent.title}** (${updatedEvent.type}) a été mis à jour.\n\n📅 **Date :** ${formattedDate} à ${formattedTime}\n📍 **Lieu :** ${updatedEvent.location}\n👥 **Audience :** ${updatedEvent.audienceScope}\n\n${updatedEvent.cleanDescription ? `> ${updatedEvent.cleanDescription.slice(0, 200)}...` : ""}\n\nConsultez le Calendrier pour plus de détails.`,
          scope: updatedEvent.audienceScope,
          department_id: updatedEvent.departmentId,
        });
      } catch (annError) {
        console.warn("Could not sync linked announcement:", annError);
      }
    }

    await createAuditLog({
      user_id: user.id,
      action: "EVENT_UPDATED",
      details: `Updated event "${updatedEvent.title}" (ID: ${id})`,
    });

    return NextResponse.json({ event: updatedEvent });
  } catch (error: any) {
    console.error("Error in PATCH /api/events/[id]:", error);
    return NextResponse.json({ error: error?.message || "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
    }

    const isLeadership =
      user.role === "PRESIDENT" ||
      user.role === "VICE_PRESIDENT" ||
      user.role === "BOARD";
    const isHost = event.hostId === user.id;
    const isCreator = event.createdById === user.id;
    const isDeptHod = user.role === "HOD" && user.departmentId === event.departmentId;

    if (!isLeadership && !isHost && !isCreator && !isDeptHod) {
      return NextResponse.json(
        { error: "Interdit : Seuls le Bureau et l'Hôte peuvent supprimer cet événement." },
        { status: 403 }
      );
    }

    await deleteEvent(id);

    await createAuditLog({
      user_id: user.id,
      action: "EVENT_DELETED",
      details: `Deleted event "${event.title}" (ID: ${id})`,
    });

    return NextResponse.json({ success: true, message: "Événement supprimé avec succès." });
  } catch (error: any) {
    console.error("Error in DELETE /api/events/[id]:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete event" }, { status: 500 });
  }
}
