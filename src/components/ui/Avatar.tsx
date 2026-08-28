import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  status?: "online" | "busy" | "offline";
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
  status,
}: AvatarProps) {
  const sizeMap = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl",
  };

  const getInitials = (n: string) => {
    if (!n) return "A";
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative inline-block flex-shrink-0">
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-display font-semibold uppercase overflow-hidden border border-line select-none bg-gradient-to-tr from-teal-900 to-teal-700 text-white shadow-sm",
          sizeMap[size],
          className
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image load fails
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-surface",
            size === "xs" || size === "sm" ? "w-2 h-2" : "w-3 h-3",
            status === "online" && "bg-emerald-500",
            status === "busy" && "bg-amber-500",
            status === "offline" && "bg-gray-400"
          )}
        />
      )}
    </div>
  );
}
