-- Bridge table N:N entre jobs et skills

select
    job_id,
    skill_id,
    false as is_required  -- ameliorer plus tard avec du NLP
from {{ ref('int_jobs_parsed_skills') }}
