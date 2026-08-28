import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "BOARD" && user.role !== "HOD")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.reviewerNotes !== undefined) updateData.reviewerNotes = body.reviewerNotes;

    const application = await prisma.application.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
