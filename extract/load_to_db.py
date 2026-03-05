"""Chargement des donnees brutes dans les tables staging de Neon PostgreSQL."""

import logging
import pandas as pd
from sqlalchemy import create_engine, text

from extract.config import NEON_DATABASE_URL

logger = logging.getLogger(__name__)

# Schema SQL commun a toutes les tables staging
_STAGING_DDL = """
CREATE TABLE IF NOT EXISTS raw.stg_{source} (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50),
    raw_title VARCHAR(500),
    company_name VARCHAR(300),
    location_city VARCHAR(200),
    raw_description TEXT,
    contract_type VARCHAR(100),
    experience_level VARCHAR(100),
    education_level VARCHAR(100),
    salary_min NUMERIC,
    salary_max NUMERIC,
    salary_period VARCHAR(50),
    remote_policy VARCHAR(50),
    date_posted DATE,
    date_scraped DATE,
    job_url TEXT,
    loaded_at TIMESTAMP DEFAULT NOW()
);
"""

# Colonnes attendues dans les DataFrames
EXPECTED_COLUMNS = [
    'source', 'raw_title', 'company_name', 'location_city', 'raw_description',
    'contract_type', 'experience_level', 'education_level',
    'salary_min', 'salary_max', 'salary_period', 'remote_policy',
    'date_posted', 'date_scraped', 'job_url',
]


def _get_engine():
    """Cree un engine SQLAlchemy vers Neon avec SSL."""
    return create_engine(
        NEON_DATABASE_URL,
        connect_args={'sslmode': 'require'},
    )


def init_staging_tables(engine):
    """Cree le schema raw et les 4 tables staging si elles n'existent pas."""
    sources = ['france_travail', 'linkedin', 'indeed', 'glassdoor']
    with engine.connect() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS raw;"))
        for src in sources:
            conn.execute(text(_STAGING_DDL.format(source=src)))
        conn.commit()
    logger.info("Schema raw et tables staging initialisees.")


def load_dataframe(df: pd.DataFrame, source: str):
    """Charge un DataFrame dans la table staging correspondante.

    Args:
        df: DataFrame avec les colonnes du schema commun.
        source: Nom de la source (france_travail, linkedin, indeed, glassdoor).
    """
    if df is None or df.empty:
        logger.warning(f"[{source}] DataFrame vide, rien a charger.")
        return 0

    engine = _get_engine()
    init_staging_tables(engine)

    # S'assurer que toutes les colonnes attendues existent
    for col in EXPECTED_COLUMNS:
        if col not in df.columns:
            df[col] = None

    # Ne garder que les colonnes attendues
    df_to_load = df[EXPECTED_COLUMNS].copy()

    table_name = f"stg_{source}"
    rows = df_to_load.to_sql(
        name=table_name,
        con=engine,
        schema='raw',
        if_exists='append',
        index=False,
    )

    row_count = len(df_to_load)
    logger.info(f"[{source}] {row_count} lignes inserees dans raw.{table_name}.")
    engine.dispose()
    return row_count
