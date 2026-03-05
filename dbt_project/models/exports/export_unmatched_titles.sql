-- Vue pour extraire les titres non matches (utile pour enrichir les seeds)

select
    raw_title,
    company_name,
    source,
    occurrences
from {{ ref('int_unmatched_titles') }}
order by occurrences desc
