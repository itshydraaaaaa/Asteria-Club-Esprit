import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // 1. Fetch Board Seats
    const boardSeats = await prisma.boardSeat.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
            skills: true,
            status: true,
          },
        },
      },
      orderBy: { order: "asc" },
    });

    // 2. Fetch Departments with HoD and Members
    const departments = await prisma.department.findMany({
      include: {
        hod: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
            skills: true,
            freelanceReady: true,
          },
        },
        members: {
          where: {
            role: "MEMBER",
            status: "ACTIVE",
          },
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            skills: true,
            freelanceReady: true,
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      board: boardSeats.map((b) => ({
        id: b.id,
        title: b.title,
        order: b.order,
        user: {
          ...b.user,
          skills: JSON.parse(b.user.skills || "[]"),
        },
      })),
      departments: departments.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        description: d.description,
        icon: d.icon,
        hod: d.hod
          ? {
              ...d.hod,
              skills: JSON.parse(d.hod.skills || "[]"),
            }
          : null,
        members: d.members.map((m) => ({
          ...m,
          skills: JSON.parse(m.skills || "[]"),
        })),
      })),
    });
  } catch (error) {
    console.error("Error in org-chart API:", error);
    return NextResponse.json({ error: "Failed to generate org chart" }, { status: 500 });
  }
}
