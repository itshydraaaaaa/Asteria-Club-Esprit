import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  canViewActivityWorkspace,
  canEditActivity,
} from "@/lib/planner/permissions";
import {
  getActivityById,
  getActivityFiles,
  createActivityFileRecord,
  deleteActivityFileRecord,
  recordPlannerAuditLog,
} from "@/lib/planner/queries";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE_BYTES = 26_214_400; // 25 MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const activity = await getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!canViewActivityWorkspace(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rawFiles = await getActivityFiles(id);
    const supabase = await createClient();

    // Resolve signed URLs for files stored in the private `activity-files` bucket
    const files = await Promise.all(
      rawFiles.map(async (f) => {
        if (f.fileUrl.startsWith("storage://activity-files/")) {
          const storagePath = f.fileUrl.replace(
            "storage://activity-files/",
            ""
          );
          const { data } = await supabase.storage
            .from("activity-files")
            .createSignedUrl(storagePath, 3600);
          return {
            ...f,
            downloadUrl: data?.signedUrl || f.fileUrl,
            storagePath,
          };
        }
        return {
          ...f,
          downloadUrl: f.fileUrl,
        };
      })
    );

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error("Error in GET /api/planner/activities/[id]/files:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load files" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const activity = await getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!canEditActivity(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    const supabase = await createClient();

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: "No file provided in form data" },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "File exceeds maximum allowed size of 25 MB" },
          { status: 400 }
        );
      }

      if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            error: `Unsupported file type (${file.type}). Allowed: PDF, PNG, JPEG, WEBP, DOCX, XLSX, PPTX.`,
          },
          { status: 400 }
        );
      }

      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${id}/${Date.now()}_${safeFileName}`;
      const arrayBuffer = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("activity-files")
        .upload(storagePath, arrayBuffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      let storedUrl = `storage://activity-files/${storagePath}`;
      if (uploadError) {
        // Fallback if storage bucket isn't provisioned yet in remote environment
        console.warn("Storage upload warning:", uploadError.message);
        storedUrl = `#local-attachment/${storagePath}`;
      }

      const created = await createActivityFileRecord({
        activityId: id,
        fileName: file.name,
        fileUrl: storedUrl,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        uploadedBy: user.id,
      });

      let downloadUrl = created.fileUrl;
      if (created.fileUrl.startsWith("storage://activity-files/")) {
        const { data } = await supabase.storage
          .from("activity-files")
          .createSignedUrl(storagePath, 3600);
        if (data?.signedUrl) downloadUrl = data.signedUrl;
      }

      await recordPlannerAuditLog({
        userId: user.id,
        action: "ACTIVITY_FILE_UPLOADED",
        entityType: "ACTIVITY_FILE",
        entityId: created.id,
        details: `Uploaded file "${created.fileName}" (${created.fileSize || 0} bytes) to "${activity.title}"`,
      });

      return NextResponse.json(
        { file: { ...created, downloadUrl, uploadedBy: created.uploader } },
        { status: 201 }
      );
    }

    // JSON metadata attachment (e.g., Google Drive / Figma / Cally / External Document link or uploaded URL)
    const body = await req.json();
    const { fileName, fileUrl, fileType, sizeBytes } = body;

    if (!fileName || !fileUrl) {
      return NextResponse.json(
        { error: "fileName and fileUrl are required" },
        { status: 400 }
      );
    }

    if (sizeBytes && Number(sizeBytes) > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds maximum allowed size of 25 MB" },
        { status: 400 }
      );
    }

    const created = await createActivityFileRecord({
      activityId: id,
      fileName: fileName.trim(),
      fileUrl: fileUrl.trim(),
      mimeType: fileType || "application/link",
      fileSize: Number(sizeBytes || 0),
      uploadedBy: user.id,
    });

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_FILE_ADDED",
      entityType: "ACTIVITY_FILE",
      entityId: created.id,
      details: `Added file/link "${created.fileName}" to "${activity.title}"`,
    });

    return NextResponse.json(
      { file: { ...created, downloadUrl: created.fileUrl, uploadedBy: created.uploader } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/planner/activities/[id]/files:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to add file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const activity = await getActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!canEditActivity(user, activity)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let fileId = searchParams.get("fileId");
    if (!fileId) {
      try {
        const body = await req.json();
        fileId = body.fileId;
      } catch {
        // ignore
      }
    }
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    const existingFiles = await getActivityFiles(id);
    const targetFile = existingFiles.find((f) => f.id === fileId);

    if (targetFile && targetFile.fileUrl.startsWith("storage://activity-files/")) {
      const storagePath = targetFile.fileUrl.replace(
        "storage://activity-files/",
        ""
      );
      const supabase = await createClient();
      await supabase.storage.from("activity-files").remove([storagePath]);
    }

    await deleteActivityFileRecord(fileId);

    await recordPlannerAuditLog({
      userId: user.id,
      action: "ACTIVITY_FILE_DELETED",
      entityType: "ACTIVITY_FILE",
      entityId: fileId,
      details: `Deleted file ${targetFile?.fileName || fileId} from "${activity.title}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/planner/activities/[id]/files:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete file" },
      { status: 500 }
    );
  }
}
