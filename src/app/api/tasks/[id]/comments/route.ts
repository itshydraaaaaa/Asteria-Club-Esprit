import { NextResponse } from "next/server";
import { createTaskComment } from "@/lib/supabase/queries";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { body } = await req.json();

    if (!body || !body.trim()) {
      return NextResponse.json({ error: "Comment body cannot be empty" }, { status: 400 });
    }

    const comment = await createTaskComment({
      task_id: id,
      user_id: user.id,
      body: body.trim(),
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
