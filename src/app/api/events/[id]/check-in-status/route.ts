import { NextResponse } from "next/server";
import {
  getEventById,
  updateEventCheckInStatus,
  createAuditLog,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { broadcastRealtime } from "@/lib/supabase/realtime";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
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
        { error: "Interdit : Seuls l'Hôte de session et le Bureau peuvent contrôler le statut de l'émargement." },
        { status: 403 }
      );
    }

    const body = await req.json();
    let actionStatus = body.status;

    if (actionStatus === "RESUME") {
      actionStatus = "OPEN";
    }

    if (!["OPEN", "PAUSED", "CLOSED"].includes(actionStatus)) {
      return NextResponse.json({ error: "Statut d'émargement invalide." }, { status: 400 });
    }

    const result = await updateEventCheckInStatus(id, actionStatus, user.id);

    await broadcastRealtime("attendance_realtime", "event_status_changed", {
      eventId: id,
      newStatus: actionStatus,
      updatedBy: user.name,
    });

    await createAuditLog({
      user_id: user.id,
      action: `ATTENDANCE_STATUS_${actionStatus}`,
      details: `Changed check-in status of event "${event.title}" to ${actionStatus}`,
    });

    return NextResponse.json({
      success: true,
      checkInStatus: actionStatus,
      result,
    });
  } catch (error: any) {
    console.error("Error in POST /api/events/[id]/check-in-status:", error);
    return NextResponse.json({ error: error?.message || "Erreur lors de la mise à jour du statut" }, { status: 500 });
  }
}
