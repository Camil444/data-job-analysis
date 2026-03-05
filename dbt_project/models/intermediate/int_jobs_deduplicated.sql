-- Deduplication cross-source : garder la source la plus fiable

with unioned as (
    select * from {{ ref('int_jobs_unioned') }}
),

-- Cle de deduplication : titre + entreprise + ville (approximatif)
with_dedup_key as (
    select
        *,
        {{ dbt_utils.generate_surrogate_key(['raw_title', 'company_name', 'location_city']) }} as dedup_key,
        case source
            when 'france_travail' then 1
            when 'linkedin' then 2
            when 'indeed' then 3
            when 'glassdoor' then 4
            else 5
        end as source_priority
    from unioned
),

ranked as (
    select
        *,
        row_number() over (
            partition by dedup_key
            order by source_priority asc, date_scraped desc
        ) as rn
    from with_dedup_key
)

select
    row_id,
    source,
    raw_title,
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
    company_sector,
    dedup_key
from ranked
where rn = 1
