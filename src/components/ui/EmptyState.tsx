import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { LucideIcon, Layers } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Layers,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "p-12 text-center bg-surface/80 backdrop-blur-sm rounded-2xl border border-line flex flex-col items-center justify-center space-y-3 shadow-sm",
        className
      )}
    >
      <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-900 shadow-inner">
        <Icon className="w-8 h-8 text-teal-900" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="font-display font-bold text-base uppercase tracking-wider text-ink">
          {title}
        </h4>
        <p className="font-body text-xs text-ink-soft leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <Button size="sm" variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
