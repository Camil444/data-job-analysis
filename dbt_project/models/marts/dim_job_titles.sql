-- Dimension titres de postes normalises (depuis le seed)

select
    title_id,
    normalized_title,
    title_family
from {{ ref('seed_dim_job_titles') }}
