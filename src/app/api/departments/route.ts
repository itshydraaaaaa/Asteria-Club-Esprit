import { NextResponse } from "next/server";
import { getDepartments } from "@/lib/supabase/queries";

export async function GET() {
  try {
    const departments = await getDepartments();

    // Fetch counts for each department
    const admin = (await import("@/lib/supabase/admin")).getAdminClient();
    const depsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const [{ count: memberCount }, { count: taskCount }, { count: eventCount }] =
          await Promise.all([
            admin.from("profiles").select("*", { count: "exact", head: true }).eq("department_id", dept.id),
            admin.from("tasks").select("*", { count: "exact", head: true }).eq("department_id", dept.id),
            admin.from("events").select("*", { count: "exact", head: true }).eq("department_id", dept.id),
          ]);
        return {
          id: dept.id,
          name: (dept as any).name,
          slug: (dept as any).slug,
          description: (dept as any).description,
          icon: (dept as any).icon,
          hod: (dept as any).hod,
          _count: {
            members: memberCount || 0,
            tasks: taskCount || 0,
            events: eventCount || 0,
          },
        };
      })
    );

    return NextResponse.json({ departments: depsWithCounts });
  } catch (error) {
    console.error("Error in /api/departments:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}
