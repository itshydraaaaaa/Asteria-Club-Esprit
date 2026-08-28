"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Calendar,
  QrCode,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  const links = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Tasks", href: "/tasks", icon: KanbanSquare },
    { label: "Check-in", href: "/attendance", icon: QrCode },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Directory", href: "/members", icon: Users },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-line px-2 py-2 flex items-center justify-around z-40 shadow-lg">
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
              "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200",
              isActive ? "text-teal-900 font-bold" : "text-ink-soft hover:text-ink"
            )}
          >
            <div
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive ? "bg-teal-400/20 text-teal-900" : "text-ink-soft"
              )}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-body font-medium">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
