import { NextResponse } from "next/server";
import {
  getMemberConnections,
  createMemberConnection,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { validateAndNormalizeSocialLink } from "@/lib/connections-validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { ConnectionProvider, ConnectionVisibility } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId") || user?.id;

    if (!targetUserId) {
      return NextResponse.json({ connections: [] });
    }

    const connections = await getMemberConnections(targetUserId, user?.id || null);

    return NextResponse.json({ connections });
  } catch (error: any) {
    console.error("Error in GET /api/connections:", error);
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non autorisé : Veuillez vous connecter pour ajouter un lien." },
        { status: 401 }
      );
    }

    const clientIp = getClientIp(req);
    const rate = checkRateLimit(`conn_add:${user.id}_${clientIp}`, 15, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Trop de requêtes. Veuillez patienter ${rate.resetInSeconds}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { provider, url, customLabel, visibility = "members" } = body;

    if (!provider || !url) {
      return NextResponse.json(
        { error: "La plateforme et le lien ou identifiant sont obligatoires." },
        { status: 400 }
      );
    }

    // Validate visibility choice
    const allowedVisibilities: ConnectionVisibility[] = ["public", "members", "private"];
    if (!allowedVisibilities.includes(visibility)) {
      return NextResponse.json({ error: "Niveau de visibilité invalide." }, { status: 400 });
    }

    // Validate & normalize URL or handle
    const validation = validateAndNormalizeSocialLink(
      provider as ConnectionProvider,
      url,
      customLabel
    );

    if (!validation.valid || !validation.normalizedUrl) {
      return NextResponse.json({ error: validation.error || "Lien invalide." }, { status: 400 });
    }

    const connection = await createMemberConnection({
      userId: user.id,
      provider: provider as ConnectionProvider,
      type: "manual",
      username: validation.extractedUsername || url,
      profileUrl: validation.normalizedUrl,
      customLabel: customLabel ? customLabel.trim().slice(0, 40) : null,
      isVerified: false,
      visibility,
    });

    return NextResponse.json({ success: true, connection }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/connections:", error);
    return NextResponse.json(
      { error: error?.message || "Échec de l'ajout du lien social." },
      { status: 500 }
    );
  }
}
