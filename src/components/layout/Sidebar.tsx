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
  Home,
  ArrowRight,
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
      label: "Admin & Governance",
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
    <aside className="w-64 bg-[#052024] border-r border-teal-900/80 flex flex-col justify-between flex-shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto text-white">
      {/* Top Brand Logo */}
      <div>
        <div className="px-6 py-5 border-b border-teal-900/80 flex items-center justify-between">
          <AsteriaLogo variant="dark" size="md" href="/dashboard" />
        </div>

        {/* User Card */}
        {user && (
          <div className="px-5 py-4 border-b border-teal-900/80 bg-[#04191c]">
            <Link
              href={`/members/${user.id}`}
              className="flex items-center gap-3 group"
            >
              <Avatar
                name={user.name}
                src={user.avatarUrl}
                size="md"
                className="group-hover:ring-2 group-hover:ring-teal-400 transition-all"
              />
              <div className="overflow-hidden flex-1">
                <p className="font-body font-bold text-xs text-white truncate group-hover:text-ast-light transition-colors">
                  {user.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <RoleBadge role={user.role} />
                </div>
                {user.departmentName && (
                  <p className="text-[10px] text-teal-300/70 truncate mt-0.5 font-mono">
                    {user.departmentName}
                  </p>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-teal-400/80 font-mono">
            Platform Navigation
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
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold font-body transition-all duration-200 group relative",
                  isActive
                    ? "bg-teal-900/90 text-ast-light font-bold border border-teal-500/40 shadow-sm"
                    : "text-teal-100/70 hover:bg-teal-900/40 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-ast-light"
                      : "text-teal-400/70 group-hover:text-teal-300"
                  )}
                />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-ast-light absolute right-3 glow-teal" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-teal-900/80 space-y-2 bg-[#04191c]">
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-teal-300 hover:bg-teal-900/50 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2 font-semibold">
            <Home className="w-3.5 h-3.5" /> Public Homepage
          </span>
          <ArrowRight className="w-3 h-3 text-teal-500" />
        </Link>

        <a
          href="https://asteria-freelance.vercel.app"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-teal-300 hover:bg-teal-900/50 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2 font-semibold">
            ★ Asteria Freelance
          </span>
          <ExternalLink className="w-3 h-3 text-teal-500" />
        </a>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
