"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog with "Vague" entrance curve */}
      <div
        className={cn(
          "relative w-full bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden z-10 animate-vague-in my-8",
          maxWidthStyles[maxWidth]
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 py-5 border-b border-line/80 flex items-start justify-between bg-surface">
            <div>
              {title && (
                <h3 className="font-display font-bold uppercase text-base tracking-wider text-ink">
                  {title}
                </h3>
              )}
              {description && (
                <p className="font-body text-xs text-ink-soft mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-ink-faint hover:text-ink hover:bg-surface-alt p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
