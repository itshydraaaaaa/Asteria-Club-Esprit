import { NextResponse } from "next/server";
import { getApplications, getApplicationByEmail, createApplication, countApplications } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "BOARD" && user.role !== "HOD")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department") || undefined;
    const status = searchParams.get("status") || undefined;

    const applications = await getApplications({ department, status });
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error in GET /api/applications:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, departmentPreference, motivation, portfolioLink } = body;

    if (!name || !email || !departmentPreference || !motivation) {
      return NextResponse.json(
        { error: "Name, email, department preference, and motivation are required" },
        { status: 400 }
      );
    }

    // Check if an application already exists for this email
    const existing = await getApplicationByEmail(email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json(
        { error: "An application with this email address is already in our review pipeline." },
        { status: 409 }
      );
    }

    const application = await createApplication({
      name,
      email: email.toLowerCase().trim(),
      phone: phone || null,
      department_preference: departmentPreference,
      motivation,
      portfolio_link: portfolioLink || null,
      status: "PENDING",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully! Our Board and Heads of Department will review your profile.",
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json({ error: "Application submission failed" }, { status: 500 });
  }
}
