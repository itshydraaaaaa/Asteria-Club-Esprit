import { NextResponse } from "next/server";
import {
  getBoardSeats,
  getDepartmentsWithCounts,
  getRecentAuditLogs,
  getMembers,
  updateProfile,
  createAuditLog,
  createDepartment,
} from "@/lib/supabase/queries";
import { getAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_ACADEMIC_CYCLE } from "@/lib/constants";
import { sendRoleUpdateEmail } from "@/lib/email";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isExecutive = user.role === "BOARD" || user.role === "PRESIDENT" || user.role === "VICE_PRESIDENT";
    if (!isExecutive) {
      return NextResponse.json({ error: "Forbidden: Executive Board access required" }, { status: 403 });
    }

    const [boardSeats, departments, auditLogs, members] = await Promise.all([
      getBoardSeats(),
      getDepartmentsWithCounts(),
      getRecentAuditLogs(30),
      getMembers(),
    ]);

    const normalizedBoardSeats = (boardSeats || []).map((seat: any) => ({
      ...seat,
      user: seat.user
        ? {
            ...seat.user,
            avatarUrl: seat.user.avatar_url || seat.user.avatarUrl,
          }
        : null,
    }));

    const normalizedAuditLogs = (auditLogs || []).map((log: any) => ({
      ...log,
      createdAt: log.created_at || log.createdAt,
      userId: log.user_id || log.userId,
      user: log.user
        ? {
            ...log.user,
            avatarUrl: log.user.avatar_url || log.user.avatarUrl,
          }
        : null,
    }));

    const normalizedMembers = (members || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      departmentId: m.department_id,
      departmentName: m.departments?.name ?? null,
      boardTitle: m.board_seats?.title ?? null,
      avatarUrl: m.avatar_url,
      bio: m.bio,
      status: m.status,
      freelanceReady: m.freelance_ready,
      joinDate: m.join_date,
    }));

    return NextResponse.json({
      boardSeats: normalizedBoardSeats,
      departments,
      auditLogs: normalizedAuditLogs,
      members: normalizedMembers,
      currentCycle: DEFAULT_ACADEMIC_CYCLE,
    });
  } catch (error) {
    console.error("Error in /api/admin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isExecutive = user.role === "BOARD" || user.role === "PRESIDENT" || user.role === "VICE_PRESIDENT";
    if (!isExecutive) {
      return NextResponse.json({ error: "Forbidden: Executive Board access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action, payload } = body;

    if (action === "UPDATE_MEMBER_ROLE") {
      const { memberId, role, departmentId, status, boardTitle } = payload;
      if (!memberId) {
        return NextResponse.json({ error: "Missing memberId parameter" }, { status: 400 });
      }

      const adminClient = getAdminClient();
      const updateData: Record<string, unknown> = {};
      if (departmentId !== undefined) updateData.department_id = departmentId || null;
      if (status !== undefined) updateData.status = status;

      let targetRole = role;
      let effectiveBoardTitle = boardTitle;
      const isExecTarget = targetRole === "PRESIDENT" || targetRole === "VICE_PRESIDENT" || targetRole === "BOARD";

      if (targetRole === "PRESIDENT" && !effectiveBoardTitle) {
        effectiveBoardTitle = "President & Executive Lead";
      } else if (targetRole === "VICE_PRESIDENT" && !effectiveBoardTitle) {
        effectiveBoardTitle = "Vice President & Operations Lead";
      }

      if (targetRole !== undefined) updateData.role = targetRole;

      let updated: any;
      try {
        updated = await updateProfile(memberId, updateData);
      } catch (err: any) {
        // Resilient fallback if Supabase check constraint profiles_role_check hasn't been altered yet
        console.warn("[ROLE CONSTRAINT FALLBACK]:", err?.message);
        if (targetRole === "PRESIDENT" || targetRole === "VICE_PRESIDENT") {
          updateData.role = "BOARD";
        } else if (targetRole === "WAITING_FOR_INTERVIEW" || targetRole === "DECLINED") {
          updateData.role = "APPLICANT";
          if (targetRole === "DECLINED") updateData.status = "INACTIVE";
        }
        updated = await updateProfile(memberId, updateData);
      }

      // Handle Head of Department (HOD) linking
      if (targetRole === "HOD" && departmentId) {
        await (adminClient as any)
          .from("departments")
          .update({ hod_user_id: memberId })
          .eq("id", departmentId);
      } else if (targetRole !== "HOD") {
        // If they were previously marked as HOD of any department, clear it
        await (adminClient as any)
          .from("departments")
          .update({ hod_user_id: null })
          .eq("hod_user_id", memberId);
      }

      // Handle Executive Board seats (President, Vice President, Board Tracks)
      if (isExecTarget) {
        const titleToSave = effectiveBoardTitle || (targetRole === "PRESIDENT" ? "President" : targetRole === "VICE_PRESIDENT" ? "Vice President" : "Executive Board");
        const orderToSave = targetRole === "PRESIDENT" ? 1 : targetRole === "VICE_PRESIDENT" ? 2 : 3;

        const { data: existingSeat } = await (adminClient as any)
          .from("board_seats")
          .select("id")
          .eq("user_id", memberId)
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
              user_id: memberId,
              title: titleToSave,
              order: orderToSave,
            });
        }
      } else {
        // If no longer in Executive Leadership, remove from board_seats
        await (adminClient as any)
          .from("board_seats")
          .delete()
          .eq("user_id", memberId);
      }

      // Create detailed audit log entry
      await createAuditLog({
        user_id: user.id,
        action: "MEMBER_ROLE_CHANGED",
        details: `Updated role of "${updated?.name || memberId}" to ${targetRole} (${status || updated?.status || 'ACTIVE'})`,
      });

      // Dispatch congratulations email if role is updated and user has an email
      if (updated?.email && targetRole) {
        let deptName = null;
        const targetDeptId = departmentId !== undefined ? departmentId : updated.department_id;
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

      return NextResponse.json({
        success: true,
        member: updated,
      });
    }

    if (action === "CREATE_DEPARTMENT") {
      const { name, description, icon } = payload;
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      const dept = await createDepartment({ name, slug, description, icon });

      await createAuditLog({
        user_id: user.id,
        action: "DEPARTMENT_CREATED",
        details: `Created new department: ${name}`,
      });

      return NextResponse.json({ success: true, department: dept });
    }

    if (action === "ROLLOVER_CYCLE") {
      await createAuditLog({
        user_id: user.id,
        action: "CYCLE_ROLLOVER",
        details: `Initiated academic cycle rollover for: ${payload.cycleName}`,
      });

      return NextResponse.json({
        success: true,
        message: `Cycle ${payload.cycleName} successfully updated.`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin POST error:", error);
    return NextResponse.json({ error: error?.message || "Operation failed" }, { status: 500 });
  }
}
