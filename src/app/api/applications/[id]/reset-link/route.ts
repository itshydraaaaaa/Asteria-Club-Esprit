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
        try {
          await admin.auth.admin.updateUserById(oldProf.id, {
            email: cleanEmail,
            email_confirm: true,
          });
          await (admin as any)
            .from("profiles")
            .update({ email: cleanEmail, updated_at: new Date().toISOString() })
            .eq("id", oldProf.id);
        } catch (e) {
          console.warn("Could not rename old auth account:", e);
        }
      }
    }

    // Match department if needed
    const { data: dept } = await (admin as any)
      .from("departments")
      .select("id, name")
      .ilike("name", `%${application.department_preference}%`)
      .single();
    const matchedDept = dept as any;

    const secureTemporaryPassword = `Ast_${crypto.randomBytes(8).toString("base64url")}!`;
    const studentEmail = application.student_email || application.studentEmail || null;
    const targetRole = application.status === "ACCEPTED" ? "MEMBER" : "WAITING_FOR_INTERVIEW";

    let authUserId: string | null = null;

    // Check if account already exists in profiles
    const { data: existingProf } = await (admin as any)
      .from("profiles")
      .select("id, role, email")
      .eq("email", cleanEmail)
      .single();

    if (existingProf) {
      authUserId = existingProf.id;
    }

    // Provision or verify auth user
    try {
      const { data: authUser, error: createAuthErr } = await admin.auth.admin.createUser({
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
      }
    } catch (createErr) {
      console.warn("Notice: createUser attempt completed:", createErr);
    }

    // If auth user exists, sync password
    if (authUserId) {
      try {
        await admin.auth.admin.updateUserById(authUserId, {
          password: secureTemporaryPassword,
          email_confirm: true,
        });
      } catch (updateErr) {
        console.warn("Password sync warning:", updateErr);
      }
    }

    // Generate redirect link
    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://asteria-club-esprit.vercel.app";
    const redirectTo = `${origin}/auth/callback?next=/auth/reset-password`;

    let actionLink: string | null = null;

    // Strategy 1: Recovery link
    try {
      const recRes = await admin.auth.admin.generateLink({
        type: "recovery",
        email: cleanEmail,
        options: { redirectTo },
      });
      if (recRes.data?.properties?.action_link) {
        actionLink = recRes.data.properties.action_link;
        if (recRes.data.user?.id) authUserId = recRes.data.user.id;
      }
    } catch {}

    // Strategy 2: Invite link (auto-creates / activates user if missing)
    if (!actionLink) {
      try {
        const invRes = await admin.auth.admin.generateLink({
          type: "invite",
          email: cleanEmail,
          options: { redirectTo },
        });
        if (invRes.data?.properties?.action_link) {
          actionLink = invRes.data.properties.action_link;
          if (invRes.data.user?.id) authUserId = invRes.data.user.id;
        }
      } catch {}
    }

    // Strategy 3: Magic link
    if (!actionLink) {
      try {
        const magRes = await admin.auth.admin.generateLink({
          type: "magiclink",
          email: cleanEmail,
          options: { redirectTo },
        });
        if (magRes.data?.properties?.action_link) {
          actionLink = magRes.data.properties.action_link;
          if (magRes.data.user?.id) authUserId = magRes.data.user.id;
        }
      } catch {}
    }

    // Sync profile if authUserId resolved
    if (authUserId) {
      try {
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
      } catch (upsertErr) {
        console.warn("Profile upsert warning:", upsertErr);
      }
    }

    if (!actionLink) {
      return NextResponse.json(
        {
          error: "Impossible de générer le lien de réinitialisation. Veuillez vérifier que l'adresse email est valide.",
          temporaryPassword: secureTemporaryPassword,
          email: cleanEmail,
        },
        { status: 500 }
      );
    }

    await createAuditLog({
      user_id: user.id,
      action: "GENERATE_RESET_LINK",
      details: `Generated access link for applicant ${cleanEmail}`,
    });

    return NextResponse.json({
      success: true,
      name: application.name,
      email: cleanEmail,
      department: application.department_preference || "Asteria Club",
      actionLink,
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
