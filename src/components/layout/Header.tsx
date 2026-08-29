"use client";

import React, { useState } from "react";
import { UserSession } from "@/lib/types";
import { Bell, Plus, Sparkles, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";

interface HeaderProps {
  user?: UserSession | null;
  title?: string;
  subtitle?: string;
}

export function Header({ user = null, title, subtitle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <header className="bg-white/85 dark:bg-[#052024]/90 backdrop-blur-md border-b border-line dark:border-teal-900/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-300">
      <div>
        {title ? (
          <div>
            <h1 className="font-display font-bold text-lg md:text-xl uppercase tracking-wider text-ink dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="font-body text-xs text-ink-soft dark:text-teal-200/70 mt-0.5">{subtitle}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs uppercase tracking-wider text-ast-primary dark:text-ast-light bg-teal-50 dark:bg-teal-950/80 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800">
              Asteria Operating System · Live Database
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Quick Task/Event Trigger */}
        {(user?.role === "BOARD" || user?.role === "HOD") && (
          <Link href="/tasks">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              <span className="hidden sm:inline">New Sprint Ticket</span>
            </Button>
          </Link>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (unreadCount > 0) setUnreadCount(0);
            }}
            className="p-2 rounded-xl bg-surface-alt dark:bg-[#08262b] border border-line dark:border-teal-900 text-ink-soft dark:text-teal-200 hover:text-ink dark:hover:text-white hover:border-ast-primary dark:hover:border-ast-light relative transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-ast-light text-ink font-bold text-[9px] rounded-full flex items-center justify-center border border-surface shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#08262b] border border-line dark:border-teal-800 rounded-2xl shadow-xl z-50 p-2 animate-vague-in">
              <div className="px-3 py-2 border-b border-line dark:border-teal-900 flex items-center justify-between">
                <span className="font-display font-bold uppercase text-xs tracking-wider text-ink dark:text-white">
                  Real-Time Bulletins
                </span>
                <span className="text-[10px] text-ast-primary dark:text-ast-light font-mono font-bold bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                  Supabase Live
                </span>
              </div>
              <div className="p-4 text-center text-xs text-ink-soft dark:text-teal-200/70 font-body">
                All announcements and sprint notifications are synced live across your devices.
                <div className="pt-2">
                  <Link
                    href="/announcements"
                    onClick={() => setShowNotifications(false)}
                    className="text-ast-primary dark:text-ast-light font-semibold hover:underline"
                  >
                    View All Bulletins →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
