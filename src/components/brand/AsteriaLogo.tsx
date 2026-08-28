import React from "react";
import Link from "next/link";

interface AsteriaLogoProps {
  variant?: "light" | "dark" | "monochrome";
  size?: "sm" | "md" | "lg" | "xl";
  withText?: boolean;
  className?: string;
  href?: string;
}

export function AsteriaLogo({
  variant = "light",
  size = "md",
  withText = true,
  className = "",
  href = "/dashboard",
}: AsteriaLogoProps) {
  const sizeMap = {
    sm: { icon: 24, text: "text-sm", sub: "text-[9px]" },
    md: { icon: 32, text: "text-lg", sub: "text-[10px]" },
    lg: { icon: 44, text: "text-2xl", sub: "text-xs" },
    xl: { icon: 56, text: "text-3xl", sub: "text-sm" },
  };

  const isDark = variant === "dark";

  const content = (
    <div
      className={`inline-flex items-center gap-3 select-none group transition-opacity duration-300 hover:opacity-95 ${className}`}
      style={{ minHeight: "36px" }} // Respect minimum protection zone
    >
      {/* Fixed Geometric Asteria Star / Water Crest Vector */}
      <div className="relative flex-shrink-0 flex items-center justify-center p-1 rounded-xl">
        <svg
          width={sizeMap[size].icon}
          height={sizeMap[size].icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          {/* Outer Star Flare Polygon */}
          <path
            d="M24 2L28.8 17.2L44 22L28.8 26.8L24 42L19.2 26.8L4 22L19.2 17.2L24 2Z"
            fill={isDark ? "#60C8D4" : "#11606E"}
          />
          {/* Inner Fluid Diamond Core */}
          <path
            d="M24 10L27.5 20.5L38 24L27.5 27.5L24 38L20.5 27.5L10 24L20.5 20.5L24 10Z"
            fill={isDark ? "#FFFFFF" : "#60C8D4"}
            opacity="0.9"
          />
          {/* Center Light Spark */}
          <circle cx="24" cy="24" r="3.5" fill={isDark ? "#11606E" : "#FFFFFF"} />
        </svg>
      </div>

      {withText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-display font-bold uppercase tracking-wider ${sizeMap[size].text} ${
                isDark ? "text-white" : "text-ink"
              }`}
            >
              ASTERIA
            </span>
            <span
              className={`font-display font-medium text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                isDark
                  ? "bg-teal-400/20 text-teal-300 border border-teal-400/30"
                  : "bg-teal-50 text-teal-900 border border-teal-200"
              }`}
            >
              ESPRIT
            </span>
          </div>
          <span
            className={`font-body font-medium tracking-normal ${sizeMap[size].sub} ${
              isDark ? "text-teal-200/80" : "text-ink-soft"
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
