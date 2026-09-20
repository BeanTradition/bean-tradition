"""Internal order model and Google Sheet <-> model conversion.

The Sheet is the source of truth, but raw row arrays never travel through the
app. Everything is converted to/from :class:`OrderInternal` at the boundary.
"""
from __future__ import annotations

import json
from enum import Enum

from pydantic import BaseModel, Field

from app.core.security import sanitize_for_sheet


class OrderStatus(str, Enum):
    RECEIVED = "RECEIVED"
    PREPARING = "PREPARING"
    READY = "READY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class MessageStatus(str, Enum):
    NOT_SENT = "NOT_SENT"
    SEND_PENDING = "SEND_PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    DELIVERED = "DELIVERED"
    READ = "READ"


# Statuses that keep an order on the active board / in the live queues.
ACTIVE_STATUSES = {OrderStatus.RECEIVED, OrderStatus.PREPARING, OrderStatus.READY}
TERMINAL_STATUSES = {OrderStatus.DELIVERED, OrderStatus.CANCELLED}

# Allowed forward transitions. Reverse/correction transitions are allowed only
# with an explicit ``force`` flag at the service layer.
ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.RECEIVED: {OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.CANCELLED},
    OrderStatus.PREPARING: {OrderStatus.READY, OrderStatus.CANCELLED, OrderStatus.RECEIVED},
    OrderStatus.READY: {OrderStatus.DELIVERED, OrderStatus.PREPARING, OrderStatus.CANCELLED},
    OrderStatus.DELIVERED: set(),
    OrderStatus.CANCELLED: set(),
}


class OrderItemModel(BaseModel):
    product: str
    quantity: int = Field(ge=1)


class OrderInternal(BaseModel):
    """Full server-side representation of one order (all Sheet columns)."""

    order_id: str = ""              # A
    order_number: str = ""         # B
    tracking_token: str = ""       # C
    created_at: str = ""           # D  ISO-8601
    customer_name: str = ""        # E
    mobile: str = ""               # F  normalised E.164
    items: list[OrderItemModel] = Field(default_factory=list)  # G (JSON)
    items_display: str = ""        # H
    quantity_total: int = 0        # I
    notes: str = ""                # J
    amount: float | None = None    # K
    payment_method: str = ""       # L
    status: OrderStatus = OrderStatus.PREPARING  # M
    confirmation_status: MessageStatus = MessageStatus.NOT_SENT  # N
    confirmation_message_id: str = ""            # O
    ready_status: MessageStatus = MessageStatus.NOT_SENT         # P
    ready_message_id: str = ""                   # Q
    created_by: str = ""           # R
    updated_at: str = ""           # S
    ready_at: str = ""             # T
    delivered_at: str = ""         # U
    idempotency_key: str = ""      # V
    confirmation_last_attempt: str = ""   # W
    ready_last_attempt: str = ""          # X
    last_messaging_error: str = ""        # Y

    # Row index in the sheet (1-based, includes header). Not persisted.
    row_number: int | None = Field(default=None, exclude=True)


# Column order matches the spec exactly (A..Y).
SHEET_HEADERS: list[str] = [
    "Order ID",
    "Order Number",
    "Tracking Token",
    "Created At",
    "Customer Name",
    "Mobile",
    "Items JSON",
    "Items Display",
    "Quantity Total",
    "Notes",
    "Amount",
    "Payment Method",
    "Status",
    "Confirmation Message Status",
    "Confirmation Meta Message ID",
    "Ready Message Status",
    "Ready Meta Message ID",
    "Created By",
    "Updated At",
    "Ready At",
    "Delivered At",
    "Idempotency Key",
    "Confirmation Last Attempt",
    "Ready Message Last Attempt",
    "Last Messaging Error",
]
COLUMN_COUNT = len(SHEET_HEADERS)  # 25 -> A..Y


def build_items_display(items: list[OrderItemModel]) -> str:
    return ", ".join(f"{i.product} x{i.quantity}" for i in items)


def _cell(value) -> str:
    return "" if value is None else str(value)


def order_to_sheet_row(order: OrderInternal) -> list[str]:
    """Serialise an order to a 25-cell row. User text is sanitised against
    formula injection here so no writer can bypass it."""
    return [
        _cell(order.order_id),
        _cell(order.order_number),
        _cell(order.tracking_token),
        _cell(order.created_at),
        sanitize_for_sheet(order.customer_name),
        _cell(order.mobile),
        json.dumps([i.model_dump() for i in order.items], ensure_ascii=False),
        sanitize_for_sheet(order.items_display),
        _cell(order.quantity_total),
        sanitize_for_sheet(order.notes),
        _cell(order.amount),
        sanitize_for_sheet(order.payment_method),
        _cell(order.status.value),
        _cell(order.confirmation_status.value),
        _cell(order.confirmation_message_id),
        _cell(order.ready_status.value),
        _cell(order.ready_message_id),
        sanitize_for_sheet(order.created_by),
        _cell(order.updated_at),
        _cell(order.ready_at),
        _cell(order.delivered_at),
        _cell(order.idempotency_key),
        _cell(order.confirmation_last_attempt),
        _cell(order.ready_last_attempt),
        sanitize_for_sheet(order.last_messaging_error),
    ]


def _get(row: list[str], idx: int) -> str:
    return row[idx] if idx < len(row) and row[idx] is not None else ""


def _strip_leading_quote(value: str) -> str:
    # Undo the injection guard when reading back for display/logic.
    return value[1:] if value.startswith("'") else value


def _parse_items(raw: str) -> list[OrderItemModel]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return []
    items: list[OrderItemModel] = []
    for entry in data:
        try:
            items.append(OrderItemModel(**entry))
        except Exception:  # noqa: BLE001 - skip malformed rows rather than crash
            continue
    return items


def _parse_status(raw: str, default: OrderStatus) -> OrderStatus:
    try:
        return OrderStatus(raw.strip().upper())
    except (ValueError, AttributeError):
        return default


def _parse_message_status(raw: str) -> MessageStatus:
    try:
        return MessageStatus(raw.strip().upper())
    except (ValueError, AttributeError):
        return MessageStatus.NOT_SENT


def _parse_amount(raw: str) -> float | None:
    if raw in ("", None):
        return None
    try:
        return float(raw)
    except (ValueError, TypeError):
        return None


def sheet_row_to_order(row: list[str], row_number: int | None = None) -> OrderInternal:
    """Deserialise a Sheet row (A..Y) into an OrderInternal."""
    return OrderInternal(
        order_id=_get(row, 0),
        order_number=_get(row, 1),
        tracking_token=_get(row, 2),
        created_at=_get(row, 3),
        customer_name=_strip_leading_quote(_get(row, 4)),
        mobile=_get(row, 5),
        items=_parse_items(_get(row, 6)),
        items_display=_strip_leading_quote(_get(row, 7)),
        quantity_total=int(_get(row, 8) or 0),
        notes=_strip_leading_quote(_get(row, 9)),
        amount=_parse_amount(_get(row, 10)),
        payment_method=_strip_leading_quote(_get(row, 11)),
        status=_parse_status(_get(row, 12), OrderStatus.PREPARING),
        confirmation_status=_parse_message_status(_get(row, 13)),
        confirmation_message_id=_get(row, 14),
        ready_status=_parse_message_status(_get(row, 15)),
        ready_message_id=_get(row, 16),
        created_by=_strip_leading_quote(_get(row, 17)),
        updated_at=_get(row, 18),
        ready_at=_get(row, 19),
        delivered_at=_get(row, 20),
        idempotency_key=_get(row, 21),
        confirmation_last_attempt=_get(row, 22),
        ready_last_attempt=_get(row, 23),
        last_messaging_error=_strip_leading_quote(_get(row, 24)),
        row_number=row_number,
    )
