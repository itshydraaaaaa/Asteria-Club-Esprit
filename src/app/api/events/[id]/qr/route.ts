import { NextResponse } from "next/server";
import { getEventById } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { generateRotatingQrToken } from "@/lib/qr-security";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé : Veuillez vous connecter." },
        { status: 401 }
      );
    }

    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
    }

    // Strict Authorization: Host and Leadership only
    const isLeadership =
      user.role === "PRESIDENT" ||
      user.role === "VICE_PRESIDENT" ||
      user.role === "BOARD";
    const isHost = event.hostId === user.id;
    const isCreator = event.createdById === user.id;
    const isDeptHod =
      user.role === "HOD" && user.departmentId === event.departmentId;

    if (!isLeadership && !isHost && !isCreator && !isDeptHod) {
      return NextResponse.json(
        {
          error:
            "Accès refusé : Le QR code dynamique d'émargement est strictement restreint à l'hôte de la session et au Bureau exécutif.",
        },
        { status: 403 }
      );
    }

    const now = Date.now();
    const eventStart = new Date(event.startTime).getTime();
    const eventEnd = new Date(event.endTime).getTime();

    const windowStart = eventStart - (event.checkInWindowStartMin || 15) * 60 * 1000;
    const windowEnd = eventStart + (event.checkInWindowEndMin || 30) * 60 * 1000;

    // Check session lifecycle status
    if (event.checkInStatus === "CLOSED") {
      return NextResponse.json({
        status: "CLOSED",
        message: "La session d'émargement est clôturée. Le QR code n'est plus actif.",
      });
    }

    if (event.checkInStatus === "PAUSED") {
      return NextResponse.json({
        status: "PAUSED",
        message: "L'émargement est actuellement en pause.",
      });
    }

    // Enforce check-in window schedule (unless explicitly forced OPEN by host)
    if (event.checkInStatus !== "OPEN") {
      if (now < windowStart) {
        const diffMinutes = Math.ceil((windowStart - now) / 60000);
        return NextResponse.json({
          status: "SCHEDULED",
          message: `La fenêtre d'émargement ouvrira automatiquement ${diffMinutes} min avant le début de l'événement. Vous pouvez également cliquer sur "Ouvrir l'émargement" manuellement.`,
          windowOpensAt: new Date(windowStart).toISOString(),
        });
      }

      if (now > windowEnd) {
        return NextResponse.json({
          status: "EXPIRED",
          message: "La fenêtre d'émargement est dépassée. Clôturez la session pour consigner les absences.",
          windowClosedAt: new Date(windowEnd).toISOString(),
        });
      }
    }

    // Generate short-lived rotating token
    const qrData = generateRotatingQrToken(id);

    return NextResponse.json({
      status: "OPEN",
      eventId: id,
      eventTitle: event.title,
      token: qrData.token,
      timeSlice: qrData.timeSlice,
      expiresInSeconds: qrData.expiresInSeconds,
      qrPayloadUrl: qrData.qrPayloadUrl,
      checkInCode: event.checkInCode,
      windowClosesAt: new Date(windowEnd).toISOString(),
      lateThresholdMin: event.lateThresholdMin || 10,
    });
  } catch (error: any) {
    console.error("Error in GET /api/events/[id]/qr:", error);
    return NextResponse.json({ error: "Failed to generate QR session" }, { status: 500 });
  }
}
