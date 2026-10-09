import { NextResponse } from "next/server";
import {
  updateMemberConnection,
  deleteMemberConnection,
} from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { ConnectionVisibility } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const body = await req.json();
    const { visibility, customLabel, displayOrder, username, profileUrl } = body;

    const updates: Record<string, any> = {};

    if (visibility !== undefined) {
      const allowed: ConnectionVisibility[] = ["public", "members", "private"];
      if (!allowed.includes(visibility)) {
        return NextResponse.json({ error: "Visibilité invalide." }, { status: 400 });
      }
      updates.visibility = visibility;
    }

    if (customLabel !== undefined) {
      updates.customLabel = customLabel ? customLabel.trim().slice(0, 40) : null;
    }
    if (displayOrder !== undefined) {
      updates.displayOrder = Number(displayOrder);
    }
    if (username !== undefined) {
      updates.username = username.trim();
    }
    if (profileUrl !== undefined) {
      updates.profileUrl = profileUrl.trim();
    }

    const updated = await updateMemberConnection(id, user.id, updates);

    return NextResponse.json({ success: true, connection: updated });
  } catch (error: any) {
    console.error("Error in PATCH /api/connections/[id]:", error);
    return NextResponse.json({ error: error?.message || "Échec de la modification." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: connection } = await (admin as any)
      .from("member_connections")
      .select("id, user_id, provider, type")
      .eq("id", id)
      .maybeSingle();

    if (!connection) {
      return NextResponse.json({ error: "Connexion introuvable." }, { status: 404 });
    }

    const isOwner = connection.user_id === user.id;
    const isBoard =
      user.role === "PRESIDENT" ||
      user.role === "VICE_PRESIDENT" ||
      user.role === "BOARD";

    if (!isOwner && !isBoard) {
      return NextResponse.json(
        { error: "Interdit : Vous ne pouvez pas supprimer cette connexion." },
        { status: 403 }
      );
    }

    let moderationReason: string | undefined = undefined;

    // Board moderation check
    if (!isOwner && isBoard) {
      let body: any = {};
      try {
        body = await req.json();
      } catch {
        // empty body
      }
      moderationReason = body?.reason?.trim();

      if (!moderationReason) {
        return NextResponse.json(
          { error: "Un motif obligatoire doit être renseigné pour toute action de modération du Bureau." },
          { status: 400 }
        );
      }
    }

    await deleteMemberConnection(
      id,
      connection.user_id,
      isBoard && !isOwner ? user.id : undefined,
      moderationReason
    );

    return NextResponse.json({
      success: true,
      message: isOwner
        ? "Compte dissocié avec succès."
        : "Lien modéré et retiré avec succès.",
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/connections/[id]:", error);
    return NextResponse.json({ error: error?.message || "Échec de la suppression." }, { status: 500 });
  }
}
