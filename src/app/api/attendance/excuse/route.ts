import { NextResponse } from "next/server";
import {
  submitExcuseRequest,
  getExcuseRequests,
  getEventById,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || undefined;
    const requestedUserId = searchParams.get("userId") || undefined;

    const isLeadership =
      user.role === "PRESIDENT" ||
      user.role === "VICE_PRESIDENT" ||
      user.role === "BOARD";
    const isHod = user.role === "HOD";

    let targetUserId = requestedUserId;
    let targetDeptId: string | undefined = undefined;

    if (!isLeadership && !isHod) {
      // Regular members can only view their own excuse requests
      targetUserId = user.id;
    } else if (isHod && !isLeadership) {
      targetDeptId = user.departmentId || undefined;
    }

    const excuses = await getExcuseRequests({
      eventId,
      userId: targetUserId,
      departmentId: targetDeptId,
    });

    return NextResponse.json({ excuses });
  } catch (error: any) {
    console.error("Error in GET /api/attendance/excuse:", error);
    return NextResponse.json({ error: "Failed to fetch excuses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, reason, attachmentUrl } = body;

    if (!eventId || !reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        { error: "L'identifiant de l'événement et le motif de l'absence sont obligatoires." },
        { status: 400 }
      );
    }

    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
    }

    const excuse = await submitExcuseRequest({
      event_id: eventId,
      user_id: user.id,
      reason: reason.trim(),
      attachment_url: attachmentUrl || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Demande de justification d'absence soumise avec succès. Elle sera examinée par l'hôte ou le responsable de département.",
      excuse,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/attendance/excuse:", error);
    return NextResponse.json({ error: error?.message || "Échec de la soumission de l'excuse" }, { status: 500 });
  }
}
