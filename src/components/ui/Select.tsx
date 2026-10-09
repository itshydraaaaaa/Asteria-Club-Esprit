import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ label: string; value: string | number }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, children, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-teal-300 font-display">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            className={cn(
              "w-full appearance-none bg-surface dark:bg-[#041d21]/90 border border-line dark:border-teal-900/80 rounded-xl px-3.5 py-2.5 pr-10 text-sm font-body text-ink dark:text-teal-50 transition-all duration-200 focus:outline-none focus:border-ast-light focus:ring-2 focus:ring-ast-light/20 focus:shadow-[0_0_16px_rgba(96,200,212,0.18)] disabled:bg-surface-alt dark:disabled:bg-[#031518] disabled:cursor-not-allowed",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/30",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#062428] text-ink dark:text-teal-100">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3.5 text-ink-faint dark:text-teal-400/70 pointer-events-none">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="text-xs text-rose-500 dark:text-rose-400 font-body font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
