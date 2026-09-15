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
    if (user.role !== "BOARD") {
      return NextResponse.json({ error: "Forbidden: Board access required" }, { status: 403 });
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
    if (user.role !== "BOARD") {
      return NextResponse.json({ error: "Forbidden: Board access required" }, { status: 403 });
    }

    const { action, payload } = await req.json();

    if (action === "UPDATE_MEMBER_ROLE") {
      const { memberId, role, departmentId, status, boardTitle } = payload;
      if (!memberId) {
        return NextResponse.json({ error: "Missing memberId parameter" }, { status: 400 });
      }

      const adminClient = getAdminClient();
      const updateData: Record<string, unknown> = {};
      if (role !== undefined) updateData.role = role;
      if (departmentId !== undefined) updateData.department_id = departmentId || null;
      if (status !== undefined) updateData.status = status;

      const updated = await updateProfile(memberId, updateData);

      // Handle Head of Department (HOD) linking
      if (role === "HOD" && departmentId) {
        await (adminClient as any)
          .from("departments")
          .update({ hod_user_id: memberId })
          .eq("id", departmentId);
      } else if (role !== "HOD") {
        // If they were previously marked as HOD of any department, clear it
        await (adminClient as any)
          .from("departments")
          .update({ hod_user_id: null })
          .eq("hod_user_id", memberId);
      }

      // Handle Executive Board seats
      if (role === "BOARD") {
        if (boardTitle) {
          const { data: existingSeat } = await (adminClient as any)
            .from("board_seats")
            .select("id")
            .eq("user_id", memberId)
            .maybeSingle();

          if (existingSeat) {
            await (adminClient as any)
              .from("board_seats")
              .update({ title: boardTitle })
              .eq("id", existingSeat.id);
          } else {
            await (adminClient as any)
              .from("board_seats")
              .insert({
                user_id: memberId,
                title: boardTitle,
                order: 99,
              });
          }
        }
      } else {
        // If no longer BOARD, remove from board_seats
        await (adminClient as any)
          .from("board_seats")
          .delete()
          .eq("user_id", memberId);
      }

      // Create detailed audit log entry
      await createAuditLog({
        user_id: user.id,
        action: "MEMBER_ROLE_CHANGED",
        details: `Updated role of "${updated?.name || memberId}" to ${role || updated?.role} (${status || updated?.status || 'ACTIVE'})`,
      });

      // Dispatch congratulations email if role is updated and user has an email
      if (updated?.email && role) {
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

        // Fire and don't block response if email provider takes a moment
        sendRoleUpdateEmail({
          toEmail: updated.email,
          memberName: updated.name || "Membre",
          newRole: role,
          departmentName: deptName,
          boardTitle: role === "BOARD" ? boardTitle : null,
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
