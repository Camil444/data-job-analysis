"use client";

import { ReactNode } from "react";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  headerRight?: ReactNode;
}

export default function ChartContainer({ title, subtitle, children, className, loading, headerRight }: ChartContainerProps) {
  return (
    <div
      className={`rounded-xl p-5 flex flex-col transition-colors duration-200 ${className || ""}`}
      style={{ backgroundColor: "var(--card-bg)", boxShadow: "var(--shadow)" }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted-light)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {headerRight && <div>{headerRight}</div>}
      </div>
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="w-full h-full min-h-[200px] rounded animate-pulse" style={{ backgroundColor: "var(--skeleton-bg)" }} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
