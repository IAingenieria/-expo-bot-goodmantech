"""
Descarga y analiza imágenes de Telegram usando Claude Vision.
Extrae todo el texto visible (tarjetas de presentación, formularios, capturas de pantalla).
"""
import os
import base64
import tempfile
import anthropic
from config import ANTHROPIC_API_KEY

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def _image_to_base64(file_path: str) -> tuple[str, str]:
    """
    Convierte una imagen a base64 y detecta su media type.
    Returns: (base64_data, media_type)
    """
    ext = os.path.splitext(file_path)[1].lower()
    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }
    media_type = media_types.get(ext, "image/jpeg")

    with open(file_path, "rb") as f:
        data = base64.standard_b64encode(f.read()).decode("utf-8")

    return data, media_type


def extract_text_from_image(file_path: str) -> str:
    """
    Extrae todo el texto visible de una imagen usando Claude Vision.
    Optimizado para tarjetas de presentación y formularios de datos.

    Args:
        file_path: Ruta local de la imagen.

    Returns:
        Todo el texto extraído de la imagen.
    """
    b64_data, media_type = _image_to_base64(file_path)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": b64_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Eres un asistente de captura de datos para una exposición comercial. "
                            "Extrae y transcribe TODO el texto visible en esta imagen, incluyendo: "
                            "nombres, teléfonos, emails, empresa, cargo, dirección, y cualquier otro dato. "
                            "Si es una tarjeta de presentación, extrae todos los campos. "
                            "Si hay notas escritas a mano, transcríbelas también. "
                            "Devuelve únicamente el texto extraído, sin comentarios adicionales."
                        ),
                    },
                ],
            }
        ],
    )

    return message.content[0].text.strip()


async def download_and_analyze(bot, file_id: str) -> str:
    """
    Descarga la imagen desde Telegram y extrae su texto con Claude Vision.

    Args:
        bot: Instancia del bot de Telegram.
        file_id: ID del archivo en Telegram.

    Returns:
        Texto extraído de la imagen.
    """
    tg_file = await bot.get_file(file_id)

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        await tg_file.download_to_drive(tmp_path)
        extracted = extract_text_from_image(tmp_path)
        return extracted
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
