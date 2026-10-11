import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, isManagementRole } from "@/lib/auth";

export default async function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?returnUrl=/planner");
  }

  // Strictly restricted to Executive Board (PRESIDENT, VICE_PRESIDENT, BOARD) and HoD
  if (!isManagementRole(user.role)) {
    redirect("/dashboard");
  }

  return <div className="flex-1 flex flex-col min-w-0">{children}</div>;
}
