import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    let authUser: any = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      authUser = data?.user || null;
    } catch {
      authUser = null;
    }

    if (authUser) {
      const { data: profile } = (await supabase
        .from("profiles")
        .select(`
          id,
          name,
          email,
          role,
          department_id,
          avatar_url,
          bio,
          skills,
          status,
          freelance_ready,
          join_date
        `)
        .eq("id", authUser.id)
        .single()) as any;

      if (profile) {
        let skills: string[] = [];
        try {
          skills = Array.isArray(profile.skills)
            ? (profile.skills as string[])
            : JSON.parse((profile.skills as string) || "[]");
        } catch {
          skills = [];
        }

        const userObj = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          departmentId: profile.department_id,
          departmentName: (profile as any).departments?.name || null,
          avatarUrl: profile.avatar_url,
          bio: profile.bio,
          skills,
          status: profile.status,
          freelanceReady: profile.freelance_ready,
        };

        return NextResponse.json({ user: userObj });
      }
    }

    // Fallback to local session / demo mode user if authenticated via demo cookie
    const fallbackUser = await getCurrentUser();
    if (fallbackUser) {
      return NextResponse.json({ user: fallbackUser });
    }

    return NextResponse.json({ user: null }, { status: 401 });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
