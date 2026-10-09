import { NextResponse } from "next/server";
import { getAttendanceMetrics } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");
    const requestedDeptId = searchParams.get("departmentId");
    const requestedEventId = searchParams.get("eventId");

    const isLeadership =
      user.role === "PRESIDENT" ||
      user.role === "VICE_PRESIDENT" ||
      user.role === "BOARD";
    const isHod = user.role === "HOD";

    let targetUserId = requestedUserId || undefined;
    let targetDeptId = requestedDeptId || undefined;

    // Regular active members can ONLY view their own attendance metrics
    if (!isLeadership && !isHod) {
      targetUserId = user.id;
      targetDeptId = undefined;
    } else if (isHod && !isLeadership) {
      targetDeptId = user.departmentId || undefined;
    }

    const metrics = await getAttendanceMetrics({
      userId: targetUserId,
      departmentId: targetDeptId,
      eventId: requestedEventId || undefined,
    });

    return NextResponse.json({ metrics });
  } catch (error: any) {
    console.error("Error in GET /api/attendance/metrics:", error);
    return NextResponse.json({ error: "Failed to compute attendance metrics" }, { status: 500 });
  }
}
