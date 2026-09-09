"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KanbanSquare,
  Calendar,
  QrCode,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useMobileNav } from "@/components/providers/MobileNavProvider";

export function MobileNav() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const isFr = language === "fr";
  const { isOpen: isDrawerOpen, toggle: toggleDrawer } = useMobileNav();

  const links = [
    { label: isFr ? "Accueil" : "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: isFr ? "Tâches" : "Tasks", href: "/tasks", icon: KanbanSquare },
    { label: isFr ? "Présence" : "Check-in", href: "/attendance", icon: QrCode },
    { label: isFr ? "Calendrier" : "Calendar", href: "/calendar", icon: Calendar },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#052024]/95 backdrop-blur-md border-t border-line dark:border-teal-900/80 px-1.5 py-1.5 flex items-center justify-around z-40 shadow-lg pb-[max(0.375rem,env(safe-area-inset-bottom))] transition-colors duration-300">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/dashboard" && pathname.startsWith(link.href));
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all duration-200",
              isActive
                ? "text-ast-primary dark:text-ast-light font-bold"
                : "text-ink-soft dark:text-teal-200/70 hover:text-ink dark:hover:text-white"
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive
                  ? "bg-teal-50 dark:bg-teal-900/80 text-ast-primary dark:text-ast-light shadow-xs"
                  : "text-ink-soft dark:text-teal-300/70"
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-body font-medium">{link.label}</span>
          </Link>
        );
      })}

      {/* Full Menu Drawer Toggle Button */}
      <button
        onClick={toggleDrawer}
        className={cn(
          "flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all duration-200",
          isDrawerOpen
            ? "text-ast-primary dark:text-ast-light font-bold"
            : "text-ink-soft dark:text-teal-200/70 hover:text-ink dark:hover:text-white"
        )}
      >
        <div
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            isDrawerOpen
              ? "bg-teal-50 dark:bg-teal-900/80 text-ast-primary dark:text-ast-light shadow-xs"
              : "text-ink-soft dark:text-teal-300/70"
          )}
        >
          <Menu className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-body font-medium">{isFr ? "Menu" : "Menu"}</span>
      </button>
    </nav>
  );
}
