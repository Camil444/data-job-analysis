-- Titres non matches : a review manuellement pour enrichir seed_title_keywords

with normalized as (
    select * from {{ ref('int_jobs_normalized_titles') }}
),

unmatched as (
    select
        raw_title,
        company_name,
        source,
        count(*) as occurrences
    from normalized
    where normalized_title_id is null
    group by raw_title, company_name, source
    order by occurrences desc
)

select * from unmatched
