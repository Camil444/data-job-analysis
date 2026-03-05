import { NextRequest, NextResponse } from "next/server";
import { query, buildWhereClause } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const titleOverride = sp.get("titles");
  const cloudParam = sp.get("cloud");
  const filters = {
    titles: titleOverride || "Data Engineer,Analytics Engineer,Data Architect",
    regions: sp.get("regions"),
    contract_type: sp.get("contract_type"),
    remote_policy: sp.get("remote_policy"),
    experience_level: sp.get("experience_level"),
    source: sp.get("source"),
  };
  const { clause, params } = buildWhereClause(filters);
  const baseFrom = `FROM analytics.fact_jobs f LEFT JOIN analytics.dim_job_titles t ON f.normalized_title_id = t.title_id`;

  // If cloud filter is set, add a subquery to restrict to jobs with that cloud skill
  let cloudClause = "";
  if (cloudParam && ["AWS", "GCP", "Azure"].includes(cloudParam)) {
    const cloudIdx = params.length + 1;
    params.push(cloudParam);
    cloudClause = ` ${clause ? "AND" : "WHERE"} f.job_id IN (SELECT bc.job_id FROM analytics.bridge_job_skills bc JOIN analytics.dim_skills sc ON bc.skill_id = sc.skill_id WHERE sc.skill_name = $${cloudIdx})`;
  }

  const fullClause = clause + cloudClause;
  const baseWithCloud = `${baseFrom} ${fullClause}`;

  const [kpis, topSkills, cloudWars, orchestrators, topCompanies, topCombo] = await Promise.all([
    query(
      `SELECT COUNT(*) as total,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY f.salary) FILTER (WHERE f.salary IS NOT NULL AND f.salary > 10000) as median_salary
      ${baseFrom} ${fullClause}`, params
    ),
    query(
      `SELECT s.skill_name, s.skill_category, COUNT(*) as count
      ${baseFrom} JOIN analytics.bridge_job_skills b ON f.job_id = b.job_id JOIN analytics.dim_skills s ON b.skill_id = s.skill_id
      ${fullClause} ${fullClause ? "AND" : "WHERE"} s.skill_name NOT IN ('AWS', 'GCP', 'Azure')
      GROUP BY s.skill_name, s.skill_category ORDER BY count DESC LIMIT 15`, params
    ),
    query(
      `SELECT s.skill_name, COUNT(*) as count
      ${baseFrom} JOIN analytics.bridge_job_skills b ON f.job_id = b.job_id JOIN analytics.dim_skills s ON b.skill_id = s.skill_id
      ${clause} AND s.skill_name IN ('AWS', 'GCP', 'Azure')
      GROUP BY s.skill_name ORDER BY count DESC`, [...params.slice(0, params.length - (cloudParam ? 1 : 0))]
    ),
    query(
      `SELECT s.skill_name, COUNT(*) as count
      ${baseFrom} JOIN analytics.bridge_job_skills b ON f.job_id = b.job_id JOIN analytics.dim_skills s ON b.skill_id = s.skill_id
      ${fullClause} ${fullClause ? "AND" : "WHERE"} s.skill_name IN ('Airflow', 'dbt', 'Dagster', 'Prefect', 'Fivetran', 'Talend')
      GROUP BY s.skill_name ORDER BY count DESC`, params
    ),
    query(
      `SELECT f.company_name,
        COUNT(*) as nb_offres,
        ROUND(AVG(f.salary)) as avg_salary,
        MODE() WITHIN GROUP (ORDER BY f.remote_policy) as remote_dominant
      ${baseFrom} ${fullClause} ${fullClause ? "AND" : "WHERE"} f.company_name IS NOT NULL AND f.company_name != ''
      GROUP BY f.company_name ORDER BY nb_offres DESC LIMIT 15`, params
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
      ${fullClause ? fullClause + " AND" : "WHERE"} s1.skill_name < s2.skill_name AND s2.skill_name < s3.skill_name
      GROUP BY s1.skill_name, s2.skill_name, s3.skill_name
      ORDER BY combo_count DESC LIMIT 1`, params
    ),
  ]);

  const topCloud = cloudWars.length > 0 ? cloudWars[0].skill_name : "-";
  const topSkillCombo = topCombo.length > 0
    ? { skills: `${topCombo[0].s1} x ${topCombo[0].s2} x ${topCombo[0].s3}`, count: Number(topCombo[0].combo_count) }
    : { skills: "-", count: 0 };

  return NextResponse.json({
    kpis: { ...kpis[0], top_cloud: topCloud, top_combo: topSkillCombo.skills, top_combo_count: topSkillCombo.count },
    topSkills, cloudWars, orchestrators, topCompanies,
  });
}
