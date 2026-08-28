import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft font-body">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-ink-faint pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-surface border border-line rounded-xl px-3.5 py-2.5 text-sm font-body text-ink placeholder:text-ink-faint transition-all duration-200 focus:outline-none focus:border-teal-900 focus:ring-1 focus:ring-teal-900 disabled:bg-surface-alt disabled:cursor-not-allowed",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-ink-faint pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-600 font-body">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft font-body">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full bg-surface border border-line rounded-xl px-3.5 py-2.5 text-sm font-body text-ink placeholder:text-ink-faint transition-all duration-200 focus:outline-none focus:border-teal-900 focus:ring-1 focus:ring-teal-900 disabled:bg-surface-alt disabled:cursor-not-allowed resize-y min-h-[90px]",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600 font-body">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
