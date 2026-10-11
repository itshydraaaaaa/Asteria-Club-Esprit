/**
 * Asteria Club Esprit — Notification Service
 * Server-side notification dispatch and management.
 * Inserts use getAdminClient (service-role) because public.notifications RLS
 * restricts inserts strictly to server execution.
 */
import { getAdminClient } from "@/lib/supabase/admin";
import { NotificationItem } from "@/lib/types";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  body: string;
  type: string;
  link?: string | null;
}

/**
 * Dispatches a single in-app notification to a specific user.
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<NotificationItem | null> {
  const admin = getAdminClient();
  const { data, error } = await (admin as any)
    .from("notifications")
    .insert({
      user_id: params.userId,
      title: params.title,
      body: params.body,
      type: params.type,
      link: params.link ?? null,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create notification:", error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    body: data.body,
    type: data.type,
    link: data.link,
    isRead: data.is_read,
    createdAt: data.created_at,
  };
}

/**
 * Bulk dispatches in-app notifications (e.g. to all department members or board).
 */
export async function createNotifications(
  notifications: CreateNotificationParams[]
): Promise<number> {
  if (!notifications.length) return 0;

  const admin = getAdminClient();
  const payload = notifications.map((n) => ({
    user_id: n.userId,
    title: n.title,
    body: n.body,
    type: n.type,
    link: n.link ?? null,
    is_read: false,
  }));

  const { data, error } = await (admin as any)
    .from("notifications")
    .insert(payload)
    .select("id");

  if (error) {
    console.error("Failed to bulk create notifications:", error);
    return 0;
  }

  return data?.length ?? 0;
}
