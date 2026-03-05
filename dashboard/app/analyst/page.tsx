"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import KPICard from "@/components/KPICard";
import ChartContainer from "@/components/ChartContainer";
import GlobalFilters from "@/components/GlobalFilters";
import CustomTooltip from "@/components/CustomTooltip";
import DataTable from "@/components/DataTable";
import { useFilters } from "@/lib/filters";
import { useTheme } from "@/lib/theme";
import {
  SKILL_CATEGORY_COLORS, SKILL_CATEGORY_LABELS, REMOTE_LABELS,
  formatSalary, formatNumber, KPI_ICONS,
} from "@/lib/colors";

interface AnalystData {
  kpis: { total: number; median_salary: number; top_combo: string; top_combo_count: number };
  topSkills: { skill_name: string; skill_category: string; count: number }[];
  vizSkills: { skill_name: string; count: number }[];
  education: { education_level: string; count: number }[];
  topCompanies: { company_name: string; nb_offres: number; avg_salary: number; remote_dominant: string }[];
}

const ALL_TITLES = ["Data Analyst", "Business Analyst", "BI Analyst"];

export default function AnalystPage() {
  const [data, setData] = useState<AnalystData | null>(null);
  const [loading, setLoading] = useState(true);
  const [metierFilter, setMetierFilter] = useState<string>("all");
  const { toQueryString } = useFilters();
  const { theme } = useTheme();

  const tickColor = theme === "dark" ? "#94A3B8" : "#4B5563";
  const tickMuted = theme === "dark" ? "#64748B" : "#6B7280";
  const accentColor = theme === "dark" ? "#818CF8" : "#6366F1";

  const fetchData = useCallback(() => {
    setLoading(true);
    const titles = metierFilter === "all" ? ALL_TITLES : [metierFilter];
    fetch(`/api/analyst?${toQueryString({ titles })}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [toQueryString, metierFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allSkills = data ? [...data.topSkills] : [];
  const skillCategories = data ? [...new Set(data.topSkills.map(s => s.skill_category))] : [];

  return (
    <div>
      {/* Title + Filters */}
      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <h2 className="text-4xl font-bold" style={{ color: "var(--text)" }}>ANALYST</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Data Analyst, Business Analyst, BI Analyst</p>
        </div>
        <GlobalFilters hideMetier />
      </div>

      {/* Metier filter */}
      <div className="flex gap-1.5 mb-6">
        {[{ value: "all", label: "Tous" }, ...ALL_TITLES.map(t => ({ value: t, label: t }))].map(opt => (
          <button
            key={opt.value}
            onClick={() => setMetierFilter(opt.value)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer filter-btn ${metierFilter === opt.value ? "filter-btn-active" : ""}`}
            style={{
              backgroundColor: metierFilter === opt.value ? accentColor : "var(--filter-inactive-bg)",
              color: metierFilter === opt.value ? "#fff" : "var(--text-muted)",
              border: metierFilter === opt.value ? `1px solid ${accentColor}` : "1px solid var(--filter-inactive-border)",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="flex justify-center flex-wrap gap-10 py-6 mb-10">
        <KPICard label="Total offres" value={data ? formatNumber(Number(data.kpis.total)) : "-"} icon={KPI_ICONS.total} loading={loading} tooltip="Nombre d'offres Analyst analysees" />
        <KPICard label="Salaire median" value={data?.kpis.median_salary ? formatSalary(Number(data.kpis.median_salary)) : "-"} icon={KPI_ICONS.salary} loading={loading} tooltip="Salaire annuel brut median" />
        <KPICard label="Combo skills #1" value={data?.kpis.top_combo || "-"} subtitle={data?.kpis.top_combo_count ? `${formatNumber(data.kpis.top_combo_count)} offres` : undefined} icon={KPI_ICONS.combo} loading={loading} tooltip="Combinaison de 3 competences la plus frequente" />
      </div>

      {/* Row 1: Top skills + Viz tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartContainer title="Top competences" subtitle="Les plus demandees" loading={loading}>
          {data && (
            <div className="flex flex-col h-[300px]">
              <div className="flex flex-wrap gap-3 mb-2">
                {skillCategories.map(cat => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: SKILL_CATEGORY_COLORS[cat] || "#6366F1" }} />
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{SKILL_CATEGORY_LABELS[cat] || cat}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div style={{ height: Math.max(200, allSkills.length * 28) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={allSkills} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" tick={{ fill: tickMuted, fontSize: 10 }} />
                      <YAxis type="category" dataKey="skill_name" tick={{ fill: tickColor, fontSize: 11 }} width={120} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {allSkills.map((s, i) => (
                          <Cell key={i} fill={SKILL_CATEGORY_COLORS[s.skill_category] || "#6366F1"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </ChartContainer>

        <ChartContainer title="Outils de visualisation" subtitle="Comparaison des outils BI/Viz" loading={loading}>
          {data && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.vizSkills} margin={{ left: 10, right: 10 }}>
                <XAxis dataKey="skill_name" tick={{ fill: tickColor, fontSize: 11 }} />
                <YAxis tick={{ fill: tickMuted, fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={accentColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>

      {/* Row 2: Education + Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer title="Niveau d'etudes demande" loading={loading}>
          {data && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.education.filter(e => e.education_level !== "not_specified")} margin={{ left: 10, right: 10 }}>
                <XAxis dataKey="education_level" tick={{ fill: tickColor, fontSize: 11 }} tickFormatter={(v) => v.replace("_", "+")} />
                <YAxis tick={{ fill: tickMuted, fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.education.filter(e => e.education_level !== "not_specified").map((_, i) => (
                    <Cell key={i} fill={`rgba(16,185,129,${0.4 + i * 0.2})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        <ChartContainer title="Top entreprises" loading={loading}>
          {data && (
            <DataTable
              columns={[
                { key: "company_name", label: "Entreprise" },
                { key: "nb_offres", label: "Offres", format: (v) => String(v) },
                { key: "avg_salary", label: "Salaire moy.", format: (v) => v ? formatSalary(Number(v)) : "-" },
                { key: "remote_dominant", label: "Remote", format: (v) => REMOTE_LABELS[v as string] || String(v) },
              ]}
              data={data.topCompanies}
            />
          )}
        </ChartContainer>
      </div>
    </div>
  );
}
