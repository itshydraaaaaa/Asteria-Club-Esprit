import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  canViewActivityWorkspace,
  canEditActivity,
} from "@/lib/planner/permissions";
import {
  getActivityById,
  getActivityEmails,
  getActivityRequirements,
  createActivityEmail,
  updateActivityEmail,
  deleteActivityEmail,
  getEmailTemplates,
  getAdminContacts,
  recordPlannerAuditLog,
} from "@/lib/planner/queries";
import { renderEmailTemplate } from "@/lib/planner/logic";
import { createNotification } from "@/lib/notifications";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const activity = await getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!canViewActivityWorkspace(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [emails, emailTemplates, adminContacts] = await Promise.all([
      getActivityEmails(id),
      getEmailTemplates(),
      getAdminContacts(),
    ]);

    return NextResponse.json({
      emails: emails.map((e) => ({
        ...e,
        adminContactId: e.contactId,
        adminContact: e.contact
          ? {
              ...e.contact,
              officeName: e.contact.name,
              officeCategory: e.contact.office,
            }
          : null,
        language: "fr",
        renderedSubject: e.subject,
        renderedBody: e.body,
        replySummary: e.replyNotes,
        ccEmails: e.ccEmails ? e.ccEmails.split(",") : [],
      })),
      emailTemplates: emailTemplates.map((et) => ({
        ...et,
        name: `${et.office} (${et.language})`,
        category: et.office,
      })),
      adminContacts: adminContacts.map((c) => ({
        ...c,
        officeName: c.name,
        officeCategory: c.office,
        recipientName: c.roleTitle,
      })),
    });
  } catch (error: any) {
    console.error("Error in GET /api/planner/activities/[id]/emails:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load activity emails" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const activity = await getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!canEditActivity(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      adminContactId,
      contactId,
      office,
      recipientEmail,
      ccEmails,
      renderedSubject,
      subject,
      renderedBody,
      body: rawBody,
      status,
      replySummary,
      replyNotes,
    } = body;

    const [existingEmails, adminContacts] = await Promise.all([
      getActivityEmails(id),
      getAdminContacts(),
    ]);

    const targetOffice = office || "STUDENT_LIFE";
    const selectedContact =
      adminContactId || contactId
        ? adminContacts.find((c) => c.id === (adminContactId || contactId))
        : adminContacts.find((c) => c.office === targetOffice);

    // If an email tracker for this office already exists, update its status/notes instead of duplicating
    const existingForOffice = existingEmails.find(
      (e) => e.office === targetOffice
    );
    if (existingForOffice && !rawBody && !renderedBody) {
      const nextStatus = status || existingForOffice.status;
      const updates: Record<string, any> = {
        status: nextStatus,
        updated_at: new Date().toISOString(),
      };
      if (nextStatus === "SENT" && !existingForOffice.sentAt) {
        updates.sent_at = new Date().toISOString();
      }
      if (
        (nextStatus === "REPLIED" || nextStatus === "APPROVED") &&
        !existingForOffice.repliedAt
      ) {
        updates.replied_at = new Date().toISOString();
      }
      if (replySummary !== undefined || replyNotes !== undefined) {
        updates.reply_notes = replySummary ?? replyNotes ?? null;
      }

      const updated = await updateActivityEmail(existingForOffice.id, updates);
      return NextResponse.json({
        email: {
          ...updated,
          adminContactId: updated.contactId,
          renderedSubject: updated.subject,
          renderedBody: updated.body,
          replySummary: updated.replyNotes,
        },
      });
    }

    const finalSubject =
      renderedSubject ||
      subject ||
      `[Asteria Club Esprit] ${activity.title}`;
    const finalBody = renderedBody || rawBody || "Suivi de courrier administratif ESPRIT";

    const emailRecord = await createActivityEmail({
      activityId: id,
      templateId: null,
      contactId: selectedContact?.id || null,
      office: targetOffice,
      recipientEmail: recipientEmail || selectedContact?.email || null,
      ccEmails: Array.isArray(ccEmails)
        ? ccEmails.join(", ")
        : ccEmails || "zied.saidi@esprit.tn, faycal.lbabda@esprit.tn",
      subject: finalSubject,
      body: finalBody,
      status: status || "DRAFT",
    });

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_EMAIL_TRACKED",
      entityType: "ACTIVITY_EMAIL",
      entityId: emailRecord.id,
      details: `Tracked ESPRIT administrative email (${targetOffice}) for "${activity.title}"`,
    });

    return NextResponse.json(
      {
        email: {
          ...emailRecord,
          adminContactId: emailRecord.contactId,
          renderedSubject: emailRecord.subject,
          renderedBody: emailRecord.body,
          replySummary: emailRecord.replyNotes,
          language: "fr",
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/planner/activities/[id]/emails:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create email draft" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const activity = await getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!canEditActivity(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      emailId,
      adminContactId,
      contactId,
      recipientEmail,
      ccEmails,
      renderedSubject,
      subject,
      renderedBody,
      body: rawBody,
      status,
      replySummary,
      replyNotes,
    } = body;

    if (!emailId) {
      return NextResponse.json({ error: "emailId is required" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const dbUpdates: Record<string, unknown> = {};
    if (adminContactId !== undefined || contactId !== undefined) {
      dbUpdates.contact_id = adminContactId ?? contactId ?? null;
    }
    if (recipientEmail !== undefined)
      dbUpdates.recipient_email = recipientEmail || null;
    if (ccEmails !== undefined) {
      dbUpdates.cc_emails = Array.isArray(ccEmails)
        ? ccEmails.join(",")
        : ccEmails;
    }
    if (renderedSubject !== undefined || subject !== undefined) {
      dbUpdates.subject = renderedSubject ?? subject;
    }
    if (renderedBody !== undefined || rawBody !== undefined) {
      dbUpdates.body = renderedBody ?? rawBody;
    }
    if (status !== undefined) dbUpdates.status = status;
    if (replySummary !== undefined || replyNotes !== undefined) {
      dbUpdates.reply_notes = replySummary ?? replyNotes;
    }

    if (status === "SENT") {
      dbUpdates.sent_at = nowIso;
    } else if (
      status === "REPLIED" ||
      status === "APPROVED" ||
      status === "REJECTED"
    ) {
      dbUpdates.replied_at = nowIso;
    }

    const updatedEmail = await updateActivityEmail(emailId, dbUpdates);

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_EMAIL_UPDATED",
      entityType: "ACTIVITY_EMAIL",
      entityId: updatedEmail.id,
      details: `Updated admin email "${updatedEmail.subject}" (status: ${updatedEmail.status}) on "${activity.title}"`,
    });

    if (
      status &&
      ["REPLIED", "APPROVED", "REJECTED"].includes(status) &&
      activity.ownerId &&
      activity.ownerId !== user.id
    ) {
      await createNotification({
        userId: activity.ownerId,
        title: `Réponse administrative (${status}) : ${activity.title}`,
        body: `L'email administratif "${updatedEmail.subject}" a été marqué comme ${status}.`,
        type: "ADMIN_EMAIL_STATUS",
        link: `/planner/activities/${id}`,
      });
    }

    return NextResponse.json({
      email: {
        ...updatedEmail,
        adminContactId: updatedEmail.contactId,
        renderedSubject: updatedEmail.subject,
        renderedBody: updatedEmail.body,
        replySummary: updatedEmail.replyNotes,
      },
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/planner/activities/[id]/emails:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update email" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const activity = await getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!canEditActivity(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let emailId = searchParams.get("emailId");
    if (!emailId) {
      try {
        const body = await req.json();
        emailId = body.emailId;
      } catch {
        // ignore
      }
    }
    if (!emailId) {
      return NextResponse.json({ error: "emailId is required" }, { status: 400 });
    }

    await deleteActivityEmail(emailId);

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_EMAIL_DELETED",
      entityType: "ACTIVITY_EMAIL",
      entityId: emailId,
      details: `Deleted admin email ${emailId} from "${activity.title}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/planner/activities/[id]/emails:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete email" },
      { status: 500 }
    );
  }
}
