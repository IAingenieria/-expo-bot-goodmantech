#!/bin/bash

clear
echo "============================================================"
echo "  GOODMAN TECH — Bot Expo Inteligente"
echo "  Instalador Automatico v1.0"
echo "  www.goodmantech.com.mx  /  81 2635 0902"
echo "============================================================"
echo ""
echo "Este instalador configurara tu bot de Telegram con IA"
echo "para capturar prospectos en tu exposicion."
echo ""
echo "ANTES DE CONTINUAR asegurate de tener:"
echo "  [1] Token de Telegram (de @BotFather)"
echo "  [2] API Key de Anthropic (console.anthropic.com)"
echo "  [3] API Key de OpenAI (platform.openai.com)"
echo "  [4] Gmail + Contrasena de aplicacion (16 letras)"
echo "  [5] Token y Table ID de Baserow"
echo ""
read -p "Presiona ENTER para continuar..."

INSTALL_DIR="$HOME/ExpoBot"

# ── Verificar Python ──────────────────────────────────────────
echo ""
echo "[1/6] Verificando Python..."
if ! command -v python3 &>/dev/null; then
    echo "ERROR: Python3 no instalado."
    echo "Mac: brew install python3  o  https://python.org"
    exit 1
fi
python3 --version
echo "Python OK"

# ── Verificar Git ─────────────────────────────────────────────
echo ""
echo "[2/6] Verificando Git..."
if ! command -v git &>/dev/null; then
    echo "ERROR: Git no instalado."
    echo "Mac: xcode-select --install"
    exit 1
fi
echo "Git OK"

# ── Descargar archivos del bot ────────────────────────────────
echo ""
echo "[3/6] Descargando archivos del bot desde GitHub..."
if [ -d "$INSTALL_DIR" ]; then
    echo "Actualizando instalacion existente..."
    cd "$INSTALL_DIR" && git pull origin main
else
    git clone https://github.com/IAingenieria/-expo-bot-goodmantech.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi
echo "Archivos en: $INSTALL_DIR"

# ── Instalar dependencias ─────────────────────────────────────
echo ""
echo "[4/6] Instalando dependencias Python..."
pip3 install -r requirements.txt --quiet
echo "Dependencias OK"

# ── Configurar datos del cliente ──────────────────────────────
echo ""
echo "[5/6] Configuracion del sistema..."
echo ""
echo "── DATOS DEL EVENTO ──────────────────────────────────────"
read -p "Nombre del evento (ej: Expo CAINTRA 2026): " EXPO_NOMBRE
read -p "Numero de stand (ej: 118): " EXPO_STAND
read -p "Ciudad (ej: Monterrey): " EXPO_CIUDAD
read -p "Venue/recinto (ej: Cintermex): " EXPO_VENUE
echo ""
echo "── TELEGRAM ──────────────────────────────────────────────"
read -p "Token de Telegram (@BotFather): " TELEGRAM_TOKEN
echo ""
echo "── INTELIGENCIA ARTIFICIAL ───────────────────────────────"
read -p "API Key Anthropic (sk-ant-...): " ANTHROPIC_KEY
read -p "API Key OpenAI (sk-proj-...): " OPENAI_KEY
echo ""
echo "── EMAIL ─────────────────────────────────────────────────"
read -p "Tu Gmail (tucorreo@gmail.com): " GMAIL_USER
read -p "Contrasena de aplicacion (16 letras): " GMAIL_PASS
echo ""
echo "── BASEROW ───────────────────────────────────────────────"
read -p "Token API de Baserow: " BASEROW_TOKEN
read -p "ID de la tabla Baserow (numero en la URL): " BASEROW_TABLE

# ── Crear .env ────────────────────────────────────────────────
cat > "$INSTALL_DIR/.env" <<EOF
TELEGRAM_BOT_TOKEN=$TELEGRAM_TOKEN
ANTHROPIC_API_KEY=$ANTHROPIC_KEY
OPENAI_API_KEY=$OPENAI_KEY
GMAIL_USER=$GMAIL_USER
GMAIL_APP_PASSWORD=$GMAIL_PASS
BASEROW_API_URL=https://api.baserow.io
BASEROW_API_TOKEN=$BASEROW_TOKEN
BASEROW_TABLE_ID=$BASEROW_TABLE
EXPO_NOMBRE=$EXPO_NOMBRE
EXPO_STAND=$EXPO_STAND
EXPO_CIUDAD=$EXPO_CIUDAD
EXPO_VENUE=$EXPO_VENUE
EOF
echo "Configuracion guardada OK"

# ── Autostart en Mac (LaunchAgent) ───────────────────────────
echo ""
echo "[6/6] Configurando inicio automatico en Mac..."

PLIST_PATH="$HOME/Library/LaunchAgents/com.goodmantech.expobot.plist"
PYTHON_PATH=$(which python3)

cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.goodmantech.expobot</string>
    <key>ProgramArguments</key>
    <array>
        <string>$PYTHON_PATH</string>
        <string>$INSTALL_DIR/bot.py</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$INSTALL_DIR/bot.log</string>
    <key>StandardErrorPath</key>
    <string>$INSTALL_DIR/bot.error.log</string>
</dict>
</plist>
EOF

launchctl load "$PLIST_PATH"
sleep 3

STATUS=$(launchctl list | grep goodmantech | awk '{print $1}')
if [ "$STATUS" != "-" ] && [ -n "$STATUS" ]; then
    echo "Bot iniciado automaticamente (PID: $STATUS)"
else
    echo "Iniciando bot manualmente..."
    cd "$INSTALL_DIR" && python3 bot.py &
fi

echo ""
echo "============================================================"
echo "  INSTALACION COMPLETADA"
echo "============================================================"
echo ""
echo "Tu bot esta corriendo. Abre Telegram y escribe /start"
echo ""
echo "Comandos utiles:"
echo "  Ver estado:  launchctl list | grep goodmantech"
echo "  Ver logs:    tail -f $INSTALL_DIR/bot.log"
echo "  Detener:     launchctl unload $PLIST_PATH"
echo ""
echo "Soporte: info@goodmantech.com.mx / 81 2635 0902"
echo "============================================================"
