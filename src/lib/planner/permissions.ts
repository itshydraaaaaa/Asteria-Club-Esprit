/**
 * Asteria Club Esprit — Activity Planner Permission Helpers
 * Enforces application-layer role & ownership checks alongside PostgreSQL RLS.
 */
import { UserSession } from "@/lib/types";
import { isExecutiveRole, isManagementRole } from "@/lib/auth";
import { ActivityItem } from "./types";

/**
 * Checks whether a user can access the Executive Activity Planner module.
 * Board (PRESIDENT, VICE_PRESIDENT, BOARD) and HoDs have full module access.
 */
export function canAccessPlanner(user: UserSession | null): boolean {
  if (!user) return false;
  return isManagementRole(user.role);
}

/**
 * Checks whether a user can view a specific activity workspace.
 * Board, HoDs, activity owner/creator, and assigned activity_members can view.
 */
export function canViewActivityWorkspace(
  user: UserSession | null,
  activity: ActivityItem
): boolean {
  if (!user) return false;
  if (isManagementRole(user.role)) return true;
  if (activity.ownerId === user.id || activity.createdById === user.id) return true;
  if (activity.members?.some((m) => m.profileId === user.id)) return true;
  return false;
}

/**
 * Checks whether a user can modify an activity's brief, tasks, logistics, emails, agenda, or report.
 */
export function canEditActivity(
  user: UserSession | null,
  activity: ActivityItem
): boolean {
  if (!user) return false;
  if (isExecutiveRole(user.role)) return true;
  if (activity.ownerId === user.id || activity.createdById === user.id) return true;
  if (
    user.role === "HOD" &&
    user.departmentId &&
    activity.departmentId === user.departmentId
  ) {
    return true;
  }
  if (
    activity.members?.some(
      (m) =>
        m.profileId === user.id &&
        (m.role === "OWNER" || m.role === "CO_OWNER" || m.role === "CONTRIBUTOR")
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Checks whether a user can approve an activity or publish it to the club calendar.
 */
export function canApproveOrPublishActivity(
  user: UserSession | null,
  activity: ActivityItem
): boolean {
  if (!user) return false;
  if (isExecutiveRole(user.role)) return true;
  if (
    user.role === "HOD" &&
    user.departmentId &&
    activity.departmentId === user.departmentId
  ) {
    return true;
  }
  return false;
}
