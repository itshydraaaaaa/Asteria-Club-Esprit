import { NextResponse } from "next/server";
import {
  getApplications,
  getApplicationByEmail,
  getApplicationByStudentEmail,
  createApplication,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";
import { sendApplicationConfirmationEmail } from "@/lib/email";

export async function GET(req: Request) {
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
    const clientIp = getClientIp(req);
    // Rate limit: Max 5 applications per hour per IP address
    const limitCheck = checkRateLimit(`apply_ip:${clientIp}`, 5, 60 * 60 * 1000);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "Too many application submissions from this IP. Please wait an hour before submitting again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      studentEmail,
      student_email,
      phone,
      departmentPreference,
      motivation,
      portfolioLink,
    } = body;

    const targetStudentEmail = (studentEmail || student_email || "").trim();

    if (!name || !email || !departmentPreference || !motivation) {
      return NextResponse.json(
        {
          error:
            "Name, personal Gmail address, department preference, and motivation are required.",
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanStudentEmail = targetStudentEmail ? targetStudentEmail.toLowerCase().trim() : null;

    // 1. Check if an application already exists for this Gmail address
    const existingGmail = await getApplicationByEmail(cleanEmail);
    if (existingGmail) {
      return NextResponse.json(
        { error: "An application with this Gmail address is already in our review pipeline." },
        { status: 409 }
      );
    }

    // 2. Check if an application already exists for this ESPRIT student email (if provided)
    if (cleanStudentEmail) {
      const existingStudent = await getApplicationByStudentEmail(cleanStudentEmail);
      if (existingStudent) {
        return NextResponse.json(
          { error: "An application with this ESPRIT student email is already in our review pipeline." },
          { status: 409 }
        );
      }
    }

    // 3. Save application in database (email = candidate Gmail, student_email = ESPRIT student email)
    const application = await createApplication({
      name,
      email: cleanEmail,
      student_email: cleanStudentEmail,
      phone: phone || null,
      department_preference: departmentPreference,
      motivation,
      portfolio_link: portfolioLink || null,
      status: "PENDING",
    });

    // 4. Dispatch automated confirmation email immediately to the applicant's Gmail
    let emailResult = null;
    try {
      emailResult = await sendApplicationConfirmationEmail({
        toEmail: cleanEmail,
        studentEmail: cleanStudentEmail || undefined,
        applicantName: name,
        departmentName: departmentPreference,
      });
    } catch (mailErr) {
      console.warn("Failed to dispatch application confirmation email to Gmail:", mailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Application submitted successfully! A confirmation email has been dispatched to your Gmail.",
        application,
        emailDelivery: emailResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json({ error: "Application submission failed" }, { status: 500 });
  }
}
