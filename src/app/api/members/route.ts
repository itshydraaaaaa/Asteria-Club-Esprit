import { NextResponse } from "next/server";
import { getMembers, parseSkills } from "@/lib/supabase/queries";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const department_id = searchParams.get("departmentId") || undefined;
    const role = searchParams.get("role") || undefined;
    const status = searchParams.get("status") || undefined;

    const members = await getMembers({ search, department_id, role, status });

    const parsedMembers = members.map((m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      departmentId: m.department_id,
      departmentName: m.departments?.name ?? null,
      boardTitle: m.board_seats?.title ?? null,
      avatarUrl: m.avatar_url,
      bio: m.bio,
      skills: parseSkills(m.skills),
      status: m.status,
      freelanceReady: m.freelance_ready,
      joinDate: m.join_date,
    }));

    return NextResponse.json({ members: parsedMembers });
  } catch (error) {
    console.error("Error in /api/members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
