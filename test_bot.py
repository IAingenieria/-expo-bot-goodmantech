"""
TEST RÁPIDO — Bot Cintermex
============================
Solo necesitas 3 variables en .env para correr esta prueba:
  - TELEGRAM_BOT_TOKEN
  - ANTHROPIC_API_KEY
  - OPENAI_API_KEY

Este script NO usa Baserow ni Gmail.
Solo prueba:
  1. Recepción de audio y transcripción con Whisper
  2. Lectura de imágenes (tarjetas de presentación) con Claude Vision
  3. Síntesis/resumen de la conversación con Claude IA
"""
import os
import tempfile
import base64
import logging
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from openai import OpenAI
import anthropic

load_dotenv()

TELEGRAM_TOKEN   = os.getenv("TELEGRAM_BOT_TOKEN", "")
ANTHROPIC_KEY    = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_KEY       = os.getenv("OPENAI_API_KEY", "")

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

openai_client    = OpenAI(api_key=OPENAI_KEY)
anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)


# ─── TRANSCRIPCIÓN DE AUDIO ───────────────────────────────────────────────────

async def transcribe_audio(bot, file_id: str) -> str:
    tg_file = await bot.get_file(file_id)
    with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
        tmp_path = tmp.name
    await tg_file.download_to_drive(tmp_path)
    try:
        with open(tmp_path, "rb") as f:
            result = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                language="es",
                response_format="text",
            )
        return result.strip()
    finally:
        os.remove(tmp_path)


# ─── EXTRACCIÓN DE TEXTO DE IMAGEN ───────────────────────────────────────────

async def extract_image_text(bot, file_id: str) -> str:
    tg_file = await bot.get_file(file_id)
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_path = tmp.name
    await tg_file.download_to_drive(tmp_path)
    try:
        with open(tmp_path, "rb") as f:
            b64 = base64.standard_b64encode(f.read()).decode("utf-8")
        msg = anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": "image/jpeg", "data": b64},
                    },
                    {
                        "type": "text",
                        "text": (
                            "Extrae y transcribe TODO el texto visible en esta imagen. "
                            "Si es una tarjeta de presentación, lista: nombre, empresa, cargo, "
                            "teléfono, email, dirección. Devuelve solo el texto extraído."
                        ),
                    },
                ],
            }],
        )
        return msg.content[0].text.strip()
    finally:
        os.remove(tmp_path)


# ─── SÍNTESIS CON CLAUDE ─────────────────────────────────────────────────────

def generar_sintesis(texto: str) -> str:
    msg = anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        messages=[{
            "role": "user",
            "content": (
                "Eres un asistente de ventas en una exposición comercial. "
                "A partir del siguiente texto, extrae y presenta en formato claro:\n\n"
                "DATOS DEL PROSPECTO:\n"
                "- Nombre:\n- Empresa:\n- Cargo:\n- Teléfono:\n- Email:\n\n"
                "SÍNTESIS DE LA CONVERSACIÓN:\n(3-4 oraciones sobre qué necesita y qué se discutió)\n\n"
                "TEMPERATURA DEL LEAD: (Caliente / Tibio / Frío)\n\n"
                f"TEXTO A ANALIZAR:\n{texto}"
            ),
        }],
    )
    return msg.content[0].text.strip()


# ─── HANDLERS ────────────────────────────────────────────────────────────────

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "✅ *Bot de prueba activo*\n\n"
        "Envíame:\n"
        "🎙️ *Audio* — te devuelvo la transcripción + síntesis\n"
        "📸 *Foto* — te extraigo el texto de la tarjeta de presentación + síntesis\n\n"
        "_(Esta versión de prueba no guarda datos ni envía emails)_",
        parse_mode="Markdown",
    )


async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🎙️ Recibido. Transcribiendo con Whisper...")
    try:
        file_id = update.message.voice.file_id
        transcript = await transcribe_audio(context.bot, file_id)

        await update.message.reply_text(
            f"📝 *Transcripción:*\n_{transcript}_",
            parse_mode="Markdown",
        )

        await update.message.reply_text("🧠 Generando síntesis con IA...")
        sintesis = generar_sintesis(transcript)

        await update.message.reply_text(
            f"📊 *Síntesis del audio:*\n\n{sintesis}",
            parse_mode="Markdown",
        )

    except Exception as e:
        logger.error(f"Error en audio: {e}", exc_info=True)
        await update.message.reply_text(f"❌ Error: {e}")


async def handle_audio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🎵 Archivo de audio recibido. Transcribiendo...")
    try:
        file_id = update.message.audio.file_id
        transcript = await transcribe_audio(context.bot, file_id)
        await update.message.reply_text(f"📝 *Transcripción:*\n_{transcript}_", parse_mode="Markdown")
        sintesis = generar_sintesis(transcript)
        await update.message.reply_text(f"📊 *Síntesis:*\n\n{sintesis}", parse_mode="Markdown")
    except Exception as e:
        logger.error(f"Error en audio: {e}", exc_info=True)
        await update.message.reply_text(f"❌ Error: {e}")


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("📸 Imagen recibida. Leyendo con IA...")
    try:
        file_id = update.message.photo[-1].file_id
        texto = await extract_image_text(context.bot, file_id)

        await update.message.reply_text(
            f"🔍 *Texto extraído de la imagen:*\n_{texto}_",
            parse_mode="Markdown",
        )

        sintesis = generar_sintesis(texto)
        await update.message.reply_text(
            f"📊 *Síntesis del contacto:*\n\n{sintesis}",
            parse_mode="Markdown",
        )

    except Exception as e:
        logger.error(f"Error en imagen: {e}", exc_info=True)
        await update.message.reply_text(f"❌ Error: {e}")


async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    doc = update.message.document
    if (doc.mime_type or "").startswith("image/"):
        await update.message.reply_text("🖼️ Imagen recibida como documento. Leyendo...")
        try:
            texto = await extract_image_text(context.bot, doc.file_id)
            await update.message.reply_text(f"🔍 *Texto extraído:*\n_{texto}_", parse_mode="Markdown")
            sintesis = generar_sintesis(texto)
            await update.message.reply_text(f"📊 *Síntesis:*\n\n{sintesis}", parse_mode="Markdown")
        except Exception as e:
            await update.message.reply_text(f"❌ Error: {e}")
    else:
        await update.message.reply_text("⚠️ Solo proceso imágenes y audios.")


# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    missing = []
    if not TELEGRAM_TOKEN:  missing.append("TELEGRAM_BOT_TOKEN")
    if not ANTHROPIC_KEY:   missing.append("ANTHROPIC_API_KEY")
    if not OPENAI_KEY:      missing.append("OPENAI_API_KEY")

    if missing:
        print(f"\n❌ Faltan estas variables en tu .env:\n")
        for m in missing:
            print(f"   - {m}")
        print("\nAgrega estas 3 variables al archivo .env y vuelve a correr.\n")
        return

    print("\n✅ Variables OK. Iniciando bot de prueba...")
    print("   Abre Telegram, busca tu bot y envía /start\n")

    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(MessageHandler(filters.VOICE, handle_voice))
    app.add_handler(MessageHandler(filters.AUDIO, handle_audio))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    app.add_handler(MessageHandler(filters.Document.IMAGE, handle_document))
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    import asyncio
    asyncio.set_event_loop(asyncio.new_event_loop())
    main()
