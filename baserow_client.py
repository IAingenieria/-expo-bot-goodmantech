"""
Cliente REST para Baserow.
Tabla principal: 903450 — Datos Expos (Expo Empaques 2026)

Campos reales de la tabla:
    Nombre | Telefono | Correo | Resumen | Fecha actual | Empresa | Seguimiento 1
"""
import csv
import io
import requests
from datetime import date, datetime
from config import (
    BASEROW_API_URL,
    BASEROW_API_TOKEN,
    BASEROW_TABLE_CONTACTOS,
    EXPO_NOMBRE,
    EXPO_STAND,
)


def _headers() -> dict:
    return {
        "Authorization": f"Token {BASEROW_API_TOKEN}",
        "Content-Type": "application/json",
    }


def _rows_url(table_id: int) -> str:
    return f"{BASEROW_API_URL}/api/database/rows/table/{table_id}/"


# ─── Guardar prospecto ────────────────────────────────────────────────────────

def save_prospect(prospect: dict) -> dict | None:
    """
    Guarda un prospecto en la tabla 'Datos Expos' (903450).

    Campos reales: Nombre, Telefono, Correo, Resumen, Fecha actual, Empresa, Seguimiento 1
    """
    now = datetime.now()
    temperatura = prospect.get("temperatura", "Tibio")

    resumen_completo = (
        f"[{EXPO_NOMBRE} - Stand {EXPO_STAND} | {temperatura}]\n\n"
        f"{prospect.get('resumen', '')}"
    )

    # Telefono debe ser None (no cadena vacía) cuando no hay valor — Baserow es campo Número
    telefono_raw = prospect.get("telefono", "") or ""
    telefono_limpio = "".join(filter(str.isdigit, str(telefono_raw))) or None

    payload = {
        "Nombre":        prospect.get("nombre", "") or "",
        "Telefono":      telefono_limpio,
        "Correo":        prospect.get("email", "") or "",
        "Empresa":       prospect.get("empresa", "") or "",
        "Resumen":       resumen_completo,
        "Fecha actual":  now.date().isoformat(),
        "Seguimiento 1": temperatura,
    }

    seguimiento_partes = [temperatura]
    if prospect.get("fecha_seguimiento"):
        seguimiento_partes.append(f"Seguimiento: {prospect['fecha_seguimiento']}")
    if prospect.get("accion_seguimiento"):
        seguimiento_partes.append(f"Acción: {prospect['accion_seguimiento']}")
    payload["Seguimiento 1"] = " | ".join(seguimiento_partes)

    resp = requests.post(
        _rows_url(BASEROW_TABLE_CONTACTOS) + "?user_field_names=true",
        headers=_headers(),
        json=payload,
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


# ─── Consultas ────────────────────────────────────────────────────────────────

def get_all_prospects(page: int = 1, size: int = 200) -> list[dict]:
    """Devuelve todos los prospectos de la tabla."""
    resp = requests.get(
        _rows_url(BASEROW_TABLE_CONTACTOS),
        headers=_headers(),
        params={"page": page, "size": size, "user_field_names": "true"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("results", [])


def get_prospects_count() -> int:
    """Devuelve el total de prospectos registrados."""
    resp = requests.get(
        _rows_url(BASEROW_TABLE_CONTACTOS),
        headers=_headers(),
        params={"size": 1, "user_field_names": "true"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("count", 0)


def get_prospects_today() -> list[dict]:
    """Devuelve los prospectos registrados hoy."""
    today = date.today().isoformat()
    resp = requests.get(
        _rows_url(BASEROW_TABLE_CONTACTOS),
        headers=_headers(),
        params={
            "size": 200,
            "user_field_names": "true",
            "filter__field_Fecha_actual__date_equal": today,
        },
        timeout=15,
    )
    resp.raise_for_status()
    rows = resp.json().get("results", [])
    # Filtro local como respaldo (Baserow a veces varía el filtro de fecha)
    return [r for r in rows if (r.get("Fecha actual") or "").startswith(today)]


def get_last_prospect() -> dict | None:
    """Devuelve el último prospecto registrado."""
    resp = requests.get(
        _rows_url(BASEROW_TABLE_CONTACTOS),
        headers=_headers(),
        params={"size": 200, "user_field_names": "true"},
        timeout=15,
    )
    resp.raise_for_status()
    results = resp.json().get("results", [])
    return results[-1] if results else None


def update_prospect(row_id: int, updates: dict) -> dict:
    """
    Actualiza campos específicos de un prospecto existente.

    Ejemplo:
        update_prospect(42, {"Nombre": "Luis Humberto", "Correo": "luis@empresa.com"})
    """
    resp = requests.patch(
        f"{_rows_url(BASEROW_TABLE_CONTACTOS)}{row_id}/?user_field_names=true",
        headers=_headers(),
        json=updates,
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


# ─── Calidad de leads ─────────────────────────────────────────────────────────

def calcular_estrellas(row: dict) -> int:
    """
    Sistema de calidad de 1-5 estrellas basado en los datos del prospecto.

    ⭐     — Solo empresa
    ⭐⭐   — Nombre + teléfono
    ⭐⭐⭐ — Empresa + nombre + correo
    ⭐⭐⭐⭐ — Todo lo anterior (+ teléfono)
    ⭐⭐⭐⭐⭐ — Todo + alta probabilidad de compra (Seguimiento 1 = Caliente)
    """
    nombre   = (row.get("Nombre")        or "").strip()
    telefono = (row.get("Telefono")       or "").strip()
    correo   = (row.get("Correo")         or "").strip()
    empresa  = (row.get("Empresa")        or "").strip()
    seg      = (row.get("Seguimiento 1")  or "").lower()

    caliente = "caliente" in seg

    if nombre and telefono and correo and empresa and caliente:
        return 5
    if nombre and telefono and correo and empresa:
        return 4
    if nombre and correo and empresa:
        return 3
    if nombre and telefono:
        return 2
    if empresa:
        return 1
    return 0


def generar_csv(prospectos: list[dict]) -> bytes:
    """Genera un archivo CSV en memoria con todos los prospectos."""
    output = io.StringIO()
    campos = ["Nombre", "Empresa", "Telefono", "Correo", "Fecha actual", "Seguimiento 1", "Estrellas"]
    writer = csv.DictWriter(output, fieldnames=campos, extrasaction="ignore")
    writer.writeheader()
    for row in prospectos:
        row["Estrellas"] = "⭐" * calcular_estrellas(row)
        writer.writerow({k: row.get(k, "") for k in campos})
    return output.getvalue().encode("utf-8-sig")  # utf-8-sig para Excel en Windows


# ─── Productos ────────────────────────────────────────────────────────────────

def search_prospects(termino: str) -> list[dict]:
    """Busca prospectos en la tabla por nombre, empresa u otro campo."""
    resp = requests.get(
        _rows_url(BASEROW_TABLE_CONTACTOS),
        headers=_headers(),
        params={"search": termino, "size": 20, "user_field_names": "true"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("results", [])


