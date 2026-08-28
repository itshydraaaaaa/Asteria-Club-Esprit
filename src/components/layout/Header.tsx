"use client";

import React, { useState } from "react";
import { UserSession } from "@/lib/types";
import { Bell, Search, Plus, Sparkles, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface HeaderProps {
  user?: UserSession | null;
  title?: string;
  subtitle?: string;
}

export function Header({ user = null, title, subtitle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  const notifications = [
    {
      id: "1",
      title: "New Announcement Published",
      desc: "Rayen posted Sprint 1 Roadmap for Web Development.",
      time: "10m ago",
      unread: true,
      href: "/announcements",
    },
    {
      id: "2",
      title: "Upcoming General Assembly",
      desc: "Asteria General Assembly 2026 #1 starts in 3 days. Please RSVP.",
      time: "1h ago",
      unread: true,
      href: "/calendar",
    },
    {
      id: "3",
      title: "Task Assigned",
      desc: "You were assigned to 'Implement QR Check-in & Scanner Engine'.",
      time: "1d ago",
      unread: false,
      href: "/tasks",
    },
  ];

  return (
    <header className="bg-surface border-b border-line px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div>
        {title ? (
          <div>
            <h1 className="font-display font-bold text-lg md:text-xl uppercase tracking-wider text-ink">
              {title}
            </h1>
            {subtitle && (
              <p className="font-body text-xs text-ink-soft mt-0.5">{subtitle}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-xs uppercase tracking-widest text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              Asteria Operating System
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Task/Event Trigger */}
        {(user?.role === "BOARD" || user?.role === "HOD") && (
          <Link href="/tasks">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              <span className="hidden sm:inline">New Task</span>
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
            className="p-2 rounded-xl bg-surface-alt border border-line text-ink-soft hover:text-ink hover:border-teal-400/40 relative transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 text-ink font-bold text-[9px] rounded-full flex items-center justify-center border border-surface shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-line rounded-2xl shadow-xl z-50 p-2 animate-vague-in">
              <div className="px-3 py-2 border-b border-line flex items-center justify-between">
                <span className="font-display font-bold uppercase text-xs tracking-wider text-ink">
                  Notifications
                </span>
                <span className="text-[10px] text-teal-900 font-semibold font-body bg-teal-50 px-2 py-0.5 rounded">
                  Live Feed
                </span>
              </div>
              <div className="divide-y divide-line/60 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setShowNotifications(false)}
                    className="p-3 block hover:bg-surface-alt rounded-xl transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-body font-bold text-xs text-ink">{n.title}</p>
                      <span className="text-[10px] text-ink-faint whitespace-nowrap">{n.time}</span>
                    </div>
                    <p className="font-body text-[11px] text-ink-soft mt-1 leading-snug">
                      {n.desc}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
