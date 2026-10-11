import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { PlannerOverviewClient } from "@/components/planner/PlannerOverviewClient";

export default async function PlannerOverviewPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex-1 flex flex-col">
      <Header
        user={user}
        title="Executive Activity Planner"
        subtitle="End-to-end activity preparation, backward scheduling, ESPRIT admin approvals, and calendar publication"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <PlannerOverviewClient currentUser={user} />
      </div>
    </div>
  );
}
