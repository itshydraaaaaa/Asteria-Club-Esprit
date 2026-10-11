import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, isManagementRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?returnUrl=/planner");
  }

  if (!isManagementRole(user.role)) {
    // Check if the member is explicitly assigned to an activity team or activity task
    const supabase = await createClient();
    const [{ data: memberRows }, { data: taskRows }] = await Promise.all([
      (supabase as any)
        .from("activity_members")
        .select("activity_id")
        .eq("user_id", user.id)
        .limit(1),
      (supabase as any)
        .from("tasks")
        .select("activity_id")
        .eq("assignee_id", user.id)
        .not("activity_id", "is", null)
        .limit(1),
    ]);

    const hasAssignedActivity =
      (Array.isArray(memberRows) && memberRows.length > 0) ||
      (Array.isArray(taskRows) && taskRows.length > 0);

    if (!hasAssignedActivity) {
      redirect("/dashboard");
    }
  }

  return <div className="flex-1 flex flex-col min-w-0">{children}</div>;
}
