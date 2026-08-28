export type UserRole = "BOARD" | "HOD" | "MEMBER" | "APPLICANT";
export type UserStatus = "ACTIVE" | "INACTIVE" | "ALUMNI";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type RsvpStatus = "GOING" | "MAYBE" | "DECLINED";
export type AttendanceMethod = "QR" | "CODE" | "MANUAL";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED";
export type AnnouncementScope = "CLUB" | "DEPARTMENT";
export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

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
  startTime: string;
  endTime: string;
  location: string;
  departmentId?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  recurrenceRule?: string | null;
  checkInCode: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
  };
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
    user: {
      id: string;
      name: string;
      avatarUrl?: string | null;
    };
  }>;
  _count?: {
    rsvps: number;
    attendanceRecords: number;
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
