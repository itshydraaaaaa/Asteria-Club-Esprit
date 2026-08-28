import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "rounded";
}

export function Skeleton({
  className,
  variant = "rounded",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    rectangular: "rounded-none",
    circular: "rounded-full",
    rounded: "rounded-xl",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-teal-900/10 border border-teal-900/5",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-surface border border-line space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-4" />
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
      <Skeleton className="w-3/4 h-6" />
      <Skeleton className="w-full h-3" />
      <Skeleton className="w-2/3 h-3" />
      <div className="pt-3 border-t border-line/60 flex justify-between">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-20 h-6" />
      </div>
    </div>
  );
}
