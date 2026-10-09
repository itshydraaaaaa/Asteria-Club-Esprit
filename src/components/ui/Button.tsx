import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-body font-semibold rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2";

    const variantStyles = {
      primary:
        "bg-ast-primary text-white hover:bg-teal-800 dark:bg-gradient-to-r dark:from-[#11606E] dark:to-[#187484] dark:hover:from-[#187484] dark:hover:to-[#228b9e] dark:border dark:border-teal-400/40 dark:shadow-[0_0_20px_rgba(96,200,212,0.25)] shadow-sm hover:shadow-md",
      secondary:
        "bg-surface-alt text-ink hover:bg-surface-alt/80 border border-line dark:bg-[#062529] dark:text-teal-100 dark:border-teal-800/80 dark:hover:bg-[#09343a] dark:hover:border-teal-400/50",
      accent:
        "bg-ast-light text-ink font-bold hover:bg-teal-300 dark:bg-gradient-to-r dark:from-[#60C8D4] dark:to-[#86d6df] dark:text-[#03171a] dark:hover:shadow-[0_0_25px_rgba(96,200,212,0.5)] shadow-md",
      outline:
        "bg-transparent text-ast-primary border border-ast-primary/30 hover:bg-teal-50 dark:text-teal-300 dark:border-teal-700/80 dark:hover:bg-teal-900/40 dark:hover:border-teal-400/60",
      ghost:
        "bg-transparent text-ink-soft hover:text-ink hover:bg-surface-alt dark:text-teal-300/70 dark:hover:text-teal-100 dark:hover:bg-teal-900/30",
      danger:
        "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900/80 dark:hover:bg-red-900/50",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5 rounded-lg",
      md: "text-sm px-4 py-2.5 gap-2",
      lg: "text-base px-6 py-3 gap-2.5 rounded-2xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
