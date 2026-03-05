-- Staging LinkedIn : nettoyage et typage des donnees brutes

with source as (
    select * from {{ source('raw', 'stg_linkedin') }}
),

cleaned as (
    select
        {{ dbt_utils.generate_surrogate_key(['raw_title', 'company_name', 'date_posted', 'source']) }} as row_id,
        source,
        trim(lower(raw_title)) as raw_title,
        trim(lower(company_name)) as company_name,
        trim(lower(location_city)) as location_city,
        raw_description,
        contract_type,
        experience_level,
        education_level,
        salary_min::numeric as salary_min,
        salary_max::numeric as salary_max,
        salary_period,
        remote_policy,
        date_posted::date as date_posted,
        date_scraped::date as date_scraped,
        job_url,
        loaded_at,
        row_number() over (
            partition by raw_title, company_name, date_posted
            order by loaded_at desc
        ) as rn
    from source
)

select * from cleaned where rn = 1
