import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        boardSeat: true,
        tasksAssigned: {
          include: { department: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        attendanceRecords: {
          include: { event: true },
          orderBy: { checkedInAt: "desc" },
          take: 10,
        },
        rsvps: {
          include: { event: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    let skills: string[] = [];
    try {
      skills = JSON.parse(user.skills || "[]");
    } catch {
      skills = [];
    }

    // Calculate attendance statistics
    const totalEvents = await prisma.event.count({
      where: {
        startTime: { lte: new Date() },
        OR: [
          { departmentId: null },
          ...(user.departmentId ? [{ departmentId: user.departmentId }] : []),
        ],
      },
    });

    const attendedEvents = user.attendanceRecords.filter(
      (a) => a.status === "PRESENT" || a.status === "EXCUSED"
    ).length;

    const attendanceRate = totalEvents > 0 ? Math.round((attendedEvents / totalEvents) * 100) : 100;

    return NextResponse.json({
      member: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        department: user.department,
        boardSeat: user.boardSeat,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        skills,
        status: user.status,
        freelanceReady: user.freelanceReady,
        joinDate: user.joinDate,
        attendanceRate,
        totalEvents,
        attendedEvents,
        tasks: user.tasksAssigned,
        recentAttendance: user.attendanceRecords,
      },
    });
  } catch (error) {
    console.error("Error fetching member details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Only BOARD can change role, status, or departmentId
    if (
      (body.role !== undefined || body.status !== undefined || body.departmentId !== undefined) &&
      currentUser.role !== "BOARD"
    ) {
      return NextResponse.json(
        { error: "Forbidden: Only Board members can change role, status, or department" },
        { status: 403 }
      );
    }

    // Users can only edit their own profile unless they are BOARD
    if (currentUser.id !== id && currentUser.role !== "BOARD") {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own profile" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.status !== undefined && currentUser.role === "BOARD") updateData.status = body.status;
    if (body.role !== undefined && currentUser.role === "BOARD") updateData.role = body.role;
    if (body.departmentId !== undefined && currentUser.role === "BOARD") updateData.departmentId = body.departmentId;
    if (body.freelanceReady !== undefined) updateData.freelanceReady = body.freelanceReady;
    if (body.skills !== undefined) {
      updateData.skills = Array.isArray(body.skills) ? JSON.stringify(body.skills) : body.skills;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { department: true, boardSeat: true },
    });

    const { passwordHash: _, ...safeMember } = updated;
    return NextResponse.json({ member: safeMember });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}
