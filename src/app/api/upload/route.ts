import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "events";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const admin = getAdminClient();
    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await admin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: data.path,
    });
  } catch (error: any) {
    console.error("Error in upload route:", error);
    return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 });
  }
}
