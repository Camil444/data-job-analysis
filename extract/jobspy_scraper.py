"""Extracteur python-jobspy pour Indeed, Glassdoor et LinkedIn."""

import logging
from datetime import date

import pandas as pd

from extract.config import DATA_KEYWORDS

logger = logging.getLogger(__name__)


def extract() -> pd.DataFrame:
    """Scrape Indeed, Glassdoor et LinkedIn via python-jobspy pour tous les mots-cles."""
    from jobspy import scrape_jobs

    all_dfs = []

    for keyword in DATA_KEYWORDS:
        try:
            logger.info(f"[JobSpy] Scraping '{keyword}'...")
            df = scrape_jobs(
                site_name=["indeed", "glassdoor", "linkedin"],
                search_term=keyword,
                location="France",
                results_wanted=100,
                hours_old=168,  # 7 jours
                country_indeed="France",
                linkedin_fetch_description=True,
            )
            if df is not None and not df.empty:
                all_dfs.append(df)
                logger.info(f"[JobSpy] '{keyword}' : {len(df)} offres trouvees.")
            else:
                logger.info(f"[JobSpy] '{keyword}' : aucun resultat.")
        except Exception as e:
            logger.error(f"[JobSpy] Erreur pour '{keyword}' : {e}")
            continue

    if not all_dfs:
        logger.warning("[JobSpy] Aucune offre recuperee.")
        return pd.DataFrame()

    raw_df = pd.concat(all_dfs, ignore_index=True)
    logger.info(f"[JobSpy] Total brut : {len(raw_df)} offres.")

    # Mapper vers le schema commun
    df = pd.DataFrame({
        'source': raw_df['site'].apply(lambda x: str(x).lower() if pd.notna(x) else 'indeed'),
        'raw_title': raw_df.get('title', pd.Series(dtype=str)),
        'company_name': raw_df.get('company', pd.Series(dtype=str)),
        'location_city': raw_df.get('location', pd.Series(dtype=str)),
        'raw_description': raw_df.get('description', pd.Series(dtype=str)),
        'contract_type': raw_df.get('job_type', pd.Series(dtype=str)),
        'experience_level': raw_df.get('job_level', pd.Series(dtype=str)),
        'education_level': None,
        'salary_min': raw_df.get('min_amount', pd.Series(dtype=float)),
        'salary_max': raw_df.get('max_amount', pd.Series(dtype=float)),
        'salary_period': raw_df.get('interval', pd.Series(dtype=str)),
        'remote_policy': raw_df.get('is_remote', pd.Series(dtype=bool)).apply(
            lambda x: 'full_remote' if x is True else 'not_specified'
        ),
        'date_posted': raw_df.get('date_posted', pd.Series(dtype=str)),
        'date_scraped': date.today().isoformat(),
        'job_url': raw_df.get('job_url', pd.Series(dtype=str)),
    })

    logger.info(f"[JobSpy] {len(df)} offres mappees au schema commun.")
    return df
