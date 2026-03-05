-- Union de toutes les sources staging en une seule table

with france_travail as (
    select * from {{ ref('stg_france_travail') }}
),

linkedin as (
    select * from {{ ref('stg_linkedin') }}
),

indeed as (
    select * from {{ ref('stg_indeed') }}
),

glassdoor as (
    select * from {{ ref('stg_glassdoor') }}
),

unioned as (
    select row_id, source, raw_title, company_name, location_city, raw_description,
           contract_type, experience_level, education_level,
           salary_min, salary_max, salary_period, remote_policy,
           date_posted, date_scraped, job_url, company_sector
    from france_travail

    union all

    select row_id, source, raw_title, company_name, location_city, raw_description,
           contract_type, experience_level, education_level,
           salary_min, salary_max, salary_period, remote_policy,
           date_posted, date_scraped, job_url, company_sector
    from linkedin

    union all

    select row_id, source, raw_title, company_name, location_city, raw_description,
           contract_type, experience_level, education_level,
           salary_min, salary_max, salary_period, remote_policy,
           date_posted, date_scraped, job_url, company_sector
    from indeed

    union all

    select row_id, source, raw_title, company_name, location_city, raw_description,
           contract_type, experience_level, education_level,
           salary_min, salary_max, salary_period, remote_policy,
           date_posted, date_scraped, job_url, company_sector
    from glassdoor
)

select * from unioned
