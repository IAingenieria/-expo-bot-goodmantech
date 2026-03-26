# 🤖 Bot Cintermex — Guía de Inicio Rápido

> **Goodman Tech** | Sistema Inteligente de Captura de Prospectos vía Telegram

---

## ¿Qué necesitas para hacer la prueba ahora mismo?

Solo **3 API Keys** para validar que el bot funciona:

| Variable | Dónde la obtienes | Tiempo estimado |
|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys | 2 min |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) → API Keys | 2 min |
| `TELEGRAM_BOT_TOKEN` | **Ya está en tu `.env`** ✅ | — |

> El Baserow token y el email de Gmail **no son necesarios para la prueba**. Los agregas después.

---

## PASO 1 — Instalar Python (si no lo tienes)

Abre el símbolo del sistema (CMD) y escribe:
```
python --version
```

Si aparece algo como `Python 3.11.x` ✅ ya lo tienes. Si no, descárgalo de **python.org** (versión 3.11 o superior). Al instalarlo activa la opción **"Add Python to PATH"**.

---

## PASO 2 — Instalar las dependencias

Abre CMD en la carpeta del proyecto y corre este comando:

```
cd "C:\Users\Dell\Documents\CLAUDE DESKTOP\Expo Cintermex"
pip install -r requirements.txt
```

Espera a que termine. Verás muchos textos instalándose — es normal.

---

## PASO 3 — Llenar el archivo `.env`

Abre el archivo `.env` que está en la carpeta del proyecto y llena las 3 variables necesarias para la prueba:

```
TELEGRAM_BOT_TOKEN=8650243800:AAHA3Ep2zPyO2N0o5n1l7BiKoIMTmfbmNkI   ← ya está

ANTHROPIC_API_KEY=sk-ant-...    ← pega tu key aquí
OPENAI_API_KEY=sk-proj-...      ← pega tu key aquí
```

Guarda el archivo.

---

## PASO 4 — Correr la prueba

En la misma ventana de CMD corre:

```
python test_bot.py
```

Si todo está bien verás:
```
✅ Variables OK. Iniciando bot de prueba...
   Abre Telegram, busca tu bot y envía /start
```

---

## PASO 5 — Probar en Telegram

1. Abre **Telegram** en tu celular o computadora
2. Busca tu bot por su nombre (el que configuraste en BotFather)
3. Escribe `/start` — el bot debe responder con un mensaje de bienvenida

### Prueba 1 — Audio (voz) 🎙️

Graba un mensaje de voz como si fuera una nota real del stand, por ejemplo:

> *"Me encontré con Luis Humberto García, director de operaciones de Empaques del Norte, su teléfono es 81 1234 5678, su correo es lhgarcia@empaquesdelnorte.com, le interesa conocer más sobre esmaltes industriales para sus líneas de producción, quedamos en enviarle una muestra la próxima semana"*

El bot te debe responder con:
- 📝 La transcripción exacta del audio
- 📊 Una síntesis con los datos del prospecto y temperatura del lead

### Prueba 2 — Imagen (tarjeta de presentación) 📸

Toma una foto de cualquier tarjeta de presentación o envía una imagen de prueba.

El bot te debe responder con:
- 🔍 Todo el texto extraído de la imagen
- 📊 Una síntesis con los datos identificados

---

## ¿Qué significan los resultados?

Si el bot responde correctamente a ambas pruebas, el sistema está **100% funcional** para los módulos de IA. Solo faltará completar el `.env` para activar el guardado en base de datos y el envío de emails.

---

## Variables completas del `.env` (para activar todo el sistema)

Una vez validada la prueba, agrega estas variables adicionales:

```env
# ── Gmail (para enviar emails automáticos al prospecto) ─────────────
GMAIL_USER=tu_correo@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
# Obtener en: Cuenta Google > Seguridad > Verificación en 2 pasos > Contraseñas de aplicaciones

# ── Baserow (base de datos en la nube) ─────────────────────────────
BASEROW_API_URL=https://api.baserow.io
BASEROW_API_TOKEN=tu_token_aqui
# Obtener en: Tu cuenta de Baserow > Settings > API Tokens

# ── Datos de Lupront (aparecen en el email y el PDF) ───────────────
LUPRONT_TELEFONO=+52 81 XXXX XXXX
LUPRONT_EMAIL=contacto@lupront.com
LUPRONT_WEBSITE=lupront.com
```

Una vez que tengas todo el `.env` completo, corre el sistema completo con:
```
python bot.py
```

---

## Si algo falla — Errores comunes

| Error | Causa | Solución |
|---|---|---|
| `ModuleNotFoundError` | Dependencias no instaladas | Corre `pip install -r requirements.txt` |
| `❌ Faltan variables en .env` | Keys no configuradas | Revisa el archivo `.env` |
| `Conflict: terminated by other getUpdates` | El bot ya está corriendo en otra ventana | Cierra la otra ventana CMD |
| `AuthenticationError` | Key de API incorrecta | Verifica que copiaste la key completa |
| El bot no responde en Telegram | Bot no iniciado o token incorrecto | Revisa que `python test_bot.py` esté corriendo |

---

## Archivos del proyecto

```
Expo Cintermex/
├── README_FIRST.md        ← Estás aquí
├── test_bot.py            ← Prueba rápida (solo 3 keys)
├── bot.py                 ← Sistema completo
├── .env                   ← Tus variables de configuración (llenar)
├── requirements.txt       ← Dependencias Python
│
├── handlers.py            ← Lógica principal del bot
├── ai_processor.py        ← Claude: extrae datos y genera propuestas
├── audio_handler.py       ← Transcripción con Whisper
├── image_handler.py       ← Lectura de imágenes con Claude Vision
├── baserow_client.py      ← Base de datos en la nube
├── pdf_generator.py       ← Generación de propuesta PDF
├── email_sender.py        ← Envío de correos automáticos
├── config.py              ← Configuración general
│
├── assets/
│   └── lupront_logo.png   ← Logo para el PDF (agregar aquí)
│
└── Cotizacion_Sistema_Telegram.docx  ← Cotización lista para imprimir
```

---

*Desarrollado por **Goodman Tech** — Soluciones Tecnológicas | Monterrey N.L.*
*info@goodmantech.com.mx | Tel: 81 2635 0902*
