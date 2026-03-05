-- Bridge table N:N entre jobs et skills
-- Filtre sur les jobs presents dans fact_jobs (exclut les offres non-data)

select
    ps.job_id,
    ps.skill_id,
    false as is_required  -- ameliorer plus tard avec du NLP
from {{ ref('int_jobs_parsed_skills') }} ps
where ps.job_id in (select job_id from {{ ref('fact_jobs') }})
