import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { PlannerCalendarClient } from "@/components/planner/PlannerCalendarClient";

export default async function PlannerCalendarPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex-1 flex flex-col">
      <Header
        user={user}
        title="Executive Activity Calendar"
        subtitle="Master schedule across all preparation phases, campus venues, and published events"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <PlannerCalendarClient currentUser={user} />
      </div>
    </div>
  );
}
