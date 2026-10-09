/**
 * Asteria Club Esprit — Supabase Query Layer
 * Single source of truth for all database operations.
 * Replaces Prisma completely.
 */
import { createClient } from "./server";
import { getAdminClient } from "./admin";
import type { Database } from "./types";

// ---------------------------------------------------------------------------
// Type Aliases
// ---------------------------------------------------------------------------
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Department = Database["public"]["Tables"]["departments"]["Row"];
export type BoardSeat = Database["public"]["Tables"]["board_seats"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type RSVP = Database["public"]["Tables"]["rsvps"]["Row"];
export type AttendanceRecord = Database["public"]["Tables"]["attendance_records"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskComment = Database["public"]["Tables"]["task_comments"]["Row"];
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];
export type Application = Database["public"]["Tables"]["applications"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

// ---------------------------------------------------------------------------
// Helper: parse skills (stored as JSON array in Supabase)
// ---------------------------------------------------------------------------
export function parseSkills(skills: unknown): string[] {
  if (Array.isArray(skills)) return skills as string[];
  if (typeof skills === "string") {
    try {
      const parsed = JSON.parse(skills);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// AUTH / PROFILES
// ---------------------------------------------------------------------------

export async function getProfileById(userId: string): Promise<any> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select(`
      *,
      departments:department_id (id, name, slug),
      board_seats!board_seats_user_id_fkey (id, title, order)
    `)
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data;
}

export async function getProfileByEmail(email: string): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("profiles")
    .select(`
      *,
      departments:department_id (id, name, slug),
      board_seats!board_seats_user_id_fkey (id, title, order)
    `)
    .eq("email", email.toLowerCase().trim())
    .single();
  if (error || !data) return null;
  return data;
}

export async function upsertProfile(profile: Record<string, unknown>): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Record<string, unknown>): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// MEMBERS / PROFILES LIST
// ---------------------------------------------------------------------------

export async function getMembers(filters: {
  search?: string;
  department_id?: string;
  role?: string;
  status?: string;
} = {}): Promise<any[]> {
  const admin = getAdminClient();
  let query = (admin as any)
    .from("profiles")
    .select(`
      *,
      departments:department_id (id, name, slug),
      board_seats!board_seats_user_id_fkey (id, title)
    `)
    .order("role", { ascending: true })
    .order("name", { ascending: true });

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }
  if (filters.department_id && filters.department_id !== "all") {
    query = query.eq("department_id", filters.department_id);
  }
  if (filters.role && filters.role !== "all") {
    query = query.eq("role", filters.role);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as any[];
}

export async function getMemberById(id: string): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("profiles")
    .select(`
      *,
      departments:department_id (id, name, slug),
      board_seats!board_seats_user_id_fkey (id, title, order)
    `)
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function countActiveMembers(): Promise<number> {
  const admin = getAdminClient();
  const { count, error } = await (admin as any)
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "ACTIVE");
  if (error) return 0;
  return count || 0;
}

// ---------------------------------------------------------------------------
// DEPARTMENTS
// ---------------------------------------------------------------------------

export async function getDepartments(): Promise<any[]> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("departments")
    .select(`
      *,
      hod:hod_user_id (id, name, email, avatar_url)
    `)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []) as any[];
}

export async function getDepartmentById(idOrSlug: string): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("departments")
    .select(`
      *,
      hod:hod_user_id (id, name, email, avatar_url, bio, skills, freelance_ready)
    `)
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .single();
  if (error) return null;
  return data;
}

export async function getDepartmentsWithCounts(): Promise<any[]> {
  const admin = getAdminClient();
  const { data: depts, error } = await (admin as any)
    .from("departments")
    .select(`
      *,
      hod:hod_user_id (id, name, email, avatar_url)
    `)
    .order("name", { ascending: true });
  if (error) throw error;

  if (!depts || depts.length === 0) return [];

  // Batch query counts across all departments in 3 parallel queries instead of 3*N sequential queries
  const [{ data: activeProfiles }, { data: tasks }, { data: events }] = await Promise.all([
    (admin as any).from("profiles").select("department_id").eq("status", "ACTIVE").not("department_id", "is", null),
    (admin as any).from("tasks").select("department_id").not("department_id", "is", null),
    (admin as any).from("events").select("department_id").not("department_id", "is", null),
  ]);

  const memberCounts: Record<string, number> = {};
  for (const p of activeProfiles || []) {
    if (p.department_id) memberCounts[p.department_id] = (memberCounts[p.department_id] || 0) + 1;
  }

  const taskCounts: Record<string, number> = {};
  for (const t of tasks || []) {
    if (t.department_id) taskCounts[t.department_id] = (taskCounts[t.department_id] || 0) + 1;
  }

  const eventCounts: Record<string, number> = {};
  for (const e of events || []) {
    if (e.department_id) eventCounts[e.department_id] = (eventCounts[e.department_id] || 0) + 1;
  }

  return (depts as any[]).map((dept: any) => ({
    ...dept,
    _count: {
      members: memberCounts[dept.id] || 0,
      tasks: taskCounts[dept.id] || 0,
      events: eventCounts[dept.id] || 0,
    },
  }));
}

export async function countDepartments(): Promise<number> {
  const admin = getAdminClient();
  const { count, error } = await (admin as any)
    .from("departments")
    .select("*", { count: "exact", head: true });
  if (error) return 0;
  return count || 0;
}

export async function createDepartment(data: { name: string; slug: string; description: string; icon?: string }): Promise<any> {
  const admin = getAdminClient();
  const { data: dept, error } = await (admin as any)
    .from("departments")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return dept;
}

// ---------------------------------------------------------------------------
// BOARD SEATS
// ---------------------------------------------------------------------------

export async function getBoardSeats(): Promise<any[]> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("board_seats")
    .select(`
      *,
      user:user_id (id, name, email, avatar_url, bio, skills, status)
    `)
    .order("order", { ascending: true });
  if (error) throw error;
  return (data || []) as any[];
}

// ---------------------------------------------------------------------------
// TASKS
// ---------------------------------------------------------------------------

export async function getTasks(filters: {
  department_id?: string;
  assignee_id?: string;
  status?: string;
} = {}): Promise<any[]> {
  const admin = getAdminClient();
  let query = (admin as any)
    .from("tasks")
    .select(`
      *,
      departments:department_id (id, name, slug),
      assignee:assignee_id (id, name, email, avatar_url),
      created_by:created_by_id (id, name),
      task_comments (
        id, body, created_at,
        user:user_id (id, name, avatar_url)
      )
    `)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.department_id && filters.department_id !== "all") {
    query = query.eq("department_id", filters.department_id);
  }
  if (filters.assignee_id && filters.assignee_id !== "all") {
    query = query.eq("assignee_id", filters.assignee_id);
  }
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as any[];
}

export async function getTaskById(id: string): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("tasks")
    .select(`
      *,
      departments:department_id (id, name, slug),
      assignee:assignee_id (id, name, email, avatar_url),
      created_by:created_by_id (id, name),
      task_comments (
        id, body, created_at,
        user:user_id (id, name, avatar_url)
      )
    `)
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getTasksByAssignee(assigneeId: string): Promise<any[]> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("tasks")
    .select(`
      *,
      departments:department_id (id, name, slug)
    `)
    .eq("assignee_id", assigneeId)
    .order("status", { ascending: true })
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data || []) as any[];
}

export async function getTasksByDepartment(departmentId: string): Promise<any[]> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("tasks")
    .select(`
      *,
      assignee:assignee_id (id, name, email, avatar_url),
      created_by:created_by_id (id, name)
    `)
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as any[];
}

export async function createTask(data: Record<string, unknown>): Promise<any> {
  const admin = getAdminClient();
  const { data: task, error } = await (admin as any)
    .from("tasks")
    .insert(data)
    .select(`
      *,
      departments:department_id (id, name, slug),
      assignee:assignee_id (id, name, email, avatar_url),
      created_by:created_by_id (id, name),
      task_comments (id, body, created_at, user:user_id (id, name, avatar_url))
    `)
    .single();
  if (error) throw error;
  return task;
}

export async function updateTask(id: string, updates: Record<string, unknown>): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("tasks")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(`
      *,
      departments:department_id (id, name, slug),
      assignee:assignee_id (id, name, email, avatar_url),
      created_by:created_by_id (id, name),
      task_comments (id, body, created_at, user:user_id (id, name, avatar_url))
    `)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const admin = getAdminClient();
  const { error } = await (admin as any).from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function countTasks(filter?: { status?: string; department_id?: string }): Promise<number> {
  const admin = getAdminClient();
  let query = (admin as any).from("tasks").select("*", { count: "exact", head: true });
  if (filter?.status) query = query.eq("status", filter.status as any);
  if (filter?.department_id) query = query.eq("department_id", filter.department_id);
  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}

export async function createTaskComment(data: { task_id: string; user_id: string; body: string }): Promise<any> {
  const admin = getAdminClient();
  const { data: comment, error } = await (admin as any)
    .from("task_comments")
    .insert(data)
    .select(`
      *,
      user:user_id (id, name, avatar_url)
    `)
    .single();
  if (error) throw error;
  return comment;
}

// ---------------------------------------------------------------------------
// EVENTS & METADATA NORMALIZATION
// ---------------------------------------------------------------------------

export function extractEventMetadata(description?: string | null): {
  cleanDescription: string;
  imageUrl: string | null;
  meta: Record<string, any>;
} {
  if (!description) return { cleanDescription: "", imageUrl: null, meta: {} };

  let clean = description;
  let imageUrl: string | null = null;
  let meta: Record<string, any> = {};

  const metaMatch = clean.match(/<!--\s*EVENT_META:\s*({[\s\S]*?})\s*-->/);
  if (metaMatch) {
    try {
      meta = JSON.parse(metaMatch[1]);
      clean = clean.replace(metaMatch[0], "").trim();
    } catch {
      // ignore JSON parse error
    }
  }

  const imgMatch =
    clean.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/) ||
    clean.match(/\[image:\s*(https?:\/\/[^\s\]]+)\]/);
  if (imgMatch) {
    imageUrl = imgMatch[1];
    clean = clean.replace(imgMatch[0], "").trim();
  }

  return { cleanDescription: clean, imageUrl, meta };
}

export function normalizeAttendance(record: any): any {
  if (!record) return null;
  let status = record.status || "PRESENT";
  let justification = record.justification || "";

  if (justification.startsWith("[LATE]")) {
    status = "LATE";
    justification = justification.replace("[LATE]", "").trim();
  } else if (justification.startsWith("[EXCUSED]")) {
    status = "EXCUSED";
    justification = justification.replace("[EXCUSED]", "").trim();
  }

  return {
    ...record,
    status,
    justification,
    eventId: record.event_id || record.eventId,
    userId: record.user_id || record.userId,
    checkedInAt: record.checked_in_at || record.checkedInAt,
    manualReason: record.manual_reason || record.manualReason || null,
    markedById: record.marked_by_id || record.markedById || null,
    user: record.user || record.profiles || null,
    event: record.events || record.event || null,
  };
}

export function normalizeEvent(e: any): any {
  if (!e) return null;
  const { cleanDescription, imageUrl, meta } = extractEventMetadata(e.description);

  const type = e.type || meta.type || "WORKSHOP";
  const audienceScope = e.audience_scope || meta.audience_scope || (e.department_id ? "DEPARTMENT" : "CLUB");
  const hostId = e.host_id || meta.host_id || e.created_by_id;
  const attendanceRequired = e.attendance_required ?? meta.attendance_required ?? true;
  const checkInWindowStartMin = Number(e.check_in_window_start_min ?? meta.check_in_window_start_min ?? 15);
  const checkInWindowEndMin = Number(e.check_in_window_end_min ?? meta.check_in_window_end_min ?? 30);
  const lateThresholdMin = Number(e.late_threshold_min ?? meta.late_threshold_min ?? 10);
  const checkInStatus = meta.check_in_status === "CLOSED" || e.check_in_status === "CLOSED"
    ? "CLOSED"
    : (e.check_in_status || meta.check_in_status || "SCHEDULED");
  const closedAt = e.closed_at || meta.closed_at || null;
  const closedById = e.closed_by_id || meta.closed_by_id || null;
  const isGeofenceEnabled = Boolean(e.is_geofence_enabled ?? meta.is_geofence_enabled ?? false);
  const geofenceLat = e.geofence_lat ?? meta.geofence_lat ?? null;
  const geofenceLng = e.geofence_lng ?? meta.geofence_lng ?? null;
  const geofenceRadiusM = Number(e.geofence_radius_m ?? meta.geofence_radius_m ?? 100);
  const linkedAnnouncementId = e.linked_announcement_id || meta.linked_announcement_id || null;

  const attendanceRecords = (e.attendance_records || []).map(normalizeAttendance);

  const presentCount = attendanceRecords.filter((a: any) => a.status === "PRESENT").length;
  const lateCount = attendanceRecords.filter((a: any) => a.status === "LATE").length;
  const absentCount = attendanceRecords.filter((a: any) => a.status === "ABSENT").length;
  const excusedCount = attendanceRecords.filter((a: any) => a.status === "EXCUSED").length;

  return {
    ...e,
    type,
    audienceScope,
    hostId,
    host: e.host || e.created_by || null,
    attendanceRequired,
    checkInWindowStartMin,
    checkInWindowEndMin,
    lateThresholdMin,
    checkInStatus,
    closedAt,
    closedById,
    isGeofenceEnabled,
    geofenceLat,
    geofenceLng,
    geofenceRadiusM,
    linkedAnnouncementId,
    cleanDescription,
    imageUrl: e.image_url || imageUrl,
    startTime: e.start_time || e.startTime,
    endTime: e.end_time || e.endTime,
    departmentId: e.department_id || e.departmentId,
    department: e.departments || e.department,
    createdById: e.created_by_id || e.createdById,
    createdBy: e.created_by || null,
    recurrenceRule: e.recurrence_rule || e.recurrenceRule,
    checkInCode: e.check_in_code || e.checkInCode || "",
    rsvps: (e.rsvps || []).map((r: any) => ({
      ...r,
      eventId: r.event_id || r.eventId,
      userId: r.user_id || r.userId,
    })),
    attendanceRecords,
    _count: {
      rsvps: (e.rsvps || []).length,
      attendanceRecords: attendanceRecords.length,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      excused: excusedCount,
    },
  };
}

export async function getEvents(filters: {
  department_id?: string;
  scope?: string;
  user_id?: string;
} = {}): Promise<any[]> {
  const admin = getAdminClient();
  let query = (admin as any)
    .from("events")
    .select(`
      *,
      departments:department_id (id, name),
      created_by:created_by_id (id, name, avatar_url, role),
      rsvps (
        id, status, user_id,
        user:user_id (id, name, avatar_url, role)
      ),
      attendance_records (
        id, user_id, status, method, checked_in_at, justification, manual_reason, marked_by_id,
        user:user_id (id, name, email, department_id, avatar_url)
      )
    `)
    .order("start_time", { ascending: true });

  if (filters.scope === "club") {
    query = query.is("department_id", null);
  } else if (filters.scope === "department" && filters.department_id && filters.department_id !== "all") {
    query = query.eq("department_id", filters.department_id);
  } else if (filters.department_id && filters.department_id !== "all") {
    query = query.or(`department_id.is.null,department_id.eq.${filters.department_id}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeEvent);
}

export async function getEventById(id: string): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("events")
    .select(`
      *,
      departments:department_id (id, name),
      created_by:created_by_id (id, name, avatar_url, role),
      rsvps (
        id, status, user_id,
        user:user_id (id, name, avatar_url, role)
      ),
      attendance_records (
        id, user_id, status, method, checked_in_at, justification, manual_reason, marked_by_id,
        user:user_id (id, name, email, department_id, avatar_url)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return normalizeEvent(data);
}

export async function getUpcomingEvents(limit = 4, departmentId?: string): Promise<any[]> {
  const admin = getAdminClient();
  let query = (admin as any)
    .from("events")
    .select(`
      *,
      departments:department_id (id, name),
      rsvps (id, user_id, status)
    `)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(limit);

  if (departmentId) {
    query = query.or(`department_id.is.null,department_id.eq.${departmentId}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeEvent);
}

export async function createEvent(data: Record<string, any>): Promise<any> {
  const admin = getAdminClient();

  const meta: Record<string, any> = {
    type: data.type || "WORKSHOP",
    audience_scope: data.audience_scope || (data.department_id ? "DEPARTMENT" : "CLUB"),
    host_id: data.host_id || data.created_by_id,
    attendance_required: data.attendance_required ?? true,
    check_in_window_start_min: data.check_in_window_start_min ?? 15,
    check_in_window_end_min: data.check_in_window_end_min ?? 30,
    late_threshold_min: data.late_threshold_min ?? 10,
    check_in_status: data.check_in_status || "SCHEDULED",
    is_geofence_enabled: data.is_geofence_enabled ?? false,
    geofence_lat: data.geofence_lat ?? null,
    geofence_lng: data.geofence_lng ?? null,
    geofence_radius_m: data.geofence_radius_m ?? 100,
    linked_announcement_id: data.linked_announcement_id || null,
  };

  let descriptionWithMeta = data.description || "";
  descriptionWithMeta = `${descriptionWithMeta}\n\n<!-- EVENT_META: ${JSON.stringify(meta)} -->`;

  const insertPayload: any = {
    title: data.title,
    description: descriptionWithMeta,
    start_time: data.start_time,
    end_time: data.end_time,
    location: data.location,
    department_id: data.department_id || null,
    recurrence_rule: data.recurrence_rule || null,
    check_in_code: data.check_in_code || `AST-${Math.floor(1000 + Math.random() * 9000)}`,
    created_by_id: data.created_by_id,
    type: data.type || "WORKSHOP",
    audience_scope: data.audience_scope || (data.department_id ? "DEPARTMENT" : "CLUB"),
    host_id: data.host_id || data.created_by_id,
    attendance_required: data.attendance_required ?? true,
    check_in_window_start_min: data.check_in_window_start_min || 15,
    check_in_window_end_min: data.check_in_window_end_min || 30,
    late_threshold_min: data.late_threshold_min || 10,
    check_in_status: data.check_in_status || "SCHEDULED",
    is_geofence_enabled: data.is_geofence_enabled ?? false,
    geofence_lat: data.geofence_lat ?? null,
    geofence_lng: data.geofence_lng ?? null,
    geofence_radius_m: data.geofence_radius_m ?? 100,
  };

  const { data: event, error } = await (admin as any)
    .from("events")
    .insert(insertPayload)
    .select(`
      *,
      departments:department_id (id, name),
      created_by:created_by_id (id, name, avatar_url, role),
      rsvps (id, user_id, status)
    `)
    .single();

  if (error) throw error;
  return normalizeEvent(event);
}

export async function updateEvent(id: string, updates: Record<string, any>): Promise<any> {
  const admin = getAdminClient();
  const existing = await getEventById(id);
  if (!existing) throw new Error("Event not found");

  const { cleanDescription, meta: existingMeta } = extractEventMetadata(existing.description);

  const updatedMeta = {
    ...existingMeta,
    type: updates.type ?? existing.type,
    audience_scope: updates.audience_scope ?? existing.audienceScope,
    host_id: updates.host_id ?? existing.hostId,
    attendance_required: updates.attendance_required ?? existing.attendanceRequired,
    check_in_window_start_min: updates.check_in_window_start_min ?? existing.checkInWindowStartMin,
    check_in_window_end_min: updates.check_in_window_end_min ?? existing.checkInWindowEndMin,
    late_threshold_min: updates.late_threshold_min ?? existing.lateThresholdMin,
    check_in_status: updates.check_in_status ?? existing.checkInStatus,
    closed_at: updates.closed_at ?? existing.closedAt,
    closed_by_id: updates.closed_by_id ?? existing.closedById,
    is_geofence_enabled: updates.is_geofence_enabled ?? existing.isGeofenceEnabled,
    geofence_lat: updates.geofence_lat ?? existing.geofenceLat,
    geofence_lng: updates.geofence_lng ?? existing.geofenceLng,
    geofence_radius_m: updates.geofence_radius_m ?? existing.geofenceRadiusM,
    linked_announcement_id: updates.linked_announcement_id ?? existing.linkedAnnouncementId,
  };

  const newDescription = updates.description !== undefined ? updates.description : cleanDescription;
  const descriptionWithMeta = `${newDescription}\n\n<!-- EVENT_META: ${JSON.stringify(updatedMeta)} -->`;

  const dbUpdates: any = {
    updated_at: new Date().toISOString(),
    description: descriptionWithMeta,
  };

  if (updates.title) dbUpdates.title = updates.title;
  if (updates.start_time) dbUpdates.start_time = updates.start_time;
  if (updates.end_time) dbUpdates.end_time = updates.end_time;
  if (updates.location) dbUpdates.location = updates.location;
  if (updates.department_id !== undefined) dbUpdates.department_id = updates.department_id;
  if (updates.recurrence_rule !== undefined) dbUpdates.recurrence_rule = updates.recurrence_rule;
  if (updates.check_in_code) dbUpdates.check_in_code = updates.check_in_code;
  if (updates.check_in_status !== undefined) dbUpdates.check_in_status = updates.check_in_status;
  if (updates.closed_at !== undefined) dbUpdates.closed_at = updates.closed_at;
  if (updates.closed_by_id !== undefined) dbUpdates.closed_by_id = updates.closed_by_id;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.audience_scope !== undefined) dbUpdates.audience_scope = updates.audience_scope;
  if (updates.host_id !== undefined) dbUpdates.host_id = updates.host_id;
  if (updates.attendance_required !== undefined) dbUpdates.attendance_required = updates.attendance_required;
  if (updates.check_in_window_start_min !== undefined) dbUpdates.check_in_window_start_min = updates.check_in_window_start_min;
  if (updates.check_in_window_end_min !== undefined) dbUpdates.check_in_window_end_min = updates.check_in_window_end_min;
  if (updates.late_threshold_min !== undefined) dbUpdates.late_threshold_min = updates.late_threshold_min;
  if (updates.is_geofence_enabled !== undefined) dbUpdates.is_geofence_enabled = updates.is_geofence_enabled;

  const { data: updated, error } = await (admin as any)
    .from("events")
    .update(dbUpdates)
    .eq("id", id)
    .select(`
      *,
      departments:department_id (id, name),
      created_by:created_by_id (id, name, avatar_url, role),
      rsvps (id, user_id, status)
    `)
    .single();

  if (error) throw error;
  return normalizeEvent(updated);
}

export async function deleteEvent(id: string): Promise<void> {
  const admin = getAdminClient();
  try {
    const event = await getEventById(id);
    if (event?.linkedAnnouncementId) {
      await (admin as any).from("announcements").delete().eq("id", event.linkedAnnouncementId);
    }
    await (admin as any).from("qr_sessions").delete().eq("event_id", id);
    await (admin as any).from("excuse_requests").delete().eq("event_id", id);
  } catch (cleanErr) {
    console.warn("Notice: Non-critical cleanup issue in deleteEvent:", cleanErr);
  }

  const { error } = await (admin as any).from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function updateEventCheckInStatus(
  eventId: string,
  status: "OPEN" | "PAUSED" | "CLOSED",
  userId: string
): Promise<any> {
  if (status === "CLOSED") {
    return closeEventAttendance(eventId, userId);
  }
  return updateEvent(eventId, { check_in_status: status });
}

/**
 * Closes attendance and automatically marks Absent for all expected attendees who didn't check in.
 */
export async function closeEventAttendance(eventId: string, closedById: string): Promise<any> {
  const admin = getAdminClient();
  const event = await getEventById(eventId);
  if (!event) throw new Error("Event not found");

  // 1. Determine expected attendees based on audience scope
  let expectedUsersQuery = (admin as any)
    .from("profiles")
    .select("id, name, email, department_id, role")
    .eq("status", "ACTIVE");

  if (event.audienceScope === "DEPARTMENT" && event.departmentId) {
    expectedUsersQuery = expectedUsersQuery.eq("department_id", event.departmentId);
  } else if (event.audienceScope === "BOARD") {
    expectedUsersQuery = expectedUsersQuery.in("role", ["PRESIDENT", "VICE_PRESIDENT", "BOARD"]);
  } else {
    // Whole club: active members and executive leadership
    expectedUsersQuery = expectedUsersQuery.in("role", [
      "MEMBER",
      "HOD",
      "BOARD",
      "PRESIDENT",
      "VICE_PRESIDENT",
    ]);
  }

  const { data: expectedProfiles } = await expectedUsersQuery;
  const expectedMap = new Map<string, any>();
  (expectedProfiles || []).forEach((p: any) => expectedMap.set(p.id, p));

  // Also add any user who RSVP'd GOING
  (event.rsvps || []).forEach((r: any) => {
    if (r.status === "GOING" && r.userId) {
      if (!expectedMap.has(r.userId)) {
        expectedMap.set(r.userId, { id: r.userId });
      }
    }
  });

  // 2. Identify who checked in vs who didn't
  const checkedInUserIds = new Set<string>();
  (event.attendanceRecords || []).forEach((a: any) => {
    if (a.userId) checkedInUserIds.add(a.userId);
  });

  const nowIso = new Date().toISOString();
  const absentRecordsToInsert: any[] = [];

  expectedMap.forEach((member, userId) => {
    if (!checkedInUserIds.has(userId)) {
      absentRecordsToInsert.push({
        event_id: eventId,
        user_id: userId,
        status: "ABSENT",
        method: "MANUAL",
        justification: "Non-émargé à la clôture de la session",
        checked_in_at: nowIso,
      });
    }
  });

  // 3. Batch insert Absent records (upsert to avoid conflict)
  if (absentRecordsToInsert.length > 0) {
    try {
      await (admin as any)
        .from("attendance_records")
        .upsert(absentRecordsToInsert, { onConflict: "event_id,user_id" });
    } catch (upsertErr) {
      console.error("Warning during absent records batch upsert:", upsertErr);
    }
  }

  // 4. Update event check-in status to CLOSED (both database column and metadata)
  const updatedEvent = await updateEvent(eventId, {
    check_in_status: "CLOSED",
    closed_at: nowIso,
    closed_by_id: closedById,
  });

  await createAuditLog({
    user_id: closedById,
    action: "ATTENDANCE_SESSION_CLOSED",
    details: `Closed attendance for event "${event.title}". Auto-marked ${absentRecordsToInsert.length} expected members as ABSENT.`,
  });

  return {
    event: updatedEvent,
    autoMarkedAbsentCount: absentRecordsToInsert.length,
    totalExpected: expectedMap.size,
  };
}

export async function countEvents(filter?: { after?: Date }): Promise<number> {
  const admin = getAdminClient();
  let query = (admin as any).from("events").select("*", { count: "exact", head: true });
  if (filter?.after) query = query.lte("start_time", filter.after.toISOString());
  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}

export async function checkEventConflict(location: string, department_id: string | null, start: Date, end: Date): Promise<any[]> {
  const admin = getAdminClient();
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const { data: locationConflicts } = await (admin as any)
    .from("events")
    .select("id, title")
    .eq("location", location)
    .lt("start_time", endIso)
    .gt("end_time", startIso);

  let deptQuery = (admin as any)
    .from("events")
    .select("id, title")
    .lt("start_time", endIso)
    .gt("end_time", startIso);

  if (department_id) {
    deptQuery = deptQuery.or(`department_id.is.null,department_id.eq.${department_id}`);
  } else {
    deptQuery = deptQuery.is("department_id", null);
  }

  const { data: deptConflicts } = await deptQuery;

  const allConflicts = [
    ...(locationConflicts || []),
    ...(deptConflicts || []),
  ];
  const seen = new Set<string>();
  return allConflicts.filter((e: any) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

// ---------------------------------------------------------------------------
// RSVP
// ---------------------------------------------------------------------------

export async function upsertRSVP(data: { event_id: string; user_id: string; status: "GOING" | "MAYBE" | "DECLINED" }): Promise<any> {
  const admin = getAdminClient();
  const { data: rsvp, error } = await (admin as any)
    .from("rsvps")
    .upsert(data, { onConflict: "event_id,user_id" })
    .select(`
      *,
      user:user_id (id, name, email, avatar_url)
    `)
    .single();
  if (error) throw error;
  return rsvp;
}

// ---------------------------------------------------------------------------
// ATTENDANCE & AUDIT LOGGING
// ---------------------------------------------------------------------------

export async function getAttendanceRecords(filters: {
  event_id?: string;
  user_id?: string;
} = {}): Promise<any[]> {
  const admin = getAdminClient();
  let query = (admin as any)
    .from("attendance_records")
    .select(`
      *,
      events:event_id (
        id, title, start_time, end_time, location, description,
        departments:department_id (id, name)
      ),
      user:user_id (id, name, email, role, department_id, avatar_url,
        departments:department_id (id, name)
      )
    `)
    .order("checked_in_at", { ascending: false });

  if (filters.event_id) query = query.eq("event_id", filters.event_id);
  if (filters.user_id) query = query.eq("user_id", filters.user_id);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeAttendance);
}

export async function getAttendanceByUser(userId: string): Promise<any[]> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("attendance_records")
    .select(`
      *,
      events:event_id (id, title, start_time, location, description)
    `)
    .eq("user_id", userId)
    .order("checked_in_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeAttendance);
}

export async function upsertAttendance(data: Record<string, unknown>): Promise<any> {
  const admin = getAdminClient();

  let statusToStore = (data.status as string) || "PRESENT";
  let justificationToStore = (data.justification as string) || "";

  // Resilient status encoding if DB constraint doesn't have LATE yet
  if (statusToStore === "LATE") {
    justificationToStore = `[LATE] ${justificationToStore}`.trim();
    // try inserting LATE, fallback to PRESENT with [LATE] justification tag
    try {
      const { data: rec, error } = await (admin as any)
        .from("attendance_records")
        .upsert({ ...data, status: "LATE" }, { onConflict: "event_id,user_id" })
        .select(`*, events:event_id (id, title), user:user_id (id, name, email)`)
        .single();
      if (!error && rec) return normalizeAttendance(rec);
    } catch {
      statusToStore = "PRESENT";
    }
  }

  const { data: record, error } = await (admin as any)
    .from("attendance_records")
    .upsert(
      {
        ...data,
        status: statusToStore,
        justification: justificationToStore || null,
      },
      { onConflict: "event_id,user_id" }
    )
    .select(`
      *,
      events:event_id (id, title),
      user:user_id (id, name, email)
    `)
    .single();

  if (error) throw error;
  return normalizeAttendance(record);
}

export async function updateAttendanceRecordStatus(
  eventId: string,
  userId: string,
  newStatus: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED",
  reason: string,
  changedById: string
): Promise<any> {
  const admin = getAdminClient();

  // 1. Fetch current status
  const { data: current } = await (admin as any)
    .from("attendance_records")
    .select("status, justification")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  const oldStatus = current?.status || "ABSENT";

  // 2. Upsert record with manual audit metadata
  const updated = await upsertAttendance({
    event_id: eventId,
    user_id: userId,
    status: newStatus,
    method: "MANUAL",
    justification: reason,
    manual_reason: reason,
    marked_by_id: changedById,
    checked_in_at: new Date().toISOString(),
  });

  // 3. Log into audit_logs
  await createAuditLog({
    user_id: changedById,
    action: "ATTENDANCE_OVERRIDE",
    details: `Manual status change: ${oldStatus} -> ${newStatus} for user ${userId} on event ${eventId}. Reason: "${reason}"`,
  });

  return updated;
}

export async function submitExcuseRequest(data: {
  event_id: string;
  user_id: string;
  reason: string;
  attachment_url?: string;
}): Promise<any> {
  const admin = getAdminClient();

  // Try inserting into dedicated excuse_requests table
  try {
    const { data: excuse, error } = await (admin as any)
      .from("excuse_requests")
      .upsert(
        {
          event_id: data.event_id,
          user_id: data.user_id,
          reason: data.reason,
          attachment_url: data.attachment_url || null,
          status: "PENDING",
        },
        { onConflict: "event_id,user_id" }
      )
      .select()
      .single();

    if (!error && excuse) {
      await createAuditLog({
        user_id: data.user_id,
        action: "EXCUSE_REQUEST_SUBMITTED",
        details: `Submitted excuse for event ${data.event_id}: "${data.reason}"`,
      });
      return excuse;
    }
  } catch {
    // table fallback
  }

  // Fallback: save excuse into attendance_records justification tag
  const fallbackRecord = await upsertAttendance({
    event_id: data.event_id,
    user_id: data.user_id,
    status: "ABSENT",
    method: "MANUAL",
    justification: `[EXCUSE_PENDING] ${data.reason}`,
    checked_in_at: new Date().toISOString(),
  });

  await createAuditLog({
    user_id: data.user_id,
    action: "EXCUSE_REQUEST_SUBMITTED",
    details: `Submitted excuse for event ${data.event_id}: "${data.reason}"`,
  });

  return {
    id: `excuse_${Date.now()}`,
    eventId: data.event_id,
    userId: data.user_id,
    reason: data.reason,
    status: "PENDING",
  };
}

export async function reviewExcuseRequest(
  eventId: string,
  userId: string,
  decision: "APPROVED" | "REJECTED",
  reviewerId: string,
  notes?: string
): Promise<any> {
  const admin = getAdminClient();

  if (decision === "APPROVED") {
    await updateAttendanceRecordStatus(
      eventId,
      userId,
      "EXCUSED",
      notes ? `Excuse approuvée: ${notes}` : "Excuse approuvée par le responsable",
      reviewerId
    );
  } else {
    await updateAttendanceRecordStatus(
      eventId,
      userId,
      "ABSENT",
      notes ? `Excuse rejetée: ${notes}` : "Excuse rejetée par le responsable",
      reviewerId
    );
  }

  // Update excuse_requests table if present
  try {
    await (admin as any)
      .from("excuse_requests")
      .update({
        status: decision,
        reviewed_by_id: reviewerId,
        reviewer_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", eventId)
      .eq("user_id", userId);
  } catch {
    // ignore
  }

  await createAuditLog({
    user_id: reviewerId,
    action: `EXCUSE_${decision}`,
    details: `Excuse for user ${userId} on event ${eventId} was ${decision} by ${reviewerId}. Notes: "${notes || ""}"`,
  });

  return { success: true, decision };
}

export async function getExcuseRequests(filters: {
  eventId?: string;
  userId?: string;
  departmentId?: string;
} = {}): Promise<any[]> {
  const admin = getAdminClient();
  const excuses: any[] = [];

  try {
    let query = (admin as any)
      .from("excuse_requests")
      .select(`
        *,
        events:event_id (id, title, start_time, department_id),
        user:user_id (id, name, email, department_id, avatar_url)
      `)
      .order("created_at", { ascending: false });

    if (filters.eventId) query = query.eq("event_id", filters.eventId);
    if (filters.userId) query = query.eq("user_id", filters.userId);

    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        eventId: d.event_id,
        userId: d.user_id,
        reason: d.reason,
        attachmentUrl: d.attachment_url,
        status: d.status,
        reviewedById: d.reviewed_by_id,
        reviewerNotes: d.reviewer_notes,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        event: d.events,
        user: d.user,
      }));
    }
  } catch {
    // fallback
  }

  let recQuery = (admin as any)
    .from("attendance_records")
    .select(`
      *,
      events:event_id (id, title, start_time, department_id),
      user:user_id (id, name, email, department_id, avatar_url)
    `);

  if (filters.eventId) recQuery = recQuery.eq("event_id", filters.eventId);
  if (filters.userId) recQuery = recQuery.eq("user_id", filters.userId);

  const { data: recs } = await recQuery;
  (recs || []).forEach((r: any) => {
    const just = r.justification || "";
    if (just.includes("[EXCUSE_PENDING]") || r.status === "EXCUSED") {
      excuses.push({
        id: `exc_${r.id}`,
        eventId: r.event_id,
        userId: r.user_id,
        reason: just.replace("[EXCUSE_PENDING]", "").replace("[EXCUSED]", "").trim() || "Absence signalée",
        status: r.status === "EXCUSED" ? "APPROVED" : "PENDING",
        createdAt: r.checked_in_at || r.created_at,
        event: r.events,
        user: r.user,
      });
    }
  });

  return excuses;
}

export async function findEventByCheckInCode(code: string): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("events")
    .select(`
      *,
      departments:department_id (id, name),
      created_by:created_by_id (id, name, avatar_url, role)
    `)
    .eq("check_in_code", code.trim().toUpperCase())
    .single();
  if (error || !data) return null;
  return normalizeEvent(data);
}

export async function countAttendance(filter?: { status?: string }): Promise<number> {
  const admin = getAdminClient();
  let query = (admin as any).from("attendance_records").select("*", { count: "exact", head: true });
  if (filter?.status) query = query.eq("status", filter.status as any);
  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}

// ---------------------------------------------------------------------------
// ANNOUNCEMENTS
// ---------------------------------------------------------------------------

export function normalizeAnnouncement(a: any): any {
  if (!a) return null;
  let eventId = a.event_id || a.eventId || null;
  let cleanBody = a.body || "";
  const eventMatch = cleanBody.match(/<!--\s*EVENT_ID:\s*([a-f0-9-]+)\s*-->/i);
  if (eventMatch) {
    eventId = eventMatch[1];
    cleanBody = cleanBody.replace(eventMatch[0], "").trim();
  }
  return {
    ...a,
    body: cleanBody,
    eventId,
  };
}

export async function getAnnouncements(filters: {
  scope?: string;
  department_id?: string;
} = {}): Promise<any[]> {
  const admin = getAdminClient();
  let query = (admin as any)
    .from("announcements")
    .select(`
      *,
      departments:department_id (id, name),
      author:author_id (id, name, role, avatar_url)
    `)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.scope === "CLUB") {
    query = query.eq("scope", "CLUB");
  } else if (filters.department_id && filters.department_id !== "all") {
    query = query.or(`scope.eq.CLUB,department_id.eq.${filters.department_id}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeAnnouncement);
}

export async function createAnnouncement(data: Record<string, any>): Promise<any> {
  const admin = getAdminClient();

  let body = data.body || "";
  if (data.event_id) {
    body = `${body}\n\n<!-- EVENT_ID: ${data.event_id} -->`;
  }

  const payload: any = {
    title: data.title,
    body,
    scope: data.scope || "CLUB",
    department_id: data.department_id || null,
    author_id: data.author_id,
    is_pinned: Boolean(data.is_pinned),
  };

  const { data: announcement, error } = await (admin as any)
    .from("announcements")
    .insert(payload)
    .select(`
      *,
      departments:department_id (id, name),
      author:author_id (id, name, role, avatar_url)
    `)
    .single();

  if (error) throw error;
  return normalizeAnnouncement(announcement);
}

export async function updateAnnouncementByEventId(eventId: string, updates: Record<string, any>): Promise<any> {
  const admin = getAdminClient();
  const announcements = await getAnnouncements();
  const linked = announcements.find((a: any) => a.eventId === eventId);
  if (!linked) return null;

  let body = updates.body !== undefined ? updates.body : linked.body;
  body = `${body}\n\n<!-- EVENT_ID: ${eventId} -->`;

  const payload: any = {
    updated_at: new Date().toISOString(),
    body,
  };
  if (updates.title) payload.title = updates.title;
  if (updates.scope) payload.scope = updates.scope;
  if (updates.department_id !== undefined) payload.department_id = updates.department_id;

  const { data: updated, error } = await (admin as any)
    .from("announcements")
    .update(payload)
    .eq("id", linked.id)
    .select()
    .single();

  if (error) return null;
  return normalizeAnnouncement(updated);
}

export async function getAttendanceMetrics(filters: {
  userId?: string;
  departmentId?: string;
  eventId?: string;
} = {}): Promise<any> {
  const admin = getAdminClient();

  // 1. All past events requiring attendance
  let eventsQuery = (admin as any)
    .from("events")
    .select("id, title, start_time, department_id, description")
    .lte("start_time", new Date().toISOString());

  if (filters.departmentId && filters.departmentId !== "all") {
    eventsQuery = eventsQuery.or(`department_id.is.null,department_id.eq.${filters.departmentId}`);
  }

  const { data: pastEvents } = await eventsQuery;
  const pastEventsList = (pastEvents || []).map(normalizeEvent).filter((e: any) => e.attendanceRequired);
  const totalPastRequiredEvents = pastEventsList.length;

  // 2. Attendance records
  let recordsQuery = (admin as any)
    .from("attendance_records")
    .select(`
      id, event_id, user_id, status, method, checked_in_at, justification, manual_reason, marked_by_id,
      events:event_id (id, title, start_time, department_id),
      user:user_id (id, name, email, department_id, role)
    `);

  if (filters.userId) {
    recordsQuery = recordsQuery.eq("user_id", filters.userId);
  }
  if (filters.eventId) {
    recordsQuery = recordsQuery.eq("event_id", filters.eventId);
  }

  const { data: rawRecords } = await recordsQuery;
  const records = (rawRecords || []).map(normalizeAttendance);

  const presentCount = records.filter((r: any) => r.status === "PRESENT").length;
  const lateCount = records.filter((r: any) => r.status === "LATE").length;
  const absentCount = records.filter((r: any) => r.status === "ABSENT").length;
  const excusedCount = records.filter((r: any) => r.status === "EXCUSED").length;

  const attendedCount = presentCount + lateCount;
  const denominator = filters.userId ? Math.max(totalPastRequiredEvents, 1) : Math.max(records.length, 1);
  const attendanceRate = totalPastRequiredEvents > 0
    ? Math.min(100, Math.round((attendedCount / denominator) * 100))
    : 100;

  return {
    totalPastRequiredEvents,
    totalRecords: records.length,
    presentCount,
    lateCount,
    absentCount,
    excusedCount,
    attendedCount,
    attendanceRate,
    records,
  };
}

// ---------------------------------------------------------------------------
// APPLICATIONS
// ---------------------------------------------------------------------------

function normalizeApplication(app: any) {
  if (!app) return null;
  let status = app.status;
  if (status === "PENDING" && app.reviewer_notes?.includes("[STATUS:INTERVIEW]")) {
    status = "INTERVIEW";
  }
  return {
    ...app,
    status,
  };
}

export async function getApplications(filters: {
  department?: string;
  status?: string;
} = {}): Promise<any[]> {
  const admin = getAdminClient();
  let query = (admin as any)
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.department && filters.department !== "all") {
    query = query.eq("department_preference", filters.department);
  }
  if (filters.status && filters.status !== "all") {
    if (filters.status === "INTERVIEW") {
      query = query.or("status.eq.INTERVIEW,reviewer_notes.ilike.%[STATUS:INTERVIEW]%");
    } else {
      query = query.eq("status", filters.status);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeApplication);
}

export async function getApplicationById(id: string): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return normalizeApplication(data);
}

export async function getApplicationByEmail(email: string): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("applications")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();
  if (error) return null;
  return normalizeApplication(data);
}

export async function createApplication(data: Record<string, unknown>): Promise<any> {
  const admin = getAdminClient();
  const { data: application, error } = await (admin as any)
    .from("applications")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return normalizeApplication(application);
}

export async function updateApplication(id: string, updates: Record<string, unknown>): Promise<any> {
  const admin = getAdminClient();
  try {
    const { data, error } = await (admin as any)
      .from("applications")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return normalizeApplication(data);
  } catch (err: any) {
    if (updates.status === "INTERVIEW") {
      const fallbackNotes = (updates.reviewer_notes ? `${updates.reviewer_notes} | ` : "") + "[STATUS:INTERVIEW]";
      const fallbackUpdates = {
        ...updates,
        status: "PENDING",
        reviewer_notes: fallbackNotes,
        updated_at: new Date().toISOString(),
      };
      const { data: fallbackData, error: fbErr } = await (admin as any)
        .from("applications")
        .update(fallbackUpdates)
        .eq("id", id)
        .select()
        .single();
      if (!fbErr && fallbackData) {
        return { ...fallbackData, status: "INTERVIEW" };
      }
    }
    throw err;
  }
}

export async function countApplications(filter?: { status?: string }): Promise<number> {
  const admin = getAdminClient();
  let query = (admin as any).from("applications").select("*", { count: "exact", head: true });
  if (filter?.status) query = query.eq("status", filter.status as any);
  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}

// ---------------------------------------------------------------------------
// AUDIT LOGS
// ---------------------------------------------------------------------------

export async function createAuditLog(data: { user_id?: string | null; action: string; details: string }): Promise<void> {
  const admin = getAdminClient();
  await (admin as any).from("audit_logs").insert(data);
}

export async function getRecentAuditLogs(limit = 20): Promise<any[]> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("audit_logs")
    .select(`
      *,
      user:user_id (id, name, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as any[];
}

// ---------------------------------------------------------------------------
// ORG CHART
// ---------------------------------------------------------------------------

export async function getOrgChart(): Promise<any> {
  const admin = getAdminClient();

  const [boardSeatsRes, departmentsRes] = await Promise.all([
    (admin as any)
      .from("board_seats")
      .select(`
        *,
        user:user_id (id, name, email, avatar_url, bio, skills, status)
      `)
      .order("order", { ascending: true }),
    (admin as any)
      .from("departments")
      .select(`
        *,
        hod:hod_user_id (id, name, email, avatar_url, bio, skills, freelance_ready),
        members:profiles!profiles_department_id_fkey (
          id, name, email, avatar_url, skills, freelance_ready, role, status
        )
      `)
      .order("name", { ascending: true }),
  ]);

  if (boardSeatsRes.error) throw boardSeatsRes.error;
  if (departmentsRes.error) throw departmentsRes.error;

  return {
    board: (boardSeatsRes.data || []).map((b: any) => ({
      id: b.id,
      title: b.title,
      order: b.order,
      user: {
        ...b.user,
        skills: parseSkills(b.user?.skills),
      },
    })),
    departments: (departmentsRes.data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      description: d.description,
      icon: d.icon,
      hod: d.hod
        ? { ...d.hod, skills: parseSkills(d.hod.skills) }
        : null,
      members: (d.members || [])
        .filter((m: any) => m && m.role === "MEMBER" && m.status === "ACTIVE")
        .map((m: any) => ({
          ...m,
          skills: parseSkills(m.skills),
        })),
    })),
  };
}

// ---------------------------------------------------------------------------
// DASHBOARD AGGREGATES
// ---------------------------------------------------------------------------

export async function getDashboardOverview(): Promise<any> {
  const [
    totalMembers,
    totalDepartments,
    pendingApplications,
    totalTasks,
    completedTasks,
    totalEvents,
    totalAttendance,
  ] = await Promise.all([
    countActiveMembers(),
    countDepartments(),
    countApplications({ status: "PENDING" }),
    countTasks(),
    countTasks({ status: "DONE" }),
    countEvents(),
    countAttendance({ status: "PRESENT" }),
  ]);

  const taskCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalMembers,
    totalDepartments,
    pendingApplications,
    totalTasks,
    completedTasks,
    taskCompletionRate,
    totalEvents,
    totalAttendance,
  };
}

// ---------------------------------------------------------------------------
// CONNECTED ACCOUNTS & SOCIAL PROFILES
// ---------------------------------------------------------------------------

export function normalizeConnection(c: any): any {
  if (!c) return null;
  return {
    id: c.id,
    userId: c.user_id || c.userId,
    provider: c.provider,
    type: c.type || "manual",
    providerUserId: c.provider_user_id || c.providerUserId || null,
    username: c.username || "",
    profileUrl: c.profile_url || c.profileUrl || "",
    avatarUrl: c.avatar_url || c.avatarUrl || null,
    customLabel: c.custom_label || c.customLabel || null,
    isVerified: Boolean(c.is_verified ?? c.isVerified ?? false),
    visibility: c.visibility || "members",
    displayOrder: c.display_order ?? c.displayOrder ?? 0,
    metadata: c.metadata || {},
    linkedAt: c.linked_at || c.linkedAt || new Date().toISOString(),
    updatedAt: c.updated_at || c.updatedAt || new Date().toISOString(),
  };
}

export async function getMemberConnections(
  targetUserId: string,
  viewerUserId?: string | null
): Promise<any[]> {
  const admin = getAdminClient();
  let query = (admin as any)
    .from("member_connections")
    .select("*")
    .eq("user_id", targetUserId)
    .order("display_order", { ascending: true })
    .order("linked_at", { ascending: true });

  const isOwner = viewerUserId && viewerUserId === targetUserId;

  if (isOwner) {
    // Owner can view all their connections including 'private'
  } else if (viewerUserId) {
    // Logged-in member: can view 'public' and 'members' only
    query = query.in("visibility", ["public", "members"]);
  } else {
    // Unauthenticated: can view 'public' only
    query = query.eq("visibility", "public");
  }

  const { data, error } = await query;
  if (error) {
    // Fallback if table doesn't exist yet before SQL migration is run
    return [];
  }
  return (data || []).map(normalizeConnection);
}

export async function createMemberConnection(
  data: Record<string, any>
): Promise<any> {
  const admin = getAdminClient();

  // If OAuth: ensure provider_user_id is not already linked to another user
  if (data.type === "oauth" && data.providerUserId) {
    const { data: existingOther } = await (admin as any)
      .from("member_connections")
      .select("id, user_id")
      .eq("provider", data.provider)
      .eq("provider_user_id", data.providerUserId)
      .neq("user_id", data.userId)
      .maybeSingle();

    if (existingOther) {
      throw new Error(
        "Ce compte externe est déjà associé à un autre membre d'Asteria Club. Chaque compte externe ne peut être lié qu'à un seul profil."
      );
    }
  }

  // Count existing manual links if manual
  if (data.type === "manual") {
    const { count } = await (admin as any)
      .from("member_connections")
      .select("*", { count: "exact", head: true })
      .eq("user_id", data.userId)
      .eq("type", "manual");

    if ((count || 0) >= 10) {
      throw new Error("Limite atteinte : Vous ne pouvez pas ajouter plus de 10 liens manuels.");
    }
  }

  const insertPayload: any = {
    user_id: data.userId,
    provider: data.provider,
    type: data.type || "manual",
    provider_user_id: data.providerUserId || null,
    username: data.username,
    profile_url: data.profileUrl,
    avatar_url: data.avatarUrl || null,
    custom_label: data.customLabel || null,
    is_verified: Boolean(data.isVerified),
    visibility: data.visibility || "members",
    display_order: data.displayOrder ?? 0,
    metadata: data.metadata || {},
    updated_at: new Date().toISOString(),
  };

  let created: any;
  if (data.type === "oauth") {
    const { data: existing } = await (admin as any)
      .from("member_connections")
      .select("id")
      .eq("user_id", data.userId)
      .eq("provider", data.provider)
      .maybeSingle();

    if (existing?.id) {
      const { data: updated, error: updateError } = await (admin as any)
        .from("member_connections")
        .update(insertPayload)
        .eq("id", existing.id)
        .select()
        .single();
      if (updateError) throw updateError;
      created = updated;
    } else {
      const { data: inserted, error: insertError } = await (admin as any)
        .from("member_connections")
        .insert(insertPayload)
        .select()
        .single();
      if (insertError) throw insertError;
      created = inserted;
    }
  } else {
    const { data: inserted, error: insertError } = await (admin as any)
      .from("member_connections")
      .insert(insertPayload)
      .select()
      .single();
    if (insertError) throw insertError;
    created = inserted;
  }

  return normalizeConnection(created);
}

export async function updateMemberConnection(
  id: string,
  userId: string,
  updates: Record<string, any>
): Promise<any> {
  const admin = getAdminClient();

  const payload: any = {
    updated_at: new Date().toISOString(),
  };
  if (updates.visibility !== undefined) payload.visibility = updates.visibility;
  if (updates.customLabel !== undefined) payload.custom_label = updates.customLabel;
  if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;
  if (updates.username !== undefined) payload.username = updates.username;
  if (updates.profileUrl !== undefined) payload.profile_url = updates.profileUrl;

  const { data, error } = await (admin as any)
    .from("member_connections")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return normalizeConnection(data);
}

export async function deleteMemberConnection(
  id: string,
  userId: string,
  adminId?: string,
  moderationReason?: string
): Promise<void> {
  const admin = getAdminClient();

  // If this is a moderation deletion by a Board member
  if (adminId && adminId !== userId) {
    const { data: targetConn } = await (admin as any)
      .from("member_connections")
      .select("*")
      .eq("id", id)
      .single();

    if (targetConn) {
      await (admin as any).from("connection_moderation_log").insert({
        admin_id: adminId,
        member_id: targetConn.user_id,
        connection_id: id,
        provider: targetConn.provider,
        profile_url: targetConn.profile_url,
        action: "REMOVED",
        reason: moderationReason || "Lien supprimé par la modération du Bureau",
      });

      await createAuditLog({
        user_id: adminId,
        action: "SOCIAL_CONNECTION_MODERATED",
        details: `Board removed manual link "${targetConn.provider}" for user ${targetConn.user_id}. Reason: "${moderationReason}"`,
      });
    }

    const { error } = await (admin as any)
      .from("member_connections")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return;
  }

  // Normal owner deletion
  const { error } = await (admin as any)
    .from("member_connections")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function getConnectedAccountsStats(): Promise<Record<string, number>> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("member_connections")
    .select("provider");

  if (error || !data) return {};

  const stats: Record<string, number> = {};
  data.forEach((row: any) => {
    stats[row.provider] = (stats[row.provider] || 0) + 1;
  });
  return stats;
}

