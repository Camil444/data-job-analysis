-- Extraction des skills depuis raw_description avec gestion des faux positifs

with jobs as (
    select row_id, raw_description
    from {{ ref('int_jobs_deduplicated') }}
    where raw_description is not null
),

skills as (
    select skill_id, skill_name
    from {{ ref('seed_dim_skills') }}
),

-- Cross join pour tester chaque skill contre chaque job
-- Avec des patterns specifiques pour eviter les faux positifs
skill_matches as (
    select
        j.row_id as job_id,
        s.skill_id,
        s.skill_name
    from jobs j
    cross join skills s
    where
        case
            -- R : trop court, patterns specifiques
            when s.skill_name = 'R' then (
                lower(j.raw_description) similar to '%( r |[ (,;/]r[ ),;/]|r language|rstudio|r studio|langage r|logiciel r)%'
            )
            -- SAS : eviter faux positifs
            when s.skill_name = 'SAS' then (
                lower(j.raw_description) similar to '%( sas |[ (,;/]sas[ ),;/]|sas enterprise|sas studio)%'
            )
            -- Git : ne pas matcher "digital"
            when s.skill_name = 'Git' then (
                lower(j.raw_description) similar to '%( git |[ (,;/]git[ ),;/]|github|gitlab|gitflow)%'
            )
            -- Spark : ne pas matcher "sparked"
            when s.skill_name = 'Spark' then (
                lower(j.raw_description) similar to '%( spark |[ (,;/]spark[ ),;/]|apache spark|pyspark)%'
            )
            -- Excel : ne pas matcher "excellent"
            when s.skill_name = 'Excel' then (
                lower(j.raw_description) similar to '%( excel |[ (,;/]excel[ ),;/]|microsoft excel|ms excel)%'
            )
            -- Julia : eviter les prenoms
            when s.skill_name = 'Julia' then (
                lower(j.raw_description) similar to '%( julia |[ (,;/]julia[ ),;/]|julialang|langage julia)%'
            )
            -- Cas general : match simple insensible a la casse
            else lower(j.raw_description) like '%' || lower(s.skill_name) || '%'
        end
)

select distinct job_id, skill_id
from skill_matches
