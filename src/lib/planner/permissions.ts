/**
 * Asteria Club Esprit — Activity Planner Permission Helpers
 * Enforces application-layer role & ownership checks alongside PostgreSQL RLS.
 * Strictly restricted to Executive Board (PRESIDENT, VICE_PRESIDENT, BOARD) and HoDs (HOD).
 */
import { UserSession } from "@/lib/types";
import { isExecutiveRole, isManagementRole } from "@/lib/auth";
import { ActivityItem } from "./types";

/**
 * Checks whether a user can access the Executive Activity Planner module.
 * Strictly Board (PRESIDENT, VICE_PRESIDENT, BOARD) and HoDs (HOD) only.
 */
export function canAccessPlanner(user: UserSession | null): boolean {
  if (!user) return false;
  return isManagementRole(user.role);
}

/**
 * Checks whether a user can view a specific activity workspace.
 * Strictly Board and HoDs only.
 */
export function canViewActivityWorkspace(
  user: UserSession | null,
  _activity: ActivityItem
): boolean {
  if (!user) return false;
  return isManagementRole(user.role);
}

/**
 * Checks whether a user can modify an activity's brief, tasks, logistics, emails, agenda, or report.
 * Strictly Board and HoDs.
 */
export function canEditActivity(
  user: UserSession | null,
  activity: ActivityItem
): boolean {
  if (!user || !isManagementRole(user.role)) return false;
  if (isExecutiveRole(user.role)) return true;
  if (activity.ownerId === user.id || activity.createdById === user.id) return true;
  if (
    user.role === "HOD" &&
    (!activity.departmentId || activity.departmentId === user.departmentId)
  ) {
    return true;
  }
  return true;
}

/**
 * Checks whether a user can approve an activity or publish it to the club calendar.
 */
export function canApproveOrPublishActivity(
  user: UserSession | null,
  activity: ActivityItem
): boolean {
  if (!user || !isManagementRole(user.role)) return false;
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
