import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { createAuditLog } from "@/lib/supabase/queries";

export async function POST(req: Request) {
  try {
    const admin = getAdminClient();
    const body = await req.json().catch(() => ({}));
    const { password, email } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit comporter au moins 6 caractères." },
        { status: 400 }
      );
    }

    if (!email || !email.toLowerCase().trim().endsWith("@gmail.com")) {
      return NextResponse.json(
        {
          error:
            "Une adresse personnelle Gmail valide (@gmail.com) est obligatoire pour activer votre compte et recevoir vos notifications.",
        },
        { status: 400 }
      );
    }

    const cleanGmail = email.toLowerCase().trim();

    // 1. Identify user from either Bearer token or SSR session cookie
    let userId: string | null = null;
    let oldEmail: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const { data: { user: bearerUser } } = await admin.auth.getUser(token);
      if (bearerUser) {
        userId = bearerUser.id;
        oldEmail = bearerUser.email?.toLowerCase().trim() || null;
      }
    }

    if (!userId) {
      const supabase = await createClient();
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (sessionUser) {
        userId = sessionUser.id;
        oldEmail = sessionUser.email?.toLowerCase().trim() || null;
      }
    }

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Session expirée ou lien invalide. Veuillez rouvrir le lien direct d'accès fourni par l'administrateur.",
        },
        { status: 401 }
      );
    }

    // 2. Update password and primary email in Supabase Auth via admin privileges (auto-confirmed)
    const { error: updateAuthErr } = await admin.auth.admin.updateUserById(userId, {
      email: cleanGmail,
      password: password,
      email_confirm: true,
    });

    if (updateAuthErr) {
      return NextResponse.json(
        { error: `Impossible de mettre à jour le compte: ${updateAuthErr.message}` },
        { status: 500 }
      );
    }

    // 3. Update profiles table
    const profileUpdates: any = {
      email: cleanGmail,
      updated_at: new Date().toISOString(),
    };
    if (oldEmail && oldEmail.includes("esprit") && oldEmail !== cleanGmail) {
      profileUpdates.student_email = oldEmail;
    }

    await (admin as any)
      .from("profiles")
      .update(profileUpdates)
      .eq("id", userId);

    // 4. Update applications table if an application corresponds to this user
    if (oldEmail) {
      const { data: matchingApp } = await (admin as any)
        .from("applications")
        .select("id, student_email")
        .or(`email.eq.${oldEmail},email.eq.${cleanGmail}`)
        .limit(1)
        .single();

      if (matchingApp) {
        const appUpdates: any = {
          email: cleanGmail,
          updated_at: new Date().toISOString(),
        };
        if (oldEmail.includes("esprit")) {
          appUpdates.student_email = oldEmail;
        }
        await (admin as any)
          .from("applications")
          .update(appUpdates)
          .eq("id", matchingApp.id);
      }
    }

    await createAuditLog({
      user_id: userId,
      action: "USER_SELF_RESET_PASSWORD_AND_GMAIL",
      details: `User updated password and confirmed primary Gmail: ${cleanGmail} (previous: ${oldEmail})`,
    });

    return NextResponse.json({
      success: true,
      message: "Votre mot de passe et votre adresse Gmail ont été configurés avec succès !",
      email: cleanGmail,
    });
  } catch (error: any) {
    console.error("Error in POST /api/auth/reset-password:", error);
    return NextResponse.json(
      { error: error?.message || "Une erreur est survenue lors de la mise à jour." },
      { status: 500 }
    );
  }
}
