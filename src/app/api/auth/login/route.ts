import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseSkills } from "@/lib/supabase/queries";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const supabase = await createClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Fetch profile for additional data to return to client
    const admin = getAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select(`
        id, name, email, role, department_id, avatar_url, bio, skills, status, freelance_ready,
        departments:department_id (id, name),
        board_seats!board_seats_user_id_fkey (id, title)
      `)
      .eq("id", authData.user.id)
      .single();

    const p = profile as any;

    return NextResponse.json({
      success: true,
      user: p
        ? {
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role,
            departmentId: p.department_id,
            departmentName: p.departments?.name ?? null,
            boardTitle: p.board_seats?.title ?? null,
            avatarUrl: p.avatar_url ?? null,
            bio: p.bio ?? null,
            skills: parseSkills(p.skills),
            status: p.status,
            freelanceReady: p.freelance_ready,
          }
        : {
            id: authData.user.id,
            email: authData.user.email,
          },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
