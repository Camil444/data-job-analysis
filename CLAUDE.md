# CLAUDE.md — Data Job Analysis

## Resume du projet
Analyse du marche de l'emploi data en France. Pipeline complet : extraction (3 sources) -> transformation (dbt) -> stockage (Neon PostgreSQL) -> visualisation (Power BI).

## Stack technique
- Python 3.11+ (extraction)
- dbt-core + dbt-postgres (transformation)
- Neon PostgreSQL serverless (stockage)
- GitHub Actions (orchestration hebdo)
- Power BI (visualisation)

## Architecture du pipeline
1. EXTRACT : scripts Python dans `extract/` -> 3 sources (France Travail API, Apify LinkedIn, JobSpy Indeed+Glassdoor)
2. LOAD : donnees brutes -> schema `raw` dans Neon (tables stg_*)
3. TRANSFORM : dbt models staging -> intermediate -> marts -> star schema dans schema `analytics`
4. VISUALIZE : Power BI connecte a Neon (tables fact_jobs, dim_*, bridge_*)

## Commandes utiles
- `python extract/run_all.py` — Lancer l'extraction complete
- `cd dbt_project && dbt seed` — Charger les referentiels (skills, titres)
- `cd dbt_project && dbt run` — Lancer les transformations
- `cd dbt_project && dbt test` — Lancer les tests
- `cd dbt_project && dbt run --select staging` — Lancer uniquement les models staging
- `cd dbt_project && dbt run --select marts` — Lancer uniquement les marts

## Variables d'environnement (.env)
- APIFY_API_TOKEN — Token API Apify pour le scraper LinkedIn
- FT_CLIENT_ID — Client ID France Travail (OAuth2)
- FT_CLIENT_SECRET — Client Secret France Travail (OAuth2)
- NEON_DATABASE_URL — Connection string PostgreSQL Neon (parse automatiquement par config.py pour extraire host, user, password, dbname)

## Schema de donnees (star schema)
- `fact_jobs` — Table de faits : 1 ligne = 1 offre d'emploi dedupliquee
- `dim_job_titles` — Dimension : 10 titres normalises (Data Analyst, Data Engineer, etc.)
- `dim_skills` — Dimension : 77 competences techniques en 9 categories
- `bridge_job_skills` — Bridge table N:N entre jobs et skills
- `int_unmatched_titles` — Titres bruts non matches, a review manuellement

## Conventions de nommage
- Tables raw : `raw.stg_{source}` (france_travail, linkedin, indeed, glassdoor)
- Models dbt staging : `stg_{source}.sql`
- Models dbt intermediate : `int_jobs_{transformation}.sql`
- Models dbt marts : `fact_*`, `dim_*`, `bridge_*`
- Seeds : `seed_{nom}.csv`

## Regles metier importantes
- LinkedIn Apify : UNE SEULE requete avec query="data" (cout par resultat)
- France Travail + JobSpy : boucle sur 10 mots-cles data (gratuit)
- Deduplication cross-source : priorite france_travail > linkedin > indeed > glassdoor
- Normalisation titres : keyword matching partiel (ILIKE), plus long keyword prioritaire
- Parsing skills : attention aux faux positifs (R, Git, Excel, Spark, SAS) -> patterns regex specifiques
- Salaires : tout normaliser en annuel brut euros
- Scraping limite aux 7 derniers jours

## Fichiers cles a connaitre
- `extract/config.py` — Centralise toute la config et le parsing de NEON_DATABASE_URL
- `dbt_project/seeds/seed_title_keywords.csv` — Mapping mots-cles -> titres normalises (a enrichir avec les unmatched)
- `dbt_project/seeds/seed_dim_skills.csv` — Referentiel complet des 77 competences
- `dbt_project/models/intermediate/int_unmatched_titles.sql` — Titres non matches a review

## Points d'attention
- Ne jamais hardcoder ou logger les credentials
- Le .env existe deja, ne pas le modifier
- Chaque extracteur a son propre try/except (un echec ne bloque pas les autres)
- Les seeds sont versionnes dans Git (source of truth pour les referentiels)
- Le GitHub Actions workflow utilise les Secrets du repo (pas le .env)
