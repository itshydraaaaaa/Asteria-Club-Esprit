import { NextResponse } from "next/server";
import { getApplicationById, updateApplication, createAuditLog } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
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
      user.role === "PRESIDENT" ||
      user.role === "VICE_PRESIDENT" ||
      user.role === "BOARD" ||
      user.role === "HOD";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Executive Board or HoD access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const application: any = await getApplicationById(id);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    let cleanEmail = (body.newEmail || application.email).toLowerCase().trim();

    const admin = getAdminClient();

    // If admin is updating applicant's email to a Gmail address
    if (body.newEmail) {
      if (!cleanEmail.endsWith("@gmail.com")) {
        return NextResponse.json(
          { error: "L'adresse email principale doit obligatoirement se terminer par @gmail.com." },
          { status: 400 }
        );
      }

      const oldEmail = application.email.toLowerCase().trim();
      const studentEmailToSave =
        application.student_email || (oldEmail.includes("esprit") ? oldEmail : null);

      await updateApplication(id, {
        email: cleanEmail,
        student_email: studentEmailToSave,
      });

      // Update auth user if existed under old email
      const { data: oldProf } = await (admin as any)
        .from("profiles")
        .select("id")
        .eq("email", oldEmail)
        .single();

      if (oldProf) {
        await admin.auth.admin.updateUserById(oldProf.id, {
          email: cleanEmail,
          email_confirm: true,
        });
        await (admin as any)
          .from("profiles")
          .update({ email: cleanEmail, updated_at: new Date().toISOString() })
          .eq("id", oldProf.id);
      }
    }

    // Check if account already exists in profiles
    const { data: existingProf } = await (admin as any)
      .from("profiles")
      .select("id, role, email")
      .eq("email", cleanEmail)
      .single();

    let authUserId: string | null = existingProf?.id ?? null;
    const secureTemporaryPassword = `Ast_${crypto.randomBytes(8).toString("base64url")}!`;

    // Match department if needed
    const { data: dept } = await (admin as any)
      .from("departments")
      .select("id, name")
      .ilike("name", `%${application.department_preference}%`)
      .single();
    const matchedDept = dept as any;

    if (!authUserId) {
      try {
        const studentEmail = application.student_email || application.studentEmail || null;
        const targetRole = application.status === "ACCEPTED" ? "MEMBER" : "WAITING_FOR_INTERVIEW";

        const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
          email: cleanEmail,
          password: secureTemporaryPassword,
          email_confirm: true,
          user_metadata: {
            name: application.name,
            role: targetRole,
            department_id: matchedDept?.id,
            student_email: studentEmail,
          },
        });

        if (authUser?.user) {
          authUserId = authUser.user.id;
        } else if (authErr) {
          // If already exists in auth, find user by email
          const { data: userList } = await admin.auth.admin.listUsers();
          const found = userList?.users?.find(
            (u) => u.email?.toLowerCase().trim() === cleanEmail
          );
          if (found) {
            authUserId = found.id;
          }
        }

        if (authUserId) {
          const profilePayload: any = {
            id: authUserId,
            name: application.name,
            email: cleanEmail,
            role: targetRole,
            department_id: matchedDept?.id ?? null,
            bio: application.motivation,
            status: "ACTIVE",
            freelance_ready: false,
            skills: ["Applicant", application.department_preference || "Candidate"],
          };
          if (studentEmail) profilePayload.student_email = studentEmail;
          await (admin as any).from("profiles").upsert(profilePayload);
        }
      } catch (err) {
        console.warn("User provisioning warning:", err);
      }
    }

    // Update password to the new secure temporary password
    if (authUserId) {
      try {
        await admin.auth.admin.updateUserById(authUserId, {
          password: secureTemporaryPassword,
          email_confirm: true,
        });
      } catch (updateErr) {
        console.warn("Password update warning:", updateErr);
      }
    }

    // Generate recovery link
    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://asteria-club-esprit.vercel.app";
    const redirectTo = `${origin}/auth/callback?next=/auth/reset-password`;

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: cleanEmail,
      options: {
        redirectTo,
      },
    });

    if (linkErr) {
      console.error("Supabase generateLink error:", linkErr);
      return NextResponse.json(
        {
          error: `Failed to generate recovery link: ${linkErr.message}`,
          temporaryPassword: secureTemporaryPassword,
          email: cleanEmail,
        },
        { status: 500 }
      );
    }

    await createAuditLog({
      user_id: user.id,
      action: "GENERATE_RESET_LINK",
      details: `Generated password reset link for applicant ${cleanEmail}`,
    });

    return NextResponse.json({
      success: true,
      name: application.name,
      email: cleanEmail,
      department: application.department_preference || "Asteria Club",
      actionLink: linkData?.properties?.action_link,
      temporaryPassword: secureTemporaryPassword,
      stage: application.status,
    });
  } catch (error: any) {
    console.error("Reset link error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
