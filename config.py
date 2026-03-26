import os
from dotenv import load_dotenv

load_dotenv()

# ─── Telegram ────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# ─── APIs ────────────────────────────────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# ─── Gmail ───────────────────────────────────────────────────
GMAIL_USER = os.getenv("GMAIL_USER", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")

# ─── Baserow ─────────────────────────────────────────────────
BASEROW_API_URL = os.getenv("BASEROW_API_URL", "https://api.baserow.io")
BASEROW_API_TOKEN = os.getenv("BASEROW_API_TOKEN", "")
BASEROW_TABLE_CONTACTOS = int(os.getenv("BASEROW_TABLE_ID", "903450"))

# ─── Datos del evento ────────────────────────────────────────
EXPO_NOMBRE = "Expo Empaques"
EXPO_STAND  = "432"
EXPO_CIUDAD = "Monterrey"
EXPO_VENUE  = "Cintermex"

# ─── Datos de Goodman Tech ───────────────────────────────────
GT_TELEFONO = os.getenv("GT_TELEFONO", "81 2635 0902")
GT_EMAIL    = os.getenv("GT_EMAIL",    "info@goodmantech.com.mx")
GT_WEBSITE  = os.getenv("GT_WEBSITE",  "goodmantech.com.mx")
GT_LOGO     = os.path.join(os.path.dirname(__file__), "goodman_logo.png")
