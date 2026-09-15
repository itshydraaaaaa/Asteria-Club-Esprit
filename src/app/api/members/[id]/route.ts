import { NextResponse } from "next/server";
import {
  getMemberById,
  updateProfile,
  getAttendanceRecords,
  countEvents,
  parseSkills,
  createAuditLog,
} from "@/lib/supabase/queries";
import { getAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { sendRoleUpdateEmail } from "@/lib/email";

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
    const adminClient = getAdminClient();
    const { count: pastCount } = await (adminClient as any)
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

    const isExecutive =
      currentUser.role === "BOARD" ||
      currentUser.role === "PRESIDENT" ||
      currentUser.role === "VICE_PRESIDENT";

    // Users can only edit their own profile unless they are in Executive Leadership
    if (currentUser.id !== id && !isExecutive) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own profile" },
        { status: 403 }
      );
    }

    const adminClient = getAdminClient();
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.status !== undefined && isExecutive) updateData.status = body.status;
    if (body.departmentId !== undefined && isExecutive) {
      updateData.department_id = body.departmentId || null;
    }
    if (body.freelanceReady !== undefined) updateData.freelance_ready = body.freelanceReady;
    if (body.skills !== undefined) {
      updateData.skills = Array.isArray(body.skills) ? body.skills : body.skills;
    }
    if (body.avatarUrl !== undefined) updateData.avatar_url = body.avatarUrl;

    let targetRole = body.role;
    let effectiveBoardTitle = body.boardTitle;
    const isExecTarget = targetRole === "PRESIDENT" || targetRole === "VICE_PRESIDENT" || targetRole === "BOARD";

    if (targetRole === "PRESIDENT" && !effectiveBoardTitle) {
      effectiveBoardTitle = "President & Executive Lead";
    } else if (targetRole === "VICE_PRESIDENT" && !effectiveBoardTitle) {
      effectiveBoardTitle = "Vice President & Operations Lead";
    }

    if (targetRole !== undefined && isExecutive) {
      updateData.role = targetRole;
    }

    let updated: any;
    try {
      updated = await updateProfile(id, updateData);
    } catch (err: any) {
      console.warn("[MEMBER ROLE CONSTRAINT FALLBACK]:", err?.message);
      if (targetRole === "PRESIDENT" || targetRole === "VICE_PRESIDENT") {
        updateData.role = "BOARD";
      } else if (targetRole === "WAITING_FOR_INTERVIEW" || targetRole === "DECLINED") {
        updateData.role = "APPLICANT";
        if (targetRole === "DECLINED") updateData.status = "INACTIVE";
      }
      updated = await updateProfile(id, updateData);
    }

    // If currentUser is in Executive Leadership, manage HOD assignments and Board seats
    if (isExecutive) {
      if (targetRole === "HOD" && body.departmentId) {
        await (adminClient as any)
          .from("departments")
          .update({ hod_user_id: id })
          .eq("id", body.departmentId);
      } else if (targetRole !== undefined && targetRole !== "HOD") {
        await (adminClient as any)
          .from("departments")
          .update({ hod_user_id: null })
          .eq("hod_user_id", id);
      }

      if (isExecTarget) {
        const titleToSave = effectiveBoardTitle || (targetRole === "PRESIDENT" ? "President" : targetRole === "VICE_PRESIDENT" ? "Vice President" : "Executive Board");
        const orderToSave = targetRole === "PRESIDENT" ? 1 : targetRole === "VICE_PRESIDENT" ? 2 : 3;

        const { data: existingSeat } = await (adminClient as any)
          .from("board_seats")
          .select("id")
          .eq("user_id", id)
          .maybeSingle();

        if (existingSeat) {
          await (adminClient as any)
            .from("board_seats")
            .update({ title: titleToSave, order: orderToSave })
            .eq("id", existingSeat.id);
        } else {
          await (adminClient as any)
            .from("board_seats")
            .insert({
              user_id: id,
              title: titleToSave,
              order: orderToSave,
            });
        }
      } else if (targetRole !== undefined && !isExecTarget) {
        await (adminClient as any)
          .from("board_seats")
          .delete()
          .eq("user_id", id);
      }

      // Record audit log entry
      if (targetRole !== undefined || body.status !== undefined || body.departmentId !== undefined) {
        await createAuditLog({
          user_id: currentUser.id,
          action: "MEMBER_ROLE_CHANGED",
          details: `Updated member "${updated?.name || id}" role to ${targetRole || updated?.role} (${body.status || updated?.status || 'ACTIVE'})`,
        });
      }

      // Dispatch congratulations email if role was changed and user has an email
      if (updated?.email && targetRole !== undefined) {
        let deptName = null;
        const targetDeptId = body.departmentId !== undefined ? body.departmentId : updated.department_id;
        if (targetDeptId) {
          const { data: d } = await (adminClient as any)
            .from("departments")
            .select("name")
            .eq("id", targetDeptId)
            .maybeSingle();
          if (d?.name) deptName = d.name;
        }

        sendRoleUpdateEmail({
          toEmail: updated.email,
          memberName: updated.name || "Membre",
          newRole: targetRole,
          departmentName: deptName,
          boardTitle: isExecTarget ? (effectiveBoardTitle || null) : null,
        }).catch((emailErr) => console.error("[ROLE UPDATE EMAIL ERROR]:", emailErr));
      }
    }

    return NextResponse.json({ success: true, member: updated });
  } catch (error: any) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: error?.message || "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isExecutive =
      currentUser.role === "BOARD" ||
      currentUser.role === "PRESIDENT" ||
      currentUser.role === "VICE_PRESIDENT";

    if (!isExecutive) {
      return NextResponse.json(
        { error: "Forbidden: Executive Board authorization required to delete accounts" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const adminClient = getAdminClient();
    const { data: targetProfile } = await (adminClient as any)
      .from("profiles")
      .select("id, name, email, role")
      .eq("id", id)
      .maybeSingle();

    if (!targetProfile) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (targetProfile.role === "PRESIDENT" && currentUser.role !== "PRESIDENT") {
      return NextResponse.json(
        { error: "Forbidden: Only the President can delete a presidential account" },
        { status: 403 }
      );
    }

    // 1. Unlink HoD
    await (adminClient as any)
      .from("departments")
      .update({ hod_user_id: null })
      .eq("hod_user_id", id);

    // 2. Remove from board_seats
    await (adminClient as any)
      .from("board_seats")
      .delete()
      .eq("user_id", id);

    // 3. Remove from profiles
    await (adminClient as any)
      .from("profiles")
      .delete()
      .eq("id", id);

    // 4. Delete Supabase Auth user
    try {
      await adminClient.auth.admin.deleteUser(id);
    } catch (sbErr) {
      console.warn("Supabase Auth deleteUser notice:", sbErr);
    }

    // 5. Audit Log
    await createAuditLog({
      user_id: currentUser.id,
      action: "MEMBER_DELETED",
      details: `Permanently deleted member account "${targetProfile.name}" (${targetProfile.email})`,
    });

    return NextResponse.json({
      success: true,
      message: `Account for ${targetProfile.name} permanently deleted.`,
    });
  } catch (error: any) {
    console.error("Error deleting member:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete member" }, { status: 500 });
  }
}
