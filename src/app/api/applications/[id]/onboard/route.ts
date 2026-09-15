import { NextResponse } from "next/server";
import { getApplicationById, updateApplication, createAuditLog } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAcceptanceEmail } from "@/lib/email";
import { getAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isAuthorized =
      user.role === "BOARD" ||
      user.role === "PRESIDENT" ||
      user.role === "VICE_PRESIDENT" ||
      user.role === "HOD";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Executive Board or HoD access required to onboard applicants" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const application: any = await getApplicationById(id);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const admin = getAdminClient();
    const { data: dept } = await (admin as any)
      .from("departments")
      .select("id, name")
      .ilike("name", `%${application.department_preference}%`)
      .single();

    const matchedDept = dept as any;
    const cleanEmail = application.email.toLowerCase().trim();
    const secureTemporaryPassword = `Ast_${crypto.randomBytes(12).toString("base64url")}!`;

    // 1. Create Supabase Auth user via admin client
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
            role: "WAITING_FOR_INTERVIEW",
            department_id: matchedDept?.id,
          },
        });

      if (!authError && authUser?.user) {
        supabaseUserId = authUser.user.id;
        
        // Attempt native WAITING_FOR_INTERVIEW role upsert
        const profilePayload: any = {
          id: authUser.user.id,
          name: application.name,
          email: cleanEmail,
          role: "WAITING_FOR_INTERVIEW",
          department_id: matchedDept?.id ?? null,
          bio: application.motivation,
          status: "ACTIVE",
          freelance_ready: false,
          skills: ["Applicant", application.department_preference || "Candidate"],
        };

        const { error: upsertErr } = await (admin as any)
          .from("profiles")
          .upsert(profilePayload);

        // Fallback for when database check constraint has not yet been altered via migration script
        if (upsertErr) {
          console.warn("WAITING_FOR_INTERVIEW constraint fallback triggered:", upsertErr.message);
          profilePayload.role = "APPLICANT";
          profilePayload.bio = `[WAITING_FOR_INTERVIEW] ${application.motivation || ""}`;
          await (admin as any).from("profiles").upsert(profilePayload);
        }
      }
    } catch (sbErr) {
      console.warn("Supabase Auth admin user creation error:", sbErr);
    }

    // 2. Update application status
    const updatedApp = await updateApplication(id, {
      status: "ACCEPTED",
      reviewer_notes:
        (application.reviewer_notes ? application.reviewer_notes + " | " : "") +
        `Auto-onboarded into ${matchedDept?.name || "General"} by ${user.name}`,
    });

    await createAuditLog({
      user_id: user.id,
      action: "MEMBER_ONBOARDED",
      details: `Auto-onboarded applicant ${application.name} (${cleanEmail}) into ${matchedDept?.name || "Asteria Club"}`,
    });

    // 3. Dispatch acceptance email
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

    // NOTE: temporaryPassword is NOT returned in the response — only sent to the applicant's email
    return NextResponse.json({
      success: true,
      message: `Applicant ${application.name} successfully onboarded into ${targetDeptName}! Acceptance email sent to ${cleanEmail}.`,
      application: updatedApp,
      emailDelivery: emailResult,
    });
  } catch (error) {
    console.error("Error onboarding applicant:", error);
    return NextResponse.json({ error: "Onboarding failed" }, { status: 500 });
  }
}
