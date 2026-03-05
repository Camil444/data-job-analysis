import { NextRequest, NextResponse } from "next/server";
import { query, buildWhereClause } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const titleOverride = sp.get("titles");
  const filters = {
    titles: titleOverride || "Data Scientist,ML Engineer,AI Engineer",
    regions: sp.get("regions"),
    contract_type: sp.get("contract_type"),
    remote_policy: sp.get("remote_policy"),
    experience_level: sp.get("experience_level"),
    source: sp.get("source"),
  };
  const { clause, params } = buildWhereClause(filters);
  const baseFrom = `FROM analytics.fact_jobs f LEFT JOIN analytics.dim_job_titles t ON f.normalized_title_id = t.title_id`;

  const [kpis, topSkills, subProfiles, mlFrameworks, genaiPct, education, heatmap, topCompanies, topCombo] = await Promise.all([
    query(
      `SELECT COUNT(*) as total,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY f.salary) FILTER (WHERE f.salary IS NOT NULL AND f.salary > 10000) as median_salary
      ${baseFrom} ${clause}`, params
    ),
    query(
      `SELECT s.skill_name, s.skill_category, COUNT(*) as count
      ${baseFrom} JOIN analytics.bridge_job_skills b ON f.job_id = b.job_id JOIN analytics.dim_skills s ON b.skill_id = s.skill_id
      ${clause} GROUP BY s.skill_name, s.skill_category ORDER BY count DESC LIMIT 15`, params
    ),
    query(
      `SELECT t.normalized_title as title, f.contract_type, COUNT(*) as count
      ${baseFrom} ${clause} AND t.normalized_title IS NOT NULL
      GROUP BY t.normalized_title, f.contract_type`, params
    ),
    query(
      `SELECT s.skill_name, COUNT(*) as count
      ${baseFrom} JOIN analytics.bridge_job_skills b ON f.job_id = b.job_id JOIN analytics.dim_skills s ON b.skill_id = s.skill_id
      ${clause} AND s.skill_name IN ('PyTorch', 'TensorFlow', 'Scikit-learn', 'XGBoost', 'LightGBM', 'Keras')
      GROUP BY s.skill_name ORDER BY count DESC`, params
    ),
    query(
      `SELECT
        COUNT(DISTINCT f.job_id) FILTER (WHERE s.skill_name IN ('Hugging Face', 'LangChain', 'OpenAI API')) as genai_jobs,
        COUNT(DISTINCT f.job_id) as total_jobs
      ${baseFrom} LEFT JOIN analytics.bridge_job_skills b ON f.job_id = b.job_id LEFT JOIN analytics.dim_skills s ON b.skill_id = s.skill_id
      ${clause}`, params
    ),
    query(
      `SELECT f.education_level, COUNT(*) as count
      ${baseFrom} ${clause} GROUP BY f.education_level ORDER BY count DESC`, params
    ),
    query(
      `SELECT s.skill_name, t.normalized_title as profile, COUNT(*) as count
      ${baseFrom} JOIN analytics.bridge_job_skills b ON f.job_id = b.job_id JOIN analytics.dim_skills s ON b.skill_id = s.skill_id
      ${clause} AND t.normalized_title IS NOT NULL
      AND s.skill_name IN (
        SELECT s2.skill_name FROM analytics.fact_jobs f2
        LEFT JOIN analytics.dim_job_titles t2 ON f2.normalized_title_id = t2.title_id
        JOIN analytics.bridge_job_skills b2 ON f2.job_id = b2.job_id
        JOIN analytics.dim_skills s2 ON b2.skill_id = s2.skill_id
        WHERE t2.normalized_title IN ('Data Scientist', 'ML Engineer', 'AI Engineer')
        GROUP BY s2.skill_name ORDER BY COUNT(*) DESC LIMIT 10
      )
      GROUP BY s.skill_name, t.normalized_title`, params
    ),
    query(
      `SELECT f.company_name,
        COUNT(*) as nb_offres,
        ROUND(AVG(f.salary)) as avg_salary,
        MODE() WITHIN GROUP (ORDER BY f.remote_policy) as remote_dominant
      ${baseFrom} ${clause} AND f.company_name IS NOT NULL AND f.company_name != ''
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
      ${clause ? clause + " AND" : "WHERE"} s1.skill_name < s2.skill_name AND s2.skill_name < s3.skill_name
      GROUP BY s1.skill_name, s2.skill_name, s3.skill_name
      ORDER BY combo_count DESC LIMIT 1`, params
    ),
  ]);

  const topFramework = mlFrameworks.length > 0 ? mlFrameworks[0].skill_name : "-";
  const genaiData = genaiPct[0] || { genai_jobs: 0, total_jobs: 1 };
  const pctGenai = Math.round((100 * Number(genaiData.genai_jobs)) / Math.max(Number(genaiData.total_jobs), 1));
  const topSkillCombo = topCombo.length > 0
    ? { skills: `${topCombo[0].s1} x ${topCombo[0].s2} x ${topCombo[0].s3}`, count: Number(topCombo[0].combo_count) }
    : { skills: "-", count: 0 };

  return NextResponse.json({
    kpis: { ...kpis[0], top_framework: topFramework, pct_genai: pctGenai, top_combo: topSkillCombo.skills, top_combo_count: topSkillCombo.count },
    topSkills, subProfiles, mlFrameworks, education, heatmap, topCompanies,
  });
}
