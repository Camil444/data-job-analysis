"use client";

interface Column {
  key: string;
  label: string;
  format?: (v: unknown) => string;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
}

export default function DataTable({ columns, data }: DataTableProps) {
  return (
    <div className="overflow-auto max-h-[400px]">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left py-2 px-3 font-medium sticky top-0"
                style={{ color: "var(--text-muted)", backgroundColor: "var(--card-bg)" }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="transition-colors"
              style={{
                borderBottom: "1px solid var(--table-border)",
                backgroundColor: i % 2 === 0 ? "transparent" : "var(--table-alt)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--hover-overlay)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? "transparent" : "var(--table-alt)")}
            >
              {columns.map((col) => (
                <td key={col.key} className="py-2 px-3" style={{ color: "var(--text)" }}>
                  {col.format ? col.format(row[col.key]) : String(row[col.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
