# 🤖 Cómo instalar el Bot de Expo en una Mac Mini
### Guía paso a paso — sin conocimientos técnicos

---

## ✅ Antes de empezar, necesitas tener esto a la mano:

| Qué | Para qué sirve | Dónde conseguirlo |
|---|---|---|
| Token de Telegram | Es el "nombre" de tu bot | @BotFather en Telegram |
| API Key de Anthropic | La IA que lee y entiende los datos | console.anthropic.com |
| API Key de OpenAI | Transcribe los audios a texto | platform.openai.com |
| Correo Gmail + Contraseña de App | Manda los emails automáticos | myaccount.google.com → Seguridad → Contraseñas de aplicación |
| Token de Baserow | Guarda los prospectos en la base de datos | baserow.io → Tu cuenta → API Tokens |
| ID de la tabla Baserow | El número de la tabla donde se guardan | Lo ves en la URL de Baserow |

---

## PASO 1 — Abrir la terminal en la Mac Mini

1. Haz clic en la lupa 🔍 (esquina superior derecha de la pantalla)
2. Escribe: `Terminal`
3. Presiona **Enter**

> Se abre una ventana negra con texto. Eso es la terminal. Aquí es donde escribiremos los comandos.

---

## PASO 2 — Descargar el bot desde internet

Copia y pega este comando en la terminal, luego presiona **Enter**:

```bash
git clone https://github.com/IAingenieria/-expo-bot-goodmantech.git /Users/macmini/ExpoBot
```

✅ Cuando termine verás: `Cloning into '/Users/macmini/ExpoBot'...`

---

## PASO 3 — Entrar a la carpeta del bot

```bash
cd /Users/macmini/ExpoBot
```

> Piénsalo como "abrir la carpeta" del bot.

---

## PASO 4 — Crear el entorno virtual (solo la primera vez)

Este paso instala las herramientas que necesita el bot sin afectar el resto de la computadora:

```bash
python3 -m venv venv
```

Luego "activa" ese entorno:

```bash
source venv/bin/activate
```

✅ Sabes que funcionó cuando ves `(venv)` al inicio de la línea en la terminal.

---

## PASO 5 — Instalar las dependencias del bot

```bash
pip install -r requirements.txt
```

> Esto descarga todos los programas que necesita el bot. Puede tardar 1-2 minutos.

✅ Al terminar verás: `Successfully installed ...`

---

## PASO 6 — Crear el archivo de credenciales (.env)

Este archivo guarda tus contraseñas y API keys. **Nunca lo compartas con nadie.**

Copia este comando, **reemplaza cada valor con el tuyo real**, y presiona Enter:

```bash
cat > /Users/macmini/ExpoBot/.env << 'EOF'
TELEGRAM_BOT_TOKEN=aqui_va_tu_token_de_telegram
ANTHROPIC_API_KEY=aqui_va_tu_api_key_de_anthropic
OPENAI_API_KEY=aqui_va_tu_api_key_de_openai
GMAIL_USER=tucorreo@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
BASEROW_API_URL=https://api.baserow.io
BASEROW_API_TOKEN=aqui_va_tu_token_de_baserow
BASEROW_TABLE_ID=000000
EOF
```

> ⚠️ El BASEROW_TABLE_ID es un número. Lo encuentras en la URL de tu tabla en Baserow.
> ⚠️ El GMAIL_APP_PASSWORD son 16 letras (con espacios está bien, ej: `abcd efgh ijkl mnop`)

---

## PASO 7 — Crear el archivo de configuración del cliente

Este archivo tiene los datos de la empresa y el evento. Primero crea una copia del ejemplo:

```bash
cp /Users/macmini/ExpoBot/config_cliente.example.json /Users/macmini/ExpoBot/config_cliente.json
```

Luego ábrelo para editarlo:

```bash
nano /Users/macmini/ExpoBot/config_cliente.json
```

Verás algo así. **Cambia cada línea con los datos reales de tu cliente:**

```json
{
  "empresa": "Nombre de la empresa",
  "giro": "A qué se dedica la empresa",
  "contacto_nombre": "Tu nombre",
  "contacto_tel": "81 1234 5678",
  "contacto_email": "correo@empresa.com",
  "contacto_web": "www.empresa.com",
  "logo": "logo.png",
  "color_primario": "1565C0",
  "expo_nombre": "Nombre del evento",
  "expo_stand": "432",
  "expo_ciudad": "Monterrey",
  "expo_venue": "Cintermex",
  "bienvenida": "Bienvenido al Stand 432 de [Empresa] en [Evento]. Manda un audio, foto o texto.",
  "productos_ejemplo": ["producto1", "producto2", "servicio1"]
}
```

Para guardar y salir del editor:
1. Presiona `Ctrl + O` → luego **Enter** (guarda)
2. Presiona `Ctrl + X` (sale del editor)

---

## PASO 8 — Copiar el logo del cliente

El logo debe llamarse igual que pusiste en `"logo"` del paso anterior.
Cópialo a la carpeta del bot:

```bash
cp /ruta/donde/esta/tu/logo.png /Users/macmini/ExpoBot/logo.png
```

> Si no tienes logo aún, sáltate este paso. El bot funcionará igual, solo el PDF no tendrá logo.

---

## PASO 9 — Probar que el bot funciona

```bash
cd /Users/macmini/ExpoBot
source venv/bin/activate
python3 bot.py
```

✅ Si todo está bien verás algo como:
```
Bot iniciado correctamente.
Escuchando mensajes...
```

Abre Telegram, busca tu bot y escribe `/start`. Debe responder con el mensaje de bienvenida.

Para detenerlo: presiona `Ctrl + C`

---

## PASO 10 — Configurar el arranque automático (LaunchAgent)

Este paso hace que el bot se encienda solo cada vez que la Mac Mini se reinicia, sin que tengas que hacer nada.

### 10a. Crear el archivo de autostart:

```bash
cat > ~/Library/LaunchAgents/com.goodmantech.expobot.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.goodmantech.expobot</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/macmini/ExpoBot/venv/bin/python3</string>
        <string>/Users/macmini/ExpoBot/bot.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/macmini/ExpoBot</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/macmini/ExpoBot/bot.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/macmini/ExpoBot/bot.error.log</string>
</dict>
</plist>
EOF
```

### 10b. Activar el autostart:

```bash
launchctl load ~/Library/LaunchAgents/com.goodmantech.expobot.plist
```

### 10c. Verificar que está corriendo:

```bash
launchctl list | grep goodmantech
```

✅ Si ves un número (PID) en la primera columna, el bot está corriendo. Si ves `-`, algo falló.

---

## 🔧 Comandos útiles del día a día

| Qué quieres hacer | Comando |
|---|---|
| Ver si el bot está corriendo | `launchctl list \| grep goodmantech` |
| Ver los logs en tiempo real | `tail -f /Users/macmini/ExpoBot/bot.log` |
| Ver errores | `tail -f /Users/macmini/ExpoBot/bot.error.log` |
| Detener el bot | `launchctl unload ~/Library/LaunchAgents/com.goodmantech.expobot.plist` |
| Volver a encender el bot | `launchctl load ~/Library/LaunchAgents/com.goodmantech.expobot.plist` |
| Actualizar el bot (después de un cambio) | `cd /Users/macmini/ExpoBot && git pull origin main` |
| Matar todos los procesos bot.py | `pkill -f bot.py` |

---

## ❌ Errores comunes y cómo resolverlos

### "409 Conflict" en los logs
**Qué significa:** Hay dos bots corriendo al mismo tiempo con el mismo token.
**Solución:**
```bash
pkill -f bot.py
launchctl unload ~/Library/LaunchAgents/com.goodmantech.expobot.plist
sleep 3
launchctl load ~/Library/LaunchAgents/com.goodmantech.expobot.plist
```

### "ModuleNotFoundError" al iniciar
**Qué significa:** Las dependencias no están instaladas en el entorno virtual.
**Solución:**
```bash
cd /Users/macmini/ExpoBot
source venv/bin/activate
pip install -r requirements.txt
```

### "401 Unauthorized" en Baserow
**Qué significa:** El token de Baserow en el `.env` está mal o venció.
**Solución:** Ve a baserow.io, genera un nuevo token y actualiza el `.env`:
```bash
nano /Users/macmini/ExpoBot/.env
```

### El bot no responde en Telegram
**Qué significa:** El bot no está corriendo.
**Solución:** Revisa los logs:
```bash
tail -20 /Users/macmini/ExpoBot/bot.error.log
```

---

## 📞 Soporte

Si algo falla y no sabes qué hacer:

**Goodman Tech**
📞 81 2635 0902
✉️ info@goodmantech.com.mx
🌐 www.goodmantech.com.mx

---

*Documento generado por Goodman Tech — Sistema Bot Expo Inteligente v2.0*
