/**
 * Asteria Club Esprit — Activity Planner Logic
 * Pure business logic for backward scheduling, email placeholder rendering,
 * lifecycle state validation, and conflict detection.
 */

import {
  ActivityStatus,
  EmailStatus,
  RequirementCategory,
  RequirementStatus,
  ActivityReadinessGate,
  ReadinessBlocker,
} from "./types";

// ---------------------------------------------------------------------------
// 1. BACKWARD SCHEDULING
// ---------------------------------------------------------------------------

export interface ScheduledTaskDateResult {
  dueDate: string; // ISO String
  isCompressed: boolean;
  shortfallDays: number;
}

/**
 * Shifts a Date to the previous working day if it falls on a weekend (Saturday or Sunday).
 * In business operations, if a deadline hits Saturday or Sunday, shift to Friday.
 */
export function shiftToPreviousWorkingDay(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 6) {
    // Saturday -> shift 1 day back to Friday
    result.setDate(result.getDate() - 1);
  } else if (day === 0) {
    // Sunday -> shift 2 days back to Friday
    result.setDate(result.getDate() - 2);
  }
  return result;
}

/**
 * Calculates task due date based on activity start date and offset_days.
 * - dueDate = activityStartDate minus offset_days.
 * - Weekends shift to previous working day (Friday).
 * - If dueDate is in the past relative to now, keep the calculated date but flag is_compressed = true
 *   and compute shortfallDays.
 */
export function calculateTaskDueDate(
  activityStartDate: Date | string,
  offsetDays: number,
  now: Date = new Date()
): ScheduledTaskDateResult {
  const start = new Date(activityStartDate);
  const targetDate = new Date(start);

  // Offset in days before the event
  // e.g. offsetDays = 21 -> start - 21 days
  // e.g. offsetDays = -3 (post-event) -> start - (-3) = start + 3 days
  targetDate.setDate(targetDate.getDate() - offsetDays);

  // Shift weekend deadlines to previous working day
  const adjustedDate = shiftToPreviousWorkingDay(targetDate);

  // Check if date is in the past
  const isPast = adjustedDate.getTime() < now.getTime();
  let shortfallDays = 0;

  if (isPast) {
    const diffMs = now.getTime() - adjustedDate.getTime();
    shortfallDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  return {
    dueDate: adjustedDate.toISOString(),
    isCompressed: isPast,
    shortfallDays: isPast ? shortfallDays : 0,
  };
}

/**
 * Validates total lead time against template default lead time.
 * Returns warning message if lead time is insufficient.
 */
export function validateLeadTime(
  activityStartDate: Date | string,
  defaultLeadDays: number,
  now: Date = new Date()
): { isSufficient: boolean; availableLeadDays: number; warning?: string } {
  const start = new Date(activityStartDate);
  const diffMs = start.getTime() - now.getTime();
  const availableLeadDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (availableLeadDays < defaultLeadDays) {
    return {
      isSufficient: false,
      availableLeadDays,
      warning: `Délai de préparation insuffisant (${availableLeadDays}j disponibles vs ${defaultLeadDays}j recommandés). Plusieurs tâches seront comprimées.`,
    };
  }

  return {
    isSufficient: true,
    availableLeadDays,
  };
}

// ---------------------------------------------------------------------------
// 2. EMAIL PLACEHOLDER RENDERING
// ---------------------------------------------------------------------------

export const ALLOWED_EMAIL_PLACEHOLDERS = [
  "activity_title",
  "activity_type",
  "date",
  "start_time",
  "end_time",
  "location",
  "expected_attendance",
  "host_name",
  "lead_organizer",
  "department",
  "club_name",
  "needs_list",
  "deadline",
] as const;

export type EmailPlaceholderKey = (typeof ALLOWED_EMAIL_PLACEHOLDERS)[number];

export type EmailContext = Partial<Record<EmailPlaceholderKey, string | number>>;

/**
 * Renders an email template body/subject by replacing all `{{placeholder}}` or `{placeholder}` tags.
 * Hard rule: An unknown placeholder must raise a visible Error, never print raw braces or fail silently.
 */
export function renderEmailTemplate(
  templateString: string,
  context: EmailContext
): string {
  // Match {{key}} or {key} with optional whitespace inside braces
  const placeholderRegex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}|\{\s*([a-zA-Z0-9_]+)\s*\}/g;

  return templateString.replace(placeholderRegex, (_match, doubleKey?: string, singleKey?: string) => {
    const key = (doubleKey || singleKey || "").trim();
    if (!ALLOWED_EMAIL_PLACEHOLDERS.includes(key as EmailPlaceholderKey)) {
      throw new Error(
        `Variable inconnue dans le modèle d'email : {{${key}}}. Variables autorisées : ${ALLOWED_EMAIL_PLACEHOLDERS.join(", ")}`
      );
    }

    let value = context[key as EmailPlaceholderKey];
    // Support alias between host_name and lead_organizer
    if ((value === undefined || value === null) && key === "lead_organizer") {
      value = context.host_name;
    } else if ((value === undefined || value === null) && key === "host_name") {
      value = context.lead_organizer;
    }

    if (value === undefined || value === null) {
      return `[Non renseigné : ${key}]`;
    }

    return String(value);
  });
}

// ---------------------------------------------------------------------------
// 3. LIFECYCLE GUARDS
// ---------------------------------------------------------------------------

export interface EmailStatusSummary {
  office: string;
  status: EmailStatus;
}

export interface RequirementStatusSummary {
  category: RequirementCategory;
  status: RequirementStatus;
}

export const MANDATORY_REQUIREMENT_CATEGORIES: RequirementCategory[] = [
  "SPACE",
  "EQUIPMENT",
  "PERMISSION",
];

/**
 * Server-side guard:
 * 1. Cannot transition to APPROVED while a mandatory admin email has no REPLIED or APPROVED status.
 */
export function canTransitionToApproved(emails: EmailStatusSummary[]): {
  allowed: boolean;
  reason?: string;
  blockingEmails?: string[];
} {
  const blocking = emails.filter(
    (e) => e.status !== "REPLIED" && e.status !== "APPROVED"
  );

  if (blocking.length > 0) {
    const names = blocking.map((b) => b.office).join(", ");
    return {
      allowed: false,
      reason: `Impossible de passer au statut APPROVED : ${blocking.length} courrier(s) administratif(s) obligatoire(s) sans réponse officielle (${names}). Statut requis : REPLIED ou APPROVED.`,
      blockingEmails: blocking.map((b) => b.office),
    };
  }

  return { allowed: true };
}

/**
 * Server-side guard:
 * 2. Cannot transition to PROMOTION while a requirement of a mandatory category is still NEEDED or REQUESTED.
 */
export function canTransitionToPromotion(requirements: RequirementStatusSummary[]): {
  allowed: boolean;
  reason?: string;
  blockingRequirements?: RequirementCategory[];
} {
  const blocking = requirements.filter(
    (r) =>
      MANDATORY_REQUIREMENT_CATEGORIES.includes(r.category) &&
      (r.status === "NEEDED" || r.status === "REQUESTED")
  );

  if (blocking.length > 0) {
    const categories = Array.from(new Set(blocking.map((b) => b.category))).join(", ");
    return {
      allowed: false,
      reason: `Impossible de passer au statut PROMOTION : Les prérequis logistiques obligatoires (${categories}) ne sont pas encore CONFIRMED ou READY.`,
      blockingRequirements: blocking.map((b) => b.category),
    };
  }

  return { allowed: true };
}

/**
 * Server-side guard:
 * 3. Cannot transition to CLOSED without a report, or an explicit skip with a written reason.
 */
export function canTransitionToClosed(
  hasReport: boolean,
  skipReason?: string | null
): { allowed: boolean; reason?: string } {
  if (hasReport) return { allowed: true };

  if (skipReason && skipReason.trim().length >= 10) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason:
      "Impossible de clôturer l'activité (CLOSED) : Aucun rapport d'activité n'a été déposé. Pour ignorer le rapport, une justification écrite détaillée (minimum 10 caractères) est requise.",
  };
}

/**
 * Validates overall status transition legality according to the defined lifecycle.
 */
export function validateStatusTransition(
  currentStatus: ActivityStatus,
  targetStatus: ActivityStatus
): { valid: boolean; reason?: string } {
  if (currentStatus === targetStatus) return { valid: true };

  // Terminal or hold states can be entered from any active state
  if (targetStatus === "CANCELLED" || targetStatus === "ON_HOLD") {
    return { valid: true };
  }

  // Can resume from ON_HOLD to previous or next reasonable state
  if (currentStatus === "ON_HOLD") {
    return { valid: true };
  }

  const validTransitions: Record<ActivityStatus, ActivityStatus[]> = {
    IDEA: ["SUBMITTED", "BRIEF_APPROVED", "ON_HOLD", "CANCELLED"],
    SUBMITTED: ["BRIEF_APPROVED", "IDEA", "ON_HOLD", "CANCELLED"],
    BRIEF_APPROVED: ["ADMIN_REQUESTS", "LOGISTICS_CONFIRMED", "APPROVED", "ON_HOLD", "CANCELLED"],
    ADMIN_REQUESTS: ["LOGISTICS_CONFIRMED", "APPROVED", "ON_HOLD", "CANCELLED"],
    LOGISTICS_CONFIRMED: ["APPROVED", "PROMOTION", "ON_HOLD", "CANCELLED"],
    APPROVED: ["LOGISTICS_READY", "LOGISTICS_CONFIRMED", "PROMOTION", "LIVE", "ON_HOLD", "CANCELLED"],
    LOGISTICS_READY: ["PROMOTION", "LIVE", "ON_HOLD", "CANCELLED"],
    PROMOTION: ["LIVE", "ON_HOLD", "CANCELLED"],
    LIVE: ["CLOSED", "CANCELLED"],
    CLOSED: [], // terminal
    ON_HOLD: [
      "IDEA",
      "SUBMITTED",
      "BRIEF_APPROVED",
      "ADMIN_REQUESTS",
      "LOGISTICS_CONFIRMED",
      "APPROVED",
      "LOGISTICS_READY",
      "PROMOTION",
      "LIVE",
      "CANCELLED",
    ],
    CANCELLED: [], // terminal
  };

  const allowedNext = validTransitions[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      valid: false,
      reason: `Transition invalide : Impossible de passer de ${currentStatus} à ${targetStatus}.`,
    };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// 4. RESOURCE CONFLICT DETECTION & AGENDA OVERLAP VALIDATION
// ---------------------------------------------------------------------------

export interface ResourceBookingSlot {
  activityId: string;
  activityTitle: string;
  resourceId: string;
  resourceName?: string;
  startsAt: Date | string;
  endsAt: Date | string;
}

/**
 * Checks for overlapping bookings on the same physical room or equipment resource.
 */
export function detectResourceConflict(
  targetSlot: {
    activityId: string;
    resourceId: string;
    startsAt: Date | string;
    endsAt: Date | string;
  },
  existingSlots: ResourceBookingSlot[]
): { hasConflict: boolean; conflictingSlot?: ResourceBookingSlot } {
  const targetStart = new Date(targetSlot.startsAt).getTime();
  const targetEnd = new Date(targetSlot.endsAt).getTime();

  for (const slot of existingSlots) {
    if (slot.activityId === targetSlot.activityId) continue;
    if (slot.resourceId !== targetSlot.resourceId) continue;

    const slotStart = new Date(slot.startsAt).getTime();
    const slotEnd = new Date(slot.endsAt).getTime();

    // Overlap condition: startA < endB and endA > startB
    if (targetStart < slotEnd && targetEnd > slotStart) {
      return {
        hasConflict: true,
        conflictingSlot: slot,
      };
    }
  }

  return { hasConflict: false };
}

export interface AgendaValidationWarning {
  itemId?: string;
  title: string;
  message: string;
}

/**
 * Validates agenda items for impossible durations, overlapping time slots,
 * or sessions falling outside the activity's scheduled start/end boundaries.
 */
export function detectAgendaConflicts(
  items: Array<{ id?: string; title: string; startsAt: string | Date; durationMin: number }>,
  activityStartsAt?: string | Date,
  activityEndsAt?: string | Date
): AgendaValidationWarning[] {
  const warnings: AgendaValidationWarning[] = [];
  const sorted = [...items].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );

  const actStart = activityStartsAt ? new Date(activityStartsAt).getTime() : null;
  const actEnd = activityEndsAt ? new Date(activityEndsAt).getTime() : null;

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const startMs = new Date(item.startsAt).getTime();
    if (isNaN(startMs)) {
      warnings.push({
        itemId: item.id,
        title: item.title,
        message: `Heure de début invalide pour "${item.title}".`,
      });
      continue;
    }

    if (item.durationMin <= 0) {
      warnings.push({
        itemId: item.id,
        title: item.title,
        message: `La durée de "${item.title}" doit être supérieure à 0 minute.`,
      });
    }

    const endMs = startMs + item.durationMin * 60 * 1000;

    if (actStart !== null && startMs < actStart) {
      warnings.push({
        itemId: item.id,
        title: item.title,
        message: `"${item.title}" commence avant l'ouverture officielle de l'activité.`,
      });
    }
    if (actEnd !== null && endMs > actEnd) {
      warnings.push({
        itemId: item.id,
        title: item.title,
        message: `"${item.title}" dépasse l'heure de fin prévue de l'activité.`,
      });
    }

    if (i < sorted.length - 1) {
      const next = sorted[i + 1];
      const nextStartMs = new Date(next.startsAt).getTime();
      if (endMs > nextStartMs) {
        warnings.push({
          itemId: item.id,
          title: item.title,
          message: `Chevauchement horaire entre "${item.title}" et "${next.title}".`,
        });
      }
    }
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// 5. ATTENTION & WARNING RULES (BUSINESS LOGIC)
// ---------------------------------------------------------------------------

export interface AttentionItemsResult {
  overdueTasks: Array<{ id: string; title: string; dueDate: string }>;
  unrepliedEmails: Array<{ id: string; office: string; daysPending: number }>;
  unconfirmedUrgentRequirements: Array<{ id: string; title: string; neededBy: string }>;
  staleIdeas: Array<{ id: string; title: string; daysInIdea: number }>;
  unapprovedUrgentActivities: Array<{ id: string; title: string; daysUntilStart: number }>;
}

export function computeAttentionFlags(params: {
  tasks: Array<{ id: string; title: string; dueDate?: string | null; status: string }>;
  emails: Array<{ id: string; office: string; sentAt?: string | null; status: string }>;
  requirements: Array<{ id: string; title: string; neededBy?: string | null; status: string }>;
  activities: Array<{ id: string; title: string; status: string; createdAt: string; startsAt: string }>;
  noReplyThresholdDays?: number;
  now?: Date;
}): AttentionItemsResult {
  const now = params.now || new Date();
  const noReplyDays = params.noReplyThresholdDays ?? 4;

  // 1. Overdue tasks
  const overdueTasks = params.tasks
    .filter((t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate).getTime() < now.getTime())
    .map((t) => ({ id: t.id, title: t.title, dueDate: t.dueDate! }));

  // 2. Emails SENT with no reply after N days
  const unrepliedEmails = params.emails
    .filter((e) => e.status === "SENT" && e.sentAt)
    .map((e) => {
      const sentTime = new Date(e.sentAt!).getTime();
      const days = Math.floor((now.getTime() - sentTime) / (1000 * 60 * 60 * 24));
      return { id: e.id, office: e.office, daysPending: days };
    })
    .filter((e) => e.daysPending >= noReplyDays);

  // 3. Requirements not CONFIRMED within 7 days of the date
  const unconfirmedUrgentRequirements = params.requirements
    .filter((r) => r.status !== "CONFIRMED" && r.status !== "READY" && r.neededBy)
    .filter((r) => {
      const neededTime = new Date(r.neededBy!).getTime();
      const daysUntilNeeded = Math.ceil((neededTime - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilNeeded <= 7 && daysUntilNeeded >= 0;
    })
    .map((r) => ({ id: r.id, title: r.title, neededBy: r.neededBy! }));

  // 4. Activities in IDEA for over 14 days
  const staleIdeas = params.activities
    .filter((a) => a.status === "IDEA")
    .map((a) => {
      const createdTime = new Date(a.createdAt).getTime();
      const days = Math.floor((now.getTime() - createdTime) / (1000 * 60 * 60 * 24));
      return { id: a.id, title: a.title, daysInIdea: days };
    })
    .filter((a) => a.daysInIdea > 14);

  // 5. Activities within 21 days without an approved brief
  const unapprovedUrgentActivities = params.activities
    .filter((a) => a.status === "IDEA")
    .map((a) => {
      const startTime = new Date(a.startsAt).getTime();
      const daysUntilStart = Math.ceil((startTime - now.getTime()) / (1000 * 60 * 60 * 24));
      return { id: a.id, title: a.title, daysUntilStart };
    })
    .filter((a) => a.daysUntilStart <= 21 && a.daysUntilStart >= 0);

  return {
    overdueTasks,
    unrepliedEmails,
    unconfirmedUrgentRequirements,
    staleIdeas,
    unapprovedUrgentActivities,
  };
}

// ---------------------------------------------------------------------------
// 6. PUBLICATION & LIFECYCLE READINESS GATE
// ---------------------------------------------------------------------------

/**
 * Evaluates an activity's complete preparation state across all 7 workspace tabs
 * and computes actionable blockers and readiness percentages.
 */
export function evaluateActivityReadiness(params: {
  activity: {
    title?: string | null;
    idea?: string | null;
    objectives?: string[] | null;
    audience?: string | null;
    location?: string | null;
    format?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    eventId?: string | null;
    closureSkipReason?: string | null;
  };
  tasks: Array<{ status: string; dueDate?: string | null; isCompressed?: boolean }>;
  emails: EmailStatusSummary[];
  requirements: RequirementStatusSummary[];
  agendaCount?: number;
  hasReport: boolean;
  now?: Date;
}): ActivityReadinessGate {
  const now = params.now || new Date();
  const blockers: ReadinessBlocker[] = [];

  const hasTitle = Boolean(params.activity.title && params.activity.title.trim().length >= 3);
  const hasIdea = Boolean(params.activity.idea && params.activity.idea.trim().length >= 10);
  const hasObjectives = Array.isArray(params.activity.objectives) && params.activity.objectives.length > 0;
  const hasVenue =
    params.activity.format === "ONLINE" ||
    Boolean(params.activity.location && params.activity.location.trim().length > 0);
  const hasDates = Boolean(params.activity.startsAt && params.activity.endsAt);

  const briefComplete = hasTitle && hasIdea && hasObjectives && hasVenue && hasDates;

  if (!briefComplete) {
    const missing: string[] = [];
    if (!hasIdea) missing.push("description/concept (min. 10 caractères)");
    if (!hasObjectives) missing.push("au moins un objectif");
    if (!hasVenue) missing.push("lieu ou salle");
    blockers.push({
      code: "BRIEF_INCOMPLETE",
      tab: "brief",
      severity: "BLOCKER",
      title: "Cahier des charges (Brief) incomplet",
      description: `Éléments manquants : ${missing.join(", ")}.`,
      actionLabel: "Compléter le Brief",
    });
  }

  // Tasks stats
  const tasksTotal = params.tasks.length;
  const tasksDone = params.tasks.filter((t) => t.status === "DONE").length;
  const tasksOverdue = params.tasks.filter(
    (t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate).getTime() < now.getTime()
  ).length;
  const tasksCompressed = params.tasks.filter((t) => t.isCompressed && t.status !== "DONE").length;

  if (tasksOverdue > 0) {
    blockers.push({
      code: "TASKS_OVERDUE",
      tab: "plan",
      severity: "WARNING",
      title: `${tasksOverdue} tâche(s) en retard`,
      description: "Certaines échéances du rétroplanning sont dépassées.",
      actionLabel: "Voir le Plan d'Action",
    });
  }

  // Emails check
  const emailsTotal = params.emails.length;
  const emailsApprovedOrReplied = params.emails.filter(
    (e) => e.status === "REPLIED" || e.status === "APPROVED"
  ).length;
  const approvalGuard = canTransitionToApproved(params.emails);

  if (!approvalGuard.allowed) {
    blockers.push({
      code: "EMAILS_PENDING_APPROVAL",
      tab: "emails",
      severity: "BLOCKER",
      title: "Courriers administratifs en attente de réponse",
      description: approvalGuard.reason || "Tous les courriers obligatoires doivent être répondus ou approuvés.",
      actionLabel: "Gérer les Courriers Admin",
    });
  }

  // Logistics check
  const requirementsTotal = params.requirements.length;
  const promotionGuard = canTransitionToPromotion(params.requirements);
  const mandatoryRequirementsPending = params.requirements.filter(
    (r) =>
      MANDATORY_REQUIREMENT_CATEGORIES.includes(r.category) &&
      (r.status === "NEEDED" || r.status === "REQUESTED")
  ).length;

  if (!promotionGuard.allowed) {
    blockers.push({
      code: "LOGISTICS_UNCONFIRMED",
      tab: "logistics",
      severity: "BLOCKER",
      title: `${mandatoryRequirementsPending} prérequis logistique(s) obligatoire(s) non confirmé(s)`,
      description: promotionGuard.reason || "Les salles, équipements et autorisations doivent être confirmés.",
      actionLabel: "Confirmer la Logistique",
    });
  }

  // Agenda warning
  if ((params.agendaCount ?? 0) === 0) {
    blockers.push({
      code: "AGENDA_EMPTY",
      tab: "agenda",
      severity: "WARNING",
      title: "Déroulé (Agenda) non défini",
      description: "Aucun créneau n'a encore été ajouté au conducteur du jour J.",
      actionLabel: "Structurer l'Agenda",
    });
  }

  // Closure check
  const closureGuard = canTransitionToClosed(params.hasReport, params.activity.closureSkipReason);

  // Weighted progress calculation
  const briefScore = briefComplete ? 20 : 10;
  const taskScore = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 30) : 30;
  const emailScore =
    emailsTotal > 0 ? Math.round((emailsApprovedOrReplied / emailsTotal) * 25) : 25;
  const reqConfirmed = params.requirements.filter(
    (r) => r.status === "CONFIRMED" || r.status === "READY" || r.status === "RETURNED"
  ).length;
  const reqScore =
    requirementsTotal > 0 ? Math.round((reqConfirmed / requirementsTotal) * 25) : 25;

  const overallProgressPct = Math.min(100, briefScore + taskScore + emailScore + reqScore);

  return {
    briefComplete,
    tasksTotal,
    tasksDone,
    tasksOverdue,
    tasksCompressed,
    emailsTotal,
    emailsApprovedOrReplied,
    canApproveActivity: briefComplete && approvalGuard.allowed,
    requirementsTotal,
    mandatoryRequirementsPending,
    canStartPromotion: briefComplete && approvalGuard.allowed && promotionGuard.allowed,
    hasReport: params.hasReport,
    canCloseActivity: closureGuard.allowed,
    isPublishedToPublicCalendar: Boolean(params.activity.eventId),
    overallProgressPct,
    blockers,
  };
}

