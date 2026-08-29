"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Sun, Moon, Sparkles } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  variant?: "pill" | "icon";
}

export function ThemeToggle({ className = "", variant = "icon" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl bg-teal-900/20 border border-teal-500/20 ${className}`} />
    );
  }

  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? "Light" : "Dark"} mode`}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all duration-300 ${
          isDark
            ? "bg-[#08262b] text-teal-300 border border-teal-500/30 hover:border-ast-light hover:bg-teal-900/60 shadow-sm"
            : "bg-white text-teal-900 border border-teal-200 hover:border-ast-primary hover:bg-teal-50 shadow-sm"
        } ${className}`}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>Light</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-ast-primary" />
            <span>Dark</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "Light" : "Dark"} mode`}
      title={`Switch to ${isDark ? "Light Mode" : "Dark Mode"}`}
      className={`relative p-2 rounded-xl transition-all duration-300 group ${
        isDark
          ? "bg-[#08262b]/90 hover:bg-teal-900 text-teal-200 hover:text-white border border-teal-500/30 hover:border-ast-light shadow-inner"
          : "bg-white hover:bg-teal-50 text-teal-900 hover:text-ast-primary border border-teal-200 hover:border-ast-primary shadow-sm"
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-300 group-hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-ast-primary group-hover:-rotate-12 transition-transform duration-300" />
        )}
      </div>
    </button>
  );
}
