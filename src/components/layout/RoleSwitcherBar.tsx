"use client";

import React, { useState } from "react";
import { UserRole, UserSession } from "@/lib/types";
import { Sparkles, Shield, User, Award, CheckCircle2 } from "lucide-react";

interface RoleSwitcherBarProps {
  currentUser: UserSession | null;
  onRoleSwitched?: () => void;
}

export function RoleSwitcherBar({ currentUser, onRoleSwitched }: RoleSwitcherBarProps) {
  const [loading, setLoading] = useState(false);

  const personas = [
    {
      role: "BOARD" as UserRole,
      name: "Yasmine (President)",
      email: "president@asteria.tn",
      badge: "Board Admin",
      icon: Shield,
      color: "bg-teal-900 text-white border-teal-800",
    },
    {
      role: "HOD" as UserRole,
      name: "Rayen (HoD Web Dev)",
      email: "hod.web@asteria.tn",
      badge: "HoD Web",
      icon: Award,
      color: "bg-teal-700 text-teal-100 border-teal-600",
    },
    {
      role: "HOD" as UserRole,
      name: "Maya (HoD Design)",
      email: "hod.design@asteria.tn",
      badge: "HoD Design",
      icon: Award,
      color: "bg-teal-600 text-teal-50 border-teal-500",
    },
    {
      role: "MEMBER" as UserRole,
      name: "Karim (Active Member)",
      email: "karim.chaabane@asteria.tn",
      badge: "Member",
      icon: User,
      color: "bg-teal-100 text-teal-900 border-teal-300",
    },
    {
      role: "APPLICANT" as UserRole,
      name: "Mehdi (Applicant)",
      email: "mehdi.applicant@esprit.tn",
      badge: "Applicant",
      icon: User,
      color: "bg-amber-100 text-amber-900 border-amber-300",
    },
  ];

  const handleSwitch = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-dark2 text-white border-b border-teal-800/80 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shadow-inner z-50">
      <div className="flex items-center gap-2 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
        <span className="font-display font-semibold uppercase tracking-wider text-teal-300 text-[11px]">
          Demo Persona Switcher:
        </span>
        <span className="text-teal-100/80 hidden sm:inline">
          Active: <strong className="text-white font-semibold">{currentUser?.name}</strong> ({currentUser?.role})
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {personas.map((p) => {
          const isActive = currentUser?.email === p.email;
          const Icon = p.icon;
          return (
            <button
              key={p.email}
              onClick={() => handleSwitch(p.email)}
              disabled={loading || isActive}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-teal-400 text-ink border-teal-300 shadow-sm font-bold scale-105"
                  : "bg-surface-dark2/80 hover:bg-teal-900 text-teal-200 border-teal-700/60 hover:text-white"
              } disabled:cursor-default`}
            >
              {isActive ? (
                <CheckCircle2 className="w-3 h-3 text-ink" />
              ) : (
                <Icon className="w-3 h-3" />
              )}
              <span>{p.badge}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
