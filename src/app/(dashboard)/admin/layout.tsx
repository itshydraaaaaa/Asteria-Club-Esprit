import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, isPresidencyRole } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?returnUrl=/admin");
  }

  // Strictly restricted to President and Vice President
  if (!isPresidencyRole(user.role)) {
    redirect("/dashboard");
  }

  return <div className="flex-1 flex flex-col min-w-0">{children}</div>;
}
