-- Verifie qu'il n'y a pas de skills dans bridge_job_skills qui ne sont pas dans dim_skills

select
    b.skill_id
from {{ ref('bridge_job_skills') }} b
left join {{ ref('dim_skills') }} d
    on b.skill_id = d.skill_id
where d.skill_id is null
