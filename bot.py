"""
Punto de entrada del bot de Telegram para captura de prospectos.
Expo Empaques — Stand 432 — Lupront

Uso:
    python bot.py
"""
import asyncio
import logging
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
)
from config import TELEGRAM_BOT_TOKEN
from handlers import (
    handle_start,
    handle_voice,
    handle_audio,
    handle_photo,
    handle_document,
    handle_text,
    handle_callback,
    handle_editar,
    handle_cancelar,
    handle_reset,
)
from commands import (
    handle_menu,
    handle_revisar,
    handle_hoy,
    handle_ultimo,
    handle_exportar,
    handle_buscar,
)

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def main():
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN no configurado. Revisa tu archivo .env")
        return

    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # ── Master Menu ──────────────────────────────────────────────
    app.add_handler(CommandHandler("menu",     handle_menu))
    app.add_handler(CommandHandler("revisar",  handle_revisar))
    app.add_handler(CommandHandler("hoy",      handle_hoy))
    app.add_handler(CommandHandler("ultimo",   handle_ultimo))
    app.add_handler(CommandHandler("exportar", handle_exportar))
    app.add_handler(CommandHandler("buscar",   handle_buscar))
    app.add_handler(CommandHandler("editar",   handle_editar))

    # ── Bienvenida ───────────────────────────────────────────────
    app.add_handler(CommandHandler("start",    handle_start))
    app.add_handler(CommandHandler("help",     handle_menu))
    app.add_handler(CommandHandler("ayuda",    handle_menu))
    app.add_handler(CommandHandler("cancelar", handle_cancelar))
    app.add_handler(CommandHandler("reset",    handle_reset))

    # ── Botones inline (confirmación de correo) ──────────────────
    app.add_handler(CallbackQueryHandler(handle_callback))

    # ── Mensajes de voz y audio ──────────────────────────────────
    app.add_handler(MessageHandler(filters.VOICE,          handle_voice))
    app.add_handler(MessageHandler(filters.AUDIO,          handle_audio))

    # ── Imágenes ─────────────────────────────────────────────────
    app.add_handler(MessageHandler(filters.PHOTO,          handle_photo))
    app.add_handler(MessageHandler(filters.Document.IMAGE, handle_document))

    # ── Texto plano (notas y corrección de email) ─────────────────
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    logger.info("✅ Bot iniciado — Stand 432 Expo Empaques. Esperando mensajes...")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    asyncio.set_event_loop(asyncio.new_event_loop())
    main()
