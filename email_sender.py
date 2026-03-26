"""
Envía el email de seguimiento al prospecto via Gmail SMTP.
Incluye el PDF de propuesta como archivo adjunto.
"""
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import datetime
from config import (
    GMAIL_USER,
    GMAIL_APP_PASSWORD,
    EXPO_NOMBRE,
    EXPO_STAND,
    EXPO_VENUE,
    EXPO_CIUDAD,
    GT_TELEFONO,
    GT_EMAIL,
    GT_WEBSITE,
)


def _format_date() -> str:
    months = [
        "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
    ]
    now = datetime.now()
    return f"{now.day} de {months[now.month]} de {now.year}"


def _build_html(prospect: dict, resumen: str) -> str:
    nombre = prospect.get("nombre", "estimado visitante")
    fecha = _format_date()

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body {{ font-family: Arial, sans-serif; color: #222; margin: 0; padding: 0; background: #f5f5f5; }}
    .container {{ max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
    .header {{ background: #1e50a0; padding: 24px 30px; }}
    .header h1 {{ color: #fff; margin: 0; font-size: 22px; letter-spacing: 1px; }}
    .header p {{ color: #cdd9f0; margin: 4px 0 0; font-size: 12px; }}
    .body {{ padding: 28px 30px; }}
    .body p {{ line-height: 1.7; font-size: 14px; color: #333; }}
    .summary-box {{ background: #f0f4fb; border-left: 4px solid #1e50a0; padding: 14px 18px; margin: 20px 0; border-radius: 4px; }}
    .summary-box p {{ margin: 0; font-size: 13.5px; color: #333; white-space: pre-line; }}
    .attachment-note {{ font-size: 13px; color: #555; background: #fff8e1; padding: 10px 14px; border-radius: 4px; border: 1px solid #ffe082; margin: 18px 0; }}
    .footer {{ background: #1e50a0; padding: 16px 30px; }}
    .footer p {{ color: #cdd9f0; font-size: 11px; margin: 2px 0; }}
    .footer strong {{ color: #fff; }}
    .divider {{ border: none; border-top: 1px solid #e0e0e0; margin: 20px 0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Stand {EXPO_STAND} — {EXPO_NOMBRE}</h1>
      <p>{EXPO_VENUE}, {EXPO_CIUDAD}</p>
    </div>
    <div class="body">
      <p>Estimado/a <strong>{nombre}</strong>,</p>
      <p>
        Ha sido un placer conocerte el día de hoy, <strong>{fecha}</strong>,
        en nuestro <strong>Stand {EXPO_STAND}</strong> de la
        <strong>{EXPO_NOMBRE}</strong> en {EXPO_CIUDAD}.
      </p>
      <p>A continuación te compartimos un resumen de nuestra conversación y los puntos que acordamos:</p>

      <div class="summary-box">
        <p>{resumen}</p>
      </div>

      <div class="attachment-note">
        📎 <strong>Archivo adjunto:</strong> encontrarás nuestra <em>propuesta inicial</em>
        en PDF con los productos y servicios que discutimos en el stand.
      </div>

      <hr class="divider">
      <p>Quedamos a tus órdenes para darte seguimiento y resolver cualquier duda.</p>
      <p>¡Hasta pronto!</p>
    </div>
    <div class="footer">
      <p><strong>Stand {EXPO_STAND} — {EXPO_NOMBRE}</strong></p>
      <p>📞 {GT_TELEFONO} &nbsp;|&nbsp; ✉️ {GT_EMAIL} &nbsp;|&nbsp; 🌐 {GT_WEBSITE}</p>
      <hr style="border-color:#3a6ab5; margin:10px 0;">
      <p style="font-size:10px; color:#a0b4d8;">
        🤖 Este correo fue generado con Inteligencia Artificial (Claude AI) —
        Asesoría tecnológica: <strong>Goodman Tech</strong> — www.goodmantech.com.mx
      </p>
    </div>
  </div>
</body>
</html>"""


def send_prospect_email(prospect: dict, resumen: str, pdf_path: str) -> bool:
    """
    Envía el email de seguimiento con el PDF adjunto.

    Args:
        prospect: Datos del prospecto (dict con 'nombre', 'email', etc.)
        resumen: Resumen de la conversación generado por Claude.
        pdf_path: Ruta local del PDF generado.

    Returns:
        True si el email fue enviado correctamente, False si falló.
    """
    to_email = prospect.get("email", "").strip()
    if not to_email:
        return False

    nombre = prospect.get("nombre", "")
    subject = f"Un placer conocerte en {EXPO_NOMBRE} — Stand {EXPO_STAND}"

    msg = MIMEMultipart("mixed")
    msg["From"] = f"Stand {EXPO_STAND} {EXPO_NOMBRE} <{GMAIL_USER}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg["Reply-To"] = GT_EMAIL

    # Body HTML
    html_content = _build_html(prospect, resumen)
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    # Adjuntar PDF
    if pdf_path and os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            pdf_data = f.read()
        pdf_attachment = MIMEApplication(pdf_data, _subtype="pdf")
        pdf_filename = os.path.basename(pdf_path)
        pdf_attachment.add_header(
            "Content-Disposition",
            "attachment",
            filename=pdf_filename,
        )
        msg.attach(pdf_attachment)

    # Enviar via Gmail SMTP
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        smtp.sendmail(GMAIL_USER, to_email, msg.as_string())

    return True
