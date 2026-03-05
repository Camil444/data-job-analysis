-- Dimension competences techniques (depuis le seed)

select
    skill_id,
    skill_name,
    skill_category
from {{ ref('seed_dim_skills') }}
