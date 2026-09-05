import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { sendAcceptanceEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
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

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // When marking an application as ACCEPTED, provision account and dispatch acceptance email
    if (body.status === "ACCEPTED") {
      const cleanEmail = application.email.toLowerCase().trim();

      const department = await prisma.department.findFirst({
        where: {
          name: { contains: application.departmentPreference },
        },
      });

      const secureTemporaryPassword = `Ast_${crypto.randomBytes(12).toString("base64url")}!`;
      const passwordHash = await bcrypt.hash(secureTemporaryPassword, 12);

      // 1. Supabase Auth user provisioning
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
              department_id: department?.id,
            },
          });

        if (!authError && authUser?.user) {
          await supabaseAdmin.from("profiles").upsert({
            id: authUser.user.id,
            name: application.name,
            email: cleanEmail,
            role: "MEMBER",
            department_id: department?.id,
            bio: application.motivation,
            status: "ACTIVE",
            freelance_ready: false,
          } as any);
        }
      } catch (sbErr) {
        console.warn("Supabase Auth admin user creation error:", sbErr);
      }

      // 2. Transaction: Upsert DB user, update application status & log audit
      const [userRecord, updatedApp] = await prisma.$transaction(async (tx) => {
        const u = await tx.user.upsert({
          where: { email: cleanEmail },
          update: {
            role: "MEMBER",
            status: "ACTIVE",
            departmentId: department?.id || null,
            bio: application.motivation,
          },
          create: {
            name: application.name,
            email: cleanEmail,
            passwordHash,
            role: "MEMBER",
            status: "ACTIVE",
            departmentId: department?.id || null,
            bio: application.motivation,
            skills: JSON.stringify(["Junior Recruit", application.departmentPreference]),
            freelanceReady: false,
          },
        });

        const app = await tx.application.update({
          where: { id },
          data: {
            status: "ACCEPTED",
            reviewerNotes:
              body.reviewerNotes !== undefined
                ? body.reviewerNotes
                : (application.reviewerNotes ? application.reviewerNotes + " | " : "") +
                  `Accepted by ${user.name}`,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: "MEMBER_ONBOARDED",
            details: `Accepted applicant ${application.name} (${cleanEmail}) into ${department?.name || "Asteria Club"}`,
          },
        });

        return [u, app];
      });

      // 3. Dispatch automated branded acceptance email with credentials
      const targetDeptName = department?.name || application.departmentPreference || "Asteria Club";
      const emailResult = await sendAcceptanceEmail({
        toEmail: cleanEmail,
        memberName: application.name,
        departmentName: targetDeptName,
        temporaryPassword: secureTemporaryPassword,
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "MEMBER_ACCEPTANCE_EMAIL_SENT",
          details: `Dispatched acceptance email to ${cleanEmail} for department ${targetDeptName} (provider: ${emailResult.provider})`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Applicant ${application.name} accepted! Login credentials sent to ${cleanEmail}.`,
        application: updatedApp,
        user: userRecord,
        temporaryPassword: secureTemporaryPassword,
        emailDelivery: emailResult,
      });
    }

    // Standard update (e.g. REJECTED or reviewerNotes change)
    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.reviewerNotes !== undefined) updateData.reviewerNotes = body.reviewerNotes;

    const applicationResult = await prisma.application.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ application: applicationResult });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
