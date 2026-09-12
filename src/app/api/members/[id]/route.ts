import { NextResponse } from "next/server";
import { getMemberById, updateProfile, getAttendanceRecords, countEvents, parseSkills } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const member = await getMemberById(id);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Fetch recent attendance records for this member
    const attendanceRecords = await getAttendanceRecords({ user_id: id });

    // Count events relevant to this member's scope (club-wide + their dept)
    const totalEvents = await countEvents({ after: new Date() }); // past events only: lte now
    const adminClient = (await import("@/lib/supabase/admin")).getAdminClient();
    const { count: pastCount } = await adminClient
      .from("events")
      .select("*", { count: "exact", head: true })
      .lte("start_time", new Date().toISOString());

    const attendedEvents = attendanceRecords.filter(
      (a: any) => a.status === "PRESENT" || a.status === "EXCUSED"
    ).length;

    const totalPast = pastCount || 0;
    const attendanceRate = totalPast > 0 ? Math.round((attendedEvents / totalPast) * 100) : 100;

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        departmentId: member.department_id,
        department: member.departments,
        boardSeat: member.board_seats,
        avatarUrl: member.avatar_url,
        bio: member.bio,
        skills: parseSkills(member.skills),
        status: member.status,
        freelanceReady: member.freelance_ready,
        joinDate: member.join_date,
        attendanceRate,
        totalEvents: totalPast,
        attendedEvents,
        recentAttendance: attendanceRecords.slice(0, 10),
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

    // Only BOARD can change role, status, or department_id
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
    if (body.departmentId !== undefined && currentUser.role === "BOARD") updateData.department_id = body.departmentId;
    if (body.freelanceReady !== undefined) updateData.freelance_ready = body.freelanceReady;
    if (body.skills !== undefined) {
      updateData.skills = Array.isArray(body.skills) ? body.skills : body.skills;
    }
    if (body.avatarUrl !== undefined) updateData.avatar_url = body.avatarUrl;

    const updated = await updateProfile(id, updateData);
    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}
