import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
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
    if (user.role !== "BOARD" && user.role !== "HOD") {
      return NextResponse.json(
        { error: "Forbidden: Only Board and HoD members can trigger member auto-onboarding" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Match department by preference
    const department = await prisma.department.findFirst({
      where: {
        name: { contains: application.departmentPreference },
      },
    });

    // Generate cryptographically random secure temporary password
    const secureTemporaryPassword = `Ast_${crypto.randomBytes(12).toString("base64url")}!`;
    const passwordHash = await bcrypt.hash(secureTemporaryPassword, 12);
    const cleanEmail = application.email.toLowerCase().trim();

    // 1. Create / Provision real Supabase Auth user via admin client
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
        // Upsert Supabase Profile
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

    // 2. Atomic database transaction for user creation, application status, and audit log
    const [newUser, updatedApp] = await prisma.$transaction(async (tx) => {
      const userRecord = await tx.user.upsert({
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

      const appRecord = await tx.application.update({
        where: { id },
        data: {
          status: "ACCEPTED",
          reviewerNotes:
            (application.reviewerNotes ? application.reviewerNotes + " | " : "") +
            `Auto-onboarded into ${department?.name || "General"} by ${user.name}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "MEMBER_ONBOARDED",
          details: `Auto-onboarded applicant ${application.name} (${cleanEmail}) into ${department?.name || "Asteria Club"}`,
        },
      });

      return [userRecord, appRecord];
    });

    return NextResponse.json({
      success: true,
      message: `Applicant ${application.name} successfully onboarded into ${department?.name || "Asteria Club"}!`,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        departmentId: newUser.departmentId,
      },
      application: updatedApp,
    });
  } catch (error) {
    console.error("Error onboarding applicant:", error);
    return NextResponse.json({ error: "Onboarding failed" }, { status: 500 });
  }
}
