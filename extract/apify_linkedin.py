"""Extracteur API Apify pour les offres LinkedIn."""

import logging
from datetime import date

import pandas as pd
import requests

from extract.config import APIFY_API_TOKEN

logger = logging.getLogger(__name__)

APIFY_URL = "https://api.apify.com/v2/acts/crawlworks~linkedin-job-scraper/run-sync-get-dataset-items"
TIMEOUT_SECONDS = 300


def extract() -> pd.DataFrame:
    """Lance le scraper LinkedIn via Apify. UNE seule requete avec query='data'."""
    logger.info("[LinkedIn] Lancement du scraper Apify (peut prendre quelques minutes)...")

    resp = requests.post(
        APIFY_URL,
        params={'token': APIFY_API_TOKEN},
        json={
            'query': 'data',
            'location': 'France',
            'publishedAt': 'past week',
        },
        timeout=TIMEOUT_SECONDS,
    )
    resp.raise_for_status()
    items = resp.json()

    logger.info(f"[LinkedIn] {len(items)} offres recuperees depuis Apify.")

    rows = []
    for item in items:
        row = {
            'source': 'linkedin',
            'raw_title': item.get('title', ''),
            'company_name': item.get('companyName', ''),
            'location_city': item.get('location', ''),
            'raw_description': item.get('description', ''),
            'contract_type': item.get('contractType', ''),
            'experience_level': item.get('experienceLevel', ''),
            'education_level': None,
            'salary_min': item.get('salaryMin') or item.get('salary', {}).get('min'),
            'salary_max': item.get('salaryMax') or item.get('salary', {}).get('max'),
            'salary_period': item.get('salaryPeriod', None),
            'remote_policy': _map_remote(item),
            'date_posted': item.get('publishedAt', ''),
            'date_scraped': date.today().isoformat(),
            'job_url': item.get('jobUrl') or item.get('url', ''),
        }
        rows.append(row)

    df = pd.DataFrame(rows)
    logger.info(f"[LinkedIn] Total : {len(df)} offres extraites.")
    return df


def _map_remote(item: dict) -> str:
    """Mappe le champ remote de LinkedIn vers notre schema."""
    work_type = (item.get('workType') or item.get('workplaceType') or '').lower()
    title = (item.get('title') or '').lower()

    if 'remote' in work_type or 'remote' in title:
        return 'full_remote'
    if 'hybrid' in work_type or 'hybride' in title:
        return 'hybrid'
    if 'on-site' in work_type or 'on site' in work_type:
        return 'on_site'
    return 'not_specified'
