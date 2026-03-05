# Data Job Analysis

**Analyse du marche de l'emploi data en France**

Pipeline de donnees complet qui collecte, transforme et analyse les offres d'emploi du secteur data en France. Le projet scrape automatiquement 3 sources chaque semaine, normalise les donnees via dbt et les prepare pour un dashboard Power BI.

![GitHub Actions](https://github.com/Camil444/data-job-analysis/actions/workflows/weekly_pipeline.yml/badge.svg)

---

## Architecture

```
Sources                    Extract (Python)         Load (Neon)            Transform (dbt)           Viz
+-----------------+       +----------------+       +-------------+       +------------------+       +-----------+
| France Travail  |------>|                |       |             |       |                  |       |           |
| LinkedIn (Apify)|------>| extract/*.py   |------>| raw.stg_*   |------>| staging          |       | Power BI  |
| Indeed+Glassdoor|------>|                |       |             |       | intermediate     |------>|           |
+-----------------+       +----------------+       +-------------+       | marts (star)     |       +-----------+
                                                                         +------------------+
```

## Stack technique

| Composant       | Technologie                          |
|-----------------|--------------------------------------|
| Extraction      | Python 3.11+, Requests, python-jobspy |
| Transformation  | dbt-core + dbt-postgres              |
| Base de donnees | Neon PostgreSQL (serverless)          |
| Orchestration   | GitHub Actions (cron hebdomadaire)    |
| Visualisation   | Power BI                             |

## Sources de donnees

| Source         | Acces               | Volume estime      | Mots-cles       |
|----------------|---------------------|--------------------|-----------------|
| France Travail | API officielle OAuth2 | ~500-2000/semaine | 10 keywords data |
| LinkedIn       | Apify (scraper)      | ~100-500/semaine  | 1 keyword "data" |
| Indeed + Glassdoor | python-jobspy    | ~200-1000/semaine | 10 keywords data |

## Schema de donnees (Star Schema)

```
                    +------------------+
                    |  dim_job_titles  |
                    |  (10 postes)     |
                    +--------+---------+
                             |
+------------------+         |         +------------------+
|   dim_skills     |---------+---------+    fact_jobs     |
|  (77 skills)     |  bridge_job_skills |  (offres uniques)|
+------------------+                   +------------------+
```

- **fact_jobs** : 1 ligne = 1 offre dedupliquee (source, titre, entreprise, lieu, salaire, remote, contrat, experience...)
- **dim_job_titles** : 10 titres normalises (Data Analyst, Data Engineer, Data Scientist...)
- **dim_skills** : 77 competences en 9 categories (langages, cloud, ML/AI, devops...)
- **bridge_job_skills** : relation N:N entre offres et competences detectees

## Prerequis

- Python 3.11+
- Compte [Neon](https://neon.tech/) (PostgreSQL serverless)
- Token API [Apify](https://apify.com/) (scraper LinkedIn)
- Identifiants API [France Travail](https://francetravail.io/) (OAuth2)

## Installation

```bash
# Cloner le repo
git clone https://github.com/Camil444/data-job-analysis.git
cd data-job-analysis

# Creer un environnement virtuel
python -m venv venv
source venv/bin/activate  # macOS/Linux

# Installer les dependances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Remplir les valeurs dans .env
```

### Template `.env`

```
APIFY_API_TOKEN=votre_token_apify
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
dbt deps        # installer les packages
dbt seed        # charger les referentiels
dbt run         # lancer les transformations
dbt test        # valider les donnees
```

### Lancement automatique

Le pipeline s'execute automatiquement chaque lundi a 6h UTC via GitHub Actions.
Il est aussi possible de le lancer manuellement depuis l'onglet Actions du repo.

## Structure du projet

```
data-job-analysis/
|-- .env                          # Variables d'environnement (non versionne)
|-- .gitignore
|-- requirements.txt
|-- CLAUDE.md                     # Memoire projet pour Claude Code
|-- README.md
|
|-- extract/
|   |-- config.py                 # Configuration centrale + parsing NEON_DATABASE_URL
|   |-- run_all.py                # Orchestrateur d'extraction
|   |-- france_travail.py         # Extracteur API France Travail
|   |-- apify_linkedin.py         # Extracteur API Apify (LinkedIn)
|   |-- jobspy_scraper.py         # Extracteur python-jobspy (Indeed + Glassdoor)
|   |-- load_to_db.py             # Chargement dans les tables staging Neon
|
|-- dbt_project/
|   |-- dbt_project.yml
|   |-- profiles.yml              # Connexion Neon via env vars
|   |-- packages.yml              # dbt-utils
|   |-- seeds/                    # Referentiels (skills, titres, keywords)
|   |-- models/
|   |   |-- staging/              # Nettoyage des donnees brutes
|   |   |-- intermediate/         # Union, dedup, normalisation, parsing skills
|   |   |-- marts/                # Star schema (fact_jobs, dim_*, bridge_*)
|   |   |-- exports/              # Vues d'export (titres non matches)
|   |-- tests/                    # Tests custom
|
|-- .github/workflows/
    |-- weekly_pipeline.yml       # GitHub Actions cron hebdomadaire
```

## Ameliorations futures

- Dashboard Streamlit ou Next.js en complement de Power BI
- NLP avance pour le parsing des skills (spaCy / transformers)
- Ajout de sources : Welcome to the Jungle, WTTJ, Talent.io
- Historique des tendances (evolution des skills demandes par mois)
- Geocodage des villes pour une carte interactive
- Enrichissement automatique des titres non matches via LLM
- Alertes email sur les nouvelles offres matchant un profil

## Auteur

**Camil** — Data Analyst / Data Engineer

---

*Projet realise dans le cadre d'une analyse du marche de l'emploi data en France.*
