import { NextResponse } from "next/server";
import {
  findEventByCheckInCode,
  getEventById,
  upsertAttendance,
  createAuditLog,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { broadcastRealtime } from "@/lib/supabase/realtime";
import { getAdminClient } from "@/lib/supabase/admin";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import { verifyRotatingQrToken } from "@/lib/qr-security";

// Haversine formula to compute distance in meters between two lat/lng coordinates
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé : Veuillez vous connecter avec votre compte Asteria pour émarger." },
        { status: 401 }
      );
    }

    const clientIp = getClientIp(req);
    // Rate limit: Max 15 attempts per minute per user/IP
    const checkRate = checkRateLimit(`checkin:${user.id}_${clientIp}`, 15, 60 * 1000);
    if (!checkRate.allowed) {
      return NextResponse.json(
        { error: `Trop de tentatives. Veuillez patienter ${checkRate.resetInSeconds} secondes avant de réessayer.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      eventId,
      token,
      ts,
      code,
      method = "QR",
      userLat,
      userLng,
    } = body;

    let targetEvent: any = null;
    let checkInMethod: "QR" | "CODE" = "QR";

    // 1. Authenticate check-in payload (Rotating QR or Fallback Code)
    if (eventId && token) {
      // Validate dynamic rotating cryptographic token
      const verification = verifyRotatingQrToken(eventId, token, ts ? Number(ts) : undefined);
      if (!verification.valid) {
        return NextResponse.json({ error: verification.reason }, { status: 400 });
      }

      targetEvent = await getEventById(eventId);
      if (!targetEvent) {
        return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
      }
      checkInMethod = "QR";
    } else if (code && typeof code === "string" && code.trim()) {
      targetEvent = await findEventByCheckInCode(code.trim());
      if (!targetEvent) {
        return NextResponse.json(
          { error: "Code d'émargement invalide. Aucun événement actif ne correspond à ce code." },
          { status: 404 }
        );
      }
      checkInMethod = "CODE";
    } else {
      return NextResponse.json(
        { error: "Token de sécurité QR ou code d'émargement requis." },
        { status: 400 }
      );
    }

    const now = Date.now();
    const eventStart = new Date(targetEvent.startTime).getTime();
    const eventEnd = new Date(targetEvent.endTime).getTime();

    // 2. Lifecycle Status & Check-In Window Verification
    if (targetEvent.checkInStatus === "CLOSED") {
      return NextResponse.json(
        { error: "La session d'émargement est clôturée. Il n'est plus possible de pointer." },
        { status: 400 }
      );
    }

    if (targetEvent.checkInStatus === "PAUSED") {
      return NextResponse.json(
        { error: "L'émargement est temporairement mis en pause par l'hôte." },
        { status: 400 }
      );
    }

    const windowStart = eventStart - (targetEvent.checkInWindowStartMin || 15) * 60 * 1000;
    const windowEnd = eventStart + (targetEvent.checkInWindowEndMin || 30) * 60 * 1000;

    if (targetEvent.checkInStatus !== "OPEN") {
      if (now < windowStart) {
        const minLeft = Math.ceil((windowStart - now) / 60000);
        return NextResponse.json(
          { error: `L'émargement n'est pas encore ouvert. Il ouvrira ${minLeft} min avant le début de l'événement.` },
          { status: 400 }
        );
      }

      if (now > windowEnd) {
        return NextResponse.json(
          { error: "La fenêtre d'émargement est expirée pour cet événement." },
          { status: 400 }
        );
      }
    }

    // 3. User Eligibility Check
    const isLeadership =
      user.role === "PRESIDENT" ||
      user.role === "VICE_PRESIDENT" ||
      user.role === "BOARD";
    const isHost = targetEvent.hostId === user.id || targetEvent.createdById === user.id;

    if (!isLeadership && !isHost) {
      if (targetEvent.audienceScope === "BOARD") {
        return NextResponse.json(
          { error: "Non éligible : Cet événement est réservé aux membres du Bureau." },
          { status: 403 }
        );
      }

      if (targetEvent.audienceScope === "DEPARTMENT" && targetEvent.departmentId) {
        const isDeptMember = user.departmentId === targetEvent.departmentId;
        const hasRsvp = (targetEvent.rsvps || []).some(
          (r: any) => r.userId === user.id && r.status === "GOING"
        );
        if (!isDeptMember && !hasRsvp) {
          return NextResponse.json(
            { error: "Non éligible : Cet événement est réservé aux membres du département concerné." },
            { status: 403 }
          );
        }
      }
    }

    // 4. Duplicate Check
    const admin = getAdminClient();
    const { data: existingRecord } = await (admin as any)
      .from("attendance_records")
      .select("id, status, checked_in_at")
      .eq("event_id", targetEvent.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingRecord && (existingRecord.status === "PRESENT" || existingRecord.status === "LATE")) {
      return NextResponse.json(
        {
          error: "Émargement déjà enregistré : Vous avez déjà validé votre présence pour cet événement.",
          alreadyCheckedIn: true,
          status: existingRecord.status,
          checkedInAt: existingRecord.checked_in_at,
        },
        { status: 400 }
      );
    }

    // 5. Geofence Verification (if enabled on event)
    if (
      targetEvent.isGeofenceEnabled &&
      targetEvent.geofenceLat != null &&
      targetEvent.geofenceLng != null
    ) {
      if (userLat == null || userLng == null) {
        return NextResponse.json(
          { error: "Géolocalisation requise : Veuillez autoriser la localisation GPS pour valider votre présence sur place." },
          { status: 400 }
        );
      }

      const distanceM = calculateDistanceMeters(
        Number(userLat),
        Number(userLng),
        targetEvent.geofenceLat,
        targetEvent.geofenceLng
      );

      const maxRadius = targetEvent.geofenceRadiusM || 100;
      if (distanceM > maxRadius) {
        return NextResponse.json(
          {
            error: `Position hors du périmètre : Vous êtes à ${Math.round(distanceM)}m du lieu de l'événement (rayon autorisé : ${maxRadius}m).`,
          },
          { status: 400 }
        );
      }
    }

    // 6. Calculate Status: PRESENT vs LATE
    const lateThreshold = eventStart + (targetEvent.lateThresholdMin || 10) * 60 * 1000;
    const isLate = now > lateThreshold;
    const finalStatus = isLate ? "LATE" : "PRESENT";
    const minutesLate = isLate ? Math.max(1, Math.round((now - eventStart) / 60000)) : 0;

    const justification = isLate
      ? `Émargé avec un retard de ${minutesLate} minute(s)`
      : null;

    // 7. Store record
    const record = await upsertAttendance({
      event_id: targetEvent.id,
      user_id: user.id,
      status: finalStatus,
      method: checkInMethod,
      justification,
      checked_in_at: new Date().toISOString(),
    });

    // 8. Realtime broadcast to live attendance board
    await broadcastRealtime("attendance_realtime", "attendance_updated", {
      recordId: record.id,
      eventId: targetEvent.id,
      userId: user.id,
      userName: user.name,
      status: finalStatus,
      method: checkInMethod,
      checkedInAt: record.checkedInAt,
    });

    // 9. Audit trail
    await createAuditLog({
      user_id: user.id,
      action: "ATTENDANCE_CHECK_IN",
      details: `User ${user.name} checked in as ${finalStatus} (${checkInMethod}) for event "${targetEvent.title}"`,
    });

    return NextResponse.json({
      success: true,
      status: finalStatus,
      method: checkInMethod,
      message:
        finalStatus === "LATE"
          ? `Présence enregistrée en retard (${minutesLate} min) pour "${targetEvent.title}".`
          : `Présence validée à l'heure pour "${targetEvent.title}" !`,
      record,
      event: {
        id: targetEvent.id,
        title: targetEvent.title,
        startTime: targetEvent.startTime,
        location: targetEvent.location,
      },
    });
  } catch (error: any) {
    console.error("Error checking in:", error);
    return NextResponse.json({ error: error?.message || "Échec du pointage." }, { status: 500 });
  }
}
