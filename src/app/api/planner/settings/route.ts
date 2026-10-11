import { NextResponse } from "next/server";
import { getCurrentUser, isExecutiveRole } from "@/lib/auth";
import { canAccessPlanner } from "@/lib/planner/permissions";
import {
  getPlannerSettings,
  updatePlannerSetting,
  getActivityTypes,
  getActivityTemplates,
  getAdminContacts,
  getPlannerResources,
  getEmailTemplates,
  createAdminContact,
  createPlannerResource,
  recordPlannerAuditLog,
} from "@/lib/planner/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canAccessPlanner(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      settings,
      activityTypes,
      templates,
      adminContacts,
      resources,
      emailTemplates,
    ] = await Promise.all([
      getPlannerSettings(),
      getActivityTypes(),
      getActivityTemplates(),
      getAdminContacts(),
      getPlannerResources(),
      getEmailTemplates(),
    ]);

    return NextResponse.json({
      settings,
      activityTypes,
      templates,
      adminContacts,
      resources,
      emailTemplates,
    });
  } catch (error: any) {
    console.error("Error in GET /api/planner/settings:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load planner settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isExecutiveRole(user.role)) {
      return NextResponse.json(
        { error: "Only Executive Board can modify planner configuration" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { entity, payload } = body;

    if (entity === "ADMIN_CONTACT") {
      const contact = await createAdminContact({
        office: payload.office || payload.officeCategory || "GENERAL_ADMIN",
        name: payload.name || payload.officeName || payload.recipientName || "Bureau ESPRIT",
        roleTitle: payload.roleTitle || payload.recipientName || "Responsable",
        email: payload.email,
        phone: payload.phone || null,
        notes: payload.notes || "",
      });
      await recordPlannerAuditLog({
        userId: user.id,
        action: "PLANNER_CONTACT_CREATED",
        entityType: "ADMIN_CONTACT",
        entityId: contact.id,
        details: `Created admin contact "${contact.name}" (${contact.email})`,
      });
      return NextResponse.json({ contact }, { status: 201 });
    }

    if (entity === "RESOURCE") {
      const resource = await createPlannerResource({
        name: payload.name,
        kind: payload.kind === "ROOM" || payload.category === "SPACE" ? "ROOM" : "EQUIPMENT",
        capacity: Number(payload.capacity || payload.totalQuantity || 1),
        notes: payload.notes || payload.location || "",
      });
      await recordPlannerAuditLog({
        userId: user.id,
        action: "PLANNER_RESOURCE_CREATED",
        entityType: "RESOURCE",
        entityId: resource.id,
        details: `Created resource "${resource.name}" (capacity: ${resource.capacity})`,
      });
      return NextResponse.json({ resource }, { status: 201 });
    }

    if (entity === "SETTING") {
      await updatePlannerSetting(payload.key, payload.value, user.id);

      await recordPlannerAuditLog({
        userId: user.id,
        action: "PLANNER_SETTING_UPDATED",
        entityType: "SETTING",
        details: `Updated planner setting "${payload.key}"`,
      });

      const settings = await getPlannerSettings();
      return NextResponse.json({ settings });
    }

    return NextResponse.json(
      { error: "Unsupported configuration entity" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/planner/settings:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update planner settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isExecutiveRole(user.role)) {
      return NextResponse.json(
        { error: "Only Executive Board can modify planner configuration" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { entity, id, payload } = body;
    const supabase = await createClient();

    if (entity === "ADMIN_CONTACT" && id) {
      const { data: contact, error } = await (supabase as any)
        .from("admin_contacts")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return NextResponse.json({ contact });
    }

    if (entity === "RESOURCE" && id) {
      const { data: resource, error } = await (supabase as any)
        .from("planner_resources")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return NextResponse.json({ resource });
    }

    return NextResponse.json(
      { error: "Unsupported configuration update" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error in PATCH /api/planner/settings:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update planner configuration" },
      { status: 500 }
    );
  }
}
