import { NextResponse } from "next/server";
import { getDepartmentById, parseSkills } from "@/lib/supabase/queries";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dept = await getDepartmentById(id);

    if (!dept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const admin = getAdminClient();

    // Fetch members, tasks, events, announcements in parallel
    const [membersRes, tasksRes, eventsRes, announcementsRes] = await Promise.all([
      admin
        .from("profiles")
        .select("id, name, email, role, avatar_url, bio, skills, status, freelance_ready, join_date, department_id")
        .eq("department_id", id)
        .order("role", { ascending: true })
        .order("name", { ascending: true }),
      admin
        .from("tasks")
        .select(`
          *,
          assignee:assignee_id (id, name, email, avatar_url),
          created_by:created_by_id (id, name)
        `)
        .eq("department_id", id)
        .order("created_at", { ascending: false }),
      admin
        .from("events")
        .select("*")
        .eq("department_id", id)
        .gte("start_time", new Date(Date.now() - 86400000).toISOString())
        .order("start_time", { ascending: true }),
      admin
        .from("announcements")
        .select(`
          *,
          author:author_id (id, name, role, avatar_url)
        `)
        .eq("department_id", id)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    const members = (membersRes.data || []).map((m: any) => ({
      ...m,
      skills: parseSkills(m.skills),
    }));

    return NextResponse.json({
      department: {
        ...dept,
        hod: dept.hod ? { ...dept.hod, skills: parseSkills(dept.hod.skills) } : null,
        members,
        tasks: tasksRes.data || [],
        events: eventsRes.data || [],
        announcements: announcementsRes.data || [],
      },
    });
  } catch (error) {
    console.error("Error in /api/departments/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch department" }, { status: 500 });
  }
}
