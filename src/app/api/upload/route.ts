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
    const requestedBucket = formData.get("bucket") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Security: Restrict bucket to strict allowlist
    const ALLOWED_BUCKETS = ["events", "avatars"] as const;
    const bucket = requestedBucket && (ALLOWED_BUCKETS as readonly string[]).includes(requestedBucket)
      ? requestedBucket
      : null;

    if (!bucket) {
      return NextResponse.json(
        { error: "Invalid storage bucket. Allowed buckets: 'events', 'avatars'." },
        { status: 400 }
      );
    }

    // Security: Validate allowed MIME types
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Only JPEG, PNG, WEBP, and GIF images are permitted." },
        { status: 400 }
      );
    }

    // Security: Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB maximum limit." },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const fileExt = extMap[file.type] || "png";
    const safeRandom = Math.random().toString(36).substring(2, 10);
    // Security: User-isolated path to prevent collision and cross-user overwriting
    const filePath = `${user.id}/${Date.now()}_${safeRandom}.${fileExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await admin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false, // Security: Do not allow overwriting arbitrary files
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
