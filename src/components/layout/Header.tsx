"use client";

import React, { useState, useEffect } from "react";
import { UserSession } from "@/lib/types";
import { Bell, Plus, Sparkles, Check, ChevronRight, HelpCircle, BookOpen, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useMobileNav } from "@/components/providers/MobileNavProvider";
import { PlatformGuideModal } from "@/components/dashboard/PlatformGuideModal";
import Link from "next/link";

interface HeaderProps {
  user?: UserSession | null;
  title?: string;
  subtitle?: string;
}

export function Header({ user = null, title, subtitle }: HeaderProps) {
  const { language, t } = useLanguage();
  const isFr = language === "fr";
  const { toggle: toggleMobileNav } = useMobileNav();

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotifications = () => {
    setLoadingNotifications(true);
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : { notifications: [], unreadCount: 0 }))
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoadingNotifications(false));
  };

  useEffect(() => {
    // Check if user has seen onboarding guide
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("asteria_platform_guide_dismissed");
      if (!seen) {
        setIsGuideOpen(true);
      }
    }

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark notification read:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all notifications read:", e);
    }
  };

  return (
    <header className="bg-white/85 dark:bg-[#052024]/90 backdrop-blur-md border-b border-line dark:border-teal-900/80 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Drawer Toggle */}
        <button
          onClick={toggleMobileNav}
          className="md:hidden p-2 rounded-xl bg-surface-alt dark:bg-[#08262b] border border-line dark:border-teal-900 text-ink dark:text-white hover:text-ast-primary dark:hover:text-ast-light transition-colors flex-shrink-0"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          {title ? (
            <div className="min-w-0">
              <h1 className="font-display font-bold text-base sm:text-lg md:text-xl uppercase tracking-wider text-ink dark:text-white truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="font-body text-[11px] sm:text-xs text-ink-soft dark:text-teal-200/70 mt-0.5 line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono font-bold text-[11px] sm:text-xs uppercase tracking-wider text-ast-primary dark:text-ast-light bg-teal-50 dark:bg-teal-950/80 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 truncate">
                <span className="hidden sm:inline">
                  {isFr
                    ? "Système d'Exploitation Asteria · Base de Données Directe"
                    : "Asteria Operating System · Live Database"}
                </span>
                <span className="sm:hidden">
                  Asteria OS · Live
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Language Switcher - available on desktop or mobile drawer */}
        <div className="hidden sm:block">
          <LanguageToggle variant="pill" />
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Quick Task/Event Trigger */}
        {(user?.role === "BOARD" || user?.role === "PRESIDENT" || user?.role === "VICE_PRESIDENT" || user?.role === "HOD") && (
          <Link href="/tasks">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />} className="px-2.5 sm:px-3">
              <span className="hidden sm:inline">
                {isFr ? "Nouveau Ticket" : "New Sprint Ticket"}
              </span>
            </Button>
          </Link>
        )}

        {/* Platform Guide / Help Trigger */}
        <button
          onClick={() => setIsGuideOpen(true)}
          title={isFr ? "Guide de la Plateforme" : "Platform Guide & Help"}
          className="hidden sm:flex p-2 rounded-xl bg-surface-alt dark:bg-[#08262b] border border-line dark:border-teal-900 text-ink-soft dark:text-teal-200 hover:text-ink dark:hover:text-white hover:border-ast-primary dark:hover:border-ast-light relative transition-all"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

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
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#08262b] border border-line dark:border-teal-800 rounded-2xl shadow-xl z-50 p-2 animate-vague-in">
              <div className="px-3 py-2 border-b border-line dark:border-teal-900 flex items-center justify-between gap-2">
                <span className="font-display font-bold uppercase text-xs tracking-wider text-ink dark:text-white">
                  {isFr ? "Notifications" : "Notifications"}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] text-ast-primary dark:text-ast-light font-semibold hover:underline bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 transition-colors"
                  >
                    {isFr ? "Tout marquer lu" : "Mark all read"}
                  </button>
                )}
              </div>
              <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => {
                    const content = (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.isRead) handleMarkAsRead(n.id);
                          if (!n.link) setShowNotifications(false);
                        }}
                        className={`block p-2.5 rounded-xl transition-all cursor-pointer ${
                          !n.isRead
                            ? "bg-teal-50/70 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80"
                            : "hover:bg-surface-alt dark:hover:bg-teal-950/30 opacity-80"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-ast-light shrink-0" />
                            )}
                            <span className="font-bold text-xs text-ink dark:text-white truncate">
                              {n.title}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-ink-soft dark:text-teal-300/60 shrink-0">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-soft dark:text-teal-200/70 line-clamp-2">
                          {n.body}
                        </p>
                      </div>
                    );

                    if (n.link) {
                      return (
                        <Link
                          key={n.id}
                          href={n.link}
                          onClick={() => {
                            if (!n.isRead) handleMarkAsRead(n.id);
                            setShowNotifications(false);
                          }}
                        >
                          {content}
                        </Link>
                      );
                    }

                    return content;
                  })
                ) : (
                  <p className="py-6 text-center text-xs text-ink-soft dark:text-teal-200/70">
                    {loadingNotifications
                      ? isFr
                        ? "Chargement..."
                        : "Loading..."
                      : isFr
                      ? "Aucune notification pour le moment."
                      : "No notifications right now."}
                  </p>
                )}
                <div className="pt-2 border-t border-line dark:border-teal-900 text-center">
                  <Link
                    href="/announcements"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-ast-primary dark:text-ast-light font-semibold hover:underline"
                  >
                    {isFr ? "Voir les annonces officielles →" : "View Announcements →"}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post-Login Onboarding / Orientation Guide Modal */}
      <PlatformGuideModal
        user={user}
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </header>
  );
}
