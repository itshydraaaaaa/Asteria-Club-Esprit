import { NextResponse } from "next/server";
import {
  getEventById,
  updateAttendanceRecordStatus,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { broadcastRealtime } from "@/lib/supabase/realtime";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, userId, status, reason } = body;

    if (!eventId || !userId || !status) {
      return NextResponse.json(
        { error: "L'ID de l'événement, l'ID du membre et le statut sont requis." },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        { error: "Un motif obligatoire doit être renseigné pour tout ajustement manuel d'émargement." },
        { status: 400 }
      );
    }

    const validStatuses = ["PRESENT", "LATE", "ABSENT", "EXCUSED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Statut d'émargement invalide." }, { status: 400 });
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
        { error: "Interdit : Vous n'avez pas l'autorisation d'ajuster manuellement l'émargement de cet événement." },
        { status: 403 }
      );
    }

    const updatedRecord = await updateAttendanceRecordStatus(
      eventId,
      userId,
      status,
      reason.trim(),
      user.id
    );

    await broadcastRealtime("attendance_realtime", "attendance_updated", {
      recordId: updatedRecord.id,
      eventId,
      userId,
      status,
      method: "MANUAL",
      manualReason: reason.trim(),
      markedByName: user.name,
    });

    return NextResponse.json({
      success: true,
      message: `Statut mis à jour en "${status}" avec succès.`,
      record: updatedRecord,
    });
  } catch (error: any) {
    console.error("Error in POST /api/attendance/manual:", error);
    return NextResponse.json({ error: error?.message || "Échec de l'ajustement manuel" }, { status: 500 });
  }
}
