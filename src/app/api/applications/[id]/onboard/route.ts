import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "BOARD") {
      return NextResponse.json(
        { error: "Only Board members can trigger member auto-onboarding" },
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

    // Match department
    const department = await prisma.department.findFirst({
      where: {
        name: { contains: application.departmentPreference },
      },
    });

    const defaultPassword = "password123";
    const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);
    const cleanEmail = application.email.toLowerCase().trim();

    // 1. Create / Provision real Supabase Auth user
    try {
      if (supabaseAdmin) {
        const { data: authUser, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: defaultPassword,
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
          });
        }
      }
    } catch (sbErr) {
      console.warn("Supabase Auth admin user creation error:", sbErr);
    }

    // 2. Create or update local user
    const newUser = await prisma.user.upsert({
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
        passwordHash: defaultPasswordHash,
        role: "MEMBER",
        status: "ACTIVE",
        departmentId: department?.id || null,
        bio: application.motivation,
        skills: JSON.stringify(["Junior Recruit", application.departmentPreference]),
        freelanceReady: false,
      },
    });

    // Mark application as accepted
    const updatedApp = await prisma.application.update({
      where: { id },
      data: {
        status: "ACCEPTED",
        reviewerNotes:
          (application.reviewerNotes ? application.reviewerNotes + " | " : "") +
          `Auto-onboarded into ${department?.name || "General"} by ${user.name}`,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "MEMBER_ONBOARDED",
        details: `Auto-onboarded applicant ${application.name} (${cleanEmail}) into ${department?.name || "Asteria Club"}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Applicant ${application.name} successfully onboarded into ${department?.name}!`,
      user: newUser,
      application: updatedApp,
    });
  } catch (error) {
    console.error("Error onboarding applicant:", error);
    return NextResponse.json({ error: "Onboarding failed" }, { status: 500 });
  }
}
