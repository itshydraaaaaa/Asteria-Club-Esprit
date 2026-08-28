import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";

export default async function TasksPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex-1 flex flex-col">
      <Header
        user={user}
        title="Task Management · Kanban"
        subtitle="Department agile sprints, priority tickets, and deliverables"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <KanbanBoard currentUser={user} />
      </div>
    </div>
  );
}
