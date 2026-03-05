"""Orchestrateur : lance les 3 extracteurs sequentiellement puis charge dans Neon."""

import logging
import os
import sys

# Ajouter la racine du projet au path pour les imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from extract.config import get_neon_env_dict
from extract.load_to_db import load_dataframe

# Configurer le logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
logger = logging.getLogger(__name__)


def run():
    """Execute le pipeline d'extraction complet."""
    # Injecter les variables Neon parsees dans l'environnement (pour dbt)
    neon_env = get_neon_env_dict()
    os.environ.update(neon_env)

    results = {}

    # --- 1. France Travail ---
    try:
        logger.info("=" * 50)
        logger.info("Demarrage extraction France Travail...")
        from extract.france_travail import extract as ft_extract
        df_ft = ft_extract()
        count = load_dataframe(df_ft, 'france_travail')
        results['france_travail'] = count
    except Exception as e:
        logger.error(f"ECHEC France Travail : {e}")
        results['france_travail'] = f"ERREUR: {e}"

    # --- 2. JobSpy (Indeed + Glassdoor + LinkedIn) ---
    try:
        logger.info("=" * 50)
        logger.info("Demarrage extraction JobSpy (Indeed + Glassdoor + LinkedIn)...")
        from extract.jobspy_scraper import extract as js_extract
        df_js = js_extract()

        # Separer par source pour charger dans des tables differentes
        if df_js is not None and not df_js.empty:
            for src in ['indeed', 'glassdoor', 'linkedin']:
                df_src = df_js[df_js['source'] == src]
                count = load_dataframe(df_src, src)
                results[src] = count
        else:
            results['indeed'] = 0
            results['glassdoor'] = 0
            results['linkedin'] = 0
    except Exception as e:
        logger.error(f"ECHEC JobSpy : {e}")
        results['indeed'] = f"ERREUR: {e}"
        results['glassdoor'] = f"ERREUR: {e}"
        results['linkedin'] = f"ERREUR: {e}"

    # --- Resume ---
    logger.info("=" * 50)
    logger.info("RESUME DU PIPELINE :")
    for source, count in results.items():
        logger.info(f"  {source:20s} : {count}")
    logger.info("Pipeline termine.")


if __name__ == '__main__':
    run()
