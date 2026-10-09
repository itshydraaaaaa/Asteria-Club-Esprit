import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMemberConnection } from "@/lib/supabase/queries";
import { getAdminClient } from "@/lib/supabase/admin";
import { ConnectionProvider } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const identities = user.identities || [];
    let syncedCount = 0;
    const errors: string[] = [];

    const admin = getAdminClient();

    for (const identity of identities) {
      let rawProvider = identity.provider;
      let provider: ConnectionProvider | null = null;

      if (rawProvider === "github") provider = "github";
      else if (rawProvider === "linkedin_oidc" || rawProvider === "linkedin") provider = "linkedin";
      else if (rawProvider === "discord") provider = "discord";
      else if (rawProvider === "google") provider = "google";
      else if (rawProvider === "facebook") provider = "facebook";

      if (!provider) continue; // Skip email or other non-social identities

      const data = identity.identity_data || {};
      const username =
        data.user_name ||
        data.preferred_username ||
        data.name ||
        data.full_name ||
        (data.email ? data.email.split("@")[0] : `user_${identity.id.slice(0, 6)}`);

      let profileUrl = "";
      if (provider === "github") {
        profileUrl = `https://github.com/${username}`;
      } else if (provider === "linkedin") {
        profileUrl = data.profile_url || `https://linkedin.com/in/${username}`;
      } else if (provider === "discord") {
        profileUrl = `https://discord.com/users/${identity.id}`;
      } else if (provider === "google") {
        profileUrl = data.profile_url || "https://google.com";
      } else if (provider === "facebook") {
        profileUrl = data.profile_url || (username ? `https://facebook.com/${username}` : `https://facebook.com`);
      }

      const avatarUrl = data.avatar_url || data.picture || null;

      // 1. Check if external identity is already linked to another Asteria member
      const { data: existingConflict } = await (admin as any)
        .from("member_connections")
        .select("id, user_id")
        .eq("provider", provider)
        .eq("provider_user_id", identity.id)
        .neq("user_id", user.id)
        .maybeSingle();

      if (existingConflict) {
        errors.push(
          `Le compte ${provider} (${username}) est déjà lié à un autre membre Asteria.`
        );
        continue;
      }

      try {
        await createMemberConnection({
          userId: user.id,
          provider,
          type: "oauth",
          providerUserId: identity.id,
          username,
          profileUrl,
          avatarUrl,
          isVerified: true,
          visibility: "members",
          metadata: {
            identityId: identity.id,
            email: data.email,
          },
        });
        syncedCount++;
      } catch (err: any) {
        errors.push(err.message || `Erreur de synchronisation pour ${provider}`);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error: any) {
    console.error("Error in POST /api/connections/sync:", error);
    return NextResponse.json({ error: "Échec de la synchronisation des identités" }, { status: 500 });
  }
}
