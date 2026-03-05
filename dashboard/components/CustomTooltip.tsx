"use client";

interface PayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
  formatter?: (value: number | string, name: string) => string;
}

export default function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg p-3 shadow-lg text-xs"
      style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}
    >
      {label && (
        <p className="font-medium mb-1.5" style={{ color: "var(--text)" }}>
          {label}
        </p>
      )}
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span style={{ color: "var(--text-muted)" }}>{item.name}:</span>
          <span className="font-medium" style={{ color: "var(--text)" }}>
            {formatter ? formatter(item.value ?? 0, item.name ?? "") : String(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
