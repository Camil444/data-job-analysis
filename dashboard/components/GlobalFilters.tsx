"use client";

import { useFilters } from "@/lib/filters";
import { useEffect, useState } from "react";

interface FilterOption {
  value: string;
  label: string;
}

const CONTRACT_OPTIONS: FilterOption[] = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "alternance,stage", label: "Stage / Alternance" },
];

const REMOTE_OPTIONS: FilterOption[] = [
  { value: "full_remote", label: "Remote" },
  { value: "hybrid", label: "Hybride" },
  { value: "on_site", label: "Presentiel" },
];

const EXPERIENCE_OPTIONS: FilterOption[] = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
];

function ToggleGroup({
  options,
  selected,
  onChange,
}: {
  options: FilterOption[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const toggle = (val: string) => {
    onChange(
      selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    );
  };
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: active ? "var(--accent)" : "var(--filter-inactive-bg)",
              color: active ? "#fff" : "var(--text-muted)",
              border: active ? "1px solid var(--accent)" : "1px solid var(--filter-inactive-border)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function GlobalFilters({ lockedTitles, hideMetier }: { lockedTitles?: string[]; hideMetier?: boolean }) {
  const { filters, setFilter, resetFilters } = useFilters();
  const [titleOptions, setTitleOptions] = useState<string[]>([]);
  const [regionOptions, setRegionOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/overview?meta=options")
      .then((r) => r.json())
      .then((d) => {
        setTitleOptions(d.titles || []);
        setRegionOptions(d.regions || []);
      })
      .catch(() => {});
  }, []);

  const hasFilters =
    filters.titles.length > 0 ||
    filters.regions.length > 0 ||
    filters.contract_type.length > 0 ||
    filters.remote_policy.length > 0 ||
    filters.experience_level.length > 0 ||
    filters.source !== "";

  return (
    <div
      className="flex flex-wrap items-center justify-end gap-4"
    >
      {!lockedTitles && !hideMetier && (
        <div>
          <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-muted)" }}>
            Metier
          </label>
          <select
            multiple
            value={filters.titles}
            onChange={(e) =>
              setFilter(
                "titles",
                Array.from(e.target.selectedOptions, (o) => o.value)
              )
            }
            className="rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--input-bg)", color: "var(--text)", border: "1px solid var(--border)", minWidth: 150, maxHeight: 70 }}
          >
            {titleOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}
      {lockedTitles && (
        <div className="flex items-center gap-2">
          <span className="text-sm px-3.5 py-1.5 rounded-lg font-medium" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>
            {lockedTitles.join(", ")}
          </span>
        </div>
      )}

      <div>
        <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-muted)" }}>Contrat</label>
        <ToggleGroup
          options={CONTRACT_OPTIONS}
          selected={filters.contract_type}
          onChange={(v) => setFilter("contract_type", v)}
        />
      </div>

      <div>
        <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-muted)" }}>Experience</label>
        <ToggleGroup
          options={EXPERIENCE_OPTIONS}
          selected={filters.experience_level}
          onChange={(v) => setFilter("experience_level", v)}
        />
      </div>

      <div>
        <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-muted)" }}>Source</label>
        <select
          value={filters.source}
          onChange={(e) => setFilter("source", e.target.value)}
          className="rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: "var(--input-bg)", color: "var(--text)", border: "1px solid var(--border)" }}
        >
          <option value="">Toutes</option>
          <option value="linkedin">LinkedIn</option>
          <option value="indeed">Indeed</option>
          <option value="france_travail">France Travail</option>
        </select>
      </div>

      {!lockedTitles && regionOptions.length > 0 && (
        <div>
          <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-muted)" }}>Region</label>
          <select
            value={filters.regions[0] || ""}
            onChange={(e) => setFilter("regions", e.target.value ? [e.target.value] : [])}
            className="rounded-lg px-3 py-2 text-sm"
            style={{ backgroundColor: "var(--input-bg)", color: "var(--text)", border: "1px solid var(--border)", maxWidth: 180 }}
          >
            <option value="">Toutes regions</option>
            {regionOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      )}

      {hasFilters && (
        <button
          onClick={resetFilters}
          className="ml-auto px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
          style={{ backgroundColor: "#EF4444", color: "#fff" }}
        >
          Reinitialiser
        </button>
      )}
    </div>
  );
}
