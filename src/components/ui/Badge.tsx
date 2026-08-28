import React from "react";
import { cn } from "@/lib/utils";
import { TaskPriority, TaskStatus, UserRole } from "@/lib/types";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "accent" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-surface-alt text-ink-soft border-line",
    primary: "bg-teal-900/10 text-teal-900 border-teal-900/20 font-semibold",
    accent: "bg-teal-400/20 text-teal-900 border-teal-400/40 font-semibold",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 rounded-md",
    md: "text-xs px-2.5 py-1 rounded-lg",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-body border select-none transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function RoleBadge({ role }: { role: UserRole | string }) {
  switch (role) {
    case "BOARD":
      return (
        <Badge variant="primary" className="bg-teal-900 text-white border-teal-900">
          ★ Board
        </Badge>
      );
    case "HOD":
      return (
        <Badge variant="accent" className="bg-teal-400 text-teal-900 font-bold border-teal-400">
          ◆ Head of Dept
        </Badge>
      );
    case "MEMBER":
      return (
        <Badge variant="default" className="bg-teal-50 text-teal-800 border-teal-200">
          ● Member
        </Badge>
      );
    case "APPLICANT":
      return (
        <Badge variant="warning" className="bg-amber-50 text-amber-800 border-amber-200">
          ○ Applicant
        </Badge>
      );
    default:
      return <Badge>{role}</Badge>;
  }
}

export function PriorityBadge({ priority }: { priority: TaskPriority | string }) {
  switch (priority) {
    case "URGENT":
      return (
        <Badge variant="danger" className="font-bold animate-pulse">
          ⚡ Urgent
        </Badge>
      );
    case "HIGH":
      return <Badge variant="warning">▲ High</Badge>;
    case "MEDIUM":
      return <Badge variant="primary">■ Medium</Badge>;
    case "LOW":
      return <Badge variant="default">▽ Low</Badge>;
    default:
      return <Badge>{priority}</Badge>;
  }
}

export function StatusBadge({ status }: { status: TaskStatus | string }) {
  switch (status) {
    case "TODO":
      return <Badge variant="default">To Do</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="accent">In Progress</Badge>;
    case "REVIEW":
      return <Badge variant="warning">In Review</Badge>;
    case "DONE":
      return <Badge variant="success">✓ Completed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}
