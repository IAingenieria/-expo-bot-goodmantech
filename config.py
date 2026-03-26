"""
Configuración central del bot.
Lee variables de entorno (.env) + datos del cliente (config_cliente.json).
Para personalizar el bot para un nuevo cliente, editar SOLO config_cliente.json.
"""
import os
import json
from dotenv import load_dotenv

load_dotenv()

# ─── APIs y credenciales (siempre desde .env) ─────────────────
TELEGRAM_BOT_TOKEN  = os.getenv("TELEGRAM_BOT_TOKEN", "")
ANTHROPIC_API_KEY   = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY      = os.getenv("OPENAI_API_KEY", "")
GMAIL_USER          = os.getenv("GMAIL_USER", "")
GMAIL_APP_PASSWORD  = os.getenv("GMAIL_APP_PASSWORD", "")
BASEROW_API_URL     = os.getenv("BASEROW_API_URL", "https://api.baserow.io")
BASEROW_API_TOKEN   = os.getenv("BASEROW_API_TOKEN", "")
BASEROW_TABLE_CONTACTOS = int(os.getenv("BASEROW_TABLE_ID", "0"))

# ─── Datos del cliente (desde config_cliente.json) ────────────
_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config_cliente.json")

def _load_cliente() -> dict:
    """Carga config_cliente.json. Si no existe, usa valores por defecto."""
    if os.path.exists(_CONFIG_PATH):
        with open(_CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

_c = _load_cliente()

# ─── Datos de la empresa cliente ─────────────────────────────
CLIENTE_EMPRESA     = _c.get("empresa",         os.getenv("CLIENTE_EMPRESA", "Mi Empresa"))
CLIENTE_GIRO        = _c.get("giro",             os.getenv("CLIENTE_GIRO", "empresa comercial"))
CLIENTE_NOMBRE      = _c.get("contacto_nombre",  os.getenv("CLIENTE_NOMBRE", ""))
CLIENTE_TEL         = _c.get("contacto_tel",     os.getenv("CLIENTE_TEL", ""))
CLIENTE_EMAIL       = _c.get("contacto_email",   os.getenv("CLIENTE_EMAIL", ""))
CLIENTE_WEB         = _c.get("contacto_web",     os.getenv("CLIENTE_WEB", ""))
CLIENTE_COLOR       = _c.get("color_primario",   "1565C0")
CLIENTE_LOGO        = os.path.join(os.path.dirname(__file__),
                        _c.get("logo", "goodman_logo.png"))
CLIENTE_BIENVENIDA  = _c.get("bienvenida",       "Bienvenido. Manda audio, foto o texto.")
CLIENTE_PRODUCTOS   = _c.get("productos_ejemplo", [])

# ─── Datos del evento ─────────────────────────────────────────
EXPO_NOMBRE = _c.get("expo_nombre", os.getenv("EXPO_NOMBRE", "Expo"))
EXPO_STAND  = _c.get("expo_stand",  os.getenv("EXPO_STAND",  "1"))
EXPO_CIUDAD = _c.get("expo_ciudad", os.getenv("EXPO_CIUDAD", "Monterrey"))
EXPO_VENUE  = _c.get("expo_venue",  os.getenv("EXPO_VENUE",  ""))

# ─── Compatibilidad con código anterior (alias) ───────────────
GT_TELEFONO = CLIENTE_TEL
GT_EMAIL    = CLIENTE_EMAIL
GT_WEBSITE  = CLIENTE_WEB
GT_LOGO     = CLIENTE_LOGO
