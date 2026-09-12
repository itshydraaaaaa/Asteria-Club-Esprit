/**
 * Asteria Club Esprit — Auth Utilities
 * Pure Supabase Auth — no custom JWT, no Prisma fallback.
 */
import { cookies } from "next/headers";
import { UserRole, UserSession } from "./types";
import { createClient } from "./supabase/server";
import { getAdminClient } from "./supabase/admin";
import { parseSkills } from "./supabase/queries";

// ---------------------------------------------------------------------------
// Session retrieval — Supabase Auth only
// ---------------------------------------------------------------------------

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    // Fetch profile with department and board seat
    const admin = getAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select(`
        *,
        departments:department_id (id, name, slug),
        board_seats!board_seats_user_id_fkey (id, title, order)
      `)
      .eq("id", authUser.id)
      .single();

    if (!profile) return null;

    const p = profile as any;

    return {
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role as UserRole,
      departmentId: p.department_id,
      departmentName: p.departments?.name ?? null,
      boardTitle: p.board_seats?.title ?? null,
      avatarUrl: p.avatar_url ?? null,
      bio: p.bio ?? null,
      skills: parseSkills(p.skills),
      status: p.status,
      freelanceReady: p.freelance_ready,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Role permission check
// ---------------------------------------------------------------------------

export function hasPermission(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  if (userRole === "BOARD") return true; // Board has superuser access
  return allowedRoles.includes(userRole);
}
