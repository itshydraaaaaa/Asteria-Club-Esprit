import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId");
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { bio: { contains: search } },
        { skills: { contains: search } },
      ];
    }

    if (departmentId && departmentId !== "all") {
      where.departmentId = departmentId;
    }

    if (role && role !== "all") {
      where.role = role;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    const members = await prisma.user.findMany({
      where,
      include: {
        department: true,
        boardSeat: true,
        _count: {
          select: {
            tasksAssigned: true,
            attendanceRecords: true,
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { name: "asc" },
      ],
    });

    const parsedMembers = members.map((m) => {
      let skills: string[] = [];
      try {
        skills = JSON.parse(m.skills || "[]");
      } catch {
        skills = [];
      }
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        departmentId: m.departmentId,
        departmentName: m.department?.name,
        boardTitle: m.boardSeat?.title,
        avatarUrl: m.avatarUrl,
        bio: m.bio,
        skills,
        status: m.status,
        freelanceReady: m.freelanceReady,
        joinDate: m.joinDate,
        tasksCount: m._count.tasksAssigned,
        attendanceCount: m._count.attendanceRecords,
      };
    });

    return NextResponse.json({ members: parsedMembers });
  } catch (error) {
    console.error("Error in /api/members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
