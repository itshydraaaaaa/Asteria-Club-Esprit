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
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-teal-300 font-display">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-ink-faint dark:text-teal-400/60 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-surface dark:bg-[#041d21]/90 border border-line dark:border-teal-900/80 rounded-xl px-3.5 py-2.5 text-sm font-body text-ink dark:text-teal-50 placeholder:text-ink-faint dark:placeholder:text-teal-600/60 transition-all duration-200 focus:outline-none focus:border-ast-light focus:ring-2 focus:ring-ast-light/20 focus:shadow-[0_0_16px_rgba(96,200,212,0.18)] disabled:bg-surface-alt dark:disabled:bg-[#031518] disabled:cursor-not-allowed",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/30",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-ink-faint dark:text-teal-400/60 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-500 dark:text-rose-400 font-body font-medium">{error}</p>}
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-teal-300 font-display">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "w-full bg-surface dark:bg-[#041d21]/90 border border-line dark:border-teal-900/80 rounded-xl px-3.5 py-2.5 text-sm font-body text-ink dark:text-teal-50 placeholder:text-ink-faint dark:placeholder:text-teal-600/60 transition-all duration-200 focus:outline-none focus:border-ast-light focus:ring-2 focus:ring-ast-light/20 focus:shadow-[0_0_16px_rgba(96,200,212,0.18)] disabled:bg-surface-alt dark:disabled:bg-[#031518] disabled:cursor-not-allowed resize-y min-h-[95px]",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/30",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-500 dark:text-rose-400 font-body font-medium">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
