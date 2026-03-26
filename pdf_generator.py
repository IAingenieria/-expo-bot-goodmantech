"""
Genera un PDF profesional de propuesta inicial para el prospecto.
Usa fpdf2 con layout de dos páginas:
  Página 1: Datos del prospecto + Resumen de conversación
  Página 2: Productos recomendados + Datos de contacto Goodman Tech
"""
import os
import tempfile
from datetime import datetime
from fpdf import FPDF
from config import (
    EXPO_NOMBRE,
    EXPO_STAND,
    EXPO_CIUDAD,
    EXPO_VENUE,
    GT_TELEFONO,
    GT_EMAIL,
    GT_WEBSITE,
    GT_LOGO,
)

# ─── Paleta de colores Goodman Tech ────────────────────────────────────────────────
COLOR_PRIMARY = (30, 80, 160)      # Azul corporativo
COLOR_SECONDARY = (220, 60, 30)    # Naranja/rojo acento
COLOR_LIGHT_GRAY = (245, 245, 245)
COLOR_DARK_GRAY = (80, 80, 80)
COLOR_WHITE = (255, 255, 255)
COLOR_BLACK = (20, 20, 20)


def _safe(text: str) -> str:
    """Reemplaza caracteres Unicode no soportados por Helvetica."""
    replacements = {
        "\u2014": "-", "\u2013": "-", "\u2018": "'", "\u2019": "'",
        "\u201c": '"', "\u201d": '"', "\u2026": "...", "\u00b0": " grados",
        "\u00e9": "e", "\u00f3": "o", "\u00fa": "u", "\u00ed": "i",
        "\u00e1": "a", "\u00f1": "n", "\u00fc": "u", "\u00e4": "a",
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text.encode("latin-1", errors="replace").decode("latin-1")


class ProposalPDF(FPDF):
    def __init__(self, prospect: dict):
        super().__init__()
        self.prospect = prospect
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        # Barra superior de color primario
        self.set_fill_color(*COLOR_PRIMARY)
        self.rect(0, 0, 210, 18, "F")

        # Logo (si existe)
        if os.path.exists(GT_LOGO):
            try:
                self.image(GT_LOGO, x=8, y=2, h=14)
            except Exception:
                pass

        # Nombre empresa en header
        self.set_text_color(*COLOR_WHITE)
        self.set_font("Helvetica", "B", 13)
        self.set_xy(0, 4)
        self.cell(210, 10, "Goodman Tech", align="C")

        # Tagline
        self.set_font("Helvetica", "", 7)
        self.set_xy(0, 11)
        self.cell(210, 5, "Pinturas y Recubrimientos Industriales", align="C")

        self.ln(12)

    def footer(self):
        self.set_y(-14)
        self.set_fill_color(*COLOR_PRIMARY)
        self.rect(0, self.get_y(), 210, 14, "F")
        self.set_text_color(*COLOR_WHITE)
        self.set_font("Helvetica", "", 7)
        self.cell(
            0,
            14,
            f"  {EXPO_NOMBRE}  |  Stand {EXPO_STAND}  |  {EXPO_VENUE}, {EXPO_CIUDAD}  |  "
            f"{GT_EMAIL}  |  {GT_TELEFONO}  |  {GT_WEBSITE}",
            align="C",
        )

    def _section_title(self, title: str):
        self.set_x(self.l_margin)
        self.set_fill_color(*COLOR_SECONDARY)
        self.set_text_color(*COLOR_WHITE)
        self.set_font("Helvetica", "B", 10)
        self.cell(self.epw, 8, f"  {title}", fill=True, ln=True)
        self.ln(3)
        self.set_text_color(*COLOR_BLACK)

    def _labeled_field(self, label: str, value: str):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*COLOR_DARK_GRAY)
        self.cell(38, 6, label, ln=False)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*COLOR_BLACK)
        self.multi_cell(self.epw - 38, 6, _safe(value or "N/D"))

    def build_page1(self):
        """Portada: datos del prospecto + resumen de conversación."""
        # Título principal
        self.set_fill_color(*COLOR_LIGHT_GRAY)
        self.rect(10, self.get_y(), 190, 16, "F")
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*COLOR_PRIMARY)
        self.set_x(10)
        self.cell(190, 16, "PROPUESTA INICIAL", align="C", ln=True)
        fecha_str = datetime.now().strftime("%d de %B de %Y").replace(
            "January", "enero").replace("February", "febrero").replace(
            "March", "marzo").replace("April", "abril").replace(
            "May", "mayo").replace("June", "junio").replace(
            "July", "julio").replace("August", "agosto").replace(
            "September", "septiembre").replace("October", "octubre").replace(
            "November", "noviembre").replace("December", "diciembre")
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*COLOR_DARK_GRAY)
        self.cell(0, 6, fecha_str, align="C", ln=True)
        self.ln(6)

        # ── Datos del prospecto
        self._section_title("DATOS DEL PROSPECTO")
        self._labeled_field("Nombre:", self.prospect.get("nombre", ""))
        self._labeled_field("Empresa:", self.prospect.get("empresa", ""))
        self._labeled_field("Cargo:", self.prospect.get("cargo", ""))
        self._labeled_field("Teléfono:", self.prospect.get("telefono", ""))
        self._labeled_field("Email:", self.prospect.get("email", ""))
        self.ln(5)

        # ── Resumen de la conversación
        self._section_title("RESUMEN DE NUESTRA CONVERSACIÓN")
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(*COLOR_BLACK)
        resumen = self.prospect.get("resumen", "")
        self.multi_cell(0, 6, _safe(resumen))
        self.ln(5)

        # ── Notas adicionales (si existen)
        notas = self.prospect.get("notas_adicionales", "").strip()
        if notas:
            self._section_title("NOTAS ADICIONALES")
            self.set_font("Helvetica", "I", 9)
            self.multi_cell(0, 6, notas)
            self.ln(3)

    def build_page2(self, productos: list[dict], propuesta: str):
        """Página 2: propuesta con productos recomendados."""
        # Propuesta generada por IA
        self._section_title("PROPUESTA PERSONALIZADA")
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(*COLOR_BLACK)
        self.multi_cell(0, 6, _safe(propuesta))
        self.ln(6)

        # Tabla de productos recomendados
        if productos:
            self._section_title("PRODUCTOS RECOMENDADOS")
            self._product_table(productos)
            self.ln(5)

        # Próximos pasos
        self._section_title("PRÓXIMOS PASOS")
        self.set_font("Helvetica", "", 9.5)
        steps = [
            "1. Revisión de esta propuesta inicial por su equipo técnico.",
            "2. Envío de muestras de los productos de interés.",
            "3. Visita de nuestro asesor técnico a su planta.",
            "4. Cotización formal adaptada a sus volúmenes de consumo.",
        ]
        for step in steps:
            self.cell(6, 6, "", ln=False)
            self.multi_cell(0, 6, step)
        self.ln(4)

        # Contacto Goodman Tech
        self.set_fill_color(*COLOR_LIGHT_GRAY)
        self.rect(10, self.get_y(), 190, 22, "F")
        y = self.get_y() + 4
        self.set_xy(14, y)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*COLOR_PRIMARY)
        self.cell(0, 5, "Contacto Goodman Tech", ln=True)
        self.set_x(14)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*COLOR_DARK_GRAY)
        self.cell(0, 5, f"Tel: {GT_TELEFONO}   |   Email: {GT_EMAIL}   |   {GT_WEBSITE}", ln=True)

    def _product_table(self, productos: list[dict]):
        col_widths = [68, 18, 60, 22, 22]
        headers = ["Producto", "Cód.", "Descripción", "Precio 1L", "Base"]

        # Encabezado
        self.set_fill_color(*COLOR_PRIMARY)
        self.set_text_color(*COLOR_WHITE)
        self.set_font("Helvetica", "B", 8)
        for w, h in zip(col_widths, headers):
            self.cell(w, 7, h, border=0, fill=True, align="C")
        self.ln()

        # Filas
        self.set_font("Helvetica", "", 7.5)
        for i, p in enumerate(productos[:8]):
            fill = i % 2 == 0
            self.set_fill_color(*COLOR_LIGHT_GRAY)
            self.set_text_color(*COLOR_BLACK)
            row_data = [
                p.get("producto", "")[:45],
                p.get("codigo", ""),
                p.get("descripcion", "")[:40],
                f"${p.get('precio_1l', 'N/D')}",
                p.get("tipo_base", ""),
            ]
            for w, val in zip(col_widths, row_data):
                self.cell(w, 6, str(val), border=0, fill=fill)
            self.ln()


def generate_proposal_pdf(prospect: dict, productos: list[dict], propuesta: str) -> str:
    """
    Genera el PDF de propuesta y lo guarda en un archivo temporal.

    Args:
        prospect: Datos del prospecto (de ai_processor.extract_prospect_data).
        productos: Lista de productos recomendados (de baserow_client.search_products).
        propuesta: Texto de propuesta generado por Claude.

    Returns:
        Ruta del archivo PDF generado.
    """
    pdf = ProposalPDF(prospect)
    pdf.add_page()
    pdf.build_page1()
    pdf.add_page()
    pdf.build_page2(productos, propuesta)

    nombre_safe = (
        prospect.get("nombre", "prospecto")
        .replace(" ", "_")
        .replace("/", "")
        [:30]
    )
    fecha = datetime.now().strftime("%Y%m%d_%H%M")
    filename = f"Propuesta_Goodman Tech_{nombre_safe}_{fecha}.pdf"

    tmp_path = os.path.join(tempfile.gettempdir(), filename)
    pdf.output(tmp_path)
    return tmp_path
