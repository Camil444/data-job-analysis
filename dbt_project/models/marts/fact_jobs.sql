-- Table de faits principale : 1 ligne = 1 offre d'emploi dedupliquee et enrichie

with jobs as (
    select * from {{ ref('int_jobs_normalized_titles') }}
),

departments as (
    select
        department_code,
        department_name,
        region_name,
        lower(main_city) as main_city
    from {{ ref('seed_departments') }}
),

city_dept as (
    select lower(city_name) as city_name, department_code::text as department_code
    from {{ ref('seed_city_to_dept') }}
),

sector_map as (
    select lower(raw_pattern) as raw_pattern, normalized_sector
    from {{ ref('seed_sector_mapping') }}
),

-- Etape 1 : extraire le code departement depuis location_city (formats varies)
with_dept_code as (
    select
        j.*,
        case
            -- Format France Travail : "75 - paris 9e" ou "31 - toulouse"
            when j.location_city ~ '^\d{2,3}\s*-'
            then trim(regexp_replace(j.location_city, '^(\d{2,3})\s*-.*', '\1'))
            -- Format Indeed : "toulouse (31)" ou "paris (75)"
            when j.location_city ~ '\(\d{2,3}\)'
            then trim(regexp_replace(j.location_city, '.*\((\d{2,3})\).*', '\1'))
            else null
        end as parsed_dept_code,
        -- Extraire le nom de ville brut
        case
            -- Format FT : "75 - paris 9e"
            when j.location_city ~ '^\d{2,3}\s*-'
            then trim(regexp_replace(j.location_city, '^\d{2,3}\s*-\s*', ''))
            -- Format LinkedIn/Indeed : "toulouse, occitanie, france" ou "paris, île-de-france, france"
            when j.location_city like '%,%'
            then trim(split_part(j.location_city, ',', 1))
            else trim(j.location_city)
        end as parsed_city_raw
    from jobs j
),

-- Etape 2 : nettoyer le nom de ville (enlever arrondissements, codes postaux)
with_clean_city as (
    select
        *,
        -- Nettoyer : enlever "9e arrondissement", "1er", chiffres isolés, etc.
        trim(regexp_replace(
            regexp_replace(parsed_city_raw, '\d+(e|er|ème)\s*(arrondissement)?', '', 'gi'),
            '\s+', ' ', 'g'
        )) as clean_city_name
    from with_dept_code
),

-- Etape 3 : matcher avec la table departements
-- D'abord par code dept parse, sinon par nom de ville, sinon par region dans le texte
with_location as (
    select
        c.*,
        coalesce(c.parsed_dept_code, d_city.department_code::text, cd.department_code, d_region.department_code::text) as dept_code,
        coalesce(d_code.department_name, d_city.department_name, d_cd.department_name, d_region.department_name) as dept_name,
        coalesce(d_code.region_name, d_city.region_name, d_cd.region_name, d_region.region_name) as region,
        case
            when c.clean_city_name is not null and c.clean_city_name != ''
            then initcap(regexp_replace(c.clean_city_name, '\s+$', ''))
            when d_code.main_city is not null
            then initcap(d_code.main_city)
            else null
        end as city_name
    from with_clean_city c
    left join departments d_code
        on c.parsed_dept_code = d_code.department_code::text
    left join departments d_city
        on lower(c.clean_city_name) = d_city.main_city
        and c.parsed_dept_code is null
    -- Fallback : lookup dans la table city_to_dept pour les communes non-prefectures
    left join city_dept cd
        on lower(c.clean_city_name) = cd.city_name
        and c.parsed_dept_code is null
        and d_city.department_code is null
    left join departments d_cd
        on cd.department_code = d_cd.department_code::text
    -- Fallback : matcher la region dans location_city (ex: "pantin, île-de-france, france")
    left join lateral (
        select d.department_code, d.department_name, d.region_name
        from departments d
        where c.parsed_dept_code is null
            and lower(c.clean_city_name) != coalesce(d_city.main_city, '')
            and lower(c.location_city) like '%' || lower(d.region_name) || '%'
        limit 1
    ) d_region on c.parsed_dept_code is null and d_city.department_code is null
),

-- Etape 4 : normaliser le secteur
with_sector as (
    select
        l.*,
        sm.normalized_sector
    from with_location l
    left join lateral (
        select s.normalized_sector
        from sector_map s
        where lower(coalesce(l.company_sector, '')) like '%' || s.raw_pattern || '%'
        limit 1
    ) sm on true
),

-- Description en lowercase pour parsing experience/education
desc_lower as (
    select
        *,
        lower(coalesce(raw_description, '')) as desc_lc,
        lower(coalesce(experience_level, '')) as exp_lc,
        lower(coalesce(education_level, '')) as edu_lc
    from with_sector
),

final as (
    select
        row_id as job_id,
        source,
        raw_title,
        normalized_title_id,
        company_name,
        normalized_sector as company_sector,
        city_name as location_city,
        dept_name as location_department,
        dept_code::int as location_department_code,
        region as location_region,

        -- Remote policy : champ + description
        case
            when remote_policy in ('full_remote')
                or desc_lc like '%full remote%'
                or desc_lc like '%100%% télétravail%'
                or desc_lc like '%100%% remote%'
                or desc_lc like '%fully remote%'
                or desc_lc like '%télétravail total%'
                then 'full_remote'
            when remote_policy in ('hybrid')
                or desc_lc like '%hybride%'
                or desc_lc like '%hybrid%'
                or desc_lc like '%télétravail partiel%'
                or desc_lc like '%2 jours%télétravail%'
                or desc_lc like '%3 jours%télétravail%'
                or desc_lc like '%télétravail%2 jour%'
                or desc_lc like '%télétravail%3 jour%'
                then 'hybrid'
            when remote_policy in ('on_site')
                or desc_lc like '%présentiel%'
                or desc_lc like '%sur site%'
                or desc_lc like '%on-site%'
                or desc_lc like '%pas de télétravail%'
                then 'on_site'
            else 'not_specified'
        end as remote_policy,

        -- Contract type
        case
            when lower(coalesce(contract_type, '')) like '%cdi%' then 'cdi'
            when lower(coalesce(contract_type, '')) like '%cdd%' then 'cdd'
            when lower(coalesce(contract_type, '')) like '%alternance%'
                or lower(coalesce(contract_type, '')) like '%apprenti%'
                or desc_lc like '%alternance%'
                or desc_lc like '%contrat d''apprentissage%'
                then 'alternance'
            when lower(coalesce(contract_type, '')) like '%stage%'
                or lower(coalesce(contract_type, '')) like '%intern%'
                or desc_lc like '%stage de%'
                or desc_lc like '%stagiaire%'
                then 'stage'
            when lower(coalesce(contract_type, '')) like '%freelance%'
                or lower(coalesce(contract_type, '')) like '%indépendant%' then 'freelance'
            when lower(coalesce(contract_type, '')) like '%intérim%'
                or lower(coalesce(contract_type, '')) like '%interim%' then 'interim'
            else 'not_specified'
        end as contract_type,

        -- Experience level : label de seniorite (junior / mid / senior / lead)
        case
            -- D'abord depuis le champ experience_level
            when exp_lc like '%débutant%' or exp_lc like '%junior%'
                then 'junior'
            when exp_lc like '%confirmé%'
                then 'mid'
            when exp_lc like '%senior%' or exp_lc like '%expérimenté%'
                then 'senior'
            when exp_lc like '%lead%' or exp_lc like '%expert%'
                or exp_lc like '%principal%' or exp_lc like '%director%'
                then 'lead'
            -- Depuis la description
            when desc_lc ~ '(débutant|junior|entry.level|entry level|graduate)'
                then 'junior'
            when desc_lc ~ '(confirmé|intermédiaire|mid.level)'
                then 'mid'
            when desc_lc ~ '(senior|expérimenté|sénior)'
                then 'senior'
            when desc_lc ~ '(lead|principal|directeur|director|staff|head of)'
                then 'lead'
            -- Deduction depuis les annees d'experience dans le champ
            when exp_lc like '%0 %' or exp_lc like '%1 an%' or exp_lc like '%2 an%'
                then 'junior'
            when exp_lc like '%3 an%' or exp_lc like '%4 an%' or exp_lc like '%5 an%'
                then 'mid'
            when exp_lc like '%6 an%' or exp_lc like '%7 an%' or exp_lc like '%8 an%'
                or exp_lc like '%9 an%' or exp_lc like '%10 an%'
                then 'senior'
            -- Deduction depuis les annees dans la description
            when desc_lc ~ '(0\s*(-|à)\s*2\s*an|1\s*(-|à)\s*2\s*an|moins de 2 an|0\s*-\s*2\s*year|1\s*-\s*2\s*year)'
                then 'junior'
            when desc_lc ~ '(2\s*(-|à)\s*5\s*an|3\s*(-|à)\s*5\s*an|3 ans? d.expérience|4 ans? d.expérience|5 ans? d.expérience|2\s*-\s*5\s*year|3\s*-\s*5\s*year|3\+?\s*year|4\+?\s*year|5\+?\s*year)'
                then 'mid'
            when desc_lc ~ '(5\s*(-|à)\s*10\s*an|6 ans? d.expérience|7 ans? d.expérience|8 ans? d.expérience|9 ans? d.expérience|10 ans? d.expérience|5\+?\s*ans?|5\s*-\s*10\s*year|6\+?\s*year|7\+?\s*year|8\+?\s*year)'
                then 'senior'
            when desc_lc ~ '(10\+?\s*ans?|\+\s*de\s*10\s*an|plus de 10|15 ans?|20 ans?|10\+?\s*year|15\+?\s*year)'
                then 'lead'
            else 'not_specified'
        end as experience_level,

        -- Experience years : tranche en annees (0_2 / 2_5 / 5_10 / 10_plus)
        case
            -- D'abord depuis le champ experience_level
            when exp_lc like '%0 %' or exp_lc like '%1 an%' or exp_lc like '%2 an%'
                or exp_lc like '%débutant%' or exp_lc like '%junior%'
                then '0_2'
            when exp_lc like '%3 an%' or exp_lc like '%4 an%' or exp_lc like '%5 an%'
                or exp_lc like '%confirmé%'
                then '2_5'
            when exp_lc like '%6 an%' or exp_lc like '%7 an%' or exp_lc like '%8 an%'
                or exp_lc like '%9 an%' or exp_lc like '%10 an%'
                or exp_lc like '%senior%'
                then '5_10'
            when exp_lc like '%lead%' or exp_lc like '%expert%'
                or exp_lc like '%principal%' or exp_lc like '%director%'
                then '10_plus'
            -- Depuis la description : annees FR
            when desc_lc ~ '(0\s*(-|à)\s*2\s*an|1\s*(-|à)\s*2\s*an|moins de 2 an|débutant|junior)'
                then '0_2'
            when desc_lc ~ '(2\s*(-|à)\s*5\s*an|3\s*(-|à)\s*5\s*an|3 ans? d.expérience|4 ans? d.expérience|5 ans? d.expérience|confirmé|intermédiaire)'
                then '2_5'
            when desc_lc ~ '(5\s*(-|à)\s*10\s*an|6 ans? d.expérience|7 ans? d.expérience|8 ans? d.expérience|9 ans? d.expérience|10 ans? d.expérience|5\+?\s*ans?|senior|expérimenté)'
                then '5_10'
            when desc_lc ~ '(10\+?\s*ans?|\+\s*de\s*10\s*an|plus de 10|15 ans?|20 ans?|lead|principal|directeur)'
                then '10_plus'
            -- Depuis la description : annees EN
            when desc_lc ~ '(0\s*-\s*2\s*year|1\s*-\s*2\s*year|entry level|graduate)'
                then '0_2'
            when desc_lc ~ '(2\s*-\s*5\s*year|3\s*-\s*5\s*year|3\+?\s*year|4\+?\s*year|5\+?\s*year|mid.level)'
                then '2_5'
            when desc_lc ~ '(5\s*-\s*10\s*year|6\+?\s*year|7\+?\s*year|8\+?\s*year)'
                then '5_10'
            when desc_lc ~ '(10\+?\s*year|15\+?\s*year)'
                then '10_plus'
            else 'not_specified'
        end as experience_years,

        -- Education level : champ education + parsing description
        case
            when edu_lc like '%bac+3%' or edu_lc like '%licence%' or edu_lc like '%bachelor%'
                then 'bac_3'
            when edu_lc like '%bac+5%' or edu_lc like '%master%'
                or edu_lc like '%ingénieur%' or edu_lc like '%ingenieur%'
                then 'bac_5'
            when edu_lc like '%bac+8%' or edu_lc like '%doctorat%' or edu_lc like '%phd%'
                then 'bac_8'
            -- Depuis la description
            when desc_lc ~ '(bac\s*\+\s*8|doctorat|phd|ph\.d)'
                then 'bac_8'
            when desc_lc ~ '(bac\s*\+\s*5|master|ingénieur|ingenieur|école d.ingénieur|grande école|msc|m\.sc|diplôme d.ingénieur|bac 5)'
                then 'bac_5'
            when desc_lc ~ '(bac\s*\+\s*3|licence|bachelor|bac 3|but |bac\s*\+\s*2|bts|dut)'
                then 'bac_3'
            else 'not_specified'
        end as education_level,

        -- Salaire : garder uniquement le max, normalise en annuel
        case
            when salary_period = 'monthly' then coalesce(salary_max, salary_min) * 12
            when salary_period = 'hourly' then coalesce(salary_max, salary_min) * 1820
            else coalesce(salary_max, salary_min)
        end as salary,

        date_posted,
        date_scraped,
        job_url
    from desc_lower
)

select * from final
