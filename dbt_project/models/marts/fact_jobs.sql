-- Table de faits principale : 1 ligne = 1 offre d'emploi dedupliquee et enrichie

with jobs as (
    select * from {{ ref('int_jobs_normalized_titles') }}
),

final as (
    select
        row_id as job_id,
        source,
        raw_title,
        normalized_title_id,
        company_name,

        -- Localisation : parser ville et departement
        location_city,
        case
            when location_city ~ '.*\((\d{2,3})\).*'
            then regexp_replace(location_city, '.*\((\d{2,3})\).*', '\1')
            else null
        end as location_department,

        -- Remote policy normalise
        case
            when lower(coalesce(remote_policy, '')) in ('full_remote')
                or lower(coalesce(raw_description, '')) like '%full remote%'
                or lower(coalesce(raw_description, '')) like '%100%% télétravail%'
                or lower(coalesce(raw_description, '')) like '%100%% remote%'
                then 'full_remote'
            when lower(coalesce(remote_policy, '')) in ('hybrid')
                or lower(coalesce(raw_description, '')) like '%hybride%'
                or lower(coalesce(raw_description, '')) like '%hybrid%'
                or lower(coalesce(raw_description, '')) like '%télétravail partiel%'
                then 'hybrid'
            when lower(coalesce(remote_policy, '')) in ('on_site')
                or lower(coalesce(raw_description, '')) like '%présentiel%'
                or lower(coalesce(raw_description, '')) like '%sur site%'
                or lower(coalesce(raw_description, '')) like '%on-site%'
                then 'on_site'
            else 'not_specified'
        end as remote_policy,

        -- Contract type normalise
        case
            when lower(coalesce(contract_type, '')) like '%cdi%' then 'cdi'
            when lower(coalesce(contract_type, '')) like '%cdd%' then 'cdd'
            when lower(coalesce(contract_type, '')) like '%alternance%'
                or lower(coalesce(contract_type, '')) like '%apprenti%' then 'alternance'
            when lower(coalesce(contract_type, '')) like '%stage%'
                or lower(coalesce(contract_type, '')) like '%intern%' then 'stage'
            when lower(coalesce(contract_type, '')) like '%freelance%'
                or lower(coalesce(contract_type, '')) like '%indépendant%' then 'freelance'
            when lower(coalesce(contract_type, '')) like '%intérim%'
                or lower(coalesce(contract_type, '')) like '%interim%' then 'interim'
            else 'not_specified'
        end as contract_type,

        -- Experience level normalise
        case
            when lower(coalesce(experience_level, '')) like '%débutant%'
                or lower(coalesce(experience_level, '')) like '%junior%'
                or lower(coalesce(experience_level, '')) like '%0%'
                or lower(coalesce(experience_level, '')) like '%1 an%'
                or lower(coalesce(experience_level, '')) like '%2 an%'
                then 'junior_0_2'
            when lower(coalesce(experience_level, '')) like '%confirmé%'
                or lower(coalesce(experience_level, '')) like '%3 an%'
                or lower(coalesce(experience_level, '')) like '%4 an%'
                or lower(coalesce(experience_level, '')) like '%5 an%'
                then 'mid_2_5'
            when lower(coalesce(experience_level, '')) like '%senior%'
                or lower(coalesce(experience_level, '')) like '%6 an%'
                or lower(coalesce(experience_level, '')) like '%7 an%'
                or lower(coalesce(experience_level, '')) like '%8 an%'
                or lower(coalesce(experience_level, '')) like '%9 an%'
                or lower(coalesce(experience_level, '')) like '%10 an%'
                then 'senior_5_10'
            when lower(coalesce(experience_level, '')) like '%lead%'
                or lower(coalesce(experience_level, '')) like '%expert%'
                or lower(coalesce(experience_level, '')) like '%principal%'
                or lower(coalesce(experience_level, '')) like '%director%'
                then 'lead_10_plus'
            else 'not_specified'
        end as experience_level,

        -- Education level normalise
        case
            when lower(coalesce(education_level, '')) like '%bac+3%'
                or lower(coalesce(education_level, '')) like '%licence%'
                or lower(coalesce(education_level, '')) like '%bachelor%'
                then 'bac_3'
            when lower(coalesce(education_level, '')) like '%bac+5%'
                or lower(coalesce(education_level, '')) like '%master%'
                or lower(coalesce(education_level, '')) like '%ingénieur%'
                or lower(coalesce(education_level, '')) like '%ingenieur%'
                then 'bac_5'
            when lower(coalesce(education_level, '')) like '%bac+8%'
                or lower(coalesce(education_level, '')) like '%doctorat%'
                or lower(coalesce(education_level, '')) like '%phd%'
                then 'bac_8'
            else 'not_specified'
        end as education_level,

        -- Salaire normalise en annuel
        case
            when salary_period = 'monthly' then salary_min * 12
            when salary_period = 'hourly' then salary_min * 1820  -- 35h * 52 semaines
            else salary_min
        end as salary_min,
        case
            when salary_period = 'monthly' then salary_max * 12
            when salary_period = 'hourly' then salary_max * 1820
            else salary_max
        end as salary_max,

        date_posted,
        date_scraped,
        job_url,
        raw_description
    from jobs
)

select * from final
