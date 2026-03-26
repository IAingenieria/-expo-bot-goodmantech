@echo off
chcp 65001 >nul
cls

echo ============================================================
echo   GOODMAN TECH — Bot Expo Inteligente
echo   Instalador Automatico v1.0
echo   www.goodmantech.com.mx  /  81 2635 0902
echo ============================================================
echo.
echo Este instalador configurara tu bot de Telegram con IA
echo para capturar prospectos en tu exposicion.
echo.
echo ANTES DE CONTINUAR asegurate de tener:
echo   [1] Token de Telegram (de @BotFather)
echo   [2] API Key de Anthropic (console.anthropic.com)
echo   [3] API Key de OpenAI (platform.openai.com)
echo   [4] Gmail + Contrasena de aplicacion (16 letras)
echo   [5] Token y Table ID de Baserow
echo.
pause

:: ── Verificar Python ──────────────────────────────────────────
echo.
echo [1/6] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no esta instalado.
    echo Descargalo en: https://www.python.org/downloads/
    echo Marca la casilla "Add Python to PATH" al instalar.
    pause
    exit /b 1
)
python --version
echo Python OK

:: ── Verificar Git ─────────────────────────────────────────────
echo.
echo [2/6] Verificando Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git no esta instalado.
    echo Descargalo en: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo Git OK

:: ── Descargar archivos del bot ────────────────────────────────
echo.
echo [3/6] Descargando archivos del bot desde GitHub...
set INSTALL_DIR=%USERPROFILE%\ExpoBot
if exist "%INSTALL_DIR%" (
    echo Actualizando instalacion existente...
    cd "%INSTALL_DIR%"
    git pull origin main
) else (
    git clone https://github.com/IAingenieria/-expo-bot-goodmantech.git "%INSTALL_DIR%"
    cd "%INSTALL_DIR%"
)
echo Archivos descargados en: %INSTALL_DIR%

:: ── Instalar dependencias ─────────────────────────────────────
echo.
echo [4/6] Instalando dependencias Python...
pip install -r requirements.txt --quiet
echo Dependencias instaladas OK

:: ── Configurar datos del cliente ──────────────────────────────
echo.
echo [5/6] Configuracion del sistema...
echo.
echo ── DATOS DEL EVENTO ──────────────────────────────────────
set /p EXPO_NOMBRE="Nombre del evento (ej: Expo CAINTRA 2026): "
set /p EXPO_STAND="Numero de stand (ej: 118): "
set /p EXPO_CIUDAD="Ciudad (ej: Monterrey): "
set /p EXPO_VENUE="Venue/recinto (ej: Cintermex): "
echo.
echo ── TELEGRAM ──────────────────────────────────────────────
set /p TELEGRAM_TOKEN="Token de Telegram (@BotFather): "
echo.
echo ── INTELIGENCIA ARTIFICIAL ───────────────────────────────
set /p ANTHROPIC_KEY="API Key Anthropic (sk-ant-...): "
set /p OPENAI_KEY="API Key OpenAI (sk-proj-...): "
echo.
echo ── EMAIL ─────────────────────────────────────────────────
set /p GMAIL_USER="Tu Gmail (tucorreo@gmail.com): "
set /p GMAIL_PASS="Contrasena de aplicacion (16 letras sin espacios): "
echo.
echo ── BASEROW ───────────────────────────────────────────────
set /p BASEROW_TOKEN="Token API de Baserow: "
set /p BASEROW_TABLE="ID de la tabla Baserow (numero en la URL): "

:: ── Crear archivo .env ────────────────────────────────────────
echo.
echo Creando archivo de configuracion...
(
echo TELEGRAM_BOT_TOKEN=%TELEGRAM_TOKEN%
echo ANTHROPIC_API_KEY=%ANTHROPIC_KEY%
echo OPENAI_API_KEY=%OPENAI_KEY%
echo GMAIL_USER=%GMAIL_USER%
echo GMAIL_APP_PASSWORD=%GMAIL_PASS%
echo BASEROW_API_URL=https://api.baserow.io
echo BASEROW_API_TOKEN=%BASEROW_TOKEN%
echo BASEROW_TABLE_ID=%BASEROW_TABLE%
echo EXPO_NOMBRE=%EXPO_NOMBRE%
echo EXPO_STAND=%EXPO_STAND%
echo EXPO_CIUDAD=%EXPO_CIUDAD%
echo EXPO_VENUE=%EXPO_VENUE%
) > .env
echo Configuracion guardada OK

:: ── Crear acceso directo y arranque automatico ────────────────
echo.
echo [6/6] Configurando inicio automatico...

:: Crear script de inicio
(
echo @echo off
echo cd "%INSTALL_DIR%"
echo python bot.py
) > "%INSTALL_DIR%\iniciar_bot.bat"

:: Acceso directo en el escritorio
set SHORTCUT=%USERPROFILE%\Desktop\Bot Expo.lnk
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%SHORTCUT%');$s.TargetPath='%INSTALL_DIR%\iniciar_bot.bat';$s.WorkingDirectory='%INSTALL_DIR%';$s.Save()"

echo Acceso directo creado en el escritorio.

:: ── Prueba final ──────────────────────────────────────────────
echo.
echo ============================================================
echo   INSTALACION COMPLETADA
echo ============================================================
echo.
echo Tu bot esta listo. Para iniciarlo:
echo   - Doble clic en "Bot Expo" en tu escritorio
echo   - O ejecuta: python bot.py desde %INSTALL_DIR%
echo.
echo Abre Telegram y escribe /start a tu bot para probar.
echo.
echo Soporte: info@goodmantech.com.mx / 81 2635 0902
echo ============================================================
echo.

set /p START_NOW="Iniciar el bot ahora? (s/n): "
if /i "%START_NOW%"=="s" (
    python bot.py
)
