"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import KPICard from "@/components/KPICard";
import ChartContainer from "@/components/ChartContainer";
import GlobalFilters from "@/components/GlobalFilters";
import CustomTooltip from "@/components/CustomTooltip";
import DataTable from "@/components/DataTable";
import { useFilters } from "@/lib/filters";
import { useTheme } from "@/lib/theme";
import {
  TITLE_COLORS, CONTRACT_COLORS, SKILL_CATEGORY_COLORS, SKILL_CATEGORY_LABELS,
  REMOTE_LABELS, CONTRACT_LABELS,
  formatSalary, formatNumber, formatPercent, KPI_ICONS,
} from "@/lib/colors";

interface ScientistData {
  kpis: { total: number; median_salary: number; top_framework: string; pct_genai: number; top_combo: string; top_combo_count: number };
  topSkills: { skill_name: string; skill_category: string; count: number }[];
  subProfiles: { title: string; contract_type: string; count: number }[];
  mlFrameworks: { skill_name: string; count: number }[];
  education: { education_level: string; count: number }[];
  heatmap: { skill_name: string; profile: string; count: number }[];
  topCompanies: { company_name: string; nb_offres: number; avg_salary: number; remote_dominant: string }[];
}

const PROFILES = ["Data Scientist", "ML Engineer", "AI Engineer"];
const contractTypes = ["cdi", "cdd", "alternance", "stage", "freelance", "interim", "not_specified"];

export default function ScientistPage() {
  const [data, setData] = useState<ScientistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [metierFilter, setMetierFilter] = useState<string>("all");
  const { toQueryString } = useFilters();
  const { theme } = useTheme();

  const tickColor = theme === "dark" ? "#94A3B8" : "#4B5563";
  const tickMuted = theme === "dark" ? "#64748B" : "#6B7280";
  const accentColor = theme === "dark" ? "#A78BFA" : "#8B5CF6";

  const fetchData = useCallback(() => {
    setLoading(true);
    const titles = metierFilter === "all" ? PROFILES : [metierFilter];
    fetch(`/api/scientist?${toQueryString({ titles })}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [toQueryString, metierFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allSkills = data ? [...data.topSkills] : [];
  const skillCategories = data ? [...new Set(data.topSkills.map(s => s.skill_category))] : [];

  // Sub-profiles pivot for stacked bar
  const subProfilePivot = (() => {
    if (!data) return [];
    const map: Record<string, Record<string, number>> = {};
    data.subProfiles.forEach((r) => {
      if (!map[r.title]) map[r.title] = {};
      map[r.title][r.contract_type] = Number(r.count);
    });
    return Object.entries(map).map(([title, contracts]) => ({ title, ...contracts }));
  })();

  // Heatmap pivot
  const heatmapPivot = (() => {
    if (!data) return [];
    const skills = [...new Set(data.heatmap.map((h) => h.skill_name))];
    return skills.map((skill) => {
      const row: Record<string, string | number> = { skill };
      PROFILES.forEach((p) => {
        const match = data.heatmap.find((h) => h.skill_name === skill && h.profile === p);
        row[p] = match ? Number(match.count) : 0;
      });
      return row;
    }).sort((a, b) => {
      const sumA = PROFILES.reduce((s, p) => s + (Number(a[p]) || 0), 0);
      const sumB = PROFILES.reduce((s, p) => s + (Number(b[p]) || 0), 0);
      return sumB - sumA;
    });
  })();

  return (
    <div>
      {/* Title + Filters */}
      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <h2 className="text-4xl font-bold" style={{ color: "var(--text)" }}>DS / ML / AI</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Data Scientist, ML Engineer, AI Engineer</p>
        </div>
        <GlobalFilters hideMetier />
      </div>

      {/* Metier filter */}
      <div className="flex gap-1.5 mb-6">
        {[{ value: "all", label: "Tous" }, ...PROFILES.map(t => ({ value: t, label: t }))].map(opt => (
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
        <KPICard label="Total offres" value={data ? formatNumber(Number(data.kpis.total)) : "-"} icon={KPI_ICONS.total} loading={loading} tooltip="Nombre d'offres DS/ML/AI analysees" />
        <KPICard label="Salaire median" value={data?.kpis.median_salary ? formatSalary(Number(data.kpis.median_salary)) : "-"} icon={KPI_ICONS.salary} loading={loading} tooltip="Salaire annuel brut median" />
        <KPICard label="Combo skills #1" value={data?.kpis.top_combo || "-"} subtitle={data?.kpis.top_combo_count ? `${formatNumber(data.kpis.top_combo_count)} offres` : undefined} icon={KPI_ICONS.combo} loading={loading} tooltip="Combinaison de 3 competences la plus frequente" />
      </div>

      {/* Row 1: Top skills + Sub-profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartContainer title="Top competences" subtitle="Les plus demandees" loading={loading}>
          {data && (
            <div className="flex flex-col h-[300px]">
              <div className="flex flex-wrap gap-3 mb-2">
                {skillCategories.map(cat => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: SKILL_CATEGORY_COLORS[cat] || "#8B5CF6" }} />
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
                          <Cell key={i} fill={SKILL_CATEGORY_COLORS[s.skill_category] || "#8B5CF6"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </ChartContainer>

        <ChartContainer title="DS vs ML Engineer vs AI Engineer" subtitle="Volume par sous-profil et type de contrat" loading={loading}>
          {data && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subProfilePivot} margin={{ left: 10, right: 10 }}>
                <XAxis dataKey="title" tick={{ fill: tickColor, fontSize: 10 }} />
                <YAxis tick={{ fill: tickMuted, fontSize: 10 }} />
                <Tooltip content={<CustomTooltip formatter={(v, n) => `${v} (${CONTRACT_LABELS[n] || n})`} />} />
                <Legend formatter={(v) => CONTRACT_LABELS[v] || v} wrapperStyle={{ fontSize: 10 }} />
                {contractTypes.map((ct) => (
                  <Bar key={ct} dataKey={ct} stackId="a" fill={CONTRACT_COLORS[ct]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>

      {/* Row 2: ML Frameworks + GenAI pie + Education */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <div className="lg:col-span-2">
          <ChartContainer title="Battle ML Frameworks" subtitle="PyTorch vs TensorFlow vs Scikit-learn..." loading={loading}>
            {data && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.mlFrameworks} margin={{ left: 10, right: 10 }}>
                  <XAxis dataKey="skill_name" tick={{ fill: tickColor, fontSize: 11 }} />
                  <YAxis tick={{ fill: tickMuted, fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>
        </div>

        <ChartContainer title="GenAI vs ML classique" loading={loading}>
          {data && (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "GenAI/LLM", value: data.kpis.pct_genai },
                    { name: "ML classique", value: 100 - data.kpis.pct_genai },
                  ]}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="var(--card-bg)"
                >
                  <Cell fill="#8B5CF6" />
                  <Cell fill="var(--border)" />
                </Pie>
                <Tooltip content={<CustomTooltip formatter={(v) => `${v}%`} />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        <ChartContainer title="Niveau d'etudes" loading={loading}>
          {data && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.education.filter(e => e.education_level !== "not_specified")} margin={{ left: 10, right: 10 }}>
                <XAxis dataKey="education_level" tick={{ fill: tickColor, fontSize: 10 }} tickFormatter={(v) => v.replace("_", "+")} />
                <YAxis tick={{ fill: tickMuted, fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>

      {/* Row 3: Heatmap + Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer title="Skills x Sous-profil" subtitle="Ce qui differencie DS, ML Eng et AI Eng" loading={loading}>
          {data && heatmapPivot.length > 0 && (
            <div className="overflow-auto text-xs">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2" style={{ color: "var(--text-muted)" }}>Skill</th>
                    {PROFILES.map((p) => (
                      <th key={p} className="p-2 text-center" style={{ color: TITLE_COLORS[p] }}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapPivot.map((row) => {
                    const maxVal = Math.max(...PROFILES.map((p) => Number(row[p]) || 0), 1);
                    return (
                      <tr key={row.skill as string}>
                        <td className="p-2 font-medium" style={{ color: "var(--text)" }}>{row.skill}</td>
                        {PROFILES.map((p) => {
                          const val = Number(row[p]) || 0;
                          const opacity = val / maxVal;
                          return (
                            <td key={p} className="p-2 text-center rounded" style={{ backgroundColor: `rgba(139,92,246,${opacity * 0.3})`, color: "var(--text)" }}>
                              {val || ""}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
