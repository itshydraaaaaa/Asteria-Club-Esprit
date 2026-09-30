import { NextResponse } from "next/server";
import { getDepartmentsWithCounts } from "@/lib/supabase/queries";

export async function GET() {
  try {
    const departments = await getDepartmentsWithCounts();
    return NextResponse.json({ departments });
  } catch (error) {
    console.error("Error in /api/departments:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}
