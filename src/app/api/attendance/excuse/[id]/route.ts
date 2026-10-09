import { NextResponse } from "next/server";
import {
  reviewExcuseRequest,
  getEventById,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const body = await req.json();
    const { decision, notes } = body;

    if (!decision || !["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json(
        { error: "Décision invalide. Doit être 'APPROVED' ou 'REJECTED'." },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    let eventId = body.eventId;
    let userId = body.userId;

    // If eventId & userId not provided in body, look up by excuse request id
    if (!eventId || !userId) {
      const { data: excuseRecord } = await (admin as any)
        .from("excuse_requests")
        .select("event_id, user_id")
        .eq("id", id)
        .maybeSingle();

      if (excuseRecord) {
        eventId = excuseRecord.event_id;
        userId = excuseRecord.user_id;
      }
    }

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: "Impossible de déterminer l'événement ou le membre associé à cette demande." },
        { status: 400 }
      );
    }

    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
    }

    // Role check: Host, HoD of department, or Board
    const isLeadership =
      user.role === "PRESIDENT" ||
      user.role === "VICE_PRESIDENT" ||
      user.role === "BOARD";
    const isHost = event.hostId === user.id || event.createdById === user.id;
    const isDeptHod = user.role === "HOD" && user.departmentId === event.departmentId;

    if (!isLeadership && !isHost && !isDeptHod) {
      return NextResponse.json(
        { error: "Interdit : Seuls l'hôte de l'événement et les responsables peuvent traiter cette justification." },
        { status: 403 }
      );
    }

    const result = await reviewExcuseRequest(
      eventId,
      userId,
      decision,
      user.id,
      notes || undefined
    );

    return NextResponse.json({
      success: true,
      message: `Justification ${decision === "APPROVED" ? "approuvée" : "rejetée"} avec succès.`,
      result,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/attendance/excuse/[id]:", error);
    return NextResponse.json({ error: error?.message || "Erreur lors du traitement de l'excuse" }, { status: 500 });
  }
}
