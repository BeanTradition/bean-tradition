"""Google Sheets operational datastore.

Two interchangeable backends implement the same low-level row interface:

* :class:`GoogleApiBackend`  - talks to the real Sheets API (service account).
* :class:`InMemoryBackend`   - a local store used when credentials are absent
  (local dev / CI / pytest). The app therefore always starts and tests never
  touch a real spreadsheet.

The public :class:`GoogleSheetsService` speaks only in :class:`OrderInternal`
objects, applies a short-lived cache to the active-queue read, and never leaks
raw row arrays to the rest of the app.
"""
from __future__ import annotations

import threading
import time
from typing import Protocol

from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.models.order import (
    ACTIVE_STATUSES,
    COLUMN_COUNT,
    OrderInternal,
    OrderStatus,
    SHEET_HEADERS,
    order_to_sheet_row,
    sheet_row_to_order,
)

logger = get_logger(__name__)

ORDERS_TAB = "Orders"
SETTINGS_TAB = "Settings"
COUNTER_TAB = "Counters"


def _col_letter(idx: int) -> str:
    letters = ""
    n = idx + 1
    while n:
        n, rem = divmod(n - 1, 26)
        letters = chr(65 + rem) + letters
    return letters


LAST_COL = _col_letter(COLUMN_COUNT - 1)  # "Y"


class SheetBackend(Protocol):
    def read_order_rows(self) -> list[list[str]]: ...
    def append_order_row(self, row: list[str]) -> int: ...
    def update_order_row(self, row_number: int, row: list[str]) -> None: ...
    def read_settings(self) -> dict[str, str]: ...
    def next_sequence(self) -> int: ...


# --------------------------------------------------------------------------
# In-memory backend (dev / tests)
# --------------------------------------------------------------------------
class InMemoryBackend:
    def __init__(self, settings: dict[str, str] | None = None) -> None:
        self._rows: list[list[str]] = []
        self._lock = threading.Lock()
        self._seq = 0
        self._settings = settings or {}

    def read_order_rows(self) -> list[list[str]]:
        with self._lock:
            return [list(r) for r in self._rows]

    def append_order_row(self, row: list[str]) -> int:
        with self._lock:
            self._rows.append(list(row))
            # +2: 1 for header row, 1 for 1-based indexing.
            return len(self._rows) + 1

    def update_order_row(self, row_number: int, row: list[str]) -> None:
        with self._lock:
            idx = row_number - 2
            if 0 <= idx < len(self._rows):
                self._rows[idx] = list(row)

    def read_settings(self) -> dict[str, str]:
        return dict(self._settings)

    def next_sequence(self) -> int:
        with self._lock:
            self._seq += 1
            return self._seq


# --------------------------------------------------------------------------
# Real Google Sheets backend
# --------------------------------------------------------------------------
class GoogleApiBackend:
    def __init__(self, settings: Settings) -> None:
        from google.oauth2.service_account import Credentials
        from googleapiclient.discovery import build

        creds = Credentials.from_service_account_info(
            {
                "type": "service_account",
                "client_email": settings.google_service_account_email,
                "private_key": settings.google_private_key,
                "token_uri": "https://oauth2.googleapis.com/token",
            },
            scopes=["https://www.googleapis.com/auth/spreadsheets"],
        )
        self._service = build("sheets", "v4", credentials=creds, cache_discovery=False)
        self._sheet_id = settings.google_sheet_id
        self._values = self._service.spreadsheets().values()
        self._counter_lock = threading.Lock()

    def read_order_rows(self) -> list[list[str]]:
        resp = self._values.get(
            spreadsheetId=self._sheet_id,
            range=f"{ORDERS_TAB}!A2:{LAST_COL}",
        ).execute()
        return resp.get("values", [])

    def append_order_row(self, row: list[str]) -> int:
        resp = self._values.append(
            spreadsheetId=self._sheet_id,
            range=f"{ORDERS_TAB}!A1",
            valueInputOption="RAW",
            insertDataOption="INSERT_ROWS",
            body={"values": [row]},
        ).execute()
        updated_range = resp.get("updates", {}).get("updatedRange", "")
        # e.g. "Orders!A57:Y57" -> 57
        try:
            return int(updated_range.split("!")[1].split(":")[0][1:])
        except (IndexError, ValueError):
            return len(self.read_order_rows()) + 1

    def update_order_row(self, row_number: int, row: list[str]) -> None:
        self._values.update(
            spreadsheetId=self._sheet_id,
            range=f"{ORDERS_TAB}!A{row_number}:{LAST_COL}{row_number}",
            valueInputOption="RAW",
            body={"values": [row]},
        ).execute()

    def read_settings(self) -> dict[str, str]:
        try:
            resp = self._values.get(
                spreadsheetId=self._sheet_id,
                range=f"{SETTINGS_TAB}!A2:B",
            ).execute()
        except Exception as exc:  # noqa: BLE001
            logger.warning("could not read Settings tab: %s", type(exc).__name__)
            return {}
        out: dict[str, str] = {}
        for row in resp.get("values", []):
            if len(row) >= 2 and row[0]:
                out[str(row[0]).strip()] = str(row[1]).strip()
        return out

    def next_sequence(self) -> int:
        """Locked counter-cell fallback (single FastAPI instance).

        For multi-instance deployments use the Apps Script LockService web app
        (see :class:`AppsScriptCounter`); this cell-based counter is guarded only
        by a process lock.
        """
        with self._counter_lock:
            resp = self._values.get(
                spreadsheetId=self._sheet_id,
                range=f"{COUNTER_TAB}!A1",
            ).execute()
            values = resp.get("values", [])
            current = int(values[0][0]) if values and values[0] else 0
            nxt = current + 1
            self._values.update(
                spreadsheetId=self._sheet_id,
                range=f"{COUNTER_TAB}!A1",
                valueInputOption="RAW",
                body={"values": [[nxt]]},
            ).execute()
            return nxt


class GoogleSheetsService:
    def __init__(self, backend: SheetBackend, settings: Settings | None = None) -> None:
        self._backend = backend
        self._settings = settings or get_settings()
        self._cache: list[OrderInternal] | None = None
        self._cache_ts: float = 0.0
        self._cache_lock = threading.Lock()

    # -- caching -----------------------------------------------------------
    def _load_all(self, fresh: bool = False) -> list[OrderInternal]:
        now = time.monotonic()
        with self._cache_lock:
            if (
                not fresh
                and self._cache is not None
                and (now - self._cache_ts) < self._settings.active_cache_ttl_seconds
            ):
                return self._cache
            rows = self._backend.read_order_rows()
            orders = [
                sheet_row_to_order(row, row_number=i + 2)
                for i, row in enumerate(rows)
                if any(c for c in row)
            ]
            self._cache = orders
            self._cache_ts = now
            return orders

    def _invalidate(self) -> None:
        with self._cache_lock:
            self._cache = None
            self._cache_ts = 0.0

    # -- writes ------------------------------------------------------------
    def append_order(self, order: OrderInternal) -> OrderInternal:
        row_number = self._backend.append_order_row(order_to_sheet_row(order))
        order.row_number = row_number
        self._invalidate()
        return order

    def update_order(self, order: OrderInternal) -> OrderInternal:
        if order.row_number is None:
            found = self.find_by_order_id(order.order_id, fresh=True)
            if not found or found.row_number is None:
                raise ValueError(f"order {order.order_id} not found for update")
            order.row_number = found.row_number
        self._backend.update_order_row(order.row_number, order_to_sheet_row(order))
        self._invalidate()
        return order

    # -- lookups -----------------------------------------------------------
    def find_by_order_id(self, order_id: str, fresh: bool = False) -> OrderInternal | None:
        return next((o for o in self._load_all(fresh) if o.order_id == order_id), None)

    def find_by_order_number(self, order_number: str, fresh: bool = False) -> OrderInternal | None:
        return next((o for o in self._load_all(fresh) if o.order_number == order_number), None)

    def find_by_tracking_token(self, token: str, fresh: bool = False) -> OrderInternal | None:
        return next((o for o in self._load_all(fresh) if o.tracking_token == token), None)

    def find_by_idempotency_key(self, key: str) -> OrderInternal | None:
        # Always fresh: correctness of duplicate prevention must not rely on cache.
        return next((o for o in self._load_all(fresh=True) if o.idempotency_key == key), None)

    def find_by_message_id(self, message_id: str) -> tuple[OrderInternal | None, str | None]:
        """Return (order, which) where which is 'confirmation' or 'ready'."""
        if not message_id:
            return None, None
        for o in self._load_all(fresh=True):
            if o.confirmation_message_id == message_id:
                return o, "confirmation"
            if o.ready_message_id == message_id:
                return o, "ready"
        return None, None

    # -- queries -----------------------------------------------------------
    def active_orders(self) -> list[OrderInternal]:
        return [o for o in self._load_all() if o.status in ACTIVE_STATUSES]

    def recent_delivered(self, limit: int = 20) -> list[OrderInternal]:
        delivered = [o for o in self._load_all() if o.status == OrderStatus.DELIVERED]
        delivered.sort(key=lambda o: o.delivered_at or o.updated_at, reverse=True)
        return delivered[:limit]

    def search_by_mobile(self, last4: str) -> list[OrderInternal]:
        return [o for o in self._load_all() if o.mobile.endswith(last4)]

    def get_settings_map(self) -> dict[str, str]:
        return self._backend.read_settings()

    def next_order_sequence(self) -> int:
        return self._backend.next_sequence()


# --------------------------------------------------------------------------
# Factory
# --------------------------------------------------------------------------
_service_singleton: GoogleSheetsService | None = None


def _has_google_credentials(settings: Settings) -> bool:
    return bool(
        settings.google_sheet_id
        and settings.google_service_account_email
        and settings.google_private_key
    )


def build_sheets_service(settings: Settings | None = None) -> GoogleSheetsService:
    settings = settings or get_settings()
    if _has_google_credentials(settings):
        logger.info("Google Sheets: using live API backend")
        backend: SheetBackend = GoogleApiBackend(settings)
    else:
        logger.warning(
            "Google Sheets credentials not set - using IN-MEMORY backend "
            "(data is not persisted). Set GOOGLE_* env vars for production."
        )
        backend = InMemoryBackend(
            settings={
                "Brand Name": settings.brand_name,
                "Order Prefix": settings.order_prefix,
                "Default Country Code": settings.default_country_code,
                "Initial Order Status": settings.initial_order_status,
                "Queue Display Limit": str(settings.queue_display_limit),
                "Tracking Poll Interval": str(settings.tracking_poll_interval_ms),
                "WhatsApp Template Language": settings.whatsapp_template_language,
                "Event Name": settings.event_name,
            }
        )
    return GoogleSheetsService(backend, settings)


def get_sheets_service() -> GoogleSheetsService:
    global _service_singleton
    if _service_singleton is None:
        _service_singleton = build_sheets_service()
    return _service_singleton


def set_sheets_service(service: GoogleSheetsService | None) -> None:
    """Test hook to inject a service (or reset with None)."""
    global _service_singleton
    _service_singleton = service


def sheet_headers() -> list[str]:
    return list(SHEET_HEADERS)
