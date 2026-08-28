import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 bg-surface-alt rounded-xl border border-line overflow-x-auto no-scrollbar",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-body transition-all duration-300 select-none whitespace-nowrap",
              isActive
                ? "bg-surface text-teal-900 shadow-sm border border-line"
                : "text-ink-soft hover:text-ink hover:bg-surface/50"
            )}
          >
            {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  isActive
                    ? "bg-teal-900 text-white"
                    : "bg-surface text-ink-soft border border-line"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
