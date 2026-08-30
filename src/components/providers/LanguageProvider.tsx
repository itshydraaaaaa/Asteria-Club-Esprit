"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, translations } from "@/lib/i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("asteria-lang") as Language | null;
    if (savedLang === "en" || savedLang === "fr") {
      setLanguageState(savedLang);
      document.documentElement.lang = savedLang;
    } else {
      // Default to English as requested
      setLanguageState("en");
      document.documentElement.lang = "en";
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("asteria-lang", lang);
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    const nextLang = language === "en" ? "fr" : "en";
    setLanguage(nextLang);
  };

  const t = (key: string, defaultText?: string): string => {
    const item = translations[key];
    if (!item) {
      return defaultText || key;
    }
    return item[language] || item["en"] || defaultText || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: "en" as Language,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: string, defaultText?: string) => {
        const item = translations[key];
        return item?.en || defaultText || key;
      },
    };
  }
  return context;
}
