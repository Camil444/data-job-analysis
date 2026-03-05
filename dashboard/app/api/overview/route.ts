import { NextRequest, NextResponse } from "next/server";
import { query, buildWhereClause } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  if (sp.get("meta") === "last_update") {
    const result = await query("SELECT MAX(date_scraped) as last_update FROM analytics.fact_jobs");
    const raw = result[0]?.last_update;
    const formatted = raw ? new Date(raw).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null;
    return NextResponse.json({ last_update: formatted });
  }

  if (sp.get("meta") === "options") {
    const [titles, regions] = await Promise.all([
      query("SELECT DISTINCT normalized_title FROM analytics.dim_job_titles ORDER BY normalized_title"),
      query("SELECT DISTINCT location_region FROM analytics.fact_jobs WHERE location_region IS NOT NULL ORDER BY location_region"),
    ]);
    return NextResponse.json({
      titles: titles.map((r) => r.normalized_title),
      regions: regions.map((r) => r.location_region),
    });
  }

  const filters = {
    titles: sp.get("titles"),
    regions: sp.get("regions"),
    contract_type: sp.get("contract_type"),
    remote_policy: sp.get("remote_policy"),
    experience_level: sp.get("experience_level"),
    source: sp.get("source"),
  };
  const { clause, params } = buildWhereClause(filters);
  const baseFrom = `FROM analytics.fact_jobs f LEFT JOIN analytics.dim_job_titles t ON f.normalized_title_id = t.title_id`;

  const [kpis, byTitle, topSkills, byContractTitle, byRegion, byCity, byRemote, bySource, salaryByTitle, topCombo, bySector, byCompany] = await Promise.all([
    query(
      `SELECT COUNT(*) as total,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY f.salary) FILTER (WHERE f.salary IS NOT NULL AND f.salary > 10000) as median_salary
      ${baseFrom} ${clause}`, params
    ),
    query(
      `SELECT t.normalized_title as name, COUNT(*) as value
      ${baseFrom} ${clause} ${clause ? "AND" : "WHERE"} t.normalized_title IS NOT NULL
      GROUP BY t.normalized_title ORDER BY value DESC`, params
    ),
    query(
      `SELECT s.skill_name, s.skill_category, COUNT(*) as count
      ${baseFrom} JOIN analytics.bridge_job_skills b ON f.job_id = b.job_id JOIN analytics.dim_skills s ON b.skill_id = s.skill_id
      ${clause} GROUP BY s.skill_name, s.skill_category ORDER BY count DESC LIMIT 15`, params
    ),
    query(
      `SELECT t.normalized_title as title, f.contract_type, COUNT(*) as count
      ${baseFrom} ${clause} ${clause ? "AND" : "WHERE"} t.normalized_title IS NOT NULL
      GROUP BY t.normalized_title, f.contract_type ORDER BY t.normalized_title`, params
    ),
    query(
      `SELECT f.location_region as region, COUNT(*) as count
      ${baseFrom} ${clause} ${clause ? "AND" : "WHERE"} f.location_region IS NOT NULL
      GROUP BY f.location_region ORDER BY count DESC LIMIT 10`, params
    ),
    query(
      `SELECT f.location_city as city, COUNT(*) as count
      ${baseFrom} ${clause} ${clause ? "AND" : "WHERE"} f.location_city IS NOT NULL
      GROUP BY f.location_city ORDER BY count DESC LIMIT 10`, params
    ),
    query(
      `SELECT f.remote_policy, COUNT(*) as count
      ${baseFrom} ${clause} GROUP BY f.remote_policy ORDER BY count DESC`, params
    ),
    query(
      `SELECT f.source, COUNT(*) as count
      ${baseFrom} ${clause} GROUP BY f.source ORDER BY count DESC`, params
    ),
    query(
      `SELECT t.normalized_title as title,
        ROUND(AVG(f.salary)) as avg_salary,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY f.salary)) as median
      ${baseFrom} ${clause} ${clause ? "AND" : "WHERE"} f.salary IS NOT NULL AND f.salary > 10000 AND t.normalized_title IS NOT NULL
      GROUP BY t.normalized_title ORDER BY median DESC`, params
    ),
    query(
      `SELECT s1.skill_name as s1, s2.skill_name as s2, s3.skill_name as s3, COUNT(*) as combo_count
      FROM analytics.fact_jobs f
      JOIN analytics.bridge_job_skills b1 ON f.job_id = b1.job_id
      JOIN analytics.dim_skills s1 ON b1.skill_id = s1.skill_id
      JOIN analytics.bridge_job_skills b2 ON f.job_id = b2.job_id
      JOIN analytics.dim_skills s2 ON b2.skill_id = s2.skill_id
      JOIN analytics.bridge_job_skills b3 ON f.job_id = b3.job_id
      JOIN analytics.dim_skills s3 ON b3.skill_id = s3.skill_id
      LEFT JOIN analytics.dim_job_titles t ON f.normalized_title_id = t.title_id
      ${clause ? clause + " AND" : "WHERE"} s1.skill_name < s2.skill_name AND s2.skill_name < s3.skill_name
      GROUP BY s1.skill_name, s2.skill_name, s3.skill_name
      ORDER BY combo_count DESC LIMIT 1`, params
    ),
    query(
      `SELECT f.company_sector as sector, COUNT(*) as count
      ${baseFrom} ${clause} ${clause ? "AND" : "WHERE"} f.company_sector IS NOT NULL AND f.company_sector != 'Non renseigné'
      GROUP BY f.company_sector ORDER BY count DESC LIMIT 10`, params
    ),
    query(
      `SELECT f.company_name as company, COUNT(*) as count
      ${baseFrom} ${clause} ${clause ? "AND" : "WHERE"} f.company_name IS NOT NULL AND f.company_name != ''
      GROUP BY f.company_name ORDER BY count DESC LIMIT 10`, params
    ),
  ]);

  const topTitle = byTitle.length > 0 ? byTitle[0].name : "-";
  const topTitleCount = byTitle.length > 0 ? Number(byTitle[0].value) : 0;
  const topSkillCombo = topCombo.length > 0
    ? { skills: `${topCombo[0].s1} x ${topCombo[0].s2} x ${topCombo[0].s3}`, count: Number(topCombo[0].combo_count) }
    : { skills: "-", count: 0 };

  return NextResponse.json({
    kpis: { ...kpis[0], top_title: topTitle, top_title_count: topTitleCount, top_combo: topSkillCombo.skills, top_combo_count: topSkillCombo.count },
    byTitle, topSkills, byContractTitle, byRegion, byCity, byRemote, bySource, salaryByTitle, bySector, byCompany,
  });
}
