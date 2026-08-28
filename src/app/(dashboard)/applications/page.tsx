import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { ApplicationsPipeline } from "@/components/recruitment/ApplicationsPipeline";
import { redirect } from "next/navigation";

export default async function ApplicationsPage() {
  const user = await getCurrentUser();

  if (user && user.role !== "BOARD" && user.role !== "HOD") {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        user={user}
        title="Recruitment & Onboarding"
        subtitle="Review applicant portfolios, interview scores, and 1-click member account creation"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <ApplicationsPipeline currentUser={user} />
      </div>
    </div>
  );
}
