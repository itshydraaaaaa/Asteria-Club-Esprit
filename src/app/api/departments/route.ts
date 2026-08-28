import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        hod: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            members: true,
            tasks: true,
            events: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("Error in /api/departments:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}
