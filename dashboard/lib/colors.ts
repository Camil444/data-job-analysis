export const TITLE_COLORS: Record<string, string> = {
  "Data Analyst": "#6366F1",
  "Data Engineer": "#06B6D4",
  "Data Scientist": "#8B5CF6",
  "Analytics Engineer": "#06B6D4",
  "ML Engineer": "#F59E0B",
  "AI Engineer": "#F59E0B",
  "Business Analyst": "#10B981",
  "BI Analyst": "#10B981",
  "Data Manager": "#EC4899",
  "Data Architect": "#F97316",
};

export const CONTRACT_COLORS: Record<string, string> = {
  cdi: "#6366F1",
  cdd: "#06B6D4",
  alternance: "#10B981",
  stage: "#F59E0B",
  freelance: "#EF4444",
  interim: "#EC4899",
  not_specified: "#CBD5E1",
};

export const REMOTE_COLORS: Record<string, string> = {
  full_remote: "#10B981",
  hybrid: "#F59E0B",
  on_site: "#EF4444",
  not_specified: "#64748B",
};

export const SKILL_CATEGORY_COLORS: Record<string, string> = {
  langages: "#6366F1",
  data_viz_bi: "#06B6D4",
  cloud: "#F59E0B",
  data_engineering: "#10B981",
  databases: "#EC4899",
  ml_ai: "#8B5CF6",
  big_data: "#F97316",
  devops: "#EF4444",
  methodologies: "#64748B",
};

export const SKILL_CATEGORY_LABELS: Record<string, string> = {
  langages: "Langages",
  data_viz_bi: "Data Viz / BI",
  cloud: "Cloud",
  data_engineering: "Data Engineering",
  databases: "Databases",
  ml_ai: "ML / AI",
  big_data: "Big Data",
  devops: "DevOps",
  methodologies: "Methodologies",
};

export const SOURCE_COLORS: Record<string, string> = {
  linkedin: "#0A66C2",
  indeed: "#2557A7",
  france_travail: "#EC4899",
  glassdoor: "#0CAA41",
};

export function formatSalary(value: number): string {
  if (value >= 1000) return `${Math.round(value / 1000)}k€`;
  return `${value}€`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export const REMOTE_LABELS: Record<string, string> = {
  full_remote: "Full Remote",
  hybrid: "Hybride",
  on_site: "Présentiel",
  not_specified: "Non spécifié",
};

export const CONTRACT_LABELS: Record<string, string> = {
  cdi: "CDI",
  cdd: "CDD",
  alternance: "Alternance",
  stage: "Stage",
  freelance: "Freelance",
  interim: "Intérim",
  not_specified: "Non spécifié",
};

export const EXPERIENCE_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
  lead: "Lead",
  not_specified: "Non spécifié",
};

export const EXPERIENCE_YEARS_LABELS: Record<string, string> = {
  "0_2": "< 2 ans",
  "2_5": "2-5 ans",
  "5_10": "5-10 ans",
  "10_plus": "10+ ans",
  not_specified: "Non spécifié",
};

export const KPI_ICONS: Record<string, string> = {
  combo: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMDAwMDAwIiBzdHlsZT0ib3BhY2l0eToxOyI+PHBhdGggIGQ9Ik0zIDEzVjVxMC0uODI1LjU4OC0xLjQxMlQ1IDNoNnYxMHpNMTMgM2g2cS44MjUgMCAxLjQxMy41ODhUMjEgNXY0aC04em0wIDE4VjExaDh2OHEwIC44MjUtLjU4NyAxLjQxM1QxOSAyMXpNMyAxNWg4djZINXEtLjgyNSAwLTEuNDEyLS41ODdUMyAxOXoiLz48L3N2Zz4=",
  total: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMDAwMDAwIiBzdHlsZT0ib3BhY2l0eToxOyI+PHBhdGggIGQ9Im0yMSAxNmwtOS40LTcuMzVsLTMuOTc1IDUuNDc1TDMgMTAuNVY3bDQgM2w1LTdsNSA0aDR6TTMgMjB2LTdsNSA0bDQtNS41bDkgNy4wMjVWMjB6Ii8+PC9zdmc+",
  salary: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMDAwMDAwIiBzdHlsZT0ib3BhY2l0eToxOyI+PHBhdGggIGQ9Ik0xMi4wMjUgMjFxLS40MjUgMC0uNzEyLS4yODhUMTEuMDI1IDIwdi0xLjE1UTkuOSAxOC42IDkuMDUgMTcuOTc1dC0xLjM3NS0xLjc1cS0uMTc1LS4zNS0uMDEyLS43Mzd0LjU4Ny0uNTYzcS4zNS0uMTUuNzI1LjAxM3QuNTc1LjUzN3EuNDI1Ljc1IDEuMDc1IDEuMTM4dDEuNi4zODdxMS4wMjUgMCAxLjczNy0uNDYydC43MTMtMS40MzhxMC0uODc1LS41NS0xLjM4N3QtMi41NS0xLjE2M3EtMi4xNS0uNjc1LTIuOTUtMS42MTJ0LS44LTIuMjg4cTAtMS42MjUgMS4wNS0yLjUyNXQyLjE1LTEuMDI1VjRxMC0uNDI1LjI4OC0uNzEzVDEyLjAyNSAzdC43MTMuMjg4dC4yODcuNzEydjEuMXEuOTUuMTUgMS42NS42MTN0MS4xNSAxLjEzN3EuMjI1LjMyNS4wODguNzI1dC0uNTYzLjU3NXEtLjM1LjE1LS43MjUuMDEzdC0uNy0uNDg4dC0uNzYzLS41Mzd0LTEuMDg3LS4xODhxLTEuMSAwLTEuNjc1LjQ4OFQ5LjgyNSA4LjY1cTAgLjgyNS43NSAxLjN0Mi42IDFxMS43MjUuNSAyLjYxMyAxLjU4OHQuODg3IDIuNTEycTAgMS43NzUtMS4wNSAyLjd0LTIuNiAxLjE1VjIwcTAgLjQyNS0uMjg4LjcxM3QtLjcxMi4yODciLz48L3N2Zz4=",
  remote: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMDAwMDAwIiBzdHlsZT0ib3BhY2l0eToxOyI+PHBhdGggIGQ9Ik0xNyA5aDJWN2gtMnptMCA0aDJ2LTJoLTJ6bTAgNGgydi0yaC0yek0xIDIxVjExbDctNWw3IDV2MTBoLTV2LTZINnY2em0xNiAwVjEwbC03LTUuMDVWM2gxM3YxOHoiLz48L3N2Zz4=",
  top: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMDAwMDAwIiBzdHlsZT0ib3BhY2l0eToxOyI+PHBhdGggIGQ9Ik0yIDE4di0uOHEwLS44NS40MjUtMS41NjJUMy42IDE0LjU1cTEuNDI1LS43MjUgMi45NjMtMS4xNXQzLjEzNy0uNDI1cS4zNSAwIC41NS4zMTN0LjA3NS42NjJxLS4xNS41MjUtLjIyNSAxLjA1dC0uMDc1IDEuMDc1cTAgLjcyNS4xNSAxLjRUMTAuNiAxOC44cS4yLjQyNS0uMDM3LjgxM1Q5LjkgMjBINHEtLjgyNSAwLTEuNDEyLS41ODdUMiAxOG0xNSAwcS44MjUgMCAxLjQxMy0uNTg3VDE5IDE2dC0uNTg3LTEuNDEyVDE3IDE0dC0xLjQxMi41ODhUMTUgMTZ0LjU4OCAxLjQxM1QxNyAxOG0tNy02cS0xLjY1IDAtMi44MjUtMS4xNzVUNiA4dDEuMTc1LTIuODI1VDEwIDR0Mi44MjUgMS4xNzVUMTQgOHQtMS4xNzUgMi44MjVUMTAgMTJtNS44NSA0LjJsLS4xNS0uN3EtLjMtLjEyNS0uNTYyLS4yNjJUMTQuNiAxOC45bC0uNzI1LjIyNXEtLjMyNS4xLS42MzctLjAyNXQtLjQ4OC0uNGwtLjItLjM1cS0uMTc1LS4zLS4xMjUtLjY1dC4zMjUtLjU3NWwuNTUtLjQ3NXEtLjA1LS4zNS0uMDUtLjY1dC4wNS0uNjVsLS41NS0uNDc1cS0uMjc1LS4yMjUtLjMyNS0uNTYzdC4xMjUtLjYzN2wuMjI1LS4zNzVxLjE3NS0uMjc1LjQ3NS0uNHQuNjI1LS4wMjVsLjcyNS4yMjVxLjI3NS0uMi41MzgtLjMzOHQuNTYyLS4yNjJsLjE1LS43MjVxLjA3NS0uMzUuMzM4LS41NjJUMTYuOCAxMWguNHEuMzUgMCAuNjEzLjIyNXQuMzM3LjU3NWwuMTUuN3EuMy4xMjUuNTYyLjI3NXQuNTM4LjM3NWwuNjc1LS4yMjVxLjM1LS4xMjUuNjc1IDB0LjUuNDI1bC4yLjM1cS4xNzUuMy4xMjUuNjV0LS4zMjUuNTc1bC0uNTUuNDc1cS4wNS4zLjA1LjYyNXQtLjA1LjYyNWwuNTUuNDc1cS4yNzUuMjI1LjMyNS41NjN0LS4xMjUuNjM3bC0uMjI1LjM3NXEtLjE3NS4yNzUtLjQ3NS40dC0uNjI1LjAyNUwxOS40IDE4LjlxLS4yNzUuMi0uNTM4LjMzN3QtLjU2Mi4yNjNsLS4xNS43MjVxLS4wNzUuMzUtLjMzNy41NjNUMTcuMiAyMWgtLjRxLS4zNSAwLS42MTItLjIyNXQtLjMzOC0uNTc1Ii8+PC9zdmc+",
};
