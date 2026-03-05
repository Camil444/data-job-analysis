"use client";

import { useState } from "react";

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: string;
  loading?: boolean;
  tooltip?: string;
}

export default function KPICard({ label, value, subtitle, icon, loading, tooltip }: KPICardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="rounded-xl px-6 py-7 flex items-center gap-5 transition-colors duration-200 relative"
      style={{
        backgroundColor: "var(--card-bg)",
        boxShadow: "var(--shadow)",
        minWidth: 240,
      }}
      onMouseEnter={() => tooltip && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {icon && (
        <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--icon-bg)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon} alt="" width={30} height={30} style={{ filter: "var(--icon-filter, none)" }} />
        </div>
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
          {label}
        </span>
        {loading ? (
          <div className="h-9 w-28 rounded animate-pulse" style={{ backgroundColor: "var(--skeleton-bg)" }} />
        ) : (
          <span className="text-[24px] font-bold leading-tight" style={{ color: "var(--text)" }}>
            {value}
          </span>
        )}
        <span className="text-xs" style={{ color: "var(--text-muted-light)", visibility: subtitle ? "visible" : "hidden" }}>
          {subtitle || "\u200B"}
        </span>
      </div>
      {showTooltip && tooltip && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap z-50"
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          {tooltip}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 rotate-45"
            style={{ backgroundColor: "var(--card-bg)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
          />
        </div>
      )}
    </div>
  );
}
