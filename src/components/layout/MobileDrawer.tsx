"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AsteriaLogo } from "@/components/brand/AsteriaLogo";
import { RoleBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useMobileNav } from "@/components/providers/MobileNavProvider";
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
  BookOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformGuideModal } from "@/components/dashboard/PlatformGuideModal";

interface MobileDrawerProps {
  user: UserSession | null;
}

export function MobileDrawer({ user }: MobileDrawerProps) {
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const isFr = language === "fr";
  const { isOpen, close } = useMobileNav();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const navItems = [
    {
      label: isFr ? "Tableau de bord" : "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["BOARD", "HOD", "MEMBER", "APPLICANT"],
    },
    {
      label: isFr ? "Annuaire des Membres" : "Members Directory",
      href: "/members",
      icon: Users,
      roles: ["BOARD", "HOD", "MEMBER"],
    },
    {
      label: isFr ? "Pôles & Organigramme" : "Departments & Org",
      href: "/departments",
      icon: Network,
      roles: ["BOARD", "HOD", "MEMBER"],
    },
    {
      label: isFr ? "Calendrier & Événements" : "Calendar & Events",
      href: "/calendar",
      icon: Calendar,
      roles: ["BOARD", "HOD", "MEMBER"],
    },
    {
      label: isFr ? "Tableau Kanban" : "Task Kanban",
      href: "/tasks",
      icon: KanbanSquare,
      roles: ["BOARD", "HOD", "MEMBER"],
    },
    {
      label: isFr ? "Présence & QR" : "Attendance & QR",
      href: "/attendance",
      icon: QrCode,
      roles: ["BOARD", "HOD", "MEMBER"],
    },
    {
      label: isFr ? "Annonces & Bulletins" : "Announcements",
      href: "/announcements",
      icon: Megaphone,
      roles: ["BOARD", "HOD", "MEMBER", "APPLICANT"],
    },
    {
      label: isFr ? "Candidatures" : "Recruitment Pipeline",
      href: "/applications",
      icon: UserPlus,
      roles: ["BOARD", "HOD"],
    },
    {
      label: isFr ? "Administration & Audit" : "Admin & Governance",
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={close}
      />

      {/* Drawer Panel */}
      <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-[#052024] border-r border-line dark:border-teal-900/80 flex flex-col justify-between h-full overflow-y-auto text-ink dark:text-white shadow-2xl z-10 animate-courant-in">
        <div>
          {/* Header Branding */}
          <div className="px-4 py-4 border-b border-line dark:border-teal-900/80 flex items-center justify-between">
            <AsteriaLogo variant="auto" size="sm" href="/dashboard" />
            <button
              onClick={close}
              className="p-1.5 rounded-xl text-ink-soft dark:text-teal-200 hover:text-ink dark:hover:text-white hover:bg-surface-alt dark:hover:bg-teal-900/60 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          {user && (
            <div className="px-4 py-3.5 border-b border-line dark:border-teal-900/80 bg-surface-alt/60 dark:bg-[#04191c]">
              <Link
                href={`/members/${user.id}`}
                onClick={close}
                className="flex items-center gap-3 group"
              >
                <Avatar
                  name={user.name}
                  src={user.avatarUrl}
                  size="md"
                  className="group-hover:ring-2 group-hover:ring-ast-primary dark:group-hover:ring-teal-400 transition-all"
                />
                <div className="overflow-hidden flex-1">
                  <p className="font-body font-bold text-xs text-ink dark:text-white truncate group-hover:text-ast-primary dark:group-hover:text-ast-light transition-colors">
                    {user.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <RoleBadge role={user.role} />
                  </div>
                  {user.departmentName && (
                    <p className="text-[10px] text-ink-soft dark:text-teal-300/70 truncate mt-0.5 font-mono">
                      {user.departmentName}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          )}

          {/* System Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-ast-primary dark:text-teal-400/80 font-mono">
              {isFr ? "Navigation Système" : "Platform Navigation"}
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
                  onClick={close}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold font-body transition-all duration-200 group relative",
                    isActive
                      ? "bg-teal-50 dark:bg-teal-900/90 text-ast-primary dark:text-ast-light font-bold border border-teal-200 dark:border-teal-500/40 shadow-sm"
                      : "text-ink-soft dark:text-teal-100/70 hover:bg-teal-50/60 dark:hover:bg-teal-900/40 hover:text-ink dark:hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors flex-shrink-0",
                      isActive
                        ? "text-ast-primary dark:text-ast-light"
                        : "text-ast-primary/60 dark:text-teal-400/70 group-hover:text-ast-primary dark:group-hover:text-teal-300"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-ast-primary dark:bg-ast-light absolute right-3 glow-teal" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-line dark:border-teal-900/80 space-y-2 bg-surface-alt/40 dark:bg-[#04191c]">
          <div className="flex items-center justify-between px-2 pb-0.5">
            <span className="text-[10px] font-mono text-ink-soft dark:text-teal-300/80 font-bold uppercase tracking-wider">
              {isFr ? "Langue" : "Language"}
            </span>
            <LanguageToggle variant="pill" />
          </div>

          <div className="flex items-center justify-between px-2 pb-0.5">
            <span className="text-[10px] font-mono text-ink-soft dark:text-teal-300/80 font-bold uppercase tracking-wider">
              {isFr ? "Thème" : "Theme Mode"}
            </span>
            <ThemeToggle variant="pill" />
          </div>

          <button
            onClick={() => {
              setIsGuideOpen(true);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-ast-primary dark:text-ast-light bg-teal-50/70 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200/60 dark:border-teal-800 transition-colors"
          >
            <span className="flex items-center gap-2 font-semibold">
              <BookOpen className="w-3.5 h-3.5" /> {isFr ? "Guide Plateforme" : "Platform Guide"}
            </span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <Link
            href="/"
            onClick={close}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-ink-soft dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/50 hover:text-ink dark:hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2 font-semibold">
              <Home className="w-3.5 h-3.5" /> {isFr ? "Site Public" : "Public Homepage"}
            </span>
            <ArrowRight className="w-3 h-3 text-ast-primary/60 dark:text-teal-500" />
          </Link>

          <a
            href="https://asteria-freelance-prelaunch.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-ink-soft dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/50 hover:text-ink dark:hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2 font-semibold">
              ★ Freelance PreLaunch
            </span>
            <ExternalLink className="w-3 h-3 text-ast-primary/60 dark:text-teal-500" />
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t("nav.logout", "Sign Out")}</span>
          </button>
        </div>

        {/* Platform Guide Modal */}
        <PlatformGuideModal
          user={user}
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
        />
      </aside>
    </div>
  );
}
