import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { ActivityWorkspaceClient } from "@/components/planner/ActivityWorkspaceClient";

export default async function ActivityWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        user={user}
        title="Activity Workspace · 360° Operations"
        subtitle="Brief, T-minus action plan, ESPRIT admin requests, logistics, run-of-show, files, and closure report"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <ActivityWorkspaceClient activityId={id} currentUser={user} />
      </div>
    </div>
  );
}
