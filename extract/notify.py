"""Notification par email apres execution du pipeline."""

import logging
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from extract.config import SMTP_EMAIL, SMTP_PASSWORD

logger = logging.getLogger(__name__)

RECIPIENT = "camilhennebert1@gmail.com"


def send_report(results: dict[str, int | str]):
    """Envoie un rapport par mail avec le resume du pipeline.

    Args:
        results: dict source -> nombre de nouvelles offres (int) ou message d'erreur (str).
    """
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.warning("SMTP_EMAIL ou SMTP_PASSWORD non configure, notification ignoree.")
        return

    has_errors = any(isinstance(v, str) and v.startswith("ERREUR") for v in results.values())
    total_new = sum(v for v in results.values() if isinstance(v, int))
    date_str = datetime.now().strftime("%d/%m/%Y %H:%M")

    status = "ERREUR" if has_errors else "OK"
    subject = f"[Data Job Pipeline] {status} - {total_new} nouveaux jobs ({date_str})"

    # Corps du mail en HTML
    rows = ""
    for source, count in results.items():
        if isinstance(count, str) and count.startswith("ERREUR"):
            color = "#EF4444"
            display = count
        elif isinstance(count, int) and count > 0:
            color = "#10B981"
            display = f"+{count} nouvelles offres"
        else:
            color = "#6B7280"
            display = "Aucune nouvelle offre"
        rows += f'<tr><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;font-weight:500">{source}</td><td style="padding:8px 12px;border-bottom:1px solid #E5E7EB;color:{color}">{display}</td></tr>'

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto">
        <div style="background:{'#FEE2E2' if has_errors else '#ECFDF5'};padding:16px 20px;border-radius:8px 8px 0 0">
            <h2 style="margin:0;font-size:18px;color:{'#991B1B' if has_errors else '#065F46'}">
                Pipeline {'en erreur' if has_errors else 'execute avec succes'}
            </h2>
            <p style="margin:4px 0 0;font-size:13px;color:#6B7280">{date_str}</p>
        </div>
        <div style="background:#fff;padding:20px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 8px 8px">
            <p style="margin:0 0 12px;font-size:24px;font-weight:700;color:#1A1D27">{total_new} <span style="font-size:14px;font-weight:400;color:#6B7280">nouveaux jobs</span></p>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
                <tr style="background:#F8F9FB">
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6B7280;text-transform:uppercase">Source</th>
                    <th style="padding:8px 12px;text-align:left;font-size:11px;color:#6B7280;text-transform:uppercase">Resultat</th>
                </tr>
                {rows}
            </table>
        </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_EMAIL
    msg["To"] = RECIPIENT
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, RECIPIENT, msg.as_string())
        logger.info(f"Notification envoyee a {RECIPIENT}")
    except Exception as e:
        logger.error(f"Echec envoi email : {e}")
