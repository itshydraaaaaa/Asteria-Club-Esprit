import { NextResponse } from "next/server";
import { countActiveMembers, countDepartments, countTasks, getDepartmentsWithCounts } from "@/lib/supabase/queries";

export async function GET() {
  try {
    const [totalMembers, totalDepartments, totalTasks, completedTasks, departments] = await Promise.all([
      countActiveMembers(),
      countDepartments(),
      countTasks(),
      countTasks({ status: "DONE" }),
      getDepartmentsWithCounts(),
    ]);

    const sprintVelocity =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    return NextResponse.json({
      totalMembers,
      totalDepartments,
      sprintVelocity,
      totalTasks,
      completedTasks,
      departments,
    });
  } catch (error) {
    console.error("Error fetching public stats:", error);
    return NextResponse.json({
      totalMembers: 0,
      totalDepartments: 0,
      sprintVelocity: 0,
      totalTasks: 0,
      completedTasks: 0,
      departments: [],
    });
  }
}
