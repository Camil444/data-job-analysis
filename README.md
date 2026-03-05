# Data Job Analysis

**Analyse du marche de l'emploi data en France**

Pipeline de donnees complet qui collecte, transforme et analyse les offres d'emploi du secteur data en France. Le projet scrape automatiquement 3 sources chaque jour, normalise les donnees via dbt et les expose dans un dashboard Next.js interactif.

![GitHub Actions](https://github.com/Camil444/data-job-analysis/actions/workflows/weekly_pipeline.yml/badge.svg)

---

## Architecture

```
Sources                    Extract (Python)         Load (Neon)            Transform (dbt)           Viz
+-----------------+       +----------------+       +-------------+       +------------------+       +------------+
| France Travail  |------>|                |       |             |       |                  |       |            |
| LinkedIn(JobSpy)|------>| extract/*.py   |------>| raw.stg_*   |------>| staging          |       | Next.js    |
| Indeed  (JobSpy)|------>|                |       |             |       | intermediate     |------>| Dashboard  |
+-----------------+       +----------------+       +-------------+       | marts (star)     |       +------------+
                                                                         +------------------+
```

## Stack technique

| Composant       | Technologie                          |
|-----------------|--------------------------------------|
| Extraction      | Python 3.11+, Requests, python-jobspy |
| Transformation  | dbt-core + dbt-postgres              |
| Base de donnees | Neon PostgreSQL (serverless)          |
| Orchestration   | GitHub Actions (cron quotidien)      |
| Visualisation   | Next.js, Recharts                    |

## Sources de donnees

| Source         | Acces                | Volume estime     | Mots-cles       |
|----------------|----------------------|-------------------|-----------------|
| France Travail | API officielle OAuth2 | ~500/semaine      | 10 keywords data |
| LinkedIn       | python-jobspy        | ~300-500/keyword  | 10 keywords data |
| Indeed         | python-jobspy        | ~20-50/keyword    | 10 keywords data |

## Schema de donnees (Star Schema)

```
                    +------------------+
                    |  dim_job_titles  |
                    |  (10 postes)     |
                    +--------+---------+
                             |
+------------------+         |         +------------------+
|   dim_skills     |---------+---------+    fact_jobs     |
|  (76 skills)     |  bridge_job_skills |  (offres uniques)|
+------------------+                   +------------------+
```

### fact_jobs (table de faits)

| Colonne | Description |
|---------|-------------|
| `job_id` | Cle surrogate (hash MD5) |
| `source` | france_travail, linkedin, indeed, glassdoor |
| `raw_title` | Titre brut de l'offre |
| `normalized_title_id` | FK vers dim_job_titles |
| `company_name` | Nom de l'entreprise |
| `company_sector` | Secteur normalise (17 categories) |
| `location_city` | Ville |
| `location_department` | Departement |
| `location_department_code` | Code departement (int) |
| `location_region` | Region |
| `remote_policy` | full_remote, hybrid, on_site, not_specified |
| `contract_type` | cdi, cdd, alternance, stage, freelance, interim |
| `experience_level` | junior, mid, senior, lead, not_specified |
| `experience_years` | 0_2, 2_5, 5_10, 10_plus, not_specified |
| `education_level` | bac_3, bac_5, bac_8, not_specified |
| `salary` | Salaire annuel brut (normalise) |
| `date_posted` | Date de publication |
| `job_url` | URL de l'offre |

### Dimensions

- **dim_job_titles** : 10 titres normalises repartis en familles (analysis, engineering, ai_ml, management)
- **dim_skills** : 76 competences techniques en 9 categories (langages, cloud, ML/AI, devops, databases, data_viz_bi, big_data, data_engineering, methodologies)
- **bridge_job_skills** : Relation N:N entre offres et competences detectees par parsing des descriptions

## Dashboard

Dashboard Next.js avec 5 pages :

- **Vue Globale** : treemap metiers, top skills, repartition contrats/regions/remote/sources, salaires par metier
- **Data Analyst** : focus skills, outils BI/viz, salaire vs experience, heatmap skills x experience
- **Data Engineer** : cloud wars (AWS/GCP/Azure), orchestrateurs, skills x cloud provider
- **DS / ML / AI** : frameworks ML, GenAI vs ML classique, sous-profils DS/ML/AI
- **Salaires** : distribution par metier, salaire vs nb skills, impact education/experience/remote

Filtres globaux : metier, contrat, remote, experience, source, region.

## Prerequis

- Python 3.11+
- Compte [Neon](https://neon.tech/) (PostgreSQL serverless)
- Identifiants API [France Travail](https://francetravail.io/) (OAuth2)

## Installation

```bash
git clone https://github.com/Camil444/data-job-analysis.git
cd data-job-analysis

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Remplir les valeurs dans .env
```

### Template `.env`

```
FT_CLIENT_ID=votre_client_id_france_travail
FT_CLIENT_SECRET=votre_client_secret_france_travail
NEON_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

## Utilisation

### Lancement manuel

```bash
# 1. Extraction des offres (3 sources)
python extract/run_all.py

# 2. Transformations dbt
cd dbt_project
dbt deps
dbt seed
dbt run
dbt test
```

### Lancement automatique

Le pipeline s'execute automatiquement chaque jour a 6h UTC via GitHub Actions.
Il est aussi possible de le lancer manuellement depuis l'onglet Actions du repo.

### Dashboard

```bash
cd dashboard
npm install
npm run dev
# Ouvrir http://localhost:3000
```

## Structure du projet

```
data-job-analysis/
|-- .env                          # Variables d'environnement (non versionne)
|-- .gitignore
|-- requirements.txt
|-- README.md
|
|-- extract/
|   |-- __init__.py               # Package Python
|   |-- config.py                 # Configuration centrale + parsing NEON_DATABASE_URL
|   |-- run_all.py                # Orchestrateur d'extraction
|   |-- france_travail.py         # Extracteur API France Travail (OAuth2)
|   |-- jobspy_scraper.py         # Extracteur python-jobspy (LinkedIn + Indeed)
|   |-- load_to_db.py             # Chargement dans les tables staging Neon (avec dedup)
|
|-- dbt_project/
|   |-- dbt_project.yml
|   |-- profiles.yml              # Connexion Neon via env vars
|   |-- packages.yml              # dbt-utils
|   |-- seeds/                    # Referentiels (skills, titres, departements, secteurs)
|   |-- models/
|   |   |-- staging/              # Nettoyage des donnees brutes (1 view/source)
|   |   |-- intermediate/         # Union, dedup, normalisation titres, parsing skills
|   |   |-- marts/                # Star schema (fact_jobs, dim_*, bridge_*)
|   |   |-- exports/              # Vues d'export (titres non matches)
|   |-- tests/                    # Tests custom
|
|-- dashboard/                    # Next.js app (gitignore)
|   |-- app/                      # Pages et API routes
|   |-- components/               # Composants React reutilisables
|   |-- lib/                      # DB connection, filtres, couleurs
|
|-- docs/
|   |-- dbt_transformations.md    # Documentation detaillee des transformations dbt
|
|-- .github/workflows/
    |-- weekly_pipeline.yml       # GitHub Actions cron quotidien
```

## Documentation

- [Transformations dbt en detail](docs/dbt_transformations.md) : Explication complete du pipeline de transformation (staging, intermediate, marts, seeds, tests)

## Auteur

**Camil** — Data Analyst / Data Engineer

---

*Projet realise dans le cadre d'une analyse du marche de l'emploi data en France.*
