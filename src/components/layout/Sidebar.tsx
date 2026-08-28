"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AsteriaLogo } from "@/components/brand/AsteriaLogo";
import { RoleBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { UserSession } from "@/lib/types";
import {
  LayoutDashboard,
  Users,
  Network,
  Calendar,
  KanbanSquare,
  QrCode,
  Megaphone,
  UserPlus,
  Settings,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: UserSession | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["BOARD", "HOD", "MEMBER", "APPLICANT"],
    },
    {
      label: "Members Directory",
      href: "/members",
      icon: Users,
      roles: ["BOARD", "HOD", "MEMBER"],
    },
    {
      label: "Departments & Org",
      href: "/departments",
      icon: Network,
      roles: ["BOARD", "HOD", "MEMBER"],
    },
    {
      label: "Calendar & Events",
      href: "/calendar",
      icon: Calendar,
      roles: ["BOARD", "HOD", "MEMBER"],
    },
    {
      label: "Task Kanban",
      href: "/tasks",
      icon: KanbanSquare,
      roles: ["BOARD", "HOD", "MEMBER"],
    },
    {
      label: "Attendance & QR",
      href: "/attendance",
      icon: QrCode,
      roles: ["BOARD", "HOD", "MEMBER"],
    },
    {
      label: "Announcements",
      href: "/announcements",
      icon: Megaphone,
      roles: ["BOARD", "HOD", "MEMBER", "APPLICANT"],
    },
    {
      label: "Recruitment Pipeline",
      href: "/applications",
      icon: UserPlus,
      roles: ["BOARD", "HOD"],
    },
    {
      label: "Admin & Settings",
      href: "/admin",
      icon: Settings,
      roles: ["BOARD"],
    },
  ];

  const allowedNav = navItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 bg-surface border-r border-line flex flex-col justify-between flex-shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
      {/* Top Brand Logo with strict protection zone */}
      <div>
        <div className="px-6 py-6 border-b border-line/70">
          <AsteriaLogo variant="light" size="md" href="/dashboard" />
        </div>

        {/* User Card */}
        {user && (
          <div className="px-5 py-4 border-b border-line/60 bg-surface-alt/40">
            <Link
              href={`/members/${user.id}`}
              className="flex items-center gap-3 group"
            >
              <Avatar
                name={user.name}
                src={user.avatarUrl}
                size="md"
                className="group-hover:ring-2 group-hover:ring-teal-400/80 transition-all"
              />
              <div className="overflow-hidden flex-1">
                <p className="font-body font-bold text-xs text-ink truncate group-hover:text-teal-900 transition-colors">
                  {user.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <RoleBadge role={user.role} />
                </div>
                {user.departmentName && (
                  <p className="text-[10px] text-ink-soft truncate mt-0.5">
                    {user.departmentName}
                  </p>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-ink-faint">
            Club Navigation
          </div>
          {allowedNav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold font-body transition-all duration-200 select-none group",
                  isActive
                    ? "bg-teal-900 text-white shadow-sm font-bold"
                    : "text-ink-soft hover:text-ink hover:bg-surface-alt"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-teal-300" : "text-ink-faint group-hover:text-teal-900"
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-line/70 space-y-2">
        <Link
          href="/apply"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-teal-50 text-teal-900 border border-teal-200/80 hover:bg-teal-100 text-xs font-semibold font-body transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-teal-700" />
            Public Join Form
          </span>
          <span className="text-[10px] font-mono font-bold bg-teal-200/60 px-1.5 py-0.5 rounded text-teal-900">
            /apply
          </span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
