"""
Comandos del Master Menu del bot.
/menu | /revisar | /hoy | /exportar | /ultimo
"""
import io
import logging
from datetime import date
from telegram import Update
from telegram.ext import ContextTypes

from baserow_client import (
    get_all_prospects,
    get_prospects_today,
    get_last_prospect,
    calcular_estrellas,
    generar_csv,
    search_prospects,
)
from config import EXPO_NOMBRE, EXPO_STAND

logger = logging.getLogger(__name__)

ESTRELLA = {0: "Sin datos", 1: "⭐", 2: "⭐⭐", 3: "⭐⭐⭐", 4: "⭐⭐⭐⭐", 5: "⭐⭐⭐⭐⭐"}


# ─── /menu ────────────────────────────────────────────────────────────────────

async def handle_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Muestra el Master Menu de comandos disponibles."""
    await update.message.reply_text(
        f"🤖 *Asistente {EXPO_NOMBRE} — Stand {EXPO_STAND}*\n"
        "━━━━━━━━━━━━━━━━━━━━\n\n"
        "📥 *Captura de prospectos:*\n"
        "🎙️ Manda un *audio* — transcribe y guarda\n"
        "📸 Manda una *foto* — escanea tarjeta\n"
        "📝 Manda *texto* — nota manual\n\n"
        "📊 *Reportes:*\n"
        "/revisar — Calidad y resumen de todos los prospectos\n"
        "/hoy — Prospectos capturados hoy\n"
        "/ultimo — Ver el último prospecto registrado\n\n"
        "📤 *Exportar:*\n"
        "/exportar — Descargar lista completa en Excel (CSV)\n\n"
        "✏️ *Edición:*\n"
        "/editar — Corregir datos del último prospecto\n\n"
        "ℹ️ *Ayuda:*\n"
        "/menu — Este menú\n"
        "/cancelar — Cancela el flujo actual\n"
        "/reset — Reinicia el bot si se queda atorado\n"
        "/start — Bienvenida\n\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "🤖 _Sistema desarrollado con IA por_\n"
        "*Goodman Tech* — Soluciones Tecnológicas\n"
        "🌐 www.goodmantech.com.mx\n"
        "📞 81 2635 0902",
        parse_mode="Markdown",
    )


# ─── /revisar ─────────────────────────────────────────────────────────────────

async def handle_revisar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Muestra estadísticas y calidad de todos los prospectos."""
    await update.message.reply_text("🔍 Consultando base de datos...")

    try:
        prospectos = get_all_prospects()
    except Exception as e:
        await update.message.reply_text(f"❌ Error al consultar Baserow: {e}")
        return

    total = len(prospectos)
    if total == 0:
        await update.message.reply_text("📭 Aún no hay prospectos registrados.\n\nManda un audio o foto para comenzar.")
        return

    # Contar por estrellas
    conteo = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    con_email    = 0
    con_telefono = 0
    con_empresa  = 0
    calientes    = 0

    for row in prospectos:
        stars = calcular_estrellas(row)
        conteo[stars] += 1
        if (row.get("Correo")        or "").strip(): con_email    += 1
        if (row.get("Telefono")      or "").strip(): con_telefono += 1
        if (row.get("Empresa")       or "").strip(): con_empresa  += 1
        if "caliente" in (row.get("Seguimiento 1") or "").lower(): calientes += 1

    # Barra visual
    def barra(n, total, largo=10):
        if total == 0:
            return "⬜" * largo
        llenos = round((n / total) * largo)
        return "🟦" * llenos + "⬜" * (largo - llenos)

    lineas_estrellas = []
    for s in range(5, 0, -1):
        n = conteo[s]
        pct = round((n / total) * 100) if total else 0
        lineas_estrellas.append(
            f"{'⭐' * s}  {barra(n, total, 8)}  {n} ({pct}%)"
        )

    msg = (
        f"📊 *Calidad de Leads — {total} total*\n"
        f"📍 Stand {EXPO_STAND} | {date.today().strftime('%d/%m/%Y')}\n"
        f"━━━━━━━━━━━━━━━━━━━━\n\n"
        + "\n".join(lineas_estrellas) +
        f"\n\n"
        f"*Datos disponibles:*\n"
        f"🏢 Con empresa:  {con_empresa} ({round(con_empresa/total*100) if total else 0}%)\n"
        f"✉️  Con email:    {con_email} ({round(con_email/total*100) if total else 0}%)\n"
        f"📱 Con teléfono: {con_telefono} ({round(con_telefono/total*100) if total else 0}%)\n"
        f"🔥 Calientes:    {calientes} ({round(calientes/total*100) if total else 0}%)\n\n"
        f"*Escala de calidad:*\n"
        f"⭐ Solo empresa\n"
        f"⭐⭐ Nombre + teléfono\n"
        f"⭐⭐⭐ Empresa + nombre + email\n"
        f"⭐⭐⭐⭐ Todo completo\n"
        f"⭐⭐⭐⭐⭐ Todo + alta probabilidad de compra 🔥"
    )
    await update.message.reply_text(msg, parse_mode="Markdown")


# ─── /hoy ─────────────────────────────────────────────────────────────────────

async def handle_hoy(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Muestra los prospectos capturados hoy."""
    await update.message.reply_text("📅 Consultando prospectos de hoy...")

    try:
        prospectos = get_all_prospects()
        hoy = date.today().isoformat()
        prospectos_hoy = [r for r in prospectos if (r.get("Fecha actual") or "").startswith(hoy)]
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {e}")
        return

    if not prospectos_hoy:
        await update.message.reply_text(
            f"📭 Sin prospectos registrados hoy ({date.today().strftime('%d/%m/%Y')}).\n\n"
            "Manda un audio o foto para comenzar."
        )
        return

    lineas = [f"📅 *Prospectos de hoy — {len(prospectos_hoy)} registros*\n━━━━━━━━━━━━━━━━━━━━"]
    for i, row in enumerate(prospectos_hoy, 1):
        nombre   = row.get("Nombre")   or "Sin nombre"
        empresa  = row.get("Empresa")  or "—"
        telefono = row.get("Telefono") or "—"
        correo   = row.get("Correo")   or "—"
        stars    = "⭐" * calcular_estrellas(row) or "Sin datos"
        lineas.append(
            f"\n*{i}. {nombre}*  {stars}\n"
            f"   🏢 {empresa}\n"
            f"   📱 {telefono}\n"
            f"   ✉️  {correo}"
        )

    await update.message.reply_text("\n".join(lineas), parse_mode="Markdown")


# ─── /ultimo ──────────────────────────────────────────────────────────────────

async def handle_ultimo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Muestra el último prospecto registrado."""
    await update.message.reply_text("🔎 Buscando último prospecto...")

    try:
        row = get_last_prospect()
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {e}")
        return

    if not row:
        await update.message.reply_text("📭 No hay prospectos registrados aún.")
        return

    nombre   = row.get("Nombre")        or "Sin nombre"
    empresa  = row.get("Empresa")        or "—"
    telefono = row.get("Telefono")       or "—"
    correo   = row.get("Correo")         or "—"
    fecha    = row.get("Fecha actual")   or "—"
    stars    = "⭐" * calcular_estrellas(row) or "Sin datos"
    seg      = row.get("Seguimiento 1")  or "—"

    await update.message.reply_text(
        f"👤 *Último prospecto registrado*\n"
        f"━━━━━━━━━━━━━━━━━━━━\n\n"
        f"*Nombre:*   {nombre}\n"
        f"*Empresa:*  {empresa}\n"
        f"*Teléfono:* {telefono}\n"
        f"*Email:*    {correo}\n"
        f"*Fecha:*    {fecha}\n"
        f"*Calidad:*  {stars}\n"
        f"*Temperatura:* {seg}",
        parse_mode="Markdown",
    )


# ─── /exportar ────────────────────────────────────────────────────────────────

async def handle_exportar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Genera y envía un CSV con todos los prospectos (abre en Excel)."""
    await update.message.reply_text("📤 Generando archivo Excel (CSV)...")

    try:
        prospectos = get_all_prospects()
    except Exception as e:
        await update.message.reply_text(f"❌ Error al consultar Baserow: {e}")
        return

    if not prospectos:
        await update.message.reply_text("📭 No hay prospectos para exportar.")
        return

    try:
        csv_bytes = generar_csv(prospectos)
        nombre_archivo = f"prospectos_expo_{date.today().strftime('%Y%m%d')}.csv"

        await context.bot.send_document(
            chat_id=update.effective_chat.id,
            document=io.BytesIO(csv_bytes),
            filename=nombre_archivo,
            caption=(
                f"📊 *{len(prospectos)} prospectos exportados*\n"
                f"📅 {date.today().strftime('%d/%m/%Y')}\n\n"
                "💡 Abre el archivo en Excel para ver la lista completa."
            ),
            parse_mode="Markdown",
        )
    except Exception as e:
        logger.error(f"Error generando CSV: {e}")
        await update.message.reply_text(f"❌ No se pudo generar el archivo: {e}")


# ─── /buscar ──────────────────────────────────────────────────────────────────

async def handle_buscar(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Busca prospectos por nombre o empresa."""
    if not context.args:
        await update.message.reply_text("Uso: /buscar [nombre o empresa]")
        return

    termino = " ".join(context.args)
    await update.message.reply_text(f"🔍 Buscando: *{termino}*...", parse_mode="Markdown")

    try:
        resultados = search_prospects(termino)
    except Exception as e:
        await update.message.reply_text(f"❌ Error al buscar: {e}")
        return

    if not resultados:
        await update.message.reply_text("No se encontraron prospectos con ese nombre.")
        return

    lineas = [f"🔍 *Resultados para \"{termino}\" — {len(resultados)} encontrado(s)*\n━━━━━━━━━━━━━━━━━━━━"]
    for i, row in enumerate(resultados, 1):
        nombre   = row.get("Nombre")   or "Sin nombre"
        empresa  = row.get("Empresa")  or "—"
        telefono = row.get("Telefono") or "—"
        correo   = row.get("Correo")   or "—"
        stars    = "⭐" * calcular_estrellas(row) or "Sin datos"
        lineas.append(
            f"\n*{i}. {nombre}*  {stars}\n"
            f"   🏢 {empresa}\n"
            f"   📱 {telefono}\n"
            f"   ✉️  {correo}"
        )

    await update.message.reply_text("\n".join(lineas), parse_mode="Markdown")
