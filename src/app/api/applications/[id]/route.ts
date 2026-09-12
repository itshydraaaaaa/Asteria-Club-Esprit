import { NextResponse } from "next/server";
import { getApplicationById, updateApplication, createAuditLog } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAcceptanceEmail } from "@/lib/email";
import { getAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "BOARD" && user.role !== "HOD")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const application: any = await getApplicationById(id);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // When marking as ACCEPTED — provision Supabase Auth account + profile
    if (body.status === "ACCEPTED") {
      const cleanEmail = application.email.toLowerCase().trim();

      // Find matching department
      const admin = getAdminClient();
      const { data: dept } = await (admin as any)
        .from("departments")
        .select("id, name")
        .ilike("name", `%${application.department_preference}%`)
        .single();

      const matchedDept = dept as any;
      const secureTemporaryPassword = `Ast_${crypto.randomBytes(12).toString("base64url")}!`;

      // 1. Supabase Auth user provisioning
      let supabaseUserId: string | null = null;
      try {
        const supabaseAdmin = await createAdminClient();
        const { data: authUser, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: secureTemporaryPassword,
            email_confirm: true,
            user_metadata: {
              name: application.name,
              role: "MEMBER",
              department_id: matchedDept?.id,
            },
          });

        if (!authError && authUser?.user) {
          supabaseUserId = authUser.user.id;
          // Upsert profile in Supabase
          await (admin as any).from("profiles").upsert({
            id: authUser.user.id,
            name: application.name,
            email: cleanEmail,
            role: "MEMBER",
            department_id: matchedDept?.id ?? null,
            bio: application.motivation,
            status: "ACTIVE",
            freelance_ready: false,
            skills: ["Junior Recruit", application.department_preference],
          });
        }
      } catch (sbErr) {
        console.warn("Supabase Auth admin user creation error:", sbErr);
      }

      // 2. Update application status
      const updatedApp = await updateApplication(id, {
        status: "ACCEPTED",
        reviewer_notes:
          body.reviewerNotes !== undefined
            ? body.reviewerNotes
            : (application.reviewer_notes ? application.reviewer_notes + " | " : "") +
              `Accepted by ${user.name}`,
      });

      await createAuditLog({
        user_id: user.id,
        action: "MEMBER_ONBOARDED",
        details: `Accepted applicant ${application.name} (${cleanEmail}) into ${matchedDept?.name || "Asteria Club"}`,
      });

      // 3. Send acceptance email
      const targetDeptName = matchedDept?.name || application.department_preference || "Asteria Club";
      const emailResult = await sendAcceptanceEmail({
        toEmail: cleanEmail,
        memberName: application.name,
        departmentName: targetDeptName,
        temporaryPassword: secureTemporaryPassword,
      });

      await createAuditLog({
        user_id: user.id,
        action: "MEMBER_ACCEPTANCE_EMAIL_SENT",
        details: `Dispatched acceptance email to ${cleanEmail} for department ${targetDeptName} (provider: ${emailResult.provider})`,
      });

      // NOTE: temporaryPassword is NOT returned in the API response — it is only sent via email
      return NextResponse.json({
        success: true,
        message: `Applicant ${application.name} accepted! Login credentials sent to ${cleanEmail}.`,
        application: updatedApp,
        emailDelivery: emailResult,
      });
    }

    // Standard update (REJECTED or reviewerNotes change)
    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.reviewerNotes !== undefined) updateData.reviewer_notes = body.reviewerNotes;

    const applicationResult = await updateApplication(id, updateData);
    return NextResponse.json({ application: applicationResult });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
