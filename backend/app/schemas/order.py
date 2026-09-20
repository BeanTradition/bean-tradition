"""Request/response schemas for order creation and management."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from app.models.order import MessageStatus, OrderInternal, OrderStatus


class OrderItem(BaseModel):
    product: str = Field(min_length=1, max_length=80)
    quantity: int = Field(ge=1, le=99)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=120)
    mobile: str = Field(min_length=4, max_length=20)
    items: list[OrderItem] = Field(min_length=1)
    notes: str = Field(default="", max_length=500)
    amount: float | None = Field(default=None, ge=0)
    payment_method: str = Field(default="", max_length=20)
    created_by: str = Field(default="", max_length=60)
    idempotency_key: str = Field(min_length=8, max_length=100)

    @field_validator("customer_name", "notes", "payment_method", "created_by")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()


class OrderSummary(BaseModel):
    order_id: str
    order_number: str
    status: OrderStatus
    tracking_url: str


class WhatsAppResultBlock(BaseModel):
    confirmation_sent: bool
    meta_message_id: str | None = None
    error: str | None = None


class OrderResponse(BaseModel):
    success: bool
    order_created: bool
    order: OrderSummary
    whatsapp: WhatsAppResultBlock


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    force: bool = False  # allow reverse/correction transitions


class OrderPublic(BaseModel):
    """Full staff-facing order (safe for authenticated /orders board)."""

    order_id: str
    order_number: str
    created_at: str
    updated_at: str
    customer_name: str
    mobile_masked: str
    items: list[OrderItem]
    items_display: str
    quantity_total: int
    notes: str
    amount: float | None
    payment_method: str
    status: OrderStatus
    confirmation_status: MessageStatus
    ready_status: MessageStatus
    ready_at: str
    delivered_at: str
    created_by: str
    last_messaging_error: str

    @classmethod
    def from_internal(cls, o: OrderInternal) -> "OrderPublic":
        masked = o.mobile[:3] + "XXXXX" + o.mobile[-2:] if len(o.mobile) > 5 else "XXXX"
        return cls(
            order_id=o.order_id,
            order_number=o.order_number,
            created_at=o.created_at,
            updated_at=o.updated_at,
            customer_name=o.customer_name,
            mobile_masked=masked,
            items=[OrderItem(product=i.product, quantity=i.quantity) for i in o.items],
            items_display=o.items_display,
            quantity_total=o.quantity_total,
            notes=o.notes,
            amount=o.amount,
            payment_method=o.payment_method,
            status=o.status,
            confirmation_status=o.confirmation_status,
            ready_status=o.ready_status,
            ready_at=o.ready_at,
            delivered_at=o.delivered_at,
            created_by=o.created_by,
            last_messaging_error=o.last_messaging_error,
        )


class ActiveOrdersResponse(BaseModel):
    orders: list[OrderPublic]
    server_time: str


class MessageActionResponse(BaseModel):
    success: bool
    message_status: MessageStatus
    meta_message_id: str | None = None
    error: str | None = None
