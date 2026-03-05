"""Extracteur API France Travail (offres d'emploi)."""

import logging
import re
from datetime import date

import pandas as pd
import requests

from extract.config import FT_CLIENT_ID, FT_CLIENT_SECRET, DATA_KEYWORDS

logger = logging.getLogger(__name__)

AUTH_URL = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire"
OFFERS_URL = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres"
PAGE_SIZE = 150


def _authenticate() -> str:
    """Obtient un access_token via OAuth2 client_credentials."""
    resp = requests.post(
        AUTH_URL,
        data={
            'grant_type': 'client_credentials',
            'client_id': FT_CLIENT_ID,
            'client_secret': FT_CLIENT_SECRET,
            'scope': 'api_offresdemploiv2 o2dsoffre',
        },
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
    )
    resp.raise_for_status()
    token = resp.json()['access_token']
    logger.info("Authentification France Travail reussie.")
    return token


def _parse_salary(salary_text: str):
    """Parse le champ salaire texte pour extraire min et max."""
    if not salary_text:
        return None, None, None

    # Chercher des nombres dans le texte
    numbers = re.findall(r'[\d]+(?:[.,]\d+)?', salary_text.replace(' ', ''))
    numbers = [float(n.replace(',', '.')) for n in numbers]

    period = None
    text_lower = salary_text.lower()
    if 'annuel' in text_lower or 'an' in text_lower:
        period = 'yearly'
    elif 'mensuel' in text_lower or 'mois' in text_lower:
        period = 'monthly'
    elif 'heure' in text_lower or 'horaire' in text_lower:
        period = 'hourly'

    if len(numbers) >= 2:
        return numbers[0], numbers[1], period
    elif len(numbers) == 1:
        return numbers[0], numbers[0], period
    return None, None, period


def _deduce_remote(offer: dict) -> str:
    """Deduit la politique de teletravail depuis les champs de l'offre."""
    description = (offer.get('description') or '').lower()
    title = (offer.get('intitule') or '').lower()
    combined = f"{title} {description}"

    if any(kw in combined for kw in ['full remote', '100% remote', '100% télétravail']):
        return 'full_remote'
    if any(kw in combined for kw in ['hybride', 'hybrid', 'télétravail partiel']):
        return 'hybrid'
    if any(kw in combined for kw in ['présentiel', 'sur site', 'on-site', 'on site']):
        return 'on_site'
    return 'not_specified'


def _fetch_offers_for_keyword(keyword: str, token: str) -> list:
    """Recupere toutes les offres pour un mot-cle avec pagination."""
    headers = {'Authorization': f'Bearer {token}'}
    all_offers = []
    start = 0

    while True:
        params = {
            'motsCles': keyword,
            'publieeDepuis': 7,
            'range': f'{start}-{start + PAGE_SIZE - 1}',
        }
        resp = requests.get(OFFERS_URL, params=params, headers=headers)

        if resp.status_code == 204:
            # Pas de resultats
            break
        if resp.status_code == 416:
            # Range invalide, fin de pagination
            break

        resp.raise_for_status()
        data = resp.json()
        results = data.get('resultats', [])

        if not results:
            break

        all_offers.extend(results)
        start += PAGE_SIZE

        # Verifier s'il y a encore des resultats
        content_range = data.get('Content-Range') or resp.headers.get('Content-Range', '')
        if content_range:
            # Format: "offres 0-149/342"
            match = re.search(r'/(\d+)', content_range)
            if match and start >= int(match.group(1)):
                break

        # Securite : pas plus de 1000 offres par keyword
        if start >= 1000:
            break

    return all_offers


def extract() -> pd.DataFrame:
    """Lance l'extraction des offres France Travail pour tous les mots-cles."""
    token = _authenticate()
    all_rows = []

    for keyword in DATA_KEYWORDS:
        try:
            offers = _fetch_offers_for_keyword(keyword, token)
            logger.info(f"[France Travail] '{keyword}' : {len(offers)} offres trouvees.")

            for offer in offers:
                salary_text = (offer.get('salaire') or {}).get('libelle', '')
                sal_min, sal_max, sal_period = _parse_salary(salary_text)

                formations = offer.get('formations') or []
                education = formations[0].get('niveauLibelle', '') if formations else ''

                entreprise = offer.get('entreprise') or {}
                lieu = offer.get('lieuTravail') or {}

                row = {
                    'source': 'france_travail',
                    'raw_title': offer.get('intitule', ''),
                    'company_name': entreprise.get('nom', ''),
                    'location_city': lieu.get('libelle', ''),
                    'raw_description': offer.get('description', ''),
                    'contract_type': offer.get('typeContrat', ''),
                    'salary_min': sal_min,
                    'salary_max': sal_max,
                    'salary_period': sal_period,
                    'experience_level': offer.get('experienceExige', ''),
                    'education_level': education,
                    'date_posted': offer.get('dateCreation', ''),
                    'remote_policy': _deduce_remote(offer),
                    'job_url': (offer.get('origineOffre') or {}).get('urlOrigine')
                               or f"https://candidat.francetravail.fr/offres/recherche/detail/{offer.get('id', '')}",
                    'date_scraped': date.today().isoformat(),
                }
                all_rows.append(row)

        except Exception as e:
            logger.error(f"[France Travail] Erreur pour '{keyword}' : {e}")
            continue

    df = pd.DataFrame(all_rows)
    logger.info(f"[France Travail] Total : {len(df)} offres extraites.")
    return df
