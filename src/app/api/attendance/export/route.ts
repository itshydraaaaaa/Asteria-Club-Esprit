import { NextResponse } from "next/server";
import { getEventById, getAttendanceRecords } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    const isLeadership =
      user.role === "PRESIDENT" ||
      user.role === "VICE_PRESIDENT" ||
      user.role === "BOARD";
    const isHod = user.role === "HOD";

    if (!eventId) {
      // Club-wide or Dept export
      if (!isLeadership && !isHod) {
        return NextResponse.json(
          { error: "Interdit : Seuls les responsables peuvent exporter les listes d'émargement." },
          { status: 403 }
        );
      }

      const records = await getAttendanceRecords({});
      const filtered = isHod && !isLeadership
        ? records.filter((r: any) => r.user?.departmentId === user.departmentId)
        : records;

      const header = ["Nom", "Email", "Département", "Rôle", "Événement", "Date", "Statut", "Heure Pointage", "Méthode", "Motif / Justification"];
      const rows = filtered.map((r: any) => [
        `"${(r.user?.name || "").replace(/"/g, '""')}"`,
        `"${(r.user?.email || "").replace(/"/g, '""')}"`,
        `"${(r.user?.departments?.name || "").replace(/"/g, '""')}"`,
        `"${r.user?.role || ""}"`,
        `"${(r.events?.title || "").replace(/"/g, '""')}"`,
        `"${r.events?.startTime ? new Date(r.events.startTime).toLocaleDateString("fr-FR") : ""}"`,
        `"${r.status || ""}"`,
        `"${r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString("fr-FR") : ""}"`,
        `"${r.method || ""}"`,
        `"${(r.justification || r.manualReason || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = "\uFEFF" + [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="emargement_global_${Date.now()}.csv"`,
        },
      });
    }

    // Specific event export
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
    }

    const isHost = event.hostId === user.id || event.createdById === user.id;
    const isDeptHod = isHod && user.departmentId === event.departmentId;

    if (!isLeadership && !isHost && !isDeptHod) {
      return NextResponse.json(
        { error: "Interdit : Vous n'avez pas l'autorisation d'exporter cette liste." },
        { status: 403 }
      );
    }

    const records = event.attendanceRecords || [];
    const cleanEventTitle = event.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);

    const header = [
      "Nom du Membre",
      "Email",
      "Rôle",
      "Département",
      "Statut Émargement",
      "Heure de Pointage",
      "Méthode",
      "Justification / Motif",
    ];

    const rows = records.map((r: any) => [
      `"${(r.user?.name || "").replace(/"/g, '""')}"`,
      `"${(r.user?.email || "").replace(/"/g, '""')}"`,
      `"${r.user?.role || ""}"`,
      `"${(r.user?.department?.name || r.user?.departmentId || "").replace(/"/g, '""')}"`,
      `"${r.status || ""}"`,
      `"${r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString("fr-FR") : ""}"`,
      `"${r.method || ""}"`,
      `"${(r.justification || r.manualReason || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [header.join(","), ...rows.map((row: string[]) => row.join(","))].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="emargement_${cleanEventTitle}_${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/attendance/export:", error);
    return NextResponse.json({ error: "Failed to export attendance CSV" }, { status: 500 });
  }
}
