"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
  Treemap, Legend,
} from "recharts";
import KPICard from "@/components/KPICard";
import ChartContainer from "@/components/ChartContainer";
import GlobalFilters from "@/components/GlobalFilters";
import CustomTooltip from "@/components/CustomTooltip";
import { useFilters } from "@/lib/filters";
import { useTheme } from "@/lib/theme";
import {
  TITLE_COLORS, REMOTE_COLORS, SKILL_CATEGORY_COLORS, SKILL_CATEGORY_LABELS, SOURCE_COLORS,
  formatSalary, formatNumber, REMOTE_LABELS, KPI_ICONS,
} from "@/lib/colors";

interface OverviewData {
  kpis: { total: number; median_salary: number; top_title: string; top_title_count: number; top_combo: string; top_combo_count: number };
  byTitle: { name: string; value: number }[];
  topSkills: { skill_name: string; skill_category: string; count: number }[];
  byContractTitle: { title: string; contract_type: string; count: number }[];
  byRegion: { region: string; count: number }[];
  byCity: { city: string; count: number }[];
  byRemote: { remote_policy: string; count: number }[];
  bySource: { source: string; count: number }[];
  salaryByTitle: { title: string; avg_salary: number; median: number }[];
  bySector: { sector: string; count: number }[];
  byCompany: { company: string; count: number }[];
}

// Custom treemap content
function TreemapContent(props: { x: number; y: number; width: number; height: number; name: string; value: number; root?: { children: { value: number }[] } }) {
  const { x, y, width, height, name, value, root } = props;
  const total = root?.children?.reduce((s: number, c: { value: number }) => s + c.value, 0) || 1;
  const pct = Math.round((100 * value) / total);
  const color = TITLE_COLORS[name] || "#6366F1";
  if (width < 40 || height < 30) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} rx={6} opacity={0.9} stroke="var(--card-bg)" strokeWidth={2} />
      {width > 60 && height > 40 && (
        <>
          <text x={x + 10} y={y + 20} fill="#fff" fontSize={12} fontWeight="bold">{name}</text>
          <text x={x + 10} y={y + 36} fill="rgba(255,255,255,0.8)" fontSize={11}>{value} ({pct}%)</text>
        </>
      )}
    </g>
  );
}

// Wrap long labels for bar charts
function wrapLabel(label: string, maxLen = 18): string {
  if (label.length <= maxLen) return label;
  const mid = label.lastIndexOf(" ", maxLen);
  if (mid > 0) return label.slice(0, mid) + "\n" + label.slice(mid + 1);
  return label;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationMode, setLocationMode] = useState<"department" | "city">("department");
  const [sectorMode, setSectorMode] = useState<"sector" | "company">("sector");
  const { toQueryString } = useFilters();
  const { theme } = useTheme();

  // Dynamic tick colors based on theme
  const tickColor = theme === "dark" ? "#94A3B8" : "#4B5563";
  const tickMuted = theme === "dark" ? "#64748B" : "#6B7280";
  const accentColor = theme === "dark" ? "#818CF8" : "#6366F1";

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/overview?${toQueryString()}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [toQueryString]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // All skills for scrollable chart
  const allSkills = data ? [...data.topSkills] : [];
  // All locations desc
  const allLocation = data
    ? locationMode === "department"
      ? [...data.byRegion]
      : [...(data.byCity || [])]
    : [];

  // Skill category legend (unique categories present)
  const skillCategories = data
    ? [...new Set(data.topSkills.map(s => s.skill_category))]
    : [];

  return (
    <div>
      {/* Title + Filters on same row */}
      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <h2 className="text-4xl font-bold" style={{ color: "var(--text)" }}>VUE GLOBALE</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Panorama du marche data en France</p>
        </div>
        <GlobalFilters />
      </div>

      {/* KPIs */}
      <div className="flex justify-center flex-wrap gap-10 py-6 mb-10">
        <KPICard label="Total offres analysees" value={data ? formatNumber(Number(data.kpis.total)) : "-"} icon={KPI_ICONS.total} loading={loading} tooltip="Nombre total d'offres data collectees et analysees" />
        <KPICard label="Salaire median" value={data?.kpis.median_salary ? formatSalary(Number(data.kpis.median_salary)) : "-"} icon={KPI_ICONS.salary} loading={loading} tooltip="Salaire annuel brut median parmi les offres avec salaire renseigne" />
        <KPICard label="Combo skills #1" value={data?.kpis.top_combo || "-"} subtitle={data?.kpis.top_combo_count ? `${formatNumber(data.kpis.top_combo_count)} offres` : undefined} icon={KPI_ICONS.combo} loading={loading} tooltip="Combinaison de 3 competences la plus frequente dans les offres" />
        <KPICard label="Top metier" value={data?.kpis.top_title || "-"} subtitle={data ? `${formatNumber(data.kpis.top_title_count)} offres` : undefined} icon={KPI_ICONS.top} loading={loading} tooltip="Metier avec le plus grand nombre d'offres" />
      </div>

      {/* Row 1: Treemap + Top Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartContainer title="Repartition des offres par metier" subtitle="Taille proportionnelle au volume" loading={loading}>
          {data && data.byTitle.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <Treemap
                data={data.byTitle.map(d => ({ ...d, name: d.name, value: Number(d.value) }))}
                dataKey="value"
                nameKey="name"
                content={<TreemapContent x={0} y={0} width={0} height={0} name="" value={0} />}
              />
            </ResponsiveContainer>
          )}
        </ChartContainer>

        <ChartContainer title="Top competences" subtitle="Les plus demandees toutes offres confondues" loading={loading}>
          {data && (
            <div className="flex flex-col h-[300px]">
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-2">
                {skillCategories.map(cat => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: SKILL_CATEGORY_COLORS[cat] || "#6366F1" }} />
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{SKILL_CATEGORY_LABELS[cat] || cat}</span>
                  </div>
                ))}
              </div>
              {/* Scrollable chart */}
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
      </div>

      {/* Row 2: Remote Donut + Source Donut + Location */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <ChartContainer title="Remote Policy" subtitle="Repartition teletravail" loading={loading}>
          {data && data.byRemote && data.byRemote.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.byRemote.map(r => ({ name: REMOTE_LABELS[r.remote_policy] || r.remote_policy, value: Number(r.count), remote_policy: r.remote_policy }))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="var(--card-bg)">
                  {data.byRemote.map((r, i) => (
                    <Cell key={i} fill={REMOTE_COLORS[r.remote_policy] || "#9CA3AF"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        <ChartContainer title="Sources" subtitle="Repartition par plateforme" loading={loading}>
          {data && data.bySource && data.bySource.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.bySource.map(r => ({ name: r.source, value: Number(r.count) }))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="var(--card-bg)">
                  {data.bySource.map((r, i) => (
                    <Cell key={i} fill={SOURCE_COLORS[r.source] || "#9CA3AF"} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>

        <div className="lg:col-span-2">
          <ChartContainer
            title={locationMode === "department" ? "Top departements" : "Top villes"}
            subtitle="Par volume d'offres"
            loading={loading}
            headerRight={
              <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <button
                  className={`px-2.5 py-1 text-xs font-medium cursor-pointer toggle-btn ${locationMode === "department" ? "toggle-btn-active" : ""}`}
                  style={{
                    backgroundColor: locationMode === "department" ? accentColor : "var(--toggle-inactive-bg)",
                    color: locationMode === "department" ? "#fff" : "var(--text-muted)",
                  }}
                  onClick={() => setLocationMode("department")}
                >
                  Dept
                </button>
                <button
                  className={`px-2.5 py-1 text-xs font-medium cursor-pointer toggle-btn ${locationMode === "city" ? "toggle-btn-active" : ""}`}
                  style={{
                    backgroundColor: locationMode === "city" ? accentColor : "var(--toggle-inactive-bg)",
                    color: locationMode === "city" ? "#fff" : "var(--text-muted)",
                  }}
                  onClick={() => setLocationMode("city")}
                >
                  Ville
                </button>
              </div>
            }
          >
            {data && (
              <div className="overflow-y-auto" style={{ maxHeight: 250 }}>
                <div style={{ height: Math.max(200, allLocation.length * 32) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={allLocation} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" tick={{ fill: tickMuted, fontSize: 10 }} />
                      <YAxis
                        type="category"
                        dataKey={locationMode === "department" ? "region" : "city"}
                        tick={{ fill: tickColor, fontSize: 11 }}
                        width={120}
                        tickFormatter={(v) => wrapLabel(v)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill={accentColor} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </ChartContainer>
        </div>
      </div>

      {/* Row 3: Sector/Company + Salary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartContainer
          title={sectorMode === "sector" ? "Top secteurs d'activite" : "Top entreprises"}
          subtitle={sectorMode === "sector" ? "Par volume d'offres" : "Les plus presentes sur le marche"}
          loading={loading}
          headerRight={
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <button
                className={`px-2.5 py-1 text-xs font-medium cursor-pointer toggle-btn ${sectorMode === "sector" ? "toggle-btn-active" : ""}`}
                style={{
                  backgroundColor: sectorMode === "sector" ? accentColor : "var(--toggle-inactive-bg)",
                  color: sectorMode === "sector" ? "#fff" : "var(--text-muted)",
                }}
                onClick={() => setSectorMode("sector")}
              >
                Secteur
              </button>
              <button
                className={`px-2.5 py-1 text-xs font-medium cursor-pointer toggle-btn ${sectorMode === "company" ? "toggle-btn-active" : ""}`}
                style={{
                  backgroundColor: sectorMode === "company" ? accentColor : "var(--toggle-inactive-bg)",
                  color: sectorMode === "company" ? "#fff" : "var(--text-muted)",
                }}
                onClick={() => setSectorMode("company")}
              >
                Entreprise
              </button>
            </div>
          }
        >
          {data && (
            <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
              <div style={{ height: Math.max(200, (sectorMode === "sector" ? data.bySector : data.byCompany).length * 32) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorMode === "sector" ? data.bySector : data.byCompany} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" tick={{ fill: tickMuted, fontSize: 10 }} />
                    <YAxis
                      type="category"
                      dataKey={sectorMode === "sector" ? "sector" : "company"}
                      tick={{ fill: tickColor, fontSize: 11 }}
                      width={140}
                      tickFormatter={(v) => wrapLabel(v, 22)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill={accentColor} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </ChartContainer>

        <ChartContainer title="Salaires par metier" subtitle="Moyenne et mediane — annuel brut" loading={loading}>
          {data && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.salaryByTitle} margin={{ left: 10, right: 10 }}>
                <XAxis dataKey="title" tick={{ fill: tickColor, fontSize: 10 }} height={40} />
                <YAxis tick={{ fill: tickMuted, fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<CustomTooltip formatter={(v) => formatSalary(Number(v))} />} />
                <Bar dataKey="avg_salary" name="Salaire moyen" fill={accentColor} radius={[4, 4, 0, 0]}>
                  {data.salaryByTitle.map((r, i) => (
                    <Cell key={i} fill={TITLE_COLORS[r.title] || "#6366F1"} opacity={0.5} />
                  ))}
                </Bar>
                <Bar dataKey="median" name="Salaire median" fill={accentColor} radius={[4, 4, 0, 0]}>
                  {data.salaryByTitle.map((r, i) => (
                    <Cell key={i} fill={TITLE_COLORS[r.title] || "#6366F1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartContainer>
      </div>
    </div>
  );
}
