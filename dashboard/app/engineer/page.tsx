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

interface EngineerData {
  kpis: { total: number; median_salary: number; top_cloud: string; top_combo: string; top_combo_count: number };
  topSkills: { skill_name: string; skill_category: string; count: number }[];
  cloudWars: { skill_name: string; count: number }[];
  orchestrators: { skill_name: string; count: number }[];
  topCompanies: { company_name: string; nb_offres: number; avg_salary: number; remote_dominant: string }[];
}

const CLOUD_COLORS: Record<string, string> = { AWS: "#F59E0B", GCP: "#EF4444", Azure: "#06B6D4" };
const ALL_TITLES = ["Data Engineer", "Analytics Engineer", "Data Architect"];
const CLOUD_OPTIONS = ["AWS", "GCP", "Azure"];

export default function EngineerPage() {
  const [data, setData] = useState<EngineerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [metierFilter, setMetierFilter] = useState<string>("all");
  const [cloudFilter, setCloudFilter] = useState<string>("all");
  const { toQueryString } = useFilters();
  const { theme } = useTheme();

  const tickColor = theme === "dark" ? "#94A3B8" : "#4B5563";
  const tickMuted = theme === "dark" ? "#64748B" : "#6B7280";
  const accentColor = theme === "dark" ? "#818CF8" : "#06B6D4";

  const fetchData = useCallback(() => {
    setLoading(true);
    const titles = metierFilter === "all" ? ALL_TITLES : [metierFilter];
    const cloudParam = cloudFilter !== "all" ? `&cloud=${cloudFilter}` : "";
    fetch(`/api/engineer?${toQueryString({ titles })}${cloudParam}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [toQueryString, metierFilter, cloudFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allSkills = data ? [...data.topSkills] : [];
  const skillCategories = data ? [...new Set(data.topSkills.map(s => s.skill_category))] : [];

  const cloudWarsData = data?.cloudWars || [];

  return (
    <div>
      {/* Title + Filters */}
      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <h2 className="text-4xl font-bold" style={{ color: "var(--text)" }}>ENGINEER</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Data Engineer, Analytics Engineer, Data Architect</p>
        </div>
        <GlobalFilters hideMetier />
      </div>

      {/* Metier + Cloud filters */}
      <div className="flex flex-wrap gap-6 mb-6">
        <div className="flex gap-1.5">
          {[{ value: "all", label: "Tous" }, ...ALL_TITLES.map(t => ({ value: t, label: t }))].map(opt => (
            <button
              key={opt.value}
              onClick={() => setMetierFilter(opt.value)}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
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
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Cloud</span>
          <div className="flex gap-1.5">
            {[{ value: "all", label: "Tous" }, ...CLOUD_OPTIONS.map(c => ({ value: c, label: c }))].map(opt => (
              <button
                key={opt.value}
                onClick={() => setCloudFilter(opt.value)}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                style={{
                  backgroundColor: cloudFilter === opt.value ? (CLOUD_COLORS[opt.value] || accentColor) : "var(--filter-inactive-bg)",
                  color: cloudFilter === opt.value ? "#fff" : "var(--text-muted)",
                  border: cloudFilter === opt.value ? `1px solid ${CLOUD_COLORS[opt.value] || accentColor}` : "1px solid var(--filter-inactive-border)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="flex justify-center flex-wrap gap-10 py-6 mb-10">
        <KPICard label="Total offres" value={data ? formatNumber(Number(data.kpis.total)) : "-"} icon={KPI_ICONS.total} loading={loading} tooltip="Nombre d'offres Engineer analysees" />
        <KPICard label="Salaire median" value={data?.kpis.median_salary ? formatSalary(Number(data.kpis.median_salary)) : "-"} icon={KPI_ICONS.salary} loading={loading} tooltip="Salaire annuel brut median" />
        <KPICard label="Combo skills #1" value={data?.kpis.top_combo || "-"} subtitle={data?.kpis.top_combo_count ? `${formatNumber(data.kpis.top_combo_count)} offres` : undefined} icon={KPI_ICONS.combo} loading={loading} tooltip="Combinaison de 3 competences la plus frequente" />
      </div>

      {/* Row 1: Top skills + Cloud Wars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartContainer title="Top competences" subtitle="Les plus demandees" loading={loading}>
          {data && (
            <div className="flex flex-col h-[300px]">
              <div className="flex flex-wrap gap-3 mb-2">
                {skillCategories.map(cat => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: SKILL_CATEGORY_COLORS[cat] || "#06B6D4" }} />
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
                          <Cell key={i} fill={SKILL_CATEGORY_COLORS[s.skill_category] || "#06B6D4"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </ChartContainer>

        <ChartContainer title="Cloud Wars : AWS vs GCP vs Azure" subtitle="Nombre d'offres mentionnant chaque cloud" loading={loading}>
          {data && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cloudWarsData} margin={{ left: 10, right: 10 }}>
                <XAxis dataKey="skill_name" tick={{ fill: tickColor, fontSize: 12 }} />
                <YAxis tick={{ fill: tickMuted, fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {cloudWarsData.map((c, i) => (
                    <Cell key={i} fill={CLOUD_COLORS[c.skill_name] || "#06B6D4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>

      {/* Row 2: Orchestrators + Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer title="Orchestrateurs" subtitle="Airflow vs dbt vs Dagster vs Prefect..." loading={loading}>
          {data && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.orchestrators} margin={{ left: 10, right: 10 }}>
                <XAxis dataKey="skill_name" tick={{ fill: tickColor, fontSize: 11 }} />
                <YAxis tick={{ fill: tickMuted, fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
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
