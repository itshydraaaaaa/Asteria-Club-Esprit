import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "alt" | "dark" | "outline";
  hoverable?: boolean;
}

export function Card({
  className,
  variant = "default",
  hoverable = false,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default:
      "bg-white/95 dark:bg-[#062428]/90 border-line dark:border-teal-900/80 text-ink dark:text-teal-50 shadow-sm dark:shadow-[0_12px_40px_rgba(2,18,20,0.6)] backdrop-blur-md",
    alt:
      "bg-surface-alt dark:bg-[#041a1d]/90 border-line dark:border-teal-900/60 text-ink dark:text-teal-100",
    dark:
      "bg-gradient-to-br from-[#062428] via-[#083036] to-[#0A3A40] border-teal-800/80 text-white shadow-md dark:shadow-[0_12px_40px_rgba(4,25,28,0.7)]",
    outline:
      "bg-transparent border-line dark:border-teal-900/80 text-ink dark:text-teal-100",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-300",
        variantStyles[variant],
        hoverable && "hover:shadow-lg dark:hover:shadow-[0_12px_30px_rgba(96,200,212,0.15)] hover:border-teal-400/60 dark:hover:border-teal-400/50 hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-6 py-5 border-b border-line/60 dark:border-teal-900/60 flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display font-bold uppercase text-sm tracking-wider text-ink dark:text-teal-200", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("font-body text-xs text-ink-soft dark:text-teal-300/70 mt-1", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-6 py-4 border-t border-line/60 dark:border-teal-900/60 bg-surface-alt/50 dark:bg-[#04181a]/60 rounded-b-2xl flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
}
