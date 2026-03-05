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
            -- SAS : eviter "mission", "brassage", etc.
            when s.skill_name = 'SAS' then (
                lower(j.raw_description) ~ '(?:^|[\s,;/(])sas(?:[\s,;/)]|$)|sas enterprise|sas studio|sas viya'
            )
            -- SSIS : eviter "mission", "professionnel"
            when s.skill_name = 'SSIS' then (
                lower(j.raw_description) ~ '(?:^|[\s,;/(])ssis(?:[\s,;/)]|$)|sql server integration'
            )
            -- Git : ne pas matcher "digital", "agité"
            when s.skill_name = 'Git' then (
                lower(j.raw_description) ~ '(?:^|[\s,;/(])git(?:[\s,;/)]|$)|github|gitlab|gitflow|gitops'
            )
            -- Spark : ne pas matcher "sparked", "sparkling"
            when s.skill_name = 'Spark' then (
                lower(j.raw_description) ~ '(?:^|[\s,;/(])spark(?:[\s,;/)]|$)|apache spark|pyspark'
            )
            -- Excel : ne pas matcher "excellent", "excellence"
            when s.skill_name = 'Excel' then (
                lower(j.raw_description) ~ '(?:^|[\s,;/(])excel(?:[\s,;/)]|$)|microsoft excel|ms excel'
            )
            -- Scala : ne pas matcher "scalable", "escalade"
            when s.skill_name = 'Scala' then (
                lower(j.raw_description) ~ '(?:^|[\s,;/(])scala(?:[\s,;/)]|$)|apache scala|langage scala'
            )
            -- Julia : eviter les prenoms
            when s.skill_name = 'Julia' then (
                lower(j.raw_description) ~ '(?:^|[\s,;/(])julia(?:[\s,;/)]|$)|julialang|langage julia'
            )
            -- Looker Studio : matcher aussi "looker" seul
            when s.skill_name = 'Looker Studio' then (
                lower(j.raw_description) like '%looker%'
            )
            -- Cas general : match simple insensible a la casse
            else lower(j.raw_description) like '%' || lower(s.skill_name) || '%'
        end
)

select distinct job_id, skill_id
from skill_matches
