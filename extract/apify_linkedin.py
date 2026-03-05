"""Extracteur API Apify pour les offres LinkedIn."""

import logging
from datetime import date

import pandas as pd
import requests

from extract.config import APIFY_API_TOKEN

logger = logging.getLogger(__name__)

# Actor crawlworks~linkedin-job-scraper (gratuit, ~10 offres par run)
APIFY_URL = "https://api.apify.com/v2/acts/crawlworks~linkedin-job-scraper/run-sync-get-dataset-items"
TIMEOUT_SECONDS = 300


def extract(max_items: int = 3000) -> pd.DataFrame:
    """Lance le scraper LinkedIn via Apify. UNE seule requete avec query='data'."""
    logger.info(f"[LinkedIn] Lancement du scraper Apify (maxItems={max_items})...")

    resp = requests.post(
        APIFY_URL,
        params={'token': APIFY_API_TOKEN},
        json={
            'query': 'data',
            'location': 'France',
            'publishedAt': 'past week',
            'maxItems': max_items,
        },
        timeout=TIMEOUT_SECONDS,
    )
    # L'API retourne 201 quand le run est cree et les resultats sont inline
    if resp.status_code not in (200, 201):
        resp.raise_for_status()

    items = resp.json()
    logger.info(f"[LinkedIn] {len(items)} offres recuperees depuis Apify.")

    rows = []
    for item in items:
        # Parser le salaire si present (souvent "Not specified")
        salary_raw = item.get('salary', '')
        sal_min, sal_max = _parse_salary(salary_raw)

        row = {
            'source': 'linkedin',
            'raw_title': item.get('jobTitle', ''),
            'company_name': item.get('companyName', ''),
            'location_city': item.get('location', ''),
            'raw_description': item.get('jobDescription', ''),
            'contract_type': item.get('employmentType', ''),
            'experience_level': item.get('seniorityLevel', ''),
            'education_level': None,
            'salary_min': sal_min,
            'salary_max': sal_max,
            'salary_period': None,
            'remote_policy': _map_remote(item),
            'date_posted': item.get('postedDate', ''),
            'date_scraped': date.today().isoformat(),
            'job_url': item.get('jobUrl', ''),
        }
        rows.append(row)

    df = pd.DataFrame(rows)
    logger.info(f"[LinkedIn] Total : {len(df)} offres extraites.")
    return df


def _parse_salary(salary_raw) -> tuple:
    """Parse le champ salaire LinkedIn (souvent 'Not specified' ou un texte)."""
    if not salary_raw or salary_raw == 'Not specified':
        return None, None
    import re
    numbers = re.findall(r'[\d]+(?:[.,]\d+)?', str(salary_raw).replace(' ', ''))
    numbers = [float(n.replace(',', '.')) for n in numbers]
    if len(numbers) >= 2:
        return numbers[0], numbers[1]
    elif len(numbers) == 1:
        return numbers[0], numbers[0]
    return None, None


def _map_remote(item: dict) -> str:
    """Mappe le champ remote de LinkedIn vers notre schema."""
    emp_type = (item.get('employmentType') or '').lower()
    title = (item.get('jobTitle') or '').lower()
    location = (item.get('location') or '').lower()

    if 'remote' in emp_type or 'remote' in title or 'remote' in location:
        return 'full_remote'
    if 'hybrid' in emp_type or 'hybride' in title or 'hybrid' in title:
        return 'hybrid'
    if 'on-site' in emp_type or 'on site' in emp_type:
        return 'on_site'
    return 'not_specified'
