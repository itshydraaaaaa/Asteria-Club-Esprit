import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { RoleSwitcherBar } from "@/components/layout/RoleSwitcherBar";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-surface-alt font-body">
      {/* Demo Persona Switcher Bar at the very top */}
      <RoleSwitcherBar currentUser={user} />

      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar user={user} />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
