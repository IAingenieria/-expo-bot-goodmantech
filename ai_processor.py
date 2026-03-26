"""
Procesamiento inteligente con Claude:
- Extrae datos estructurados del prospecto (nombre, teléfono, email, empresa)
- Genera resumen de la conversación
- Crea propuesta inicial basada en productos de interés
"""
import json
import re
import anthropic
from config import (
    ANTHROPIC_API_KEY, EXPO_NOMBRE, EXPO_STAND, EXPO_CIUDAD,
    CLIENTE_EMPRESA, CLIENTE_GIRO, CLIENTE_PRODUCTOS
)

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

EXTRACTION_PROMPT = """Eres un asistente experto en captura de prospectos para exposiciones comerciales.
Estás en el stand de {empresa} ({giro}) en {expo_nombre}, Stand {expo_stand}, {expo_ciudad}.

Tu tarea: a partir del texto (transcripción de audio o imagen de tarjeta), extrae los datos del prospecto y genera un RESUMEN PROFESIONAL de la conversación.

IMPORTANTE sobre el resumen:
- NO repitas la transcripción textual
- Escribe en tercera persona como si fuera un reporte ejecutivo
- Incluye: quién es, qué necesita, qué se acordó, próximos pasos
- Máximo 4 oraciones claras y concretas
- Usa lenguaje profesional de negocios

TEXTO A ANALIZAR:
{texto}

Devuelve ÚNICAMENTE un JSON válido (sin markdown, sin explicaciones):
{{
  "nombre": "Nombre completo del prospecto o cadena vacía",
  "telefono": "Solo dígitos del teléfono, con lada, o cadena vacía",
  "email": "Correo electrónico o cadena vacía",
  "empresa": "Nombre de la empresa o cadena vacía",
  "cargo": "Puesto o cargo del prospecto o cadena vacía",
  "resumen": "Resumen ejecutivo profesional de 3-4 oraciones. Ejemplo: 'El Lic. García, Director de Compras de Empaques del Norte, mostró interés en adquirir 500 cajas mensuales de material de empaque. Solicitó cotización formal y muestras físicas. Se acordó enviar propuesta antes del viernes y agendar visita a planta la próxima semana.'",
  "productos_interes": ["productos", "o servicios", "mencionados"],
  "temperatura": "Caliente si hay intención clara de compra o pedido concreto | Tibio si hay interés pero sin compromiso | Frío si solo es información general",
  "notas_adicionales": "Datos relevantes adicionales no capturados arriba",
  "fecha_seguimiento": "Fecha o descripción del seguimiento mencionado, o cadena vacía",
  "accion_seguimiento": "llamar | enviar propuesta | agendar visita | enviar muestra | enviar cotización | cadena vacía"
}}"""

PROPOSAL_PROMPT = """Eres un asesor comercial profesional que acaba de conocer a un prospecto en una exposición.

Redacta un texto de seguimiento personalizado y profesional para incluir en el email al prospecto.

DATOS DEL PROSPECTO:
- Nombre: {nombre}
- Empresa: {empresa}
- Cargo: {cargo}
- Resumen de la conversación: {resumen}
- Productos/servicios de interés: {productos_interes}

Escribe 2-3 párrafos que:
1. Agradezca el tiempo del prospecto y haga referencia específica a lo que se discutió
2. Resuma los puntos clave acordados y próximos pasos concretos
3. Exprese disponibilidad para avanzar

Tono: profesional, cálido, personalizado. Escribe en español. NO uses frases genéricas.
NO menciones productos del catálogo (eso va en el PDF adjunto).

IMPORTANTE: El texto debe sonar como si lo hubiera escrito una persona real, no un robot."""


def extract_prospect_data(texto: str) -> dict:
    """
    Extrae datos estructurados del prospecto a partir del texto.

    Args:
        texto: Transcripción de audio o texto extraído de imagen.

    Returns:
        dict con: nombre, telefono, email, empresa, cargo,
                  resumen, productos_interes, temperatura, notas_adicionales
    """
    prompt = EXTRACTION_PROMPT.format(
        texto=texto,
        empresa=CLIENTE_EMPRESA,
        giro=CLIENTE_GIRO,
        expo_nombre=EXPO_NOMBRE,
        expo_stand=EXPO_STAND,
        expo_ciudad=EXPO_CIUDAD,
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    # Limpiar posible markdown
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: devuelve datos mínimos con el texto completo en resumen
        data = {
            "nombre": "",
            "telefono": "",
            "email": "",
            "empresa": "",
            "cargo": "",
            "resumen": texto[:500],
            "productos_interes": [],
            "temperatura": "Tibio",
            "notas_adicionales": raw,
        }

    # Asegurar que todos los campos existan
    defaults = {
        "nombre": "",
        "telefono": "",
        "email": "",
        "empresa": "",
        "cargo": "",
        "resumen": "",
        "productos_interes": [],
        "temperatura": "Tibio",
        "notas_adicionales": "",
        "fecha_seguimiento": "",
        "accion_seguimiento": "",
    }
    for key, default in defaults.items():
        data.setdefault(key, default)

    return data


def generate_proposal(prospect: dict, productos_catalogo: list[dict]) -> str:
    """
    Genera una propuesta inicial personalizada basada en el prospecto y el catálogo.

    Args:
        prospect: Datos del prospecto (resultado de extract_prospect_data).
        productos_catalogo: Lista de productos relevantes de Baserow.

    Returns:
        Texto de la propuesta inicial.
    """
    # Formatear el catálogo de productos para el prompt
    if productos_catalogo:
        productos_str = "\n".join(
            f"- {p.get('producto', '')} (Cód: {p.get('codigo', '')}) | "
            f"{p.get('descripcion', '')} | "
            f"Precio 1L: ${p.get('precio_1l', 'N/D')} | "
            f"Base: {p.get('tipo_base', '')}"
            for p in productos_catalogo[:6]
        )
    else:
        productos_str = "Línea completa de esmaltes industriales, pinturas anticorrosivas y recubrimientos especiales."

    prompt = PROPOSAL_PROMPT.format(
        nombre=prospect.get("nombre", "estimado cliente"),
        empresa=prospect.get("empresa", "su empresa"),
        cargo=prospect.get("cargo", ""),
        resumen=prospect.get("resumen", ""),
        productos_interes=", ".join(prospect.get("productos_interes", [])) or "recubrimientos industriales",
        productos_catalogo=productos_str,
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].text.strip()
