"use client";

import React, { useState, useEffect } from "react";
import { UserSession } from "@/lib/types";
import { Bell, Plus, Sparkles, Check, ChevronRight, HelpCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/components/providers/LanguageProvider";
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

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [bulletins, setBulletins] = useState<any[]>([]);

  useEffect(() => {
    // Check if user has seen onboarding guide
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("asteria_platform_guide_dismissed");
      if (!seen) {
        setIsGuideOpen(true);
      }
    }

    // Fetch dynamic announcements for notifications popover
    fetch("/api/announcements")
      .then((res) => (res.ok ? res.json() : { announcements: [] }))
      .then((data) => {
        const list = data.announcements || [];
        setBulletins(list.slice(0, 3));
        setUnreadCount(Math.min(list.length, 3));
      })
      .catch(() => {});
  }, []);

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
              {isFr
                ? "Système d'Exploitation Asteria · Base de Données Directe"
                : "Asteria Operating System · Live Database"}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Language Switcher */}
        <LanguageToggle variant="pill" />

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Quick Task/Event Trigger */}
        {(user?.role === "BOARD" || user?.role === "HOD") && (
          <Link href="/tasks">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
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
          className="p-2 rounded-xl bg-surface-alt dark:bg-[#08262b] border border-line dark:border-teal-900 text-ink-soft dark:text-teal-200 hover:text-ink dark:hover:text-white hover:border-ast-primary dark:hover:border-ast-light relative transition-all"
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
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#08262b] border border-line dark:border-teal-800 rounded-2xl shadow-xl z-50 p-2 animate-vague-in">
              <div className="px-3 py-2 border-b border-line dark:border-teal-900 flex items-center justify-between">
                <span className="font-display font-bold uppercase text-xs tracking-wider text-ink dark:text-white">
                  {isFr ? "Bulletins en Temps Réel" : "Real-Time Bulletins"}
                </span>
                <span className="text-[10px] text-ast-primary dark:text-ast-light font-mono font-bold bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                  Supabase Live
                </span>
              </div>
              <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto">
                {bulletins.length > 0 ? (
                  bulletins.map((b) => (
                    <Link
                      key={b.id}
                      href="/announcements"
                      onClick={() => setShowNotifications(false)}
                      className="block p-2 rounded-xl hover:bg-surface-alt dark:hover:bg-teal-950/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-ink dark:text-white line-clamp-1">
                          {b.title}
                        </span>
                        <span className="text-[9px] font-mono text-ink-soft dark:text-teal-300/60 shrink-0">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-soft dark:text-teal-200/70 line-clamp-2">
                        {b.body}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="py-4 text-center text-xs text-ink-soft dark:text-teal-200/70">
                    {isFr ? "Aucun nouveau bulletin." : "No new bulletins."}
                  </p>
                )}
                <div className="pt-2 border-t border-line dark:border-teal-900 text-center">
                  <Link
                    href="/announcements"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-ast-primary dark:text-ast-light font-semibold hover:underline"
                  >
                    {isFr ? "Voir tous les bulletins →" : "View All Bulletins →"}
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
