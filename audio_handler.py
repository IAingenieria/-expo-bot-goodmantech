"""
Descarga y transcribe mensajes de voz de Telegram usando OpenAI Whisper.
"""
import os
import tempfile
from openai import OpenAI
from config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)


async def transcribe_voice(file_path: str) -> str:
    """
    Transcribe un archivo de audio (OGG, MP3, WAV, M4A) a texto en español.

    Args:
        file_path: Ruta local del archivo de audio.

    Returns:
        Texto transcrito.
    """
    # Whisper acepta OGG directamente — Telegram envía voice notes como .oga/.ogg
    with open(file_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="es",
            response_format="text",
        )
    return transcript.strip()


async def download_and_transcribe(bot, file_id: str) -> str:
    """
    Descarga el archivo de audio desde Telegram y lo transcribe.

    Args:
        bot: Instancia del bot de Telegram.
        file_id: ID del archivo en Telegram.

    Returns:
        Texto transcrito del audio.
    """
    tg_file = await bot.get_file(file_id)

    with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        await tg_file.download_to_drive(tmp_path)
        transcript = await transcribe_voice(tmp_path)
        return transcript
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
