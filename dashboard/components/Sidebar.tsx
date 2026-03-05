"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";

const NAV_ITEMS = [
  { href: "/overview", label: "Vue Globale" },
  { href: "/analyst", label: "Analyst" },
  { href: "/engineer", label: "Engineer" },
  { href: "/scientist", label: "DS / ML / AI" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    fetch("/api/overview?meta=last_update")
      .then((r) => r.json())
      .then((d) => { if (d.last_update) setLastUpdate(d.last_update); })
      .catch(() => {});
  }, []);

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[240px] flex flex-col z-50 transition-colors duration-200"
      style={{ backgroundColor: "var(--card-bg)", borderRight: "1px solid var(--border)" }}
    >
      <div className="px-5 pt-8 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            DATA JOB FRANCE
          </h1>
          {lastUpdate && (
            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted-light)" }}>
              MAJ : {lastUpdate}
            </p>
          )}
        </div>
        <button
          onClick={toggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
          style={{ backgroundColor: "var(--icon-bg)" }}
          title={theme === "light" ? "Dark mode" : "Light mode"}
        >
          {theme === "light" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: active ? "var(--active-bg)" : "transparent",
                borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                color: active ? "var(--accent)" : "var(--text-muted)",
                fontWeight: active ? 600 : 500,
              }}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-3 space-y-1">
        <Link
          href="/about"
          className="flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors"
          style={{
            backgroundColor: pathname === "/about" ? "var(--active-bg)" : "transparent",
            borderLeft: pathname === "/about" ? "3px solid var(--accent)" : "3px solid transparent",
            color: pathname === "/about" ? "var(--accent)" : "var(--text-muted)",
            fontWeight: pathname === "/about" ? 600 : 500,
          }}
        >
          <span>A propos</span>
        </Link>
        <a
          href="https://github.com/Camil444/data-job-analysis"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors"
          style={{ color: "var(--text-muted)", borderLeft: "3px solid transparent" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    </aside>
  );
}
