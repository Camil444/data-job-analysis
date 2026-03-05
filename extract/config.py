"""Configuration centrale du pipeline d'extraction."""

import os
from urllib.parse import urlparse
from dotenv import load_dotenv

# Charger le .env depuis la racine du projet
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# --- Credentials ---
FT_CLIENT_ID = os.getenv('FT_CLIENT_ID')
FT_CLIENT_SECRET = os.getenv('FT_CLIENT_SECRET')
NEON_DATABASE_URL = os.getenv('NEON_DATABASE_URL')
SMTP_EMAIL = os.getenv('SMTP_EMAIL')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')

# --- Parser NEON_DATABASE_URL pour extraire les composants individuels ---
_parsed = urlparse(NEON_DATABASE_URL) if NEON_DATABASE_URL else None
NEON_HOST = _parsed.hostname if _parsed else None
NEON_USER = _parsed.username if _parsed else None
NEON_PASSWORD = _parsed.password if _parsed else None
NEON_DBNAME = _parsed.path.lstrip('/') if _parsed else None
NEON_PORT = str(_parsed.port) if _parsed and _parsed.port else '5432'


def get_neon_env_dict():
    """Retourne un dict des variables Neon parsees, injectable dans os.environ pour dbt."""
    return {
        'NEON_HOST': NEON_HOST or '',
        'NEON_USER': NEON_USER or '',
        'NEON_PASSWORD': NEON_PASSWORD or '',
        'NEON_DBNAME': NEON_DBNAME or '',
        'NEON_PORT': NEON_PORT,
    }


# --- Parametres de recherche ---
DATA_KEYWORDS = [
    "data analyst",
    "data engineer",
    "data scientist",
    "analytics engineer",
    "machine learning engineer",
    "ai engineer",
    "business analyst",
    "bi analyst",
    "data architect",
    "data manager",
]

SEARCH_LOCATION = "France"
DAYS_BACK = 7
