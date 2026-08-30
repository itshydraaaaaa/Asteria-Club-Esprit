"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Globe } from "lucide-react";

interface LanguageToggleProps {
  className?: string;
  variant?: "pill" | "icon" | "dropdown";
}

export function LanguageToggle({ className = "", variant = "pill" }: LanguageToggleProps) {
  const { language, setLanguage, toggleLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`h-8 w-16 rounded-xl bg-teal-900/10 border border-teal-500/20 ${className}`} />
    );
  }

  if (variant === "icon") {
    return (
      <button
        onClick={toggleLanguage}
        aria-label={`Switch language. Current: ${language.toUpperCase()}`}
        title={`Switch language (${language === "en" ? "Français" : "English"})`}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all duration-300 border ${
          language === "en"
            ? "bg-white dark:bg-[#08262b] text-teal-900 dark:text-teal-200 border-teal-200 dark:border-teal-500/30 hover:border-ast-primary dark:hover:border-ast-light"
            : "bg-teal-50 dark:bg-teal-900/40 text-ast-primary dark:text-ast-light border-ast-primary/40 dark:border-ast-light/40"
        } ${className}`}
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="tracking-wider">{language.toUpperCase()}</span>
      </button>
    );
  }

  // Pill variant with sleek EN / FR toggle
  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl border border-teal-500/20 bg-teal-900/5 dark:bg-[#08262b]/80 backdrop-blur-sm ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all duration-200 ${
          language === "en"
            ? "bg-ast-primary text-white shadow-sm shadow-ast-primary/20 scale-[1.02]"
            : "text-ink/60 dark:text-teal-300/70 hover:text-ink dark:hover:text-white"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("fr")}
        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all duration-200 ${
          language === "fr"
            ? "bg-ast-primary text-white shadow-sm shadow-ast-primary/20 scale-[1.02]"
            : "text-ink/60 dark:text-teal-300/70 hover:text-ink dark:hover:text-white"
        }`}
      >
        FR
      </button>
    </div>
  );
}
