import React, { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { NewActivityWizardClient } from "@/components/planner/NewActivityWizardClient";

export default async function NewActivityWizardPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex-1 flex flex-col">
      <Header
        user={user}
        title="New Activity · Backward-Schedule Wizard"
        subtitle="Instantiate templates, calculate T-minus milestones, and generate ESPRIT administrative requests"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <Suspense fallback={<div className="p-8 text-center text-xs">Loading wizard...</div>}>
          <NewActivityWizardClient currentUser={user} />
        </Suspense>
      </div>
    </div>
  );
}
