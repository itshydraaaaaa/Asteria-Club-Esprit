/**
 * Asteria Club Esprit — Activity Planner Types
 * Domain interfaces, lifecycle statuses, and data transfer types.
 */

export type ActivityStatus =
  | "IDEA"
  | "SUBMITTED"
  | "BRIEF_APPROVED"
  | "ADMIN_REQUESTS"
  | "LOGISTICS_CONFIRMED"
  | "APPROVED"
  | "LOGISTICS_READY"
  | "PROMOTION"
  | "LIVE"
  | "CLOSED"
  | "ON_HOLD"
  | "CANCELLED";

export type ActivityFormat = "IN_PERSON" | "ONLINE" | "HYBRID";

export type ActivityMemberRole = "OWNER" | "CO_OWNER" | "CONTRIBUTOR";

export type AdminOffice =
  | "STUDENT_LIFE"
  | "SCOLARITE"
  | "TECHNICAL_EQUIPMENT"
  | "LOGISTICS"
  | "PROMOTION"
  | "PURCHASES";

export type EmailStatus =
  | "DRAFT"
  | "READY"
  | "SENT"
  | "REPLIED"
  | "APPROVED"
  | "REJECTED";

export type RequirementCategory =
  | "SPACE"
  | "EQUIPMENT"
  | "MATERIALS"
  | "PEOPLE"
  | "PURCHASE"
  | "PERMISSION"
  | "PROMOTION";

export type RequirementStatus =
  | "NEEDED"
  | "REQUESTED"
  | "CONFIRMED"
  | "READY"
  | "RETURNED";

export type ResourceKind = "ROOM" | "EQUIPMENT";

export interface ActivityType {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string | null;
  defaultLeadDays: number;
  createdAt: string;
}

export interface ActivityTemplateTask {
  title: string;
  offset_days: number;
  default_role: "OWNER" | "CO_OWNER" | "CONTRIBUTOR";
  section?: string;
}

export interface ActivityTemplateRequirement {
  category: RequirementCategory;
  title: string;
  quantity: number;
}

export interface ActivityTemplate {
  id: string;
  activityTypeId: string;
  name: string;
  tasks: ActivityTemplateTask[];
  requirements: ActivityTemplateRequirement[];
  requiredOffices: AdminOffice[];
  isActive: boolean;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  slug: string;
  typeId: string;
  departmentId?: string | null;
  ownerId: string;
  status: ActivityStatus;
  idea?: string | null;
  objectives?: string[] | null;
  audience?: string | null;
  expectedAttendance?: number | null;
  format: ActivityFormat;
  location?: string | null;
  venueResourceId?: string | null;
  startsAt: string;
  endsAt: string;
  budgetEstimate?: number | null;
  facilitators?: string | null;
  closureSkipReason?: string | null;
  templateId?: string | null;
  eventId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;

  // Joined relations
  type?: ActivityType | null;
  department?: { id: string; name: string; slug: string } | null;
  owner?: { id: string; name: string; email: string; avatarUrl?: string | null } | null;
  members?: ActivityMemberItem[];
}

export interface ActivityMemberItem {
  activityId: string;
  profileId: string;
  role: ActivityMemberRole;
  profile?: { id: string; name: string; email: string; avatarUrl?: string | null };
}

export interface ActivityTaskItem {
  id: string;
  activityId: string;
  title: string;
  description?: string | null;
  departmentId?: string | null;
  assigneeId?: string | null;
  createdById: string;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string | null;
  offsetDays?: number | null;
  dependsOn: string[];
  section?: string | null;
  sortOrder: number;
  isCompressed: boolean;
  createdAt: string;
  updatedAt: string;

  // Derived
  isBlocked?: boolean;
  assignee?: { id: string; name: string; email: string; avatarUrl?: string | null } | null;
}

export interface AdminContactItem {
  id: string;
  office: AdminOffice;
  name: string;
  roleTitle: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface EmailTemplateItem {
  id: string;
  office: AdminOffice;
  language: "FR" | "EN";
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: string;
}

export interface ActivityEmailItem {
  id: string;
  activityId: string;
  contactId?: string | null;
  templateId?: string | null;
  office: AdminOffice;
  recipientEmail?: string | null;
  ccEmails?: string | null;
  subject: string;
  body: string;
  status: EmailStatus;
  dueAt?: string | null;
  sentAt?: string | null;
  repliedAt?: string | null;
  replyNotes?: string | null;
  createdAt: string;
  updatedAt: string;

  contact?: AdminContactItem | null;
}

export interface ActivityRequirementItem {
  id: string;
  activityId: string;
  category: RequirementCategory;
  title: string;
  quantity: number;
  ownerId?: string | null;
  neededBy?: string | null;
  status: RequirementStatus;
  estCost: number;
  actualCost: number;
  linkedEmailId?: string | null;
  resourceId?: string | null;
  notes?: string | null;
  createdAt: string;

  resource?: PlannerResourceItem | null;
  owner?: { id: string; name: string; avatarUrl?: string | null } | null;
}

export interface PlannerResourceItem {
  id: string;
  name: string;
  kind: ResourceKind;
  capacity?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface ActivityAgendaItem {
  id: string;
  activityId: string;
  startsAt: string;
  durationMin: number;
  title: string;
  speaker?: string | null;
  location?: string | null;
  sortOrder: number;
  leadId?: string | null;
  notes?: string | null;
  createdAt: string;

  lead?: { id: string; name: string; avatarUrl?: string | null } | null;
}

export interface ActivityReportItem {
  activityId: string;
  summary?: string | null;
  attendanceCount: number;
  objectivesResult: Record<string, unknown>;
  budgetActual: number;
  wentWell?: string | null;
  problemsEncountered?: string | null;
  toImprove?: string | null;
  lessonsLearned?: string | null;
  mediaLinks: string[];
  submittedBy: string;
  submittedAt: string;

  author?: { id: string; name: string } | null;
}

export interface ActivityCommentItem {
  id: string;
  activityId: string;
  entityType: string;
  entityId?: string | null;
  authorId: string;
  body: string;
  createdAt: string;

  author?: { id: string; name: string; avatarUrl?: string | null };
}

export interface ActivityFileItem {
  id: string;
  activityId: string;
  entityType: string;
  entityId?: string | null;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  uploadedBy: string;
  createdAt: string;

  uploader?: { id: string; name: string };
}

export interface ReadinessBlocker {
  code: string;
  tab: "brief" | "plan" | "logistics" | "emails" | "agenda" | "files" | "report";
  severity: "BLOCKER" | "WARNING";
  title: string;
  description: string;
  actionLabel: string;
}

export interface ActivityReadinessGate {
  briefComplete: boolean;
  tasksTotal: number;
  tasksDone: number;
  tasksOverdue: number;
  tasksCompressed: number;
  emailsTotal: number;
  emailsApprovedOrReplied: number;
  canApproveActivity: boolean;
  requirementsTotal: number;
  mandatoryRequirementsPending: number;
  canStartPromotion: boolean;
  hasReport: boolean;
  canCloseActivity: boolean;
  isPublishedToPublicCalendar: boolean;
  overallProgressPct: number;
  blockers: ReadinessBlocker[];
}

