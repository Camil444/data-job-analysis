-- Normalisation des titres via keyword matching (plus long keyword = plus specifique)

with jobs as (
    select * from {{ ref('int_jobs_deduplicated') }}
),

keywords as (
    select * from {{ ref('seed_title_keywords') }}
),

-- Joindre chaque job avec tous les keywords qui matchent
matched as (
    select
        j.*,
        k.title_id as matched_title_id,
        k.keyword,
        length(k.keyword) as keyword_length
    from jobs j
    left join keywords k
        on lower(j.raw_title) like '%' || lower(k.keyword) || '%'
),

-- Garder le keyword le plus long (le plus specifique) pour chaque job
best_match as (
    select
        *,
        row_number() over (
            partition by row_id
            order by keyword_length desc nulls last
        ) as rn
    from matched
)

select
    row_id,
    source,
    raw_title,
    matched_title_id as normalized_title_id,
    keyword as matched_keyword,
    company_name,
    location_city,
    raw_description,
    contract_type,
    experience_level,
    education_level,
    salary_min,
    salary_max,
    salary_period,
    remote_policy,
    date_posted,
    date_scraped,
    job_url,
    dedup_key
from best_match
where rn = 1
