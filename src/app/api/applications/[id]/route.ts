import { NextResponse } from "next/server";
import { getApplicationById, updateApplication, createAuditLog } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAcceptanceEmail, sendInterviewInvitationEmail } from "@/lib/email";
import { getAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const isAuthorized =
      user &&
      (user.role === "PRESIDENT" ||
        user.role === "VICE_PRESIDENT" ||
        user.role === "BOARD" ||
        user.role === "HOD");

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const application: any = await getApplicationById(id);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const cleanEmail = application.email.toLowerCase().trim();
    const admin = getAdminClient();

    // Match preferred department
    const { data: dept } = await (admin as any)
      .from("departments")
      .select("id, name")
      .ilike("name", `%${application.department_preference}%`)
      .single();
    const matchedDept = dept as any;
    const targetDeptName = matchedDept?.name || application.department_preference || "Asteria Club";

    // =========================================================================
    // 1. STAGE: INTERVIEW INVITATION (WAITING_FOR_INTERVIEW)
    // =========================================================================
    if (body.status === "INTERVIEW" || body.action === "INVITE_INTERVIEW" || body.status === "WAITING_FOR_INTERVIEW") {
      let secureTemporaryPassword = `Ast_${crypto.randomBytes(10).toString("base64url")}!`;
      let supabaseUserId: string | null = null;
      let existingProfile = false;

      // Check if profile already exists in DB
      const { data: existingProf } = await (admin as any)
        .from("profiles")
        .select("id, role, email")
        .eq("email", cleanEmail)
        .single();

      if (existingProf) {
        existingProfile = true;
        supabaseUserId = existingProf.id;
        // Promote/assign to WAITING_FOR_INTERVIEW
        await (admin as any).from("profiles").update({
          role: "WAITING_FOR_INTERVIEW",
          department_id: matchedDept?.id ?? null,
          status: "ACTIVE",
          updated_at: new Date().toISOString(),
        }).eq("id", existingProf.id);
      } else {
        // Provision new Supabase Auth account
        try {
          const supabaseAdmin = await createAdminClient();
          const studentEmail = application.student_email || application.studentEmail || null;
          const { data: authUser, error: authError } =
            await supabaseAdmin.auth.admin.createUser({
              email: cleanEmail,
              password: secureTemporaryPassword,
              email_confirm: true,
              user_metadata: {
                name: application.name,
                role: "WAITING_FOR_INTERVIEW",
                department_id: matchedDept?.id,
                student_email: studentEmail,
              },
            });

          if (!authError && authUser?.user) {
            supabaseUserId = authUser.user.id;
            const profileData: any = {
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
            if (studentEmail) profileData.student_email = studentEmail;

            const { error: profErr } = await (admin as any).from("profiles").upsert(profileData);
            if (profErr && studentEmail) {
              // Retry without student_email in case profiles table doesn't have the column yet
              delete profileData.student_email;
              await (admin as any).from("profiles").upsert(profileData);
            }
          }
        } catch (sbErr) {
          console.warn("Error creating Supabase user for interview:", sbErr);
        }
      }

      // Update application status to INTERVIEW
      const updatedApp = await updateApplication(id, {
        status: "INTERVIEW",
        reviewer_notes:
          body.reviewerNotes !== undefined
            ? body.reviewerNotes
            : (application.reviewer_notes ? application.reviewer_notes + " | " : "") +
              `Convoqué à l'entretien par ${user.name}`,
      });

      await createAuditLog({
        user_id: user.id,
        action: "APPLICANT_INVITED_TO_INTERVIEW",
        details: `Invited applicant ${application.name} (${cleanEmail}) to interview for ${targetDeptName} with WAITING_FOR_INTERVIEW role`,
      });

      // Dispatch interview email with credentials
      const emailResult = await sendInterviewInvitationEmail({
        toEmail: cleanEmail,
        memberName: application.name,
        departmentName: targetDeptName,
        temporaryPassword: secureTemporaryPassword,
        interviewDate: body.interviewDate,
        interviewLocation: body.interviewLocation,
      });

      await createAuditLog({
        user_id: user.id,
        action: "INTERVIEW_INVITATION_EMAIL_SENT",
        details: `Dispatched interview invitation email to ${cleanEmail} (provider: ${emailResult.provider})`,
      });

      return NextResponse.json({
        success: true,
        message: `Candidat ${application.name} convoqué à l'entretien ! Identifiants d'accès au portail (Rôle: En Attente d'Entretien) envoyés à ${cleanEmail}.`,
        application: updatedApp,
        temporaryPassword: secureTemporaryPassword,
        emailDelivery: emailResult,
      });
    }

    // =========================================================================
    // 2. STAGE: ACCEPT AS OFFICIAL MEMBER (MEMBER)
    // =========================================================================
    if (body.status === "ACCEPTED") {
      let secureTemporaryPassword = `Ast_${crypto.randomBytes(10).toString("base64url")}!`;
      let hadExistingAccount = false;

      // Check if user account was already provisioned during interview stage
      const { data: existingProf } = await (admin as any)
        .from("profiles")
        .select("id, role, email")
        .eq("email", cleanEmail)
        .single();

      if (existingProf) {
        hadExistingAccount = true;
        // Promote from WAITING_FOR_INTERVIEW to MEMBER
        await (admin as any).from("profiles").update({
          role: "MEMBER",
          department_id: matchedDept?.id ?? null,
          status: "ACTIVE",
          updated_at: new Date().toISOString(),
        }).eq("id", existingProf.id);

        try {
          const supabaseAdmin = await createAdminClient();
          await supabaseAdmin.auth.admin.updateUserById(existingProf.id, {
            user_metadata: {
              name: application.name,
              role: "MEMBER",
              department_id: matchedDept?.id,
            },
          });
        } catch (authUpdateErr) {
          console.warn("Auth metadata update warning:", authUpdateErr);
        }
      } else {
        // Direct acceptance without prior interview account
        try {
          const supabaseAdmin = await createAdminClient();
          const studentEmail = application.student_email || application.studentEmail || null;
          const { data: authUser, error: authError } =
            await supabaseAdmin.auth.admin.createUser({
              email: cleanEmail,
              password: secureTemporaryPassword,
              email_confirm: true,
              user_metadata: {
                name: application.name,
                role: "MEMBER",
                department_id: matchedDept?.id,
                student_email: studentEmail,
              },
            });

          if (!authError && authUser?.user) {
            const memberProfileData: any = {
              id: authUser.user.id,
              name: application.name,
              email: cleanEmail,
              role: "MEMBER",
              department_id: matchedDept?.id ?? null,
              bio: application.motivation,
              status: "ACTIVE",
              freelance_ready: false,
              skills: ["Junior Recruit", application.department_preference],
            };
            if (studentEmail) memberProfileData.student_email = studentEmail;

            const { error: profErr } = await (admin as any).from("profiles").upsert(memberProfileData);
            if (profErr && studentEmail) {
              delete memberProfileData.student_email;
              await (admin as any).from("profiles").upsert(memberProfileData);
            }
          }
        } catch (sbErr) {
          console.warn("Supabase Auth admin user creation error:", sbErr);
        }
      }

      // Update application status
      const updatedApp = await updateApplication(id, {
        status: "ACCEPTED",
        reviewer_notes:
          body.reviewerNotes !== undefined
            ? body.reviewerNotes
            : (application.reviewer_notes ? application.reviewer_notes + " | " : "") +
              `Promu Membre Officiel par ${user.name}`,
      });

      await createAuditLog({
        user_id: user.id,
        action: "MEMBER_ONBOARDED",
        details: `Promoted applicant ${application.name} (${cleanEmail}) to official MEMBER in ${targetDeptName}`,
      });

      // Send acceptance email
      const emailResult = await sendAcceptanceEmail({
        toEmail: cleanEmail,
        memberName: application.name,
        departmentName: targetDeptName,
        temporaryPassword: hadExistingAccount
          ? "(Conservez vos identifiants reçus lors de l'entretien)"
          : secureTemporaryPassword,
      });

      await createAuditLog({
        user_id: user.id,
        action: "MEMBER_ACCEPTANCE_EMAIL_SENT",
        details: `Dispatched member acceptance confirmation email to ${cleanEmail} for ${targetDeptName} (provider: ${emailResult.provider})`,
      });

      return NextResponse.json({
        success: true,
        message: `Candidat ${application.name} validé comme Membre Officiel d'Asteria Club ! Email de confirmation envoyé à ${cleanEmail}.`,
        application: updatedApp,
        temporaryPassword: hadExistingAccount ? undefined : secureTemporaryPassword,
        emailDelivery: emailResult,
      });
    }

    // =========================================================================
    // 3. STAGE: REJECT / DECLINE (DECLINED / REJECTED)
    // =========================================================================
    if (body.status === "REJECTED") {
      // If user had an interview account, update role to DECLINED
      const { data: existingProf } = await (admin as any)
        .from("profiles")
        .select("id, role")
        .eq("email", cleanEmail)
        .single();

      if (existingProf && existingProf.role === "WAITING_FOR_INTERVIEW") {
        await (admin as any).from("profiles").update({
          role: "DECLINED",
          status: "INACTIVE",
          updated_at: new Date().toISOString(),
        }).eq("id", existingProf.id);
      }

      const updatedApp = await updateApplication(id, {
        status: "REJECTED",
        reviewer_notes: body.reviewerNotes ?? application.reviewer_notes,
      });

      await createAuditLog({
        user_id: user.id,
        action: "APPLICANT_REJECTED",
        details: `Rejected application for ${application.name} (${cleanEmail})`,
      });

      return NextResponse.json({
        success: true,
        application: updatedApp,
        message: `Candidature de ${application.name} refusée.`,
      });
    }

    // Standard reviewer notes update
    const updateData: any = {};
    if (body.reviewerNotes !== undefined) updateData.reviewer_notes = body.reviewerNotes;

    const applicationResult = await updateApplication(id, updateData);
    return NextResponse.json({ application: applicationResult });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
