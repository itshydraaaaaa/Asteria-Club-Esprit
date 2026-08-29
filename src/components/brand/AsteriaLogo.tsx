"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface AsteriaLogoProps {
  variant?: "light" | "dark" | "auto" | "monochrome";
  size?: "sm" | "md" | "lg" | "xl";
  withText?: boolean;
  className?: string;
  href?: string;
}

export function AsteriaLogo({
  variant = "auto",
  size = "md",
  withText = true,
  className = "",
  href = "/dashboard",
}: AsteriaLogoProps) {
  const sizeMap = {
    sm: { icon: 28, text: "text-sm", sub: "text-[9px]" },
    md: { icon: 38, text: "text-lg", sub: "text-[10px]" },
    lg: { icon: 48, text: "text-2xl", sub: "text-xs" },
    xl: { icon: 64, text: "text-3xl", sub: "text-sm" },
  };

  const isDark = variant === "dark";
  const isAuto = variant === "auto";

  const content = (
    <div
      className={`inline-flex items-center gap-3 select-none group transition-opacity duration-300 hover:opacity-95 ${className}`}
      style={{ minHeight: "36px" }}
    >
      {/* Official Asteria Wave 'A' Emblem */}
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <div className="relative group-hover:scale-105 transition-transform duration-300">
          <Image
            src="/asteria-wave-logo.png"
            alt="Asteria Club Esprit Official Wave Crest"
            width={sizeMap[size].icon}
            height={sizeMap[size].icon}
            className={`object-contain transition-all duration-300 ${
              isDark
                ? "drop-shadow-[0_0_14px_rgba(96,200,212,0.65)]"
                : isAuto
                ? "dark:drop-shadow-[0_0_14px_rgba(96,200,212,0.65)] drop-shadow-[0_4px_10px_rgba(17,96,110,0.2)]"
                : "drop-shadow-[0_4px_10px_rgba(17,96,110,0.2)]"
            }`}
            priority
          />
        </div>
      </div>

      {withText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-display font-black uppercase tracking-wider ${sizeMap[size].text} ${
                isDark
                  ? "text-white"
                  : isAuto
                  ? "dark:text-white text-[#0A3A40]"
                  : "text-[#0A3A40]"
              }`}
            >
              ASTERIA
            </span>
            <span
              className={`font-display font-bold text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                isDark
                  ? "bg-teal-400/20 text-teal-300 border border-teal-400/30"
                  : isAuto
                  ? "dark:bg-teal-400/20 dark:text-teal-300 dark:border-teal-400/30 bg-teal-50 text-teal-900 border border-teal-200"
                  : "bg-teal-50 text-teal-900 border border-teal-200"
              }`}
            >
              ESPRIT
            </span>
          </div>
          <span
            className={`font-body font-medium tracking-normal ${sizeMap[size].sub} ${
              isDark
                ? "text-teal-200/80"
                : isAuto
                ? "dark:text-teal-200/80 text-ink-soft"
                : "text-ink-soft"
            }`}
          >
            Management Platform
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
