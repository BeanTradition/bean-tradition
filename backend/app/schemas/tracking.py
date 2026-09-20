"""Public tracking schemas. These MUST never leak other customers' data."""
from __future__ import annotations

from pydantic import BaseModel

from app.models.order import OrderStatus


class TrackingOrder(BaseModel):
    """The requesting customer's own order (safe to fully expose to them)."""

    order_number: str
    status: OrderStatus
    items_display: str


class TrackingResponse(BaseModel):
    my_order: TrackingOrder
    ready_orders: list[str]       # order numbers only, e.g. ["BT0139", ...]
    preparing_orders: list[str]   # order numbers only
    server_time: str
