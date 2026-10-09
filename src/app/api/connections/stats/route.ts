import { NextResponse } from "next/server";
import { getConnectedAccountsStats } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const isBoard =
      user.role === "PRESIDENT" ||
      user.role === "VICE_PRESIDENT" ||
      user.role === "BOARD";

    if (!isBoard) {
      return NextResponse.json(
        { error: "Interdit : Seuls les membres du Bureau peuvent consulter les statistiques globales des connexions." },
        { status: 403 }
      );
    }

    const stats = await getConnectedAccountsStats();

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error("Error in GET /api/connections/stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
