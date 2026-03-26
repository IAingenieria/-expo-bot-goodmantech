"""
Manejadores de mensajes del bot de Telegram.
Flujo: recepción → IA → verificación correo → Baserow → PDF → Email → confirmación → edición opcional.
"""
import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

from audio_handler import download_and_transcribe
from image_handler import download_and_analyze
from ai_processor import extract_prospect_data, generate_proposal
from baserow_client import save_prospect, update_prospect, get_last_prospect
from pdf_generator import generate_proposal_pdf
from email_sender import send_prospect_email

logger = logging.getLogger(__name__)

# Mapeo: nombre visible → campo real en Baserow
CAMPOS_EDITABLES = {
    "Nombre":      "Nombre",
    "Teléfono":    "Telefono",
    "Correo":      "Correo",
    "Empresa":     "Empresa",
    "Temperatura": "Seguimiento 1",
}


# ─── Helpers de estado ────────────────────────────────────────────────────────

def _clear_pending(context: ContextTypes.DEFAULT_TYPE) -> None:
    for key in ["pending_prospect", "pending_productos", "pending_propuesta", "awaiting_email"]:
        context.user_data.pop(key, None)


def _clear_edit(context: ContextTypes.DEFAULT_TYPE) -> None:
    for key in ["awaiting_edit", "editing_row_id", "editing_field"]:
        context.user_data.pop(key, None)


def _clear_all(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Limpia todo el estado del usuario."""
    context.user_data.clear()


# ─── /cancelar y /reset ───────────────────────────────────────────────────────

async def handle_cancelar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Cancela el flujo actual sin borrar historial."""
    _clear_pending(context)
    _clear_edit(context)
    await update.message.reply_text(
        "❌ *Acción cancelada.*\n\n"
        "Puedes mandar un nuevo audio, foto o texto cuando quieras.\n"
        "Usa /menu para ver los comandos disponibles.",
        parse_mode="Markdown",
    )


async def handle_reset(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Reinicia completamente el estado del bot para este usuario."""
    _clear_all(context)
    await update.message.reply_text(
        "🔄 *Bot reiniciado correctamente.*\n\n"
        "Todo el estado fue limpiado. Listo para capturar el siguiente prospecto.\n"
        "Usa /menu para ver los comandos disponibles.",
        parse_mode="Markdown",
    )


# ─── Menú de edición ─────────────────────────────────────────────────────────

async def _show_edit_buttons(message, row_id: int, nombre: str) -> None:
    """Muestra los botones de campos editables para un prospecto."""
    keyboard = [
        [
            InlineKeyboardButton("👤 Nombre",      callback_data=f"edit_campo:{row_id}:Nombre"),
            InlineKeyboardButton("📱 Teléfono",    callback_data=f"edit_campo:{row_id}:Telefono"),
        ],
        [
            InlineKeyboardButton("✉️ Correo",      callback_data=f"edit_campo:{row_id}:Correo"),
            InlineKeyboardButton("🏢 Empresa",     callback_data=f"edit_campo:{row_id}:Empresa"),
        ],
        [
            InlineKeyboardButton("🌡️ Temperatura", callback_data=f"edit_campo:{row_id}:Temperatura"),
        ],
        [
            InlineKeyboardButton("❌ Cancelar",    callback_data="edit_cancel"),
        ],
    ]
    await message.reply_text(
        f"✏️ *¿Qué deseas corregir de {nombre}?*",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


async def _show_temp_buttons(query, row_id: int) -> None:
    """Muestra los botones de temperatura para seleccionar."""
    keyboard = [[
        InlineKeyboardButton("🔥 Caliente", callback_data=f"edit_temp:{row_id}:Caliente"),
        InlineKeyboardButton("🌡️ Tibio",   callback_data=f"edit_temp:{row_id}:Tibio"),
        InlineKeyboardButton("❄️ Frío",    callback_data=f"edit_temp:{row_id}:Frio"),
    ]]
    await query.edit_message_text(
        "🌡️ *Selecciona la temperatura del lead:*",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ─── Confirmación de correo ───────────────────────────────────────────────────

async def _ask_email_confirmation(update: Update, prospect: dict) -> None:
    """Muestra resumen y pide confirmación del correo antes de guardar."""
    nombre    = prospect.get("nombre")   or "Sin nombre"
    tel       = prospect.get("telefono") or "—"
    email     = prospect.get("email")    or "—"
    empresa   = prospect.get("empresa")  or "—"
    temperatura = prospect.get("temperatura", "Tibio")
    temp_emoji  = {"Caliente": "🔥", "Tibio": "🌡️", "Frío": "❄️"}.get(temperatura, "🌡️")

    texto = (
        f"📋 *Datos detectados:*\n\n"
        f"👤 *Nombre:* {nombre}\n"
        f"📱 *Teléfono:* {tel}\n"
        f"✉️ *Email:* `{email}`\n"
        f"🏢 *Empresa:* {empresa}\n"
        f"{temp_emoji} *Temperatura:* {temperatura}\n\n"
        f"❓ *¿El correo electrónico es correcto?*"
    )
    keyboard = [[
        InlineKeyboardButton("✅  Sí, está correcto", callback_data="confirm_email"),
        InlineKeyboardButton("✏️  Corregir correo",   callback_data="correct_email"),
    ]]
    await update.message.reply_text(
        texto, parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ─── Pipeline completo ────────────────────────────────────────────────────────

async def _complete_flow(
    bot, prospect: dict, productos: list,
    propuesta: str, message, context=None
) -> None:
    """Baserow → PDF → Email → resumen al vendedor + botón de edición."""
    chat_id = message.chat.id
    nombre  = prospect.get("nombre")   or "Sin nombre"
    email   = (prospect.get("email")   or "").strip()
    tel     = prospect.get("telefono") or "—"
    empresa = prospect.get("empresa")  or "—"
    temperatura = prospect.get("temperatura", "Tibio")
    temp_emoji  = {"Caliente": "🔥", "Tibio": "🌡️", "Frío": "❄️"}.get(temperatura, "🌡️")

    # 1. Guardar en Baserow — capturamos el row_id
    await message.reply_text("💾 Guardando en base de datos...")
    row_id = None
    try:
        result = save_prospect(prospect)
        row_id = result.get("id") if result else None
        if row_id and context is not None:
            context.user_data["last_row_id"] = row_id
    except Exception as e:
        logger.error(f"Error guardando en Baserow: {e}")
        await message.reply_text(f"⚠️ No se pudo guardar en Baserow.\nError: {e}")

    # 2. Generar PDF
    await message.reply_text("📄 Generando propuesta PDF...")
    pdf_path = None
    try:
        pdf_path = generate_proposal_pdf(prospect, productos, propuesta)
    except Exception as e:
        logger.error(f"Error generando PDF: {e}")
        await message.reply_text(f"⚠️ No se pudo generar el PDF: {e}")

    # 3. Enviar email al prospecto
    email_enviado = False
    if email and email != "—":
        await message.reply_text(f"📧 Enviando email a {email}...")
        try:
            email_enviado = send_prospect_email(
                prospect, prospect.get("resumen", ""), pdf_path or "",
            )
        except Exception as e:
            logger.error(f"Error enviando email: {e}")
            await message.reply_text(f"⚠️ No se pudo enviar el email: {e}")
    else:
        await message.reply_text("⚠️ Sin correo registrado. Email no enviado.")

    # 4. Resumen final + botón de edición
    confirmacion = (
        f"✅ *Prospecto registrado*\n\n"
        f"👤 *Nombre:* {nombre}\n"
        f"📱 *Teléfono:* {tel}\n"
        f"✉️ *Email:* {email or '—'}\n"
        f"🏢 *Empresa:* {empresa}\n"
        f"{temp_emoji} *Temperatura:* {temperatura}\n\n"
        f"{'📧 Email enviado ✓' if email_enviado else '📧 Email no enviado'}\n"
        f"{'📄 PDF generado ✓' if pdf_path else '📄 PDF no generado'}\n"
        f"💾 Guardado en base de datos"
    )

    # Botón de edición si tenemos el row_id
    keyboard = None
    if row_id:
        keyboard = InlineKeyboardMarkup([[
            InlineKeyboardButton("✏️ Corregir un dato", callback_data=f"edit_start:{row_id}"),
        ]])

    await message.reply_text(confirmacion, parse_mode="Markdown", reply_markup=keyboard)

    # 4b. Recordatorio de seguimiento si la IA detectó fecha
    if prospect.get("fecha_seguimiento"):
        await message.reply_text(
            f"📅 *Recordatorio de seguimiento detectado:*\n"
            f"🗓️ Cuándo: {prospect['fecha_seguimiento']}\n"
            f"📋 Acción: {prospect.get('accion_seguimiento', 'Contactar')}",
            parse_mode="Markdown",
        )

    # 5. Enviar PDF por Telegram al vendedor
    if pdf_path and os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            await bot.send_document(
                chat_id=chat_id,
                document=f,
                filename=os.path.basename(pdf_path),
                caption=f"📎 Propuesta para {nombre}",
            )
        os.remove(pdf_path)

    # 6. Cotización automática si el lead es Caliente
    if temperatura == "Caliente" and email:
        try:
            from cotizacion_auto import enviar_cotizacion_email
            cotizacion_enviada = enviar_cotizacion_email(prospect)
            if cotizacion_enviada:
                await message.reply_text(
                    "🔥 *Lead Caliente detectado*\n\n"
                    "📄 Cotización de Goodman Tech enviada automáticamente\n"
                    f"✉️ Enviada a: {email}",
                    parse_mode="Markdown",
                )
        except Exception as e:
            logger.error(f"Error enviando cotizacion automatica: {e}")


# ─── Extracción y análisis ────────────────────────────────────────────────────

async def _process_text(
    bot, texto: str, update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    """Extrae datos con IA y muestra la pantalla de confirmación de correo."""
    await update.message.reply_text("🧠 Analizando con IA...")
    prospect = extract_prospect_data(texto)

    productos = []

    propuesta = generate_proposal(prospect, productos)
    prospect["propuesta"]  = propuesta
    prospect["transcript"] = texto

    context.user_data["pending_prospect"]  = prospect
    context.user_data["pending_productos"] = productos
    context.user_data["pending_propuesta"] = propuesta
    context.user_data["awaiting_email"]    = False

    await _ask_email_confirmation(update, prospect)


# ─── Callback handler (todos los botones inline) ──────────────────────────────

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Procesa todos los botones inline: confirmación de correo + flujo de edición."""
    query = update.callback_query
    await query.answer()
    data = query.data

    # ── Confirmación de correo ──────────────────────────────────
    if data == "confirm_email":
        prospect = context.user_data.get("pending_prospect")
        if not prospect:
            await query.edit_message_text("⚠️ Sesión expirada. Envía nuevamente el audio o imagen.")
            return
        await query.edit_message_text("✅ Correo confirmado. Completando registro...")
        productos = context.user_data.get("pending_productos", [])
        propuesta = context.user_data.get("pending_propuesta", "")
        await _complete_flow(context.bot, prospect, productos, propuesta, query.message, context)
        _clear_pending(context)

    elif data == "correct_email":
        context.user_data["awaiting_email"] = True
        await query.edit_message_text(
            "✏️ *Escribe el correo electrónico correcto:*\n\n"
            "_(Usa el teclado de tu celular para escribirlo sin errores)_",
            parse_mode="Markdown",
        )

    # ── Inicio de edición ───────────────────────────────────────
    elif data.startswith("edit_start:"):
        row_id = int(data.split(":")[1])
        context.user_data["last_row_id"] = row_id
        # Obtener nombre del prospecto para el mensaje
        nombre = "el prospecto"
        try:
            ultimo = get_last_prospect()
            if ultimo and ultimo.get("id") == row_id:
                nombre = ultimo.get("Nombre") or "el prospecto"
        except Exception:
            pass
        await _show_edit_buttons(query.message, row_id, nombre)

    # ── Selección de campo a editar ─────────────────────────────
    elif data.startswith("edit_campo:"):
        _, row_id_str, campo = data.split(":", 2)
        row_id = int(row_id_str)

        if campo == "Temperatura":
            await _show_temp_buttons(query, row_id)
        else:
            context.user_data["awaiting_edit"]    = True
            context.user_data["editing_row_id"]   = row_id
            context.user_data["editing_field"]    = campo
            etiqueta = {
                "Nombre": "nombre completo",
                "Telefono": "número de teléfono",
                "Correo": "correo electrónico",
                "Empresa": "nombre de la empresa",
            }.get(campo, campo)
            await query.edit_message_text(
                f"✏️ *Escribe el {etiqueta} correcto:*",
                parse_mode="Markdown",
            )

    # ── Edición de temperatura (botones directos) ───────────────
    elif data.startswith("edit_temp:"):
        _, row_id_str, valor = data.split(":", 2)
        row_id = int(row_id_str)
        emoji  = {"Caliente": "🔥", "Tibio": "🌡️", "Frio": "❄️"}.get(valor, "")
        try:
            update_prospect(row_id, {"Seguimiento 1": valor})
            await query.edit_message_text(
                f"✅ *Temperatura actualizada:* {emoji} {valor}",
                parse_mode="Markdown",
            )
        except Exception as e:
            await query.edit_message_text(f"❌ No se pudo actualizar: {e}")

    # ── Cancelar edición ────────────────────────────────────────
    elif data == "edit_cancel":
        _clear_edit(context)
        await query.edit_message_text("❌ Edición cancelada.")


# ─── Comando /editar ──────────────────────────────────────────────────────────

async def handle_editar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Muestra el último prospecto con botones para editar cualquier campo."""
    await update.message.reply_text("🔎 Buscando último prospecto...")
    try:
        row = get_last_prospect()
    except Exception as e:
        await update.message.reply_text(f"❌ Error al consultar Baserow: {e}")
        return

    if not row:
        await update.message.reply_text("📭 No hay prospectos registrados aún.")
        return

    row_id   = row.get("id")
    nombre   = row.get("Nombre")   or "Sin nombre"
    empresa  = row.get("Empresa")  or "—"
    telefono = row.get("Telefono") or "—"
    correo   = row.get("Correo")   or "—"
    temp     = row.get("Seguimiento 1") or "—"

    await update.message.reply_text(
        f"👤 *Último prospecto:*\n\n"
        f"*Nombre:*      {nombre}\n"
        f"*Empresa:*     {empresa}\n"
        f"*Teléfono:*    {telefono}\n"
        f"*Correo:*      {correo}\n"
        f"*Temperatura:* {temp}\n\n"
        f"¿Qué deseas corregir?",
        parse_mode="Markdown",
    )
    await _show_edit_buttons(update.message, row_id, nombre)


# ─── Handlers de Telegram ────────────────────────────────────────────────────

async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text("🎙️ Audio recibido. Transcribiendo...")
    try:
        transcript = await download_and_transcribe(context.bot, update.message.voice.file_id)
        await update.message.reply_text(
            f"📝 *Transcripción:*\n_{transcript}_", parse_mode="Markdown"
        )
        await _process_text(context.bot, transcript, update, context)
    except Exception as e:
        logger.error(f"Error procesando audio: {e}", exc_info=True)
        await update.message.reply_text(f"❌ Error al procesar el audio: {e}")


async def handle_audio(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text("🎵 Archivo de audio recibido. Transcribiendo...")
    try:
        transcript = await download_and_transcribe(context.bot, update.message.audio.file_id)
        await update.message.reply_text(
            f"📝 *Transcripción:*\n_{transcript}_", parse_mode="Markdown"
        )
        await _process_text(context.bot, transcript, update, context)
    except Exception as e:
        logger.error(f"Error procesando audio: {e}", exc_info=True)
        await update.message.reply_text(f"❌ Error al procesar el audio: {e}")


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text("📸 Imagen recibida. Extrayendo información...")
    try:
        file_id   = update.message.photo[-1].file_id
        extracted = await download_and_analyze(context.bot, file_id)
        caption = (update.message.caption or "").strip()
        if caption:
            extracted = f"{extracted}\n\nNOTA DEL VENDEDOR: {caption}"
        await update.message.reply_text(
            f"🔍 *Texto extraído:*\n_{extracted[:300]}{'...' if len(extracted) > 300 else ''}_",
            parse_mode="Markdown",
        )
        await _process_text(context.bot, extracted, update, context)
    except Exception as e:
        logger.error(f"Error procesando imagen: {e}", exc_info=True)
        await update.message.reply_text(f"❌ Error al procesar la imagen: {e}")


async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    doc  = update.message.document
    mime = doc.mime_type or ""
    if mime.startswith("image/"):
        await update.message.reply_text("🖼️ Documento de imagen recibido. Extrayendo información...")
        try:
            extracted = await download_and_analyze(context.bot, doc.file_id)
            await update.message.reply_text(
                f"🔍 *Texto extraído:*\n_{extracted[:300]}{'...' if len(extracted) > 300 else ''}_",
                parse_mode="Markdown",
            )
            await _process_text(context.bot, extracted, update, context)
        except Exception as e:
            logger.error(f"Error procesando documento imagen: {e}", exc_info=True)
            await update.message.reply_text(f"❌ Error al procesar el documento: {e}")
    else:
        await update.message.reply_text(
            "⚠️ Solo proceso imágenes y audios. Envía una foto o mensaje de voz."
        )


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Maneja texto plano — corrección de correo, edición de campos, o nota nueva."""
    texto = update.message.text.strip()

    if texto.startswith("/"):
        return

    # ── ¿Esperando correo corregido? ───────────────────────────
    if context.user_data.get("awaiting_email"):
        prospect = context.user_data.get("pending_prospect")
        if prospect:
            email_limpio = texto.lower().strip()
            if "@" in email_limpio and "." in email_limpio.split("@")[-1]:
                prospect["email"] = email_limpio
                context.user_data["awaiting_email"] = False
                await update.message.reply_text(
                    f"✅ Correo actualizado: `{email_limpio}`", parse_mode="Markdown"
                )
                productos = context.user_data.get("pending_productos", [])
                propuesta = context.user_data.get("pending_propuesta", "")
                await _complete_flow(context.bot, prospect, productos, propuesta, update.message, context)
                _clear_pending(context)
            else:
                await update.message.reply_text(
                    "⚠️ Ese no parece un correo válido. Intenta de nuevo.\n"
                    "Ejemplo: _nombre@empresa.com_",
                    parse_mode="Markdown",
                )
        return

    # ── ¿Esperando valor de campo editado? ─────────────────────
    if context.user_data.get("awaiting_edit"):
        row_id = context.user_data.get("editing_row_id")
        campo  = context.user_data.get("editing_field")

        if row_id and campo:
            # Validación básica de correo
            if campo == "Correo" and ("@" not in texto or "." not in texto.split("@")[-1]):
                await update.message.reply_text(
                    "⚠️ Ese no parece un correo válido. Intenta de nuevo.",
                    parse_mode="Markdown",
                )
                return

            try:
                update_prospect(row_id, {campo: texto.strip()})
                etiqueta = {
                    "Nombre": "Nombre", "Telefono": "Teléfono",
                    "Correo": "Correo", "Empresa": "Empresa",
                }.get(campo, campo)
                await update.message.reply_text(
                    f"✅ *{etiqueta}* actualizado:\n`{texto.strip()}`",
                    parse_mode="Markdown",
                )
            except Exception as e:
                await update.message.reply_text(f"❌ No se pudo actualizar: {e}")

            _clear_edit(context)
        return

    # ── Texto libre → procesar como nota del vendedor ──────────
    await update.message.reply_text("📝 Nota de texto recibida. Procesando...")
    await _process_text(context.bot, texto, update, context)


async def handle_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "👋 *Bienvenido al asistente de captura de prospectos*\n\n"
        "📍 *Stand 432 — Expo Empaques, Monterrey*\n\n"
        "Puedes enviarme:\n"
        "🎙️ *Audio* — describe la conversación con el prospecto\n"
        "📸 *Foto* — tarjeta de presentación o formulario\n"
        "📝 *Texto* — escribe los datos del prospecto\n\n"
        "El sistema automáticamente:\n"
        "✅ Extrae nombre, teléfono, email y empresa\n"
        "✅ Te pide *confirmar el correo* antes de enviar\n"
        "✅ Permite *corregir cualquier dato* después\n"
        "✅ Genera una propuesta PDF personalizada\n"
        "✅ Envía el email al prospecto\n"
        "✅ Guarda todo en la base de datos\n\n"
        "Escribe /menu para ver todos los comandos.",
        parse_mode="Markdown",
    )
