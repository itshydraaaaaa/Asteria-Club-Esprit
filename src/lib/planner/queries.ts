/**
 * Asteria Club Esprit — Activity Planner Supabase Query Layer
 * Pure query module separate from src/lib/supabase/queries.ts.
 * Follows RLS strictly using createClient() from src/lib/supabase/server.ts.
 * Uses getAdminClient() strictly when explicit cross-user privileges are necessary
 * (e.g., syncing events/event_hosts rows and creating in-app notifications).
 */

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  ActivityItem,
  ActivityType,
  ActivityTemplate,
  ActivityTaskItem,
  AdminContactItem,
  EmailTemplateItem,
  ActivityEmailItem,
  ActivityRequirementItem,
  PlannerResourceItem,
  ActivityAgendaItem,
  ActivityReportItem,
  ActivityCommentItem,
  ActivityFileItem,
  ActivityStatus,
} from "./types";
import { calculateTaskDueDate } from "./logic";

// ---------------------------------------------------------------------------
// 1. SETTINGS
// ---------------------------------------------------------------------------

export async function getPlannerSettings(): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("planner_settings")
    .select("key, value");

  if (error || !data) return {};
  const result: Record<string, unknown> = {};
  for (const row of data) {
    result[row.key] = row.value;
  }
  return result;
}

export async function getPlannerSetting<T = unknown>(key: string): Promise<T | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("planner_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error || !data) return null;
  return data.value as T;
}

export async function updatePlannerSetting(
  key: string,
  value: Record<string, unknown> | boolean | number,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await (supabase as any)
    .from("planner_settings")
    .upsert({
      key,
      value,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
  return true;
}

// ---------------------------------------------------------------------------
// 2. ACTIVITY TYPES & TEMPLATES
// ---------------------------------------------------------------------------

export async function getActivityTypes(): Promise<ActivityType[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_types")
    .select("*")
    .order("default_lead_days", { ascending: false });

  if (error) throw error;
  return (data || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    icon: t.icon,
    description: t.description,
    defaultLeadDays: t.default_lead_days,
    createdAt: t.created_at,
  }));
}

export async function getActivityTemplates(typeId?: string): Promise<ActivityTemplate[]> {
  const supabase = await createClient();
  let query = (supabase as any)
    .from("activity_templates")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (typeId) {
    query = query.eq("activity_type_id", typeId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((t: any) => ({
    id: t.id,
    activityTypeId: t.activity_type_id,
    name: t.name,
    tasks: t.tasks || [],
    requirements: t.requirements || [],
    requiredOffices: t.required_offices || [],
    isActive: t.is_active,
    createdAt: t.created_at,
  }));
}

export async function getActivityTemplateById(id: string): Promise<ActivityTemplate | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    activityTypeId: data.activity_type_id,
    name: data.name,
    tasks: data.tasks || [],
    requirements: data.requirements || [],
    requiredOffices: data.required_offices || [],
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}

// ---------------------------------------------------------------------------
// 3. ACTIVITIES (CRUD)
// ---------------------------------------------------------------------------

export async function getActivities(filters: {
  status?: ActivityStatus;
  typeId?: string;
  departmentId?: string;
  limit?: number;
} = {}): Promise<ActivityItem[]> {
  const supabase = await createClient();
  let query = (supabase as any)
    .from("activities")
    .select(`
      *,
      type:type_id (id, name, color, icon, default_lead_days),
      department:department_id (id, name, slug),
      owner:owner_id (id, name, email, avatar_url)
    `)
    .order("starts_at", { ascending: true });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.typeId) query = query.eq("type_id", filters.typeId);
  if (filters.departmentId) query = query.eq("department_id", filters.departmentId);
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(mapActivityRecord);
}

export async function getActivityById(id: string): Promise<ActivityItem | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activities")
    .select(`
      *,
      type:type_id (id, name, color, icon, default_lead_days),
      department:department_id (id, name, slug),
      owner:owner_id (id, name, email, avatar_url),
      members:activity_members (
        activity_id, profile_id, role,
        profile:profile_id (id, name, email, avatar_url)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapActivityRecord(data);
}

export async function createActivity(payload: {
  title: string;
  slug: string;
  typeId: string;
  departmentId?: string | null;
  ownerId: string;
  status?: ActivityStatus;
  idea?: string | null;
  objectives?: string[];
  audience?: string | null;
  expectedAttendance?: number;
  format?: "IN_PERSON" | "ONLINE" | "HYBRID";
  location?: string | null;
  venueResourceId?: string | null;
  startsAt: string;
  endsAt: string;
  budgetEstimate?: number;
  facilitators?: string | null;
  templateId?: string | null;
  userId: string;
  coOwnerIds?: string[];
}): Promise<ActivityItem> {
  const supabase = await createClient();

  const insertData = {
    title: payload.title,
    slug: payload.slug,
    type_id: payload.typeId,
    department_id: payload.departmentId || null,
    owner_id: payload.ownerId,
    status: payload.status || "IDEA",
    idea: payload.idea || null,
    objectives: payload.objectives || [],
    audience: payload.audience || null,
    expected_attendance: payload.expectedAttendance || 0,
    format: payload.format || "IN_PERSON",
    location: payload.location || null,
    venue_resource_id: payload.venueResourceId || null,
    starts_at: payload.startsAt,
    ends_at: payload.endsAt,
    budget_estimate: payload.budgetEstimate || 0,
    facilitators: payload.facilitators || null,
    template_id: payload.templateId || null,
    created_by_id: payload.userId,
  };

  const { data: activity, error } = await (supabase as any)
    .from("activities")
    .insert(insertData)
    .select(`
      *,
      type:type_id (id, name, color, icon, default_lead_days),
      department:department_id (id, name, slug),
      owner:owner_id (id, name, email, avatar_url)
    `)
    .single();

  if (error) throw error;

  // Automatically insert creator/owner as OWNER in activity_members
  const memberRows: Array<{ activity_id: string; profile_id: string; role: string }> = [
    {
      activity_id: activity.id,
      profile_id: payload.ownerId,
      role: "OWNER",
    },
  ];

  if (Array.isArray(payload.coOwnerIds)) {
    for (const coId of payload.coOwnerIds) {
      if (coId && coId !== payload.ownerId) {
        memberRows.push({
          activity_id: activity.id,
          profile_id: coId,
          role: "CO_OWNER",
        });
      }
    }
  }

  await (supabase as any)
    .from("activity_members")
    .upsert(memberRows, { onConflict: "activity_id,profile_id" });

  return mapActivityRecord(activity);
}

export async function updateActivity(
  id: string,
  updates: Record<string, unknown>
): Promise<ActivityItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activities")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(`
      *,
      type:type_id (id, name, color, icon, default_lead_days),
      department:department_id (id, name, slug),
      owner:owner_id (id, name, email, avatar_url),
      members:activity_members (
        activity_id, profile_id, role,
        profile:profile_id (id, name, email, avatar_url)
      )
    `)
    .single();

  if (error) throw error;
  return mapActivityRecord(data);
}

export async function upsertActivityMember(
  activityId: string,
  profileId: string,
  role: "OWNER" | "CO_OWNER" | "CONTRIBUTOR"
) {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_members")
    .upsert(
      { activity_id: activityId, profile_id: profileId, role },
      { onConflict: "activity_id,profile_id" }
    )
    .select(`
      activity_id, profile_id, role,
      profile:profile_id (id, name, email, avatar_url)
    `)
    .single();

  if (error) throw error;
  return {
    activityId: data.activity_id,
    profileId: data.profile_id,
    role: data.role,
    profile: data.profile
      ? {
          id: data.profile.id,
          name: data.profile.name,
          email: data.profile.email,
          avatarUrl: data.profile.avatar_url,
        }
      : undefined,
  };
}

export async function removeActivityMember(activityId: string, profileId: string) {
  const supabase = await createClient();
  const { error } = await (supabase as any)
    .from("activity_members")
    .delete()
    .eq("activity_id", activityId)
    .eq("profile_id", profileId);

  if (error) throw error;
  return true;
}

// ---------------------------------------------------------------------------
// 4. TEMPLATE INSTANTIATION TRANSACTION
// ---------------------------------------------------------------------------

/**
 * Instantiates an activity from a template (with optional user overrides from Wizard Step 2):
 * Creates tasks in the existing tasks table, requirements, and email drafts.
 */
export async function instantiateActivityFromTemplate(params: {
  activityId: string;
  templateId: string;
  activityStartDate: string;
  ownerId: string;
  departmentId?: string | null;
  createdById: string;
  customTasks?: Array<{
    title: string;
    offset_days: number;
    default_role?: string;
    section?: string;
    assignee_id?: string | null;
  }>;
  customRequirements?: Array<{
    category: string;
    title: string;
    quantity: number;
    resource_id?: string | null;
    est_cost?: number;
  }>;
  customOffices?: string[];
  emailContext?: Record<string, string | number>;
}): Promise<{ tasksCreated: number; requirementsCreated: number; emailsCreated: number }> {
  const supabase = await createClient();
  const template = await getActivityTemplateById(params.templateId);
  if (!template) {
    throw new Error("Modèle d'activité introuvable.");
  }

  const now = new Date();
  let tasksCreated = 0;
  let requirementsCreated = 0;
  let emailsCreated = 0;

  const sourceTasks = params.customTasks ?? template.tasks ?? [];
  const sourceRequirements = params.customRequirements ?? template.requirements ?? [];
  const sourceOffices = params.customOffices ?? template.requiredOffices ?? [];

  // 1. Generate Tasks from template
  if (sourceTasks.length > 0) {
    const taskInserts = sourceTasks.map((t: any, idx: number) => {
      const schedule = calculateTaskDueDate(params.activityStartDate, Number(t.offset_days ?? 7), now);
      return {
        activity_id: params.activityId,
        title: t.title,
        department_id: params.departmentId || null,
        created_by_id: params.createdById,
        assignee_id: t.assignee_id || (t.default_role === "OWNER" ? params.ownerId : null),
        status: "TODO",
        priority: Number(t.offset_days ?? 7) <= 3 ? "HIGH" : "MEDIUM",
        due_date: schedule.dueDate,
        offset_days: Number(t.offset_days ?? 7),
        section: t.section || "GÉNÉRAL",
        sort_order: idx + 1,
        is_compressed: schedule.isCompressed,
      };
    });

    const { error: tasksErr } = await (supabase as any)
      .from("tasks")
      .insert(taskInserts);
    if (tasksErr) throw tasksErr;
    tasksCreated = taskInserts.length;
  }

  // 2. Generate Requirements from template
  if (sourceRequirements.length > 0) {
    const reqInserts = sourceRequirements.map((r: any) => ({
      activity_id: params.activityId,
      category: r.category,
      title: r.title,
      quantity: Number(r.quantity) || 1,
      status: "NEEDED",
      owner_id: params.ownerId,
      needed_by: params.activityStartDate,
      resource_id: r.resource_id || null,
      est_cost: Number(r.est_cost) || 0,
    }));

    const { error: reqErr } = await (supabase as any)
      .from("activity_requirements")
      .insert(reqInserts);
    if (reqErr) throw reqErr;
    requirementsCreated = reqInserts.length;
  }

  // 3. Generate Draft Emails for required offices
  if (sourceOffices.length > 0) {
    const { data: defaultEmailTemplates } = await (supabase as any)
      .from("email_templates")
      .select("*")
      .in("office", sourceOffices)
      .eq("language", "FR")
      .eq("is_active", true);

    const { data: defaultContacts } = await (supabase as any)
      .from("admin_contacts")
      .select("*")
      .in("office", sourceOffices)
      .eq("is_active", true);

    const dueSchedule = calculateTaskDueDate(params.activityStartDate, 14, now);

    const emailInserts = sourceOffices.map((office) => {
      const foundTpl = (defaultEmailTemplates || []).find((t: any) => t.office === office);
      const foundContact = (defaultContacts || []).find((c: any) => c.office === office);
      return {
        activity_id: params.activityId,
        template_id: foundTpl?.id || null,
        contact_id: foundContact?.id || null,
        recipient_email: foundContact?.email || null,
        cc_emails: "contact@asteria.tn",
        office,
        subject: foundTpl?.subject || `Demande administrative (${office})`,
        body: foundTpl?.body || `Demande officielle pour l'activité.`,
        status: "DRAFT",
        due_at: dueSchedule.dueDate,
      };
    });

    if (emailInserts.length > 0) {
      const { error: emailsErr } = await (supabase as any)
        .from("activity_emails")
        .insert(emailInserts);
      if (emailsErr) throw emailsErr;
      emailsCreated = emailInserts.length;
    }
  }

  return { tasksCreated, requirementsCreated, emailsCreated };
}

// ---------------------------------------------------------------------------
// 5. RESCHEDULE LOGIC
// ---------------------------------------------------------------------------

export async function rescheduleActivityTasks(params: {
  activityId: string;
  newStartDate: string;
  oldStartDate: string;
  userId: string;
}): Promise<{ updatedCount: number }> {
  const supabase = await createClient();

  // Fetch non-DONE tasks
  const { data: tasks, error: fetchErr } = await (supabase as any)
    .from("tasks")
    .select("id, title, due_date, offset_days, status")
    .eq("activity_id", params.activityId)
    .neq("status", "DONE");

  if (fetchErr) throw fetchErr;
  if (!tasks || tasks.length === 0) return { updatedCount: 0 };

  const now = new Date();
  let updatedCount = 0;

  for (const task of tasks) {
    if (task.offset_days === null || task.offset_days === undefined) continue;

    const schedule = calculateTaskDueDate(params.newStartDate, task.offset_days, now);

    await (supabase as any)
      .from("tasks")
      .update({
        due_date: schedule.dueDate,
        is_compressed: schedule.isCompressed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    // Record audit log for task date modification
    await (supabase as any).from("audit_logs").insert({
      user_id: params.userId,
      action: "TASK_RESCHEDULED",
      details: `Tâche "${task.title}" recalculée de ${task.due_date} à ${schedule.dueDate} suite au report d'activité`,
      entity_type: "TASK",
      entity_id: task.id,
    });

    updatedCount++;
  }

  return { updatedCount };
}

// ---------------------------------------------------------------------------
// 6. TASKS QUERIES & MUTATIONS
// ---------------------------------------------------------------------------

export async function getActivityTasks(activityId: string): Promise<ActivityTaskItem[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("tasks")
    .select(`
      *,
      assignee:assignee_id (id, name, email, avatar_url)
    `)
    .eq("activity_id", activityId)
    .order("sort_order", { ascending: true })
    .order("due_date", { ascending: true });

  if (error) throw error;

  const allTasks = (data || []) as any[];

  return allTasks.map((t) => mapActivityTask(t, allTasks));
}

export async function getMyActivityTasks(userId: string): Promise<Array<ActivityTaskItem & { activityTitle?: string; activityStatus?: string }>> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("tasks")
    .select(`
      *,
      assignee:assignee_id (id, name, email, avatar_url),
      activity:activity_id (id, title, status, starts_at)
    `)
    .not("activity_id", "is", null)
    .eq("assignee_id", userId)
    .order("due_date", { ascending: true });

  if (error) throw error;
  const rows = (data || []) as any[];
  return rows.map((t) => ({
    ...mapActivityTask(t, rows),
    activityTitle: t.activity?.title,
    activityStatus: t.activity?.status,
  }));
}

export async function createActivityTask(payload: {
  activityId: string;
  title: string;
  description?: string | null;
  departmentId?: string | null;
  assigneeId?: string | null;
  createdById: string;
  status?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string | null;
  offsetDays?: number | null;
  dependsOn?: string[];
  section?: string | null;
  sortOrder?: number;
  isCompressed?: boolean;
}): Promise<ActivityTaskItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("tasks")
    .insert({
      activity_id: payload.activityId,
      title: payload.title,
      description: payload.description || null,
      department_id: payload.departmentId || null,
      assignee_id: payload.assigneeId || null,
      created_by_id: payload.createdById,
      status: payload.status || "TODO",
      priority: payload.priority || "MEDIUM",
      due_date: payload.dueDate || null,
      offset_days: payload.offsetDays ?? null,
      depends_on: payload.dependsOn || [],
      section: payload.section || "GÉNÉRAL",
      sort_order: payload.sortOrder ?? 99,
      is_compressed: Boolean(payload.isCompressed),
    })
    .select(`
      *,
      assignee:assignee_id (id, name, email, avatar_url)
    `)
    .single();

  if (error) throw error;
  return mapActivityTask(data, [data]);
}

export async function updateActivityTask(
  taskId: string,
  updates: Record<string, unknown>
): Promise<ActivityTaskItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("tasks")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .select(`
      *,
      assignee:assignee_id (id, name, email, avatar_url)
    `)
    .single();

  if (error) throw error;
  return mapActivityTask(data, [data]);
}

export async function deleteActivityTask(taskId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await (supabase as any).from("tasks").delete().eq("id", taskId);
  if (error) throw error;
  return true;
}

function mapActivityTask(t: any, allTasks: any[]): ActivityTaskItem {
  let isBlocked = false;
  if (Array.isArray(t.depends_on) && t.depends_on.length > 0) {
    const unfinishedDeps = allTasks.filter(
      (other) => t.depends_on.includes(other.id) && other.status !== "DONE"
    );
    isBlocked = unfinishedDeps.length > 0;
  }

  return {
    id: t.id,
    activityId: t.activity_id,
    title: t.title,
    description: t.description,
    departmentId: t.department_id,
    assigneeId: t.assignee_id,
    createdById: t.created_by_id,
    status: t.status,
    priority: t.priority,
    dueDate: t.due_date,
    offsetDays: t.offset_days,
    dependsOn: t.depends_on || [],
    section: t.section,
    sortOrder: t.sort_order || 0,
    isCompressed: Boolean(t.is_compressed),
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    isBlocked,
    assignee: t.assignee
      ? {
          id: t.assignee.id,
          name: t.assignee.name,
          email: t.assignee.email,
          avatarUrl: t.assignee.avatar_url,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// 7. EMAILS, REQUIREMENTS, AGENDA, REPORTS, COMMENTS, FILES (CRUD)
// ---------------------------------------------------------------------------

export async function getEmailTemplates(office?: string, language?: "FR" | "EN"): Promise<EmailTemplateItem[]> {
  const supabase = await createClient();
  let query = (supabase as any)
    .from("email_templates")
    .select("*")
    .eq("is_active", true)
    .order("office", { ascending: true });

  if (office) query = query.eq("office", office);
  if (language) query = query.eq("language", language);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((t: any) => ({
    id: t.id,
    office: t.office,
    language: t.language,
    subject: t.subject,
    body: t.body,
    isActive: t.is_active,
    createdAt: t.created_at,
  }));
}

export async function getActivityEmails(activityId: string): Promise<ActivityEmailItem[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_emails")
    .select(`
      *,
      contact:contact_id (id, office, name, role_title, email, phone, notes, is_active)
    `)
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).map(mapActivityEmail);
}

export async function createActivityEmail(payload: {
  activityId: string;
  contactId?: string | null;
  templateId?: string | null;
  office: string;
  recipientEmail?: string | null;
  ccEmails?: string | null;
  subject: string;
  body: string;
  status?: string;
  dueAt?: string | null;
}): Promise<ActivityEmailItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_emails")
    .insert({
      activity_id: payload.activityId,
      contact_id: payload.contactId || null,
      template_id: payload.templateId || null,
      office: payload.office,
      recipient_email: payload.recipientEmail || null,
      cc_emails: payload.ccEmails || "contact@asteria.tn",
      subject: payload.subject,
      body: payload.body,
      status: payload.status || "DRAFT",
      due_at: payload.dueAt || null,
    })
    .select(`
      *,
      contact:contact_id (id, office, name, role_title, email, phone, notes, is_active)
    `)
    .single();

  if (error) throw error;
  return mapActivityEmail(data);
}

export async function updateActivityEmail(
  id: string,
  updates: Record<string, unknown>
): Promise<ActivityEmailItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_emails")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(`
      *,
      contact:contact_id (id, office, name, role_title, email, phone, notes, is_active)
    `)
    .single();

  if (error) throw error;
  return mapActivityEmail(data);
}

export async function deleteActivityEmail(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await (supabase as any).from("activity_emails").delete().eq("id", id);
  if (error) throw error;
  return true;
}

function mapActivityEmail(e: any): ActivityEmailItem {
  return {
    id: e.id,
    activityId: e.activity_id,
    contactId: e.contact_id,
    templateId: e.template_id,
    office: e.office,
    recipientEmail: e.recipient_email || e.contact?.email || null,
    ccEmails: e.cc_emails || null,
    subject: e.subject,
    body: e.body,
    status: e.status,
    dueAt: e.due_at,
    sentAt: e.sent_at,
    repliedAt: e.replied_at,
    replyNotes: e.reply_notes,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
    contact: e.contact
      ? {
          id: e.contact.id,
          office: e.contact.office,
          name: e.contact.name,
          roleTitle: e.contact.role_title,
          email: e.contact.email,
          phone: e.contact.phone,
          notes: e.contact.notes,
          isActive: e.contact.is_active,
          createdAt: "",
        }
      : null,
  };
}

export async function getActivityRequirements(activityId: string): Promise<ActivityRequirementItem[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_requirements")
    .select(`
      *,
      resource:resource_id (id, name, kind, capacity, notes),
      owner:owner_id (id, name, avatar_url)
    `)
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).map(mapActivityRequirement);
}

export async function createActivityRequirement(payload: {
  activityId: string;
  category: string;
  title: string;
  quantity?: number;
  ownerId?: string | null;
  neededBy?: string | null;
  status?: string;
  estCost?: number;
  actualCost?: number;
  linkedEmailId?: string | null;
  resourceId?: string | null;
  notes?: string | null;
}): Promise<ActivityRequirementItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_requirements")
    .insert({
      activity_id: payload.activityId,
      category: payload.category,
      title: payload.title,
      quantity: Number(payload.quantity) || 1,
      owner_id: payload.ownerId || null,
      needed_by: payload.neededBy || null,
      status: payload.status || "NEEDED",
      est_cost: Number(payload.estCost) || 0,
      actual_cost: Number(payload.actualCost) || 0,
      linked_email_id: payload.linkedEmailId || null,
      resource_id: payload.resourceId || null,
      notes: payload.notes || null,
    })
    .select(`
      *,
      resource:resource_id (id, name, kind, capacity, notes),
      owner:owner_id (id, name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return mapActivityRequirement(data);
}

export async function updateActivityRequirement(
  id: string,
  updates: Record<string, unknown>
): Promise<ActivityRequirementItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_requirements")
    .update(updates)
    .eq("id", id)
    .select(`
      *,
      resource:resource_id (id, name, kind, capacity, notes),
      owner:owner_id (id, name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return mapActivityRequirement(data);
}

export async function deleteActivityRequirement(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await (supabase as any).from("activity_requirements").delete().eq("id", id);
  if (error) throw error;
  return true;
}

function mapActivityRequirement(r: any): ActivityRequirementItem {
  return {
    id: r.id,
    activityId: r.activity_id,
    category: r.category,
    title: r.title,
    quantity: r.quantity,
    ownerId: r.owner_id,
    neededBy: r.needed_by,
    status: r.status,
    estCost: Number(r.est_cost || 0),
    actualCost: Number(r.actual_cost || 0),
    linkedEmailId: r.linked_email_id,
    resourceId: r.resource_id,
    notes: r.notes,
    createdAt: r.created_at,
    resource: r.resource || null,
    owner: r.owner
      ? {
          id: r.owner.id,
          name: r.owner.name,
          avatarUrl: r.owner.avatar_url,
        }
      : null,
  };
}

export async function getActivityAgendaItems(activityId: string): Promise<ActivityAgendaItem[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_agenda_items")
    .select(`
      *,
      lead:lead_id (id, name, avatar_url)
    `)
    .eq("activity_id", activityId)
    .order("sort_order", { ascending: true })
    .order("starts_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((a: any) => ({
    id: a.id,
    activityId: a.activity_id,
    startsAt: a.starts_at,
    durationMin: a.duration_min,
    title: a.title,
    speaker: a.speaker || null,
    location: a.location || null,
    sortOrder: a.sort_order ?? 0,
    leadId: a.lead_id,
    notes: a.notes,
    createdAt: a.created_at,
    lead: a.lead
      ? {
          id: a.lead.id,
          name: a.lead.name,
          avatarUrl: a.lead.avatar_url,
        }
      : null,
  }));
}

export async function createActivityAgendaItem(payload: {
  activityId: string;
  startsAt: string;
  durationMin: number;
  title: string;
  speaker?: string | null;
  location?: string | null;
  sortOrder?: number;
  leadId?: string | null;
  notes?: string | null;
}): Promise<ActivityAgendaItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_agenda_items")
    .insert({
      activity_id: payload.activityId,
      starts_at: payload.startsAt,
      duration_min: Number(payload.durationMin) || 30,
      title: payload.title,
      speaker: payload.speaker || null,
      location: payload.location || null,
      sort_order: payload.sortOrder ?? 0,
      lead_id: payload.leadId || null,
      notes: payload.notes || null,
    })
    .select(`
      *,
      lead:lead_id (id, name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return {
    id: data.id,
    activityId: data.activity_id,
    startsAt: data.starts_at,
    durationMin: data.duration_min,
    title: data.title,
    speaker: data.speaker,
    location: data.location,
    sortOrder: data.sort_order ?? 0,
    leadId: data.lead_id,
    notes: data.notes,
    createdAt: data.created_at,
    lead: data.lead || null,
  };
}

export async function updateActivityAgendaItem(
  id: string,
  updates: Record<string, unknown>
): Promise<ActivityAgendaItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_agenda_items")
    .update(updates)
    .eq("id", id)
    .select(`
      *,
      lead:lead_id (id, name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return {
    id: data.id,
    activityId: data.activity_id,
    startsAt: data.starts_at,
    durationMin: data.duration_min,
    title: data.title,
    speaker: data.speaker,
    location: data.location,
    sortOrder: data.sort_order ?? 0,
    leadId: data.lead_id,
    notes: data.notes,
    createdAt: data.created_at,
    lead: data.lead || null,
  };
}

export async function deleteActivityAgendaItem(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await (supabase as any).from("activity_agenda_items").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function getActivityReport(activityId: string): Promise<ActivityReportItem | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_reports")
    .select(`
      *,
      author:submitted_by (id, name)
    `)
    .eq("activity_id", activityId)
    .single();

  if (error || !data) return null;

  return {
    activityId: data.activity_id,
    summary: data.summary || null,
    attendanceCount: data.attendance_count || 0,
    objectivesResult: data.objectives_result || {},
    budgetActual: Number(data.budget_actual || 0),
    wentWell: data.went_well,
    problemsEncountered: data.problems_encountered || null,
    toImprove: data.to_improve,
    lessonsLearned: data.lessons_learned || null,
    mediaLinks: data.media_links || [],
    submittedBy: data.submitted_by,
    submittedAt: data.submitted_at,
    author: data.author || null,
  };
}

export async function upsertActivityReport(payload: {
  activityId: string;
  summary?: string | null;
  attendanceCount: number;
  objectivesResult?: Record<string, unknown>;
  budgetActual: number;
  wentWell?: string | null;
  problemsEncountered?: string | null;
  toImprove?: string | null;
  lessonsLearned?: string | null;
  mediaLinks?: string[];
  submittedBy: string;
}): Promise<ActivityReportItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_reports")
    .upsert(
      {
        activity_id: payload.activityId,
        summary: payload.summary || null,
        attendance_count: Number(payload.attendanceCount) || 0,
        objectives_result: payload.objectivesResult || {},
        budget_actual: Number(payload.budgetActual) || 0,
        went_well: payload.wentWell || null,
        problems_encountered: payload.problemsEncountered || null,
        to_improve: payload.toImprove || null,
        lessons_learned: payload.lessonsLearned || null,
        media_links: payload.mediaLinks || [],
        submitted_by: payload.submittedBy,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "activity_id" }
    )
    .select(`
      *,
      author:submitted_by (id, name)
    `)
    .single();

  if (error) throw error;
  return {
    activityId: data.activity_id,
    summary: data.summary,
    attendanceCount: data.attendance_count || 0,
    objectivesResult: data.objectives_result || {},
    budgetActual: Number(data.budget_actual || 0),
    wentWell: data.went_well,
    problemsEncountered: data.problems_encountered,
    toImprove: data.to_improve,
    lessonsLearned: data.lessons_learned,
    mediaLinks: data.media_links || [],
    submittedBy: data.submitted_by,
    submittedAt: data.submitted_at,
    author: data.author || null,
  };
}

export async function getActivityComments(activityId: string): Promise<ActivityCommentItem[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_comments")
    .select(`
      *,
      author:author_id (id, name, avatar_url)
    `)
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((c: any) => ({
    id: c.id,
    activityId: c.activity_id,
    entityType: c.entity_type,
    entityId: c.entity_id,
    authorId: c.author_id,
    body: c.body,
    createdAt: c.created_at,
    author: c.author
      ? {
          id: c.author.id,
          name: c.author.name,
          avatarUrl: c.author.avatar_url,
        }
      : undefined,
  }));
}

export async function createActivityComment(payload: {
  activityId: string;
  entityType?: string;
  entityId?: string | null;
  authorId: string;
  body: string;
}): Promise<ActivityCommentItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_comments")
    .insert({
      activity_id: payload.activityId,
      entity_type: payload.entityType || "ACTIVITY",
      entity_id: payload.entityId || null,
      author_id: payload.authorId,
      body: payload.body,
    })
    .select(`
      *,
      author:author_id (id, name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return {
    id: data.id,
    activityId: data.activity_id,
    entityType: data.entity_type,
    entityId: data.entity_id,
    authorId: data.author_id,
    body: data.body,
    createdAt: data.created_at,
    author: data.author
      ? {
          id: data.author.id,
          name: data.author.name,
          avatarUrl: data.author.avatar_url,
        }
      : undefined,
  };
}

export async function deleteActivityComment(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await (supabase as any).from("activity_comments").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function getActivityFiles(activityId: string): Promise<ActivityFileItem[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_files")
    .select(`
      *,
      uploader:uploaded_by (id, name)
    `)
    .eq("activity_id", activityId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((f: any) => ({
    id: f.id,
    activityId: f.activity_id,
    entityType: f.entity_type,
    entityId: f.entity_id,
    fileName: f.file_name,
    fileUrl: f.file_url,
    fileSize: f.file_size,
    mimeType: f.mime_type,
    uploadedBy: f.uploaded_by,
    createdAt: f.created_at,
    uploader: f.uploader || null,
  }));
}

export async function createActivityFileRecord(payload: {
  activityId: string;
  entityType?: string;
  entityId?: string | null;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  uploadedBy: string;
}): Promise<ActivityFileItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("activity_files")
    .insert({
      activity_id: payload.activityId,
      entity_type: payload.entityType || "ACTIVITY",
      entity_id: payload.entityId || null,
      file_name: payload.fileName,
      file_url: payload.fileUrl,
      file_size: payload.fileSize ?? null,
      mime_type: payload.mimeType || null,
      uploaded_by: payload.uploadedBy,
    })
    .select(`
      *,
      uploader:uploaded_by (id, name)
    `)
    .single();

  if (error) throw error;
  return {
    id: data.id,
    activityId: data.activity_id,
    entityType: data.entity_type,
    entityId: data.entity_id,
    fileName: data.file_name,
    fileUrl: data.file_url,
    fileSize: data.file_size,
    mimeType: data.mime_type,
    uploadedBy: data.uploaded_by,
    createdAt: data.created_at,
    uploader: data.uploader || null,
  };
}

export async function deleteActivityFileRecord(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await (supabase as any).from("activity_files").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ---------------------------------------------------------------------------
// 8. ADMIN CONTACTS, RESOURCES & CONFLICT SLOTS
// ---------------------------------------------------------------------------

export async function getAdminContacts(office?: string): Promise<AdminContactItem[]> {
  const supabase = await createClient();
  let query = (supabase as any)
    .from("admin_contacts")
    .select("*")
    .eq("is_active", true)
    .order("office", { ascending: true });

  if (office) query = query.eq("office", office);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((c: any) => ({
    id: c.id,
    office: c.office,
    name: c.name,
    roleTitle: c.role_title,
    email: c.email,
    phone: c.phone,
    notes: c.notes,
    isActive: c.is_active,
    createdAt: c.created_at,
  }));
}

export async function createAdminContact(payload: {
  office: string;
  name: string;
  roleTitle: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
}): Promise<AdminContactItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("admin_contacts")
    .insert({
      office: payload.office,
      name: payload.name,
      role_title: payload.roleTitle,
      email: payload.email,
      phone: payload.phone || null,
      notes: payload.notes || null,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return {
    id: data.id,
    office: data.office,
    name: data.name,
    roleTitle: data.role_title,
    email: data.email,
    phone: data.phone,
    notes: data.notes,
    isActive: data.is_active,
    createdAt: data.created_at,
  };
}

export async function getPlannerResources(): Promise<PlannerResourceItem[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("planner_resources")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    kind: r.kind,
    capacity: r.capacity,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

export async function createPlannerResource(payload: {
  name: string;
  kind: "ROOM" | "EQUIPMENT";
  capacity?: number | null;
  notes?: string | null;
}): Promise<PlannerResourceItem> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("planner_resources")
    .insert({
      name: payload.name,
      kind: payload.kind,
      capacity: payload.capacity ?? null,
      notes: payload.notes || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    kind: data.kind,
    capacity: data.capacity,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

/**
 * Returns active resource booking slots across non-cancelled activities
 * so detectResourceConflict can check for overlapping room/equipment usage.
 */
export async function getActiveResourceBookingSlots() {
  const supabase = await createClient();
  const { data: acts } = await (supabase as any)
    .from("activities")
    .select(`
      id, title, starts_at, ends_at, status, venue_resource_id,
      venue:venue_resource_id (id, name),
      requirements:activity_requirements (resource_id, status, resource:resource_id (id, name))
    `)
    .neq("status", "CANCELLED")
    .neq("status", "CLOSED");

  const slots: Array<{
    activityId: string;
    activityTitle: string;
    resourceId: string;
    resourceName?: string;
    startsAt: string;
    endsAt: string;
  }> = [];

  for (const a of acts || []) {
    if (a.venue_resource_id) {
      slots.push({
        activityId: a.id,
        activityTitle: a.title,
        resourceId: a.venue_resource_id,
        resourceName: a.venue?.name,
        startsAt: a.starts_at,
        endsAt: a.ends_at,
      });
    }
    for (const req of a.requirements || []) {
      if (req.resource_id) {
        slots.push({
          activityId: a.id,
          activityTitle: a.title,
          resourceId: req.resource_id,
          resourceName: req.resource?.name,
          startsAt: a.starts_at,
          endsAt: a.ends_at,
        });
      }
    }
  }

  return slots;
}

export async function recordPlannerAuditLog(params: {
  userId: string;
  action: string;
  details: string;
  entityType?: string;
  entityId?: string;
}) {
  const supabase = await createClient();
  await (supabase as any).from("audit_logs").insert({
    user_id: params.userId,
    action: params.action,
    details: params.details,
    entity_type: params.entityType || "ACTIVITY",
    entity_id: params.entityId || null,
  });
}

export async function getActivityAuditLogs(activityId: string) {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("audit_logs")
    .select(`
      id, user_id, action, details, entity_type, entity_id, created_at,
      actor:user_id (id, name, role)
    `)
    .eq("entity_id", activityId)
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}

// ---------------------------------------------------------------------------
// 9. CROSS-USER / ADMIN BRIDGES (EVENTS, NOTIFICATIONS, ATTENDANCE STATS)
// ---------------------------------------------------------------------------

/**
 * Reads attendance & RSVP counts for an activity's linked event so the post-activity
 * report can pre-fill or verify actual attendance numbers.
 * Uses getAdminClient() because attendance_records across all members require cross-user read.
 */
export async function getLinkedEventAttendanceStats(eventId?: string | null): Promise<{
  rsvpGoingCount: number;
  presentCount: number;
}> {
  if (!eventId) return { rsvpGoingCount: 0, presentCount: 0 };
  const admin: any = getAdminClient();

  const [{ count: rsvpGoingCount }, { count: presentCount }] = await Promise.all([
    admin.from("rsvps").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "GOING"),
    admin.from("attendance_records").select("*", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "PRESENT"),
  ]);

  return {
    rsvpGoingCount: rsvpGoingCount || 0,
    presentCount: presentCount || 0,
  };
}

/**
 * Syncs or creates the linked public.events row and public.event_hosts rows
 * when an activity first reaches APPROVED status or is updated.
 *
 * NOTE ON getAdminClient():
 * Cross-user operation: regular users under RLS cannot unconditionally insert
 * into events with arbitrary host roles, nor modify existing attendance check-in codes.
 * Service-role is used strictly here with full parameter validation.
 */
export async function syncActivityToEventsBridge(activityId: string): Promise<string | null> {
  const admin: any = getAdminClient();

  // Fetch complete activity details
  const { data: activity } = await admin
    .from("activities")
    .select(`
      *,
      members:activity_members (profile_id, role)
    `)
    .eq("id", activityId)
    .single();

  if (!activity) return null;

  // Generate standard 6-digit check-in code matching existing events convention
  const checkInCode = `AST-${Math.floor(1000 + Math.random() * 9000)}`;

  let eventId = activity.event_id;

  if (!eventId) {
    // 1. Create new events row
    const { data: newEvent, error: eventErr } = await admin
      .from("events")
      .insert({
        title: activity.title,
        description: activity.idea || `Activité Asteria : ${activity.title}`,
        start_time: activity.starts_at,
        end_time: activity.ends_at,
        location: activity.location || "Campus ESPRIT",
        department_id: activity.department_id || null,
        created_by_id: activity.owner_id,
        host_id: activity.owner_id,
        check_in_code: checkInCode,
        type: "WORKSHOP",
        audience_scope: activity.department_id ? "DEPARTMENT" : "CLUB",
        check_in_status: "SCHEDULED",
        attendance_required: true,
      })
      .select("id")
      .single();

    if (eventErr || !newEvent) {
      console.error("Failed to create bridge event:", eventErr);
      return null;
    }

    eventId = newEvent.id;

    // Link back to activity
    await admin
      .from("activities")
      .update({ event_id: eventId })
      .eq("id", activityId);
  } else {
    // 2. Update existing event
    await admin
      .from("events")
      .update({
        title: activity.title,
        description: activity.idea || `Activité Asteria : ${activity.title}`,
        start_time: activity.starts_at,
        end_time: activity.ends_at,
        location: activity.location || "Campus ESPRIT",
        department_id: activity.department_id || null,
        host_id: activity.owner_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId);
  }

  // 3. Sync event_hosts for CO_OWNER members so they can run QR code
  if (eventId) {
    const coOwners = (activity.members || []).filter(
      (m: any) => m.role === "CO_OWNER" || m.role === "OWNER"
    );

    for (const host of coOwners) {
      await admin
        .from("event_hosts")
        .upsert(
          {
            event_id: eventId,
            user_id: host.profile_id,
            is_primary: host.role === "OWNER",
          },
          { onConflict: "event_id,user_id" }
        );
    }
  }

  return eventId;
}

/**
 * Handles event deletion or title cancellation when an activity is CANCELLED.
 *
 * Approach:
 * If the linked event has NO RSVPs and NO attendance records, it is safely deleted.
 * If members have already RSVP'd or attendance exists, the event is retained
 * and its title is marked "[ANNULÉ] <Title>" to preserve historical integrity.
 */
export async function handleCancelledActivityEvent(activityId: string): Promise<string> {
  const admin: any = getAdminClient();

  const { data: activity } = await admin
    .from("activities")
    .select("id, title, event_id")
    .eq("id", activityId)
    .single();

  if (!activity || !activity.event_id) return "NO_EVENT";

  const eventId = activity.event_id;

  // Check RSVPs and Attendance
  const [{ count: rsvpCount }, { count: attendanceCount }] = await Promise.all([
    admin.from("rsvps").select("*", { count: "exact", head: true }).eq("event_id", eventId),
    admin.from("attendance_records").select("*", { count: "exact", head: true }).eq("event_id", eventId),
  ]);

  const hasActivityHistory = (rsvpCount || 0) > 0 || (attendanceCount || 0) > 0;

  if (hasActivityHistory) {
    // Retain and mark cancelled
    await admin
      .from("events")
      .update({
        title: activity.title.startsWith("[ANNULÉ]") ? activity.title : `[ANNULÉ] ${activity.title}`,
        check_in_status: "CLOSED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId);
    return "TITLE_MARKED_CANCELLED";
  } else {
    // Delete cleanly
    await admin.from("events").delete().eq("id", eventId);
    await admin.from("activities").update({ event_id: null }).eq("id", activityId);
    return "DELETED";
  }
}

// ---------------------------------------------------------------------------
// HELPER: MAPPER
// ---------------------------------------------------------------------------

function mapActivityRecord(row: any): ActivityItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    typeId: row.type_id,
    departmentId: row.department_id,
    ownerId: row.owner_id,
    status: row.status,
    idea: row.idea,
    objectives: Array.isArray(row.objectives) ? row.objectives : [],
    audience: row.audience,
    expectedAttendance: row.expected_attendance,
    format: row.format,
    location: row.location,
    venueResourceId: row.venue_resource_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    budgetEstimate: Number(row.budget_estimate || 0),
    facilitators: row.facilitators || null,
    closureSkipReason: row.closure_skip_reason || null,
    templateId: row.template_id,
    eventId: row.event_id,
    createdById: row.created_by_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    type: row.type
      ? {
          id: row.type.id,
          name: row.type.name,
          color: row.type.color,
          icon: row.type.icon,
          defaultLeadDays: row.type.default_lead_days,
          createdAt: "",
        }
      : null,
    department: row.department
      ? {
          id: row.department.id,
          name: row.department.name,
          slug: row.department.slug,
        }
      : null,
    owner: row.owner
      ? {
          id: row.owner.id,
          name: row.owner.name,
          email: row.owner.email,
          avatarUrl: row.owner.avatar_url,
        }
      : null,
    members: Array.isArray(row.members)
      ? row.members.map((m: any) => ({
          activityId: m.activity_id,
          profileId: m.profile_id,
          role: m.role,
          profile: m.profile
            ? {
                id: m.profile.id,
                name: m.profile.name,
                email: m.profile.email,
                avatarUrl: m.profile.avatar_url,
              }
            : undefined,
        }))
      : [],
  };
}

