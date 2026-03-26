# CONTEXT.md — Bot de Captura de Prospectos Expo Empaques 2026
> Este archivo permite a cualquier agente de Claude entender el proyecto completo y autoconfigurarse sin necesidad de contexto previo.
> **Última actualización:** 26/03/2026 — Versión 2.0

---

## 1. ¿Qué es este proyecto?

Un **bot de Telegram con IA** desplegado en un stand de exposición comercial. Su propósito es capturar prospectos (clientes potenciales) en tiempo real durante la **Expo Empaques 2026**, en el **Stand 432 del Cintermex, Monterrey, México**.

El vendedor en el stand puede:
- Mandar un **audio** describiendo la conversación → transcripción + extracción de datos con IA
- Mandar una **foto de tarjeta de presentación** → OCR + extracción de datos con IA
- Mandar una **foto con caption** → OCR + nota del vendedor combinados (modo express)
- Escribir **texto libre** con los datos del prospecto

El sistema automáticamente:
1. Transcribe audio con OpenAI Whisper
2. Extrae datos con Claude IA (nombre, tel, email, empresa, temperatura, seguimiento)
3. Genera **resumen ejecutivo profesional** (NO repite la transcripción)
4. Pide confirmación/corrección del correo antes de guardar
5. Guarda el prospecto en Baserow (base de datos en la nube)
6. Genera propuesta PDF personalizada
7. Envía email de seguimiento al prospecto con PDF adjunto
8. Si lead es **Caliente** → envía cotización de Goodman Tech automáticamente
9. Permite editar cualquier dato después del registro

---

## 2. Contexto de negocio

| Campo | Valor |
|-------|-------|
| **Desarrollador** | Goodman Tech — Luis Vilchis / Olegario Ríos, Monterrey NL |
| **Evento** | Expo Empaques 2026 |
| **Stand** | 432 |
| **Venue** | Cintermex, Monterrey |
| **Precio del sistema** | $8,000 MXN + IVA (setup) + $1,500/evento |

---

## 3. Stack tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Bot de mensajería | Python + python-telegram-bot v21.6 |
| IA extracción de datos | Anthropic Claude Sonnet (claude-sonnet-4-6) |
| Transcripción de audio | OpenAI Whisper (whisper-1) |
| OCR / análisis de imágenes | Anthropic Claude Vision |
| Base de datos | Baserow cloud (tabla 903450) |
| Generación de PDF | fpdf2 |
| Envío de email | Gmail SMTP + App Password |
| **Hosting** | **Mac Mini 2014 — usuario: macmini — IP local: 192.168.1.127** |
| Autostart | LaunchAgent macOS (`com.goodmantech.expobot.plist`) |
| Python | 3.14 (requiere fix de event loop — ver sección 12) |

---

## 4. Arquitectura de archivos

```
/Users/macmini/Documents/Claude Code/Expo Cintermex/
│
├── bot.py               # Punto de entrada. Registra handlers y comandos
├── config.py            # Variables de entorno. GT_TELEFONO/EMAIL/WEBSITE/LOGO
├── handlers.py          # Flujo completo: media → IA → confirmación → edición
├── commands.py          # Master Menu: /menu /revisar /hoy /exportar /ultimo /buscar
├── baserow_client.py    # API REST Baserow: guardar, consultar, actualizar, CSV
├── ai_processor.py      # Claude: extracción + resumen ejecutivo + propuesta
├── audio_handler.py     # Telegram audio → OpenAI Whisper → texto
├── image_handler.py     # Telegram imagen → Claude Vision → texto
├── pdf_generator.py     # Propuesta PDF con fpdf2 (colores Goodman Tech)
├── email_sender.py      # Email al prospecto (Gmail SMTP, footer Goodman Tech)
├── cotizacion_auto.py   # PDF cotización $8,000 MXN para leads Calientes
│
├── goodman_logo.png     # Logo Goodman Tech (pájaro multicolor, fondo azul)
├── .env                 # Variables de entorno (NO subir a git)
├── requirements.txt     # Dependencias Python
├── CONTEXT.md           # Este archivo
│
├── Cotizacion_Sistema_Telegram.docx  # Cotización vendible a clientes
└── bot.log / bot.error.log           # Logs del LaunchAgent
```

---

## 5. Variables de entorno (.env)

```env
TELEGRAM_BOT_TOKEN=8650243800:AAHA3Ep2zPyO2N0o5n1l7BiKoIMTmfbmNkI
ANTHROPIC_API_KEY=<sk-ant-api03-PVdX...>   # Cuenta: esg.mexico.mx@gmail.com
OPENAI_API_KEY=<sk-proj-JjzdZ...>
GMAIL_USER=3dlasheslv2@gmail.com
GMAIL_APP_PASSWORD=tvpd kjjf caag fwhc
BASEROW_API_URL=https://api.baserow.io
BASEROW_API_TOKEN=ixblKWjB8t1KgYGf8Rls3zuwr2jctPYL
BASEROW_TABLE_ID=903450
```

---

## 6. Baserow — Estructura de la tabla

**Base de datos:** Cuadricula 204305 — **Tabla:** Datos Expos (ID: `903450`)
**Token API:** `ixblKWjB8t1KgYGf8Rls3zuwr2jctPYL` (nombre: "Bot Expo", permisos completos)

| Campo | Tipo Baserow | Descripción |
|-------|-------------|-------------|
| `Nombre` | Single line text | Nombre completo del prospecto |
| `Telefono` | Number | Solo dígitos. El bot limpia caracteres no numéricos antes de guardar |
| `Correo` | Email | Correo electrónico |
| `Empresa` | Single line text | Nombre de la empresa |
| `Resumen` | Long text | Resumen ejecutivo IA + temperatura + seguimiento |
| `Fecha actual` | Date | Fecha captura. Formato: YYYY-MM-DD |
| `Seguimiento 1` | **Single line text** ⚠️ | Temperatura + fecha + acción. Ej: "Caliente \| Seguimiento: 2026-04-01 \| Acción: llamar" |

> ⚠️ **CRÍTICO:** `Seguimiento 1` debe ser tipo **Single line text** (NO Date). Si es Date, el POST da error 400.
> ⚠️ `Telefono` es campo **Number** — enviar string vacío `""` causa error 400. Usar `None` si no hay teléfono.
> ⚠️ Siempre usar `?user_field_names=true` en el POST, no solo en el GET.

---

## 7. Sistema de calidad de leads (estrellas)

| ⭐ | Criterio |
|----|---------|
| ⭐ | Solo empresa registrada |
| ⭐⭐ | Nombre + teléfono |
| ⭐⭐⭐ | Empresa + nombre + correo |
| ⭐⭐⭐⭐ | Empresa + nombre + correo + teléfono |
| ⭐⭐⭐⭐⭐ | Todo completo + `Seguimiento 1` contiene "caliente" |

---

## 8. Flujo completo del bot

```
VENDEDOR manda audio / foto / texto
           ↓
[audio_handler / image_handler] — transcripción / OCR
           ↓
[ai_processor] — Claude genera:
  - nombre, tel, email, empresa, cargo
  - resumen EJECUTIVO (3-4 oraciones, NO repite transcripción)
  - temperatura (Caliente/Tibio/Frío)
  - fecha_seguimiento + accion_seguimiento
           ↓
Bot muestra resumen + pregunta correo:
  ┌─────────────────────────────────────┐
  │ ¿El correo es correcto?             │
  │ [✅ Sí, está correcto] [✏️ Corregir]│
  └─────────────────────────────────────┘
           ↓ (confirmado o corregido)
[baserow_client] — save_prospect() → tabla 903450
  - Telefono: solo dígitos o None
  - Seguimiento 1: "Temperatura | Seguimiento: fecha | Acción: accion"
           ↓
[pdf_generator] — genera propuesta PDF (colores Goodman Tech #1565C0)
           ↓
[email_sender] — email al prospecto con PDF
  - Footer: "Generado con IA — Goodman Tech — www.goodmantech.com.mx"
           ↓
Si temperatura == "Caliente":
  [cotizacion_auto] → PDF cotización $8,000 MXN → email al prospecto
           ↓
Bot muestra resumen final + botones:
  [✏️ Corregir un dato]
           ↓ (opcional)
Bot detecta seguimiento → mensaje adicional:
  "📅 Recordatorio: [fecha] — Acción: [accion]"
```

---

## 9. Comandos del Master Menu

| Comando | Función |
|---------|---------|
| `/start` | Mensaje de bienvenida |
| `/menu` | Master Menu con todos los comandos |
| `/ayuda` | Igual que /menu |
| `/revisar` | Stats: total prospectos, estrellas, % datos, calientes |
| `/hoy` | Prospectos capturados hoy |
| `/ultimo` | Último prospecto registrado |
| `/buscar [nombre]` | Busca prospecto por nombre o empresa en Baserow |
| `/editar` | Editar campos del último prospecto (botones inline) |
| `/exportar` | Genera y envía CSV para Excel |
| `/cancelar` | Cancela el flujo actual (limpia pending) |
| `/reset` | Reinicia completamente el estado del bot |

> Footer del /ayuda: "🤖 Sistema desarrollado con IA por Goodman Tech — www.goodmantech.com.mx — 81 2635 0902"

---

## 10. Manejo de estado (context.user_data)

| Clave | Tipo | Cuándo se usa |
|-------|------|---------------|
| `pending_prospect` | dict | Datos extraídos esperando confirmación |
| `pending_productos` | list | Siempre `[]` (productos externos eliminados) |
| `pending_propuesta` | str | Texto de propuesta generada |
| `awaiting_email` | bool | True cuando espera correo corregido por teclado |
| `last_row_id` | int | ID Baserow del último prospecto guardado |
| `awaiting_edit` | bool | True cuando espera valor de campo a editar |
| `editing_row_id` | int | ID del registro que se está editando |
| `editing_field` | str | Nombre del campo Baserow que se edita |

---

## 11. Callback data — botones inline

| callback_data | Acción |
|--------------|--------|
| `confirm_email` | Correo confirmado → completa el pipeline |
| `correct_email` | Activa `awaiting_email = True` |
| `edit_start:{row_id}` | Muestra menú de campos editables |
| `edit_campo:{row_id}:{campo}` | Selecciona campo a editar |
| `edit_temp:{row_id}:{valor}` | Cambia temperatura directamente |
| `edit_cancel` | Cancela edición |

---

## 12. Problemas conocidos y soluciones aplicadas

### Python 3.14 — sin event loop automático
```python
if __name__ == "__main__":
    asyncio.set_event_loop(asyncio.new_event_loop())
    main()
```

### Baserow 400 — campo Telefono vacío
```python
telefono_limpio = "".join(filter(str.isdigit, str(telefono_raw))) or None
```

### PDF — "Not enough horizontal space"
```python
# Usar epw (effective page width) en lugar de 0
self.cell(self.epw, 8, title, ...)
self.multi_cell(self.epw - 38, 6, value)
```

### Baserow POST sin user_field_names
```python
# CORRECTO:
requests.post(_rows_url(TABLE) + "?user_field_names=true", ...)
# INCORRECTO (datos se guardan en campos vacíos):
requests.post(_rows_url(TABLE), ...)
```

---

## 13. Autostart en Mac Mini (LaunchAgent)

**Archivo:** `/Users/macmini/Library/LaunchAgents/com.goodmantech.expobot.plist`

```bash
# Iniciar
launchctl load /Users/macmini/Library/LaunchAgents/com.goodmantech.expobot.plist

# Detener
launchctl unload /Users/macmini/Library/LaunchAgents/com.goodmantech.expobot.plist

# Verificar estado (número = PID activo, "-" = caído)
launchctl list | grep goodmantech

# Ver logs
tail -50 "/Users/macmini/Documents/Claude Code/Expo Cintermex/bot.error.log"
tail -50 "/Users/macmini/Documents/Claude Code/Expo Cintermex/bot.log"
```

> El bot arranca automáticamente al prender la Mac Mini.
> Si aparece `-  1  com.goodmantech.expobot` = error, revisar bot.error.log

---

## 14. Migración Dell → Mac Mini (SCP)

Para copiar archivos actualizados desde la Dell a la Mac Mini:

```powershell
# Archivo individual
scp "C:\Users\Dell\Documents\CLAUDE DESKTOP\Expo Cintermex\archivo.py" "macmini@192.168.1.127:/Users/macmini/Documents/Claude Code/Expo Cintermex/archivo.py"

# Siempre reiniciar después de copiar:
# (en Claude Code / Chano.Bot)
launchctl unload /Users/macmini/Library/LaunchAgents/com.goodmantech.expobot.plist
launchctl load /Users/macmini/Library/LaunchAgents/com.goodmantech.expobot.plist
sleep 3
launchctl list | grep goodmantech
```

---

## 15. Goodman Tech — Datos del desarrollador

| Campo | Valor |
|-------|-------|
| **Empresa** | Goodman Tech — Soluciones Tecnológicas |
| **Dueño** | Luis Vilchis / Olegario Ríos |
| **Ciudad** | Monterrey, NL, México |
| **Dirección** | Zuazua #114 Col. Centro, CP 64000 |
| **Tel** | 81 2635 0902 |
| **Email** | info@goodmantech.com.mx |
| **RFC** | GMT0000000XXX |
| **Banco** | Mercado Pago |
| **Beneficiario** | Guadalupe Salinas Baños |
| **CLABE** | 7229 6901 0455 5450 66 |
| **Color primario** | Azul `#1565C0` |
| **Logo** | `goodman_logo.png` (pájaro multicolor, fondo azul) |
| **Web** | www.goodmantech.com.mx |

---

## 16. Modelo de negocio — Precios del sistema

| Producto | Precio | Frecuencia |
|----------|--------|-----------|
| Setup inicial | $8,000 + IVA | Una sola vez |
| Licencia por evento | $1,500 + IVA | Por cada expo |
| Soporte técnico mensual | $500 + IVA | Opcional |
| Módulo extra (WhatsApp / Multi-vendedor) | $3,000 + IVA | À la carte |

> ⚠️ Los costos de APIs de IA (Claude + OpenAI) NO están incluidos. Se cobran por consumo (~$0.01-$0.05 USD por prospecto).
> 💡 Con 5 clientes recurrentes = $7,500 MXN/mes en licencias de evento.

---

## 17. Cotización del sistema (documento)

**Archivo:** `Cotizacion_Sistema_Telegram.docx`
- Branding Goodman Tech completo (logo + azul #1565C0)
- Tabla de 10 beneficios incluidos
- Tabla de precios con 4 planes
- Nota sobre tokens de IA por separado
- Condiciones de pago 50/50
- Datos bancarios Mercado Pago

---

## 18. Funciones implementadas (historial)

| Fecha | Función | Archivos |
|-------|---------|---------|
| 25/03/2026 | Bot base: audio + foto + texto → Baserow + email + PDF | Todos |
| 25/03/2026 | Verificación de correo con botones inline | handlers.py |
| 25/03/2026 | Master Menu completo | commands.py, bot.py |
| 25/03/2026 | Sistema de estrellas (calidad de leads) | baserow_client.py |
| 25/03/2026 | /exportar CSV para Excel | commands.py |
| 25/03/2026 | /editar prospecto (botones + texto) | handlers.py |
| 25/03/2026 | Detección de seguimiento con IA | ai_processor.py |
| 25/03/2026 | Cotización automática para leads Calientes | cotizacion_auto.py |
| 26/03/2026 | Migración Dell → Mac Mini con autostart LaunchAgent | plist |
| 26/03/2026 | Fix Baserow: user_field_names=true en POST | baserow_client.py |
| 26/03/2026 | Fix Telefono: solo dígitos o None | baserow_client.py |
| 26/03/2026 | Fix Seguimiento 1: cambiar a Single line text en Baserow | (manual) |
| 26/03/2026 | Fix PDF: márgenes con epw | pdf_generator.py |
| 26/03/2026 | Limpieza Lupront → Goodman Tech en todos los archivos | config.py, email_sender.py, pdf_generator.py |
| 26/03/2026 | IA: resumen ejecutivo profesional (no repite transcripción) | ai_processor.py |
| 26/03/2026 | /buscar, /cancelar, /reset, /ayuda | commands.py, handlers.py, bot.py |
| 26/03/2026 | Footer email: "Generado con IA — Goodman Tech" | email_sender.py |
| 26/03/2026 | Cotización DOCX actualizada con precios y logo | Cotizacion_Sistema_Telegram.docx |

---

## 19. Pendientes / ideas futuras

- [ ] Soporte multi-usuario (varios vendedores en el stand)
- [ ] Webhook en lugar de polling para producción
- [ ] Panel web con Baserow embebido
- [ ] Integración con WhatsApp Business API
- [ ] Bot genérico configurable con `config_cliente.json`
- [ ] Onboarding automatizado en 15 minutos
