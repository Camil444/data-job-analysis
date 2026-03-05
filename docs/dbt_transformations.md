# Comment fonctionnent les transformations dbt

Ce document explique en detail le pipeline de transformation des donnees avec dbt, depuis les donnees brutes scrapees jusqu'au star schema final exploitable par le dashboard.

---

## Vue d'ensemble

```
raw.stg_france_travail ──┐
raw.stg_linkedin ────────┤    STAGING         INTERMEDIATE              MARTS
raw.stg_indeed ──────────┤    (views)          (views)                  (tables)
raw.stg_glassdoor ───────┘
        │                      │                   │                      │
        ▼                      ▼                   ▼                      ▼
   Donnees brutes     Nettoyage/typage      Union + Dedup +        Star Schema
   (1 table/source)   (1 view/source)       Normalisation         (fact + dims)
```

Le pipeline se decompose en **3 couches** (staging, intermediate, marts), chacune avec un role precis. Les staging et intermediate sont des **views** (pas de stockage physique), les marts sont des **tables** materialisees.

---

## Couche 1 : Staging (nettoyage)

**Fichiers** : `models/staging/stg_france_travail.sql`, `stg_linkedin.sql`, `stg_indeed.sql`, `stg_glassdoor.sql`

**Role** : Nettoyer et typer les donnees brutes de chaque source. Un model par source.

**Ce qui se passe** :
1. **Surrogate key** : Generation d'un ID unique par offre via `dbt_utils.generate_surrogate_key` a partir de `raw_title + company_name + date_posted + source`. Cela cree un hash MD5 qui sert d'identifiant stable.

2. **Nettoyage texte** : `trim(lower(...))` sur les champs textuels (titre, entreprise, ville) pour uniformiser les formats.

3. **Typage** : Cast des salaires en `numeric`, des dates en `date`.

4. **Dedup intra-source** : `row_number() over (partition by raw_title, company_name, date_posted order by loaded_at desc)` pour ne garder que la version la plus recente si la meme offre a ete scrapee plusieurs fois.

**Exemple concret** :
```
Avant:  "  DATA ANALYST H/F  " | "SOPRA STERIA" | "75 - PARIS"
Apres:  "data analyst h/f"     | "sopra steria"  | "75 - paris"
```

---

## Couche 2 : Intermediate (union, dedup, enrichissement)

### 2.1 Union (`int_jobs_unioned.sql`)

Empile les 4 sources staging en une seule table via `UNION ALL`. Toutes les sources partagent le meme schema de colonnes, donc l'union est directe.

### 2.2 Deduplication cross-source (`int_jobs_deduplicated.sql`)

**Probleme** : La meme offre peut apparaitre sur France Travail ET LinkedIn ET Indeed.

**Solution** :
1. On cree une **cle de dedup** : hash de `raw_title + company_name + location_city`
2. On definit une **priorite par source** : France Travail (1) > LinkedIn (2) > Indeed (3) > Glassdoor (4)
3. On garde uniquement la ligne la mieux classee par `row_number() over (partition by dedup_key order by source_priority, date_scraped desc)`

**Pourquoi cette priorite ?** France Travail est la source officielle (donnees structurees, fiable), LinkedIn a les meilleures descriptions, Indeed/Glassdoor sont des fallbacks.

### 2.3 Normalisation des titres (`int_jobs_normalized_titles.sql`)

**Probleme** : Les titres bruts sont tres varies ("data analyst h/f", "analyste donnees senior", "junior data engineer - cdi", etc.)

**Solution** : Matching par mots-cles via un seed `seed_title_keywords.csv` qui mappe ~70 keywords vers 10 titres normalises.

```
Keyword                    →  Titre normalise
"data analyst"             →  Data Analyst
"analyste donnees"         →  Data Analyst
"machine learning engineer"→  ML Engineer
"ingenieur ia"             →  AI Engineer
```

**Algorithme** :
1. `LEFT JOIN` entre chaque offre et tous les keywords qui matchent (`raw_title LIKE '%keyword%'`)
2. Si plusieurs keywords matchent, on garde le **plus long** (le plus specifique). Ex: "machine learning engineer" bat "engineer".
3. `row_number() over (partition by row_id order by keyword_length desc)` + `where rn = 1`

Les titres non matches sont identifies dans `int_unmatched_titles.sql` pour review manuelle.

### 2.4 Parsing des skills (`int_jobs_parsed_skills.sql`)

**Probleme** : Extraire les competences techniques depuis le texte libre des descriptions.

**Solution** : Cross join entre chaque offre et les 76 skills du referentiel (`seed_dim_skills.csv`), puis test de presence dans la description.

**Gestion des faux positifs** avec des regex specifiques :
- **R** : "r" est trop court, matcherait partout. On utilise un pattern qui cherche "R " (avec espace), "R language", "RStudio", etc.
- **SAS** : Eviter de matcher "mission", "brassage". Regex avec word boundaries.
- **Git** : Ne pas matcher "digital", "agite". Cherche "git" comme mot isole + "github", "gitlab".
- **Spark** : Ne pas matcher "sparked". Cherche "spark" comme mot isole + "apache spark", "pyspark".
- **Excel** : Ne pas matcher "excellent". Regex avec word boundaries.
- **Looker Studio** : Matche aussi "looker" seul (simplifie).

Pour les autres skills (Python, SQL, AWS, Docker...), un simple `LIKE '%nom_skill%'` suffit car ils sont assez specifiques.

**Resultat** : Une table `(job_id, skill_id)` avec toutes les paires offre-competence detectees.

---

## Couche 3 : Marts (star schema)

### 3.1 `dim_job_titles.sql` et `dim_skills.sql`

Simples copies des seeds. Les dimensions sont statiques et maintenues manuellement :
- **10 titres** repartis en 3 familles : analysis, engineering, ai_ml, management
- **76 skills** en 9 categories : langages, cloud, data_engineering, ml_ai, databases, data_viz_bi, big_data, devops, methodologies

### 3.2 `bridge_job_skills.sql`

Copie directe du parsing des skills. Table de liaison N:N entre `fact_jobs` et `dim_skills`.

### 3.3 `fact_jobs.sql` (le coeur du pipeline)

C'est le model le plus complexe. Il prend les offres dedupliquees+normalisees et produit la table de faits finale avec de nombreux enrichissements.

#### Etape 1 : Extraction du code departement

Les formats de localisation varient selon les sources :
- France Travail : `"75 - paris 9e"` ou `"31 - toulouse"`
- Indeed : `"toulouse (31)"`
- LinkedIn : `"toulouse, occitanie, france"`

On extrait le code departement avec des regex :
```sql
-- Format "75 - paris"
WHEN location_city ~ '^\d{2,3}\s*-' THEN regexp_replace(...)
-- Format "toulouse (31)"
WHEN location_city ~ '\(\d{2,3}\)' THEN regexp_replace(...)
```

#### Etape 2 : Nettoyage du nom de ville

On enleve les arrondissements ("9e arrondissement"), codes postaux, et artefacts de scraping.

#### Etape 3 : Matching geographique (4 niveaux de fallback)

C'est un systeme en cascade pour maximiser la couverture (~90%) :

1. **Par code departement** : Si on a extrait "75", on le matche directement avec `seed_departments.csv`
2. **Par nom de ville = prefecture** : Si "toulouse" correspond a la prefecture du departement 31
3. **Par nom de ville = commune** : Si "puteaux" est dans `seed_city_to_dept.csv` (121 communes non-prefectures)
4. **Par nom de region dans le texte** : Si "île-de-france" apparait dans la localisation, on matche via `LATERAL JOIN`

Chaque niveau n'est tente que si les precedents n'ont rien donne (conditions `AND c.parsed_dept_code IS NULL AND d_city.department_code IS NULL`).

**Resultat** : `location_city`, `location_department`, `location_department_code`, `location_region`

#### Etape 4 : Normalisation du secteur d'entreprise

Les secteurs bruts viennent surtout de France Travail et sont tres varies (anglais/francais, termes metier specifiques).

On utilise `seed_sector_mapping.csv` (138 patterns) pour normaliser vers 17 categories generiques :
```
"information technology" → Technologie
"conseil en management"  → Conseil
"banque de detail"       → Banque
```

Le matching se fait par `LATERAL JOIN` avec `LIKE '%pattern%'` sur le secteur brut.

#### Etape 5 : Enrichissement depuis les descriptions

Trois champs sont enrichis en parsant le texte des descriptions avec des regex PostgreSQL (POSIX) :

**Remote policy** :
```sql
WHEN desc_lc LIKE '%full remote%' OR desc_lc LIKE '%100% teletravail%' → 'full_remote'
WHEN desc_lc LIKE '%hybride%' OR desc_lc LIKE '%2 jours%teletravail%' → 'hybrid'
WHEN desc_lc LIKE '%presentiel%' OR desc_lc LIKE '%pas de teletravail%' → 'on_site'
```

**Experience level** (seniorite) :
- D'abord depuis le champ `experience_level` fourni par la source
- Sinon depuis la description : patterns FR ("junior", "confirme", "senior", "lead") et EN ("entry level", "mid-level")
- Sinon deduction depuis les annees mentionnees
- Valeurs : `junior`, `mid`, `senior`, `lead`, `not_specified`

**Experience years** (tranche d'annees) :
- Meme logique mais produit des tranches : `0_2`, `2_5`, `5_10`, `10_plus`, `not_specified`
- Patterns FR : "3 ans d'experience", "5 a 10 ans", "moins de 2 ans"
- Patterns EN : "3+ years", "5-10 years experience"

**Education level** :
- D'abord depuis le champ source, sinon depuis la description
- Patterns : "bac+5", "master", "ingenieur", "PhD", "licence"
- Valeurs : `bac_3`, `bac_5`, `bac_8`, `not_specified`

#### Etape 6 : Normalisation du salaire

Les salaires arrivent sous differentes periodes (annuel, mensuel, horaire) :
```sql
WHEN salary_period = 'monthly' THEN coalesce(salary_max, salary_min) * 12
WHEN salary_period = 'hourly'  THEN coalesce(salary_max, salary_min) * 1820
ELSE coalesce(salary_max, salary_min)
```

On garde une seule valeur (`salary`) en priorisant `salary_max` quand disponible.

---

## Seeds (referentiels)

| Seed | Contenu | Usage |
|------|---------|-------|
| `seed_dim_job_titles.csv` | 10 titres normalises + famille | Dimension titres |
| `seed_dim_skills.csv` | 76 competences + categorie | Dimension skills |
| `seed_title_keywords.csv` | ~70 keywords → titre | Normalisation titres |
| `seed_departments.csv` | 94 departements FR + region + prefecture | Normalisation lieux |
| `seed_city_to_dept.csv` | 121 communes → code departement | Fallback lieux |
| `seed_sector_mapping.csv` | 138 patterns → 17 secteurs | Normalisation secteurs |

---

## Tests dbt

Les tests valident l'integrite du star schema :

- **fact_jobs** : `job_id` unique + not_null, `source` not_null, `remote_policy` et `contract_type` dans les valeurs acceptees, `experience_level` et `experience_years` dans les valeurs acceptees, FK vers `dim_job_titles`
- **dim_job_titles** : `title_id` unique + not_null
- **dim_skills** : `skill_id` unique + not_null
- **bridge_job_skills** : `job_id` not_null + FK vers fact_jobs, `skill_id` not_null + FK vers dim_skills

---

## DAG (graphe de dependances)

```
seed_departments ────────────────────────────────┐
seed_city_to_dept ───────────────────────────────┤
seed_sector_mapping ─────────────────────────────┤
                                                  ▼
raw.stg_france_travail → stg_france_travail ──┐
raw.stg_linkedin       → stg_linkedin ────────┤
raw.stg_indeed         → stg_indeed ──────────┤→ int_jobs_unioned → int_jobs_deduplicated ─┐
raw.stg_glassdoor      → stg_glassdoor ───────┘                            │                │
                                                                            │                │
seed_title_keywords ─────────────────────────────────→ int_jobs_normalized_titles ──→ fact_jobs
seed_dim_skills ─────────────────────→ int_jobs_parsed_skills ──→ bridge_job_skills
seed_dim_job_titles ─────────────────────────────────────────────→ dim_job_titles
seed_dim_skills ─────────────────────────────────────────────────→ dim_skills
```
