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
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft font-body">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            className={cn(
              "w-full appearance-none bg-surface border border-line rounded-xl px-3.5 py-2.5 pr-10 text-sm font-body text-ink transition-all duration-200 focus:outline-none focus:border-teal-900 focus:ring-1 focus:ring-teal-900 disabled:bg-surface-alt disabled:cursor-not-allowed",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3.5 text-ink-faint pointer-events-none">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="text-xs text-red-600 font-body">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
