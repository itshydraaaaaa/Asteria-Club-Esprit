import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "BOARD") {
      return NextResponse.json({ error: "Only Board members can trigger member auto-onboarding" }, { status: 403 });
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

    // Create user account or update existing applicant account
    const defaultPasswordHash = await bcrypt.hash("password123", 10);

    const newUser = await prisma.user.upsert({
      where: { email: application.email.toLowerCase().trim() },
      update: {
        role: "MEMBER",
        status: "ACTIVE",
        departmentId: department?.id || null,
        bio: application.motivation,
      },
      create: {
        name: application.name,
        email: application.email.toLowerCase().trim(),
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
        reviewerNotes: (application.reviewerNotes ? application.reviewerNotes + " | " : "") + `Auto-onboarded into ${department?.name || "General"} by ${user.name}`,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "MEMBER_ONBOARDED",
        details: `Auto-onboarded applicant ${application.name} (${application.email}) into ${department?.name || "Asteria Club"}`,
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
