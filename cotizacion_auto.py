"""
Genera y envía automáticamente la cotización de Goodman Tech
cuando un lead se clasifica como Caliente.
"""
import io
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import date
from fpdf import FPDF
from config import GMAIL_USER, GMAIL_APP_PASSWORD

logger = logging.getLogger(__name__)

PRECIO_BASE = 8000
IVA = 0.16
PRECIO_IVA = PRECIO_BASE * IVA
PRECIO_TOTAL = PRECIO_BASE + PRECIO_IVA


def generar_cotizacion_pdf(prospect: dict) -> bytes:
    """Genera PDF de cotización de Goodman Tech con datos del prospecto."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # ── Encabezado ──────────────────────────────────────────────
    pdf.set_fill_color(0, 102, 204)  # Azul Goodman Tech
    pdf.rect(0, 0, 210, 35, 'F')

    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_xy(10, 8)
    pdf.cell(0, 8, "Goodman Tech", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_xy(10, 17)
    pdf.cell(0, 5, "Soluciones Tecnologicas con IA", ln=True)
    pdf.set_xy(10, 23)
    pdf.cell(0, 5, "Monterrey, NL | info@goodmantech.com.mx | 81 2635 0902", ln=True)

    pdf.set_font("Helvetica", "B", 22)
    pdf.set_xy(130, 10)
    pdf.cell(70, 10, "COTIZACION", align="R", ln=True)
    pdf.set_font("Helvetica", "", 10)
    fecha = date.today().strftime("%d/%m/%Y")
    folio = f"COT{date.today().strftime('%Y%m%d')}001"
    pdf.set_xy(130, 20)
    pdf.cell(70, 5, f"Folio: {folio}", align="R", ln=True)
    pdf.set_xy(130, 25)
    pdf.cell(70, 5, f"Fecha: {fecha}", align="R", ln=True)

    # ── Datos del cliente ────────────────────────────────────────
    pdf.set_text_color(0, 0, 0)
    pdf.set_xy(10, 42)
    pdf.set_fill_color(230, 240, 255)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(190, 8, "  DATOS DEL CLIENTE", fill=True, ln=True)

    pdf.set_font("Helvetica", "", 10)
    nombre  = prospect.get("nombre")  or "Prospecto"
    empresa = prospect.get("empresa") or ""
    correo  = prospect.get("email")   or prospect.get("correo") or ""
    tel     = prospect.get("telefono") or ""

    pdf.set_xy(10, 53)
    pdf.cell(95, 7, f"Cliente: {nombre}")
    pdf.cell(95, 7, f"Empresa: {empresa}", ln=True)
    pdf.set_xy(10, 60)
    pdf.cell(95, 7, f"Email: {correo}")
    pdf.cell(95, 7, f"Tel: {tel}", ln=True)

    # ── Tabla de servicios ───────────────────────────────────────
    pdf.set_xy(10, 72)
    pdf.set_fill_color(0, 102, 204)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(10, 8, "No.", fill=True, border=1, align="C")
    pdf.cell(120, 8, "Descripcion del Servicio", fill=True, border=1)
    pdf.cell(30, 8, "Precio", fill=True, border=1, align="C")
    pdf.cell(30, 8, "Importe", fill=True, border=1, align="C", ln=True)

    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_xy(10, 80)
    pdf.cell(10, 20, "1", border=1, align="C")
    pdf.set_xy(20, 80)
    desc = (
        "Sistema Inteligente de Captura de Prospectos via Telegram\n"
        "- Bot personalizado para tu empresa o evento\n"
        "- Captura por audio, foto o texto\n"
        "- IA extrae: nombre, telefono, email, empresa\n"
        "- Base de datos en la nube con descarga a Excel\n"
        "- Email automatico al prospecto con propuesta PDF\n"
        "- Edicion y seguimiento desde Telegram"
    )
    pdf.multi_cell(120, 4, desc, border=1)
    pdf.set_xy(140, 80)
    pdf.cell(30, 20, f"${PRECIO_BASE:,.0f}", border=1, align="C")
    pdf.cell(30, 20, f"${PRECIO_BASE:,.0f}", border=1, align="C", ln=True)

    # ── Totales ──────────────────────────────────────────────────
    pdf.set_xy(140, 102)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(30, 7, "Subtotal:", border=1)
    pdf.cell(30, 7, f"${PRECIO_BASE:,.0f}", border=1, align="R", ln=True)
    pdf.set_xy(140, 109)
    pdf.cell(30, 7, "IVA (16%):", border=1)
    pdf.cell(30, 7, f"${PRECIO_IVA:,.0f}", border=1, align="R", ln=True)

    pdf.set_xy(140, 116)
    pdf.set_fill_color(0, 102, 204)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(30, 9, "TOTAL:", fill=True, border=1)
    pdf.cell(30, 9, f"${PRECIO_TOTAL:,.0f}", fill=True, border=1, align="R", ln=True)

    # ── Condiciones y banco ──────────────────────────────────────
    pdf.set_text_color(0, 0, 0)
    pdf.set_xy(10, 132)
    pdf.set_fill_color(230, 240, 255)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(93, 7, "  CONDICIONES DE PAGO", fill=True, border=0)
    pdf.set_xy(108, 132)
    pdf.cell(92, 7, "  DATOS BANCARIOS", fill=True, border=0, ln=True)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_xy(10, 140)
    pdf.multi_cell(93, 6,
        "* 50% de anticipo para iniciar\n"
        "* 50% restante al finalizar\n"
        "* Precios en MXN\n"
        "* Entrega: 3-5 dias habiles"
    )
    pdf.set_xy(108, 140)
    pdf.multi_cell(92, 6,
        "Beneficiario: Guadalupe Salinas Banos\n"
        "Banco: MERCADO PAGO\n"
        "CLABE: 7229 6901 0455 5450 66"
    )

    # ── Vigencia ────────────────────────────────────────────────
    pdf.set_xy(10, 175)
    pdf.set_fill_color(0, 102, 204)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "I", 9)
    pdf.cell(190, 8,
        "Esta cotizacion tiene una vigencia de 30 dias a partir de la fecha de emision",
        fill=True, align="C", ln=True
    )

    # ── Footer ──────────────────────────────────────────────────
    pdf.set_text_color(100, 100, 100)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_xy(10, 187)
    pdf.cell(190, 5,
        "Goodman Tech | Zuazua #114 Col. Centro, Monterrey NL CP 64000 | Tel: 81 2635 0902",
        align="C"
    )

    return bytes(pdf.output())


def enviar_cotizacion_email(prospect: dict) -> bool:
    """Envía la cotización automática al prospecto Caliente."""
    email_destino = (prospect.get("email") or prospect.get("correo") or "").strip()
    if not email_destino:
        return False

    nombre = prospect.get("nombre") or "estimado cliente"

    try:
        pdf_bytes = generar_cotizacion_pdf(prospect)

        msg = MIMEMultipart()
        msg["From"]    = GMAIL_USER
        msg["To"]      = email_destino
        msg["Subject"] = "Cotizacion - Sistema de Captura de Prospectos con IA | Goodman Tech"

        cuerpo = f"""Hola {nombre},

Ha sido un placer conocerte el dia de hoy en el Stand 432 de la Expo Empaques en Monterrey.

Como platicamos, te comparto la cotizacion de nuestro Sistema Inteligente de Captura de Prospectos via Telegram, desarrollado por Goodman Tech.

Lo que incluye tu sistema:
* Bot de Telegram personalizado para tu empresa
* Captura por audio, foto de tarjeta o texto
* Inteligencia Artificial extrae nombre, telefono, email y empresa
* Email automatico al prospecto con propuesta PDF
* Base de datos en la nube, accesible desde cualquier dispositivo
* Descarga de tu lista de prospectos en Excel
* Edicion y seguimiento desde Telegram
* Entrega en 3-5 dias habiles

Inversion: $8,000 MXN + IVA

Estoy disponible para cualquier pregunta o para iniciar el proyecto.

Saludos,
Luis Vilchis
Goodman Tech -- Soluciones Tecnologicas
Tel: 81 2635 0902
info@goodmantech.com.mx"""

        msg.attach(MIMEText(cuerpo, "plain"))

        part = MIMEBase("application", "octet-stream")
        part.set_payload(pdf_bytes)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", 'attachment; filename="Cotizacion_GoodmanTech.pdf"')
        msg.attach(part)

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.send_message(msg)

        logger.info(f"Cotizacion enviada a {email_destino}")
        return True

    except Exception as e:
        logger.error(f"Error enviando cotizacion: {e}")
        return False
