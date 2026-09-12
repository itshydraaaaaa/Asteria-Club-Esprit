import { NextResponse } from "next/server";
import { getOrgChart } from "@/lib/supabase/queries";

export async function GET() {
  try {
    const orgChart = await getOrgChart();
    return NextResponse.json(orgChart);
  } catch (error) {
    console.error("Error in org-chart API:", error);
    return NextResponse.json({ error: "Failed to generate org chart" }, { status: 500 });
  }
}
