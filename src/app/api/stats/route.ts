import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [totalMembers, departments, totalTasks, completedTasks] = await Promise.all([
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.department.findMany({
        include: {
          _count: {
            select: { members: true, tasks: true, events: true },
          },
        },
      }),
      prisma.task.count(),
      prisma.task.count({ where: { status: "DONE" } }),
    ]);

    const sprintVelocity =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    return NextResponse.json({
      totalMembers,
      totalDepartments: departments.length,
      sprintVelocity,
      totalTasks,
      completedTasks,
      departments,
    });
  } catch (error) {
    console.error("Error fetching public stats:", error);
    return NextResponse.json({
      totalMembers: 0,
      totalDepartments: 4,
      sprintVelocity: 100,
      totalTasks: 0,
      completedTasks: 0,
      departments: [],
    });
  }
}
