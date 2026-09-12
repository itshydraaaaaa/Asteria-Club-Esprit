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
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;

  const deptsWithCounts = await Promise.all(
    ((depts || []) as any[]).map(async (dept: any) => {
      const [{ count: memberCount }, { count: taskCount }, { count: eventCount }] =
        await Promise.all([
          (admin as any).from("profiles").select("*", { count: "exact", head: true }).eq("department_id", dept.id).eq("status", "ACTIVE"),
          (admin as any).from("tasks").select("*", { count: "exact", head: true }).eq("department_id", dept.id),
          (admin as any).from("events").select("*", { count: "exact", head: true }).eq("department_id", dept.id),
        ]);
      return {
        ...dept,
        _count: {
          members: memberCount || 0,
          tasks: taskCount || 0,
          events: eventCount || 0,
        },
      };
    })
  );
  return deptsWithCounts;
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
// EVENTS
// ---------------------------------------------------------------------------

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
      created_by:created_by_id (id, name),
      rsvps (
        id, status, user_id,
        user:user_id (id, name, avatar_url, role)
      ),
      attendance_records (
        id, user_id, status, method, checked_in_at,
        user:user_id (id, name, avatar_url)
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
  return (data || []) as any[];
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
  return (data || []) as any[];
}

export async function createEvent(data: Record<string, unknown>): Promise<any> {
  const admin = getAdminClient();
  const { data: event, error } = await (admin as any)
    .from("events")
    .insert(data)
    .select(`
      *,
      departments:department_id (id, name),
      created_by:created_by_id (id, name),
      rsvps (id, user_id, status)
    `)
    .single();
  if (error) throw error;
  return event;
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
// ATTENDANCE
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
        id, title, start_time, end_time, location,
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
  return (data || []) as any[];
}

export async function getAttendanceByUser(userId: string): Promise<any[]> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("attendance_records")
    .select(`
      *,
      events:event_id (id, title, start_time, location)
    `)
    .eq("user_id", userId)
    .order("checked_in_at", { ascending: false });
  if (error) throw error;
  return (data || []) as any[];
}

export async function upsertAttendance(data: Record<string, unknown>): Promise<any> {
  const admin = getAdminClient();
  const { data: record, error } = await (admin as any)
    .from("attendance_records")
    .upsert(data, { onConflict: "event_id,user_id" })
    .select(`
      *,
      events:event_id (id, title),
      user:user_id (id, name, email)
    `)
    .single();
  if (error) throw error;
  return record;
}

export async function findEventByCheckInCode(code: string): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("events")
    .select("*")
    .eq("check_in_code", code.trim().toUpperCase())
    .single();
  if (error) return null;
  return data;
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
  return (data || []) as any[];
}

export async function createAnnouncement(data: Record<string, unknown>): Promise<any> {
  const admin = getAdminClient();
  const { data: announcement, error } = await (admin as any)
    .from("announcements")
    .insert(data)
    .select(`
      *,
      departments:department_id (id, name),
      author:author_id (id, name, role, avatar_url)
    `)
    .single();
  if (error) throw error;
  return announcement;
}

// ---------------------------------------------------------------------------
// APPLICATIONS
// ---------------------------------------------------------------------------

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
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as any[];
}

export async function getApplicationById(id: string): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getApplicationByEmail(email: string): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("applications")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();
  if (error) return null;
  return data;
}

export async function createApplication(data: Record<string, unknown>): Promise<any> {
  const admin = getAdminClient();
  const { data: application, error } = await (admin as any)
    .from("applications")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return application;
}

export async function updateApplication(id: string, updates: Record<string, unknown>): Promise<any> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("applications")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
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
