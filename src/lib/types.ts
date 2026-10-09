export type UserRole =
  | "PRESIDENT"
  | "VICE_PRESIDENT"
  | "BOARD"
  | "HOD"
  | "MEMBER"
  | "WAITING_FOR_INTERVIEW"
  | "DECLINED"
  | "APPLICANT";

export type BoardTrack = "PR" | "HR" | "CM" | "CRD" | "GENERAL";

export const BOARD_TRACK_LABELS: Record<BoardTrack, { fr: string; en: string; description: string }> = {
  PR: {
    fr: "Relations Publiques (PR)",
    en: "Public Relations (PR)",
    description: "Partenariats institutionnels, presse et représentation officielle",
  },
  HR: {
    fr: "Ressources Humaines (HR)",
    en: "Human Resources (HR)",
    description: "Recrutements, entretiens, intégration et cohésion d'équipe",
  },
  CM: {
    fr: "Community Management (CM)",
    en: "Community Management (CM)",
    description: "Réseaux sociaux, couverture médiatique et engagement communautaire",
  },
  CRD: {
    fr: "Corporate Relations & Dev (CRD)",
    en: "Corporate Relations & Dev (CRD)",
    description: "Sponsoring, relations entreprises, stages et opportunités de carrière",
  },
  GENERAL: {
    fr: "Général / Coordination",
    en: "General / Operations",
    description: "Supervision exécutive et opérations générales du club",
  },
};

export type UserStatus = "ACTIVE" | "INACTIVE" | "ALUMNI";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type RsvpStatus = "GOING" | "MAYBE" | "DECLINED";
export type AttendanceMethod = "QR" | "CODE" | "MANUAL";
export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
export type EventType =
  | "WORKSHOP"
  | "MEETING"
  | "SESSION"
  | "PODCAST"
  | "COMPETITION"
  | "GENERAL"
  | "HACKATHON";
export type AudienceScope = "CLUB" | "DEPARTMENT" | "BOARD";
export type CheckInStatus = "SCHEDULED" | "OPEN" | "PAUSED" | "CLOSED";
export type AnnouncementScope = "CLUB" | "DEPARTMENT" | "BOARD";
export type ApplicationStatus = "PENDING" | "INTERVIEW" | "ACCEPTED" | "REJECTED";
export type ExcuseStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string | null;
  departmentName?: string | null;
  boardTitle?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  skills: string[];
  status: UserStatus;
  freelanceReady: boolean;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string | null;
  hodUserId?: string | null;
  hod?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  _count?: {
    members: number;
    tasks: number;
    events: number;
  };
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  departmentId: string;
  department?: {
    id: string;
    name: string;
    slug: string;
  };
  assigneeId?: string | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
  };
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  createdAt: string;
  comments?: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      avatarUrl?: string | null;
    };
    body: string;
    createdAt: string;
  }>;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  cleanDescription?: string;
  imageUrl?: string | null;
  type: EventType;
  audienceScope: AudienceScope;
  startTime: string;
  endTime: string;
  location: string;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  hostId?: string | null;
  host?: {
    id: string;
    name: string;
    role?: UserRole | string;
    avatarUrl?: string | null;
  } | null;
  attendanceRequired: boolean;
  checkInWindowStartMin: number;
  checkInWindowEndMin: number;
  lateThresholdMin: number;
  checkInStatus: CheckInStatus;
  closedAt?: string | null;
  closedById?: string | null;
  isGeofenceEnabled?: boolean;
  geofenceLat?: number | null;
  geofenceLng?: number | null;
  geofenceRadiusM?: number | null;
  recurrenceRule?: string | null;
  checkInCode: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    role?: UserRole | string;
    avatarUrl?: string | null;
  };
  linkedAnnouncementId?: string | null;
  rsvps?: Array<{
    id: string;
    userId: string;
    status: RsvpStatus;
    user: {
      id: string;
      name: string;
      avatarUrl?: string | null;
    };
  }>;
  attendanceRecords?: Array<{
    id: string;
    userId: string;
    status: AttendanceStatus;
    method: AttendanceMethod;
    checkedInAt: string;
    justification?: string | null;
    manualReason?: string | null;
    markedById?: string | null;
    user: {
      id: string;
      name: string;
      email?: string;
      departmentId?: string | null;
      avatarUrl?: string | null;
    };
  }>;
  excuseRequests?: Array<ExcuseRequestItem>;
  _count?: {
    rsvps: number;
    attendanceRecords: number;
    present?: number;
    late?: number;
    absent?: number;
    excused?: number;
    expected?: number;
  };
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  scope: AnnouncementScope;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  eventId?: string | null;
  event?: {
    id: string;
    title: string;
    startTime: string;
    location: string;
  } | null;
  authorId: string;
  author: {
    id: string;
    name: string;
    role: UserRole;
    avatarUrl?: string | null;
  };
  isPinned: boolean;
  createdAt: string;
}

export interface ExcuseRequestItem {
  id: string;
  eventId: string;
  event?: {
    id: string;
    title: string;
    startTime: string;
  };
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    departmentId?: string | null;
    avatarUrl?: string | null;
  };
  reason: string;
  attachmentUrl?: string | null;
  status: ExcuseStatus;
  reviewedById?: string | null;
  reviewerNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceAuditLogItem {
  id: string;
  eventId: string;
  attendanceId?: string | null;
  userId: string;
  user?: {
    id: string;
    name: string;
  };
  changedById: string;
  changedBy?: {
    id: string;
    name: string;
  };
  oldStatus?: string | null;
  newStatus: string;
  reason: string;
  createdAt: string;
}

export interface ApplicationItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  departmentPreference: string;
  motivation: string;
  portfolioLink?: string | null;
  status: ApplicationStatus;
  reviewerNotes?: string | null;
  createdAt: string;
}

export type ConnectionProvider =
  | "github"
  | "linkedin"
  | "discord"
  | "google"
  | "instagram"
  | "tiktok"
  | "x"
  | "facebook"
  | "youtube"
  | "behance"
  | "dribbble"
  | "telegram"
  | "website"
  | "other";

export type ConnectionType = "oauth" | "manual";
export type ConnectionVisibility = "public" | "members" | "private";

export interface MemberConnectionItem {
  id: string;
  userId: string;
  provider: ConnectionProvider;
  type: ConnectionType;
  providerUserId?: string | null;
  username: string;
  profileUrl: string;
  avatarUrl?: string | null;
  customLabel?: string | null;
  isVerified: boolean;
  visibility: ConnectionVisibility;
  displayOrder: number;
  metadata?: Record<string, any>;
  linkedAt: string;
  updatedAt: string;
}

export interface ConnectionModerationLogItem {
  id: string;
  adminId: string;
  memberId: string;
  connectionId?: string | null;
  provider: ConnectionProvider;
  profileUrl: string;
  action: "REMOVED" | "RESTRICTED";
  reason: string;
  createdAt: string;
}

