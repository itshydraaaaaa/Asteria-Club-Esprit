import { NextResponse } from "next/server";
import {
  getEvents,
  createEvent,
  updateEvent,
  checkEventConflict,
  upsertRSVP,
  createAuditLog,
  createAnnouncement,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";

function extractImageUrl(description?: string | null, rawImageUrl?: string | null): { cleanDescription: string; imageUrl: string | null } {
  if (rawImageUrl) return { cleanDescription: description || "", imageUrl: rawImageUrl };
  if (!description) return { cleanDescription: "", imageUrl: null };
  const imgMatch = description.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/) || description.match(/\[image:\s*(https?:\/\/[^\s\]]+)\]/);
  if (imgMatch) {
    return {
      cleanDescription: description.replace(imgMatch[0], "").trim(),
      imageUrl: imgMatch[1],
    };
  }
  return { cleanDescription: description, imageUrl: null };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId") || undefined;
    const scope = searchParams.get("scope") || undefined;
    const user = await getCurrentUser();

    const events = await getEvents({
      department_id: departmentId,
      scope,
      user_id: user?.id,
    });

    const isLeadership =
      user?.role === "PRESIDENT" ||
      user?.role === "VICE_PRESIDENT" ||
      user?.role === "BOARD";

    const mappedEvents = events.map((e: any) => {
      const { cleanDescription, imageUrl } = extractImageUrl(e.description, e.image_url);

      const isOrganizer = user?.id && e.created_by_id === user.id;
      const isHost = user?.id && e.hostId === user.id;
      const isDeptHod = user?.role === "HOD" && user?.departmentId === (e.department_id || e.departmentId);
      const canViewCode = Boolean(isLeadership || isOrganizer || isHost || isDeptHod);

      return {
        ...e,
        // Security: Strip check_in_code from non-organizers/non-hosts to prevent premature attendance spoofing
        checkInCode: canViewCode ? (e.check_in_code || e.checkInCode || "") : "",
        startTime: e.start_time || e.startTime,
        endTime: e.end_time || e.endTime,
        departmentId: e.department_id || e.departmentId,
        department: e.departments || e.department,
        createdById: e.created_by_id || e.createdById,
        recurrenceRule: e.recurrence_rule || e.recurrenceRule,
        imageUrl,
        cleanDescription,
        rsvps: (e.rsvps || []).map((r: any) => ({
          ...r,
          eventId: r.event_id || r.eventId,
          userId: r.user_id || r.userId,
        })),
        attendanceRecords: (e.attendance_records || []).map((a: any) => ({
          ...a,
          eventId: a.event_id || a.eventId,
          userId: a.user_id || a.userId,
          checkedInAt: a.checked_in_at || a.checkedInAt,
        })),
      };
    });

    return NextResponse.json({ events: mappedEvents });
  } catch (error) {
    console.error("Error in GET /api/events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé : Veuillez vous connecter." }, { status: 401 });
    }

    const isBoard =
      user.role === "PRESIDENT" ||
      user.role === "VICE_PRESIDENT" ||
      user.role === "BOARD";
    const isHod = user.role === "HOD";

    if (!isBoard && !isHod) {
      return NextResponse.json(
        { error: "Interdit : Seuls les membres du Bureau et les Responsables de Département (HOD) peuvent créer et animer des événements." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      type = "WORKSHOP",
      audienceScope,
      startTime,
      endTime,
      location,
      departmentId,
      hostId,
      attendanceRequired = true,
      checkInWindowStartMin = 15,
      checkInWindowEndMin = 30,
      lateThresholdMin = 10,
      isGeofenceEnabled = false,
      geofenceLat = null,
      geofenceLng = null,
      geofenceRadiusM = 100,
      recurrenceRule,
      checkInCode,
      imageUrl,
    } = body;

    if (!title || !startTime || !endTime || !location) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants : Le titre, l'heure de début, l'heure de fin et le lieu sont requis." },
        { status: 400 }
      );
    }

    // Role enforcement: HOD can only create department-level events for their own department
    if (isHod) {
      if (!departmentId || departmentId !== user.departmentId) {
        return NextResponse.json(
          { error: "Interdit : En tant que Responsable de Département (HOD), vous ne pouvez créer des événements que pour votre propre département." },
          { status: 403 }
        );
      }
      if (audienceScope && audienceScope !== "DEPARTMENT") {
        return NextResponse.json(
          { error: "Interdit : Un responsable de département ne peut publier que des événements avec la portée 'DEPARTMENT'." },
          { status: 403 }
        );
      }
    }

    const resolvedScope = audienceScope || (departmentId ? "DEPARTMENT" : "CLUB");

    // Validate host assignment: only Board or HoD of department can be host
    let targetHostId = hostId || user.id;
    if (targetHostId !== user.id) {
      const admin = getAdminClient();
      const { data: hostProfile } = await (admin as any)
        .from("profiles")
        .select("id, name, role, department_id")
        .eq("id", targetHostId)
        .single();

      if (!hostProfile) {
        return NextResponse.json({ error: "Hôte spécifié introuvable." }, { status: 400 });
      }

      const hostIsBoard =
        hostProfile.role === "PRESIDENT" ||
        hostProfile.role === "VICE_PRESIDENT" ||
        hostProfile.role === "BOARD";
      const hostIsHod =
        hostProfile.role === "HOD" && departmentId && hostProfile.department_id === departmentId;

      if (!hostIsBoard && !hostIsHod) {
        return NextResponse.json(
          { error: "Hôte non éligible : Seuls les membres du Bureau et le Responsable du Département peuvent être assignés comme hôte de session. Les membres actifs et invités ne peuvent pas héberger d'événements." },
          { status: 400 }
        );
      }
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Format de date invalide." }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: "L'heure de fin doit être postérieure à l'heure de début." }, { status: 400 });
    }

    const conflictingEvents = await checkEventConflict(location, departmentId || null, start, end);

    const generatedCode =
      (checkInCode && checkInCode.trim()) || `AST-${Math.floor(1000 + Math.random() * 9000)}`;

    let fullDescription = description || "";
    if (imageUrl) {
      fullDescription = fullDescription ? `${fullDescription}\n\n[image: ${imageUrl}]` : `[image: ${imageUrl}]`;
    }

    // 1. Create event with metadata
    const event = await createEvent({
      title: title.trim(),
      description: fullDescription,
      type,
      audience_scope: resolvedScope,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      location: location.trim(),
      department_id: departmentId || null,
      host_id: targetHostId,
      attendance_required: Boolean(attendanceRequired),
      check_in_window_start_min: Number(checkInWindowStartMin) || 15,
      check_in_window_end_min: Number(checkInWindowEndMin) || 30,
      late_threshold_min: Number(lateThresholdMin) || 10,
      check_in_status: "SCHEDULED",
      is_geofence_enabled: Boolean(isGeofenceEnabled),
      geofence_lat: geofenceLat ? Number(geofenceLat) : null,
      geofence_lng: geofenceLng ? Number(geofenceLng) : null,
      geofence_radius_m: Number(geofenceRadiusM) || 100,
      recurrence_rule: recurrenceRule || null,
      check_in_code: generatedCode,
      created_by_id: user.id,
    });

    // 2. Automatically publish linked Announcement
    let announcement: any = null;
    try {
      const formattedDate = start.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const formattedTime = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

      announcement = await createAnnouncement({
        title: `📅 [Événement] ${title.trim()}`,
        body: `Un nouvel événement **${title.trim()}** (${type}) a été programmé.\n\n📅 **Date :** ${formattedDate} à ${formattedTime}\n📍 **Lieu :** ${location.trim()}\n👥 **Audience :** ${resolvedScope}\n\n${description ? `> ${description.slice(0, 200)}...` : ""}\n\nRetrouvez cet événement dans le Calendrier pour confirmer votre présence et accéder à l'émargement QR !`,
        scope: resolvedScope,
        department_id: departmentId || null,
        author_id: user.id,
        event_id: event.id,
        is_pinned: false,
      });

      // Link announcement ID back into event metadata
      if (announcement?.id) {
        await updateEvent(event.id, { linked_announcement_id: announcement.id });
      }
    } catch (announcementErr) {
      console.warn("Could not auto-create linked announcement:", announcementErr);
    }

    // 3. Auto RSVP GOING for the creator/host
    await upsertRSVP({ event_id: event.id, user_id: user.id, status: "GOING" });
    if (targetHostId !== user.id) {
      await upsertRSVP({ event_id: event.id, user_id: targetHostId, status: "GOING" });
    }

    // 4. Audit log
    await createAuditLog({
      user_id: user.id,
      action: "EVENT_CREATED",
      details: `Created event "${title.trim()}" (${type}, ${resolvedScope}) scheduled for ${start.toLocaleDateString()} with host ${targetHostId}`,
    });

    return NextResponse.json(
      {
        event: {
          ...event,
          checkInCode: generatedCode,
          linkedAnnouncementId: announcement?.id || null,
        },
        conflictWarning: conflictingEvents.length > 0 ? conflictingEvents : null,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/events:", error);
    return NextResponse.json({ error: error?.message || "Failed to create event" }, { status: 500 });
  }
}
