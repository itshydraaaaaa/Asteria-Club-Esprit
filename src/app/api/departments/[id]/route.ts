import { NextResponse } from "next/server";
import { prisma, SAFE_USER_SELECT } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const department = await prisma.department.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        hod: { select: SAFE_USER_SELECT },
        members: {
          select: SAFE_USER_SELECT,
          orderBy: [{ role: "asc" }, { name: "asc" }],
        },
        tasks: {
          include: {
            assignee: { select: SAFE_USER_SELECT },
            createdBy: { select: SAFE_USER_SELECT },
          },
          orderBy: { createdAt: "desc" },
        },
        events: {
          where: {
            startTime: { gte: new Date(Date.now() - 86400000) },
          },
          orderBy: { startTime: "asc" },
        },
        announcements: {
          include: {
            author: { select: SAFE_USER_SELECT },
          },
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json({ department });
  } catch (error) {
    console.error("Error in /api/departments/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch department" }, { status: 500 });
  }
}
