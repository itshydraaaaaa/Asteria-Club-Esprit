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
    default: "bg-surface border-line text-ink shadow-sm",
    alt: "bg-surface-alt border-line text-ink",
    dark: "bg-surface-dark2 border-teal-800 text-white",
    outline: "bg-transparent border-line text-ink",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-300",
        variantStyles[variant],
        hoverable && "hover:shadow-md hover:border-teal-400/50 hover:-translate-y-0.5",
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
      className={cn("px-6 py-5 border-b border-line/60 flex items-center justify-between", className)}
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
      className={cn("font-display font-bold uppercase text-sm tracking-wider text-ink", className)}
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
    <p className={cn("font-body text-xs text-ink-soft mt-1", className)} {...props}>
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
      className={cn("px-6 py-4 border-t border-line/60 bg-surface-alt/50 rounded-b-2xl flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
}
