import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { CalendarView } from "@/components/calendar/CalendarView";

export default async function CalendarPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex-1 flex flex-col">
      <Header
        user={user}
        title="Calendar & Scheduling"
        subtitle="Shared workshops, general assemblies, department syncs, and RSVP attendance"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <CalendarView currentUser={user} />
      </div>
    </div>
  );
}
