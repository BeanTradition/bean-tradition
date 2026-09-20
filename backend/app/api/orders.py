"""Order creation and management endpoints (staff-authenticated)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import require_staff
from app.models.order import OrderStatus
from app.schemas.order import (
    ActiveOrdersResponse,
    MessageActionResponse,
    OrderCreate,
    OrderPublic,
    OrderResponse,
    OrderStatusUpdate,
    OrderSummary,
    WhatsAppResultBlock,
)
from app.services.google_sheets import GoogleSheetsService, get_sheets_service
from app.services.messaging.messaging_service import MessagingService, get_messaging_service
from app.services.order_service import (
    InvalidStatusTransition,
    OrderNotFound,
    OrderService,
    get_order_service,
)
from app.utils.phone import InvalidPhoneError
from app.utils.tokens import utc_now_iso

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, dependencies=[Depends(require_staff)])
def create_order(
    body: OrderCreate,
    service: OrderService = Depends(get_order_service),
    messaging: MessagingService = Depends(get_messaging_service),
) -> OrderResponse:
    try:
        order, wa, _is_new = service.create_order(body)
    except InvalidPhoneError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid mobile number: {exc}") from exc

    return OrderResponse(
        success=True,
        order_created=True,
        order=OrderSummary(
            order_id=order.order_id,
            order_number=order.order_number,
            status=order.status,
            tracking_url=messaging.tracking_url(order.tracking_token),
        ),
        whatsapp=WhatsAppResultBlock(
            confirmation_sent=wa.success,
            meta_message_id=wa.meta_message_id,
            error=None if wa.success else wa.error,
        ),
    )


@router.get("/active", response_model=ActiveOrdersResponse, dependencies=[Depends(require_staff)])
def active_orders(sheets: GoogleSheetsService = Depends(get_sheets_service)) -> ActiveOrdersResponse:
    orders = sheets.active_orders()
    orders.sort(key=lambda o: o.created_at)
    return ActiveOrdersResponse(
        orders=[OrderPublic.from_internal(o) for o in orders],
        server_time=utc_now_iso(),
    )


@router.get("/delivered", response_model=ActiveOrdersResponse, dependencies=[Depends(require_staff)])
def delivered_orders(
    limit: int = Query(default=20, ge=1, le=200),
    sheets: GoogleSheetsService = Depends(get_sheets_service),
) -> ActiveOrdersResponse:
    orders = sheets.recent_delivered(limit)
    return ActiveOrdersResponse(
        orders=[OrderPublic.from_internal(o) for o in orders],
        server_time=utc_now_iso(),
    )


@router.get("/search", response_model=ActiveOrdersResponse, dependencies=[Depends(require_staff)])
def search_orders(
    order_number: str | None = Query(default=None),
    mobile_last4: str | None = Query(default=None, min_length=4, max_length=4),
    sheets: GoogleSheetsService = Depends(get_sheets_service),
) -> ActiveOrdersResponse:
    results = []
    if order_number:
        found = sheets.find_by_order_number(order_number.strip())
        if found:
            results.append(found)
    elif mobile_last4:
        results = sheets.search_by_mobile(mobile_last4.strip())
    return ActiveOrdersResponse(
        orders=[OrderPublic.from_internal(o) for o in results],
        server_time=utc_now_iso(),
    )


@router.patch("/{order_id}/status", response_model=OrderPublic, dependencies=[Depends(require_staff)])
def update_status(
    order_id: str,
    body: OrderStatusUpdate,
    service: OrderService = Depends(get_order_service),
) -> OrderPublic:
    try:
        order, _wa = service.update_status(order_id, body.status, force=body.force)
    except OrderNotFound as exc:
        raise HTTPException(status_code=404, detail="Order not found.") from exc
    except InvalidStatusTransition as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return OrderPublic.from_internal(order)


@router.post(
    "/{order_id}/resend-ready",
    response_model=MessageActionResponse,
    dependencies=[Depends(require_staff)],
)
def resend_ready(order_id: str, service: OrderService = Depends(get_order_service)) -> MessageActionResponse:
    try:
        result = service.resend_ready(order_id)
    except OrderNotFound as exc:
        raise HTTPException(status_code=404, detail="Order not found.") from exc
    from app.models.order import MessageStatus

    return MessageActionResponse(
        success=result.success,
        message_status=MessageStatus.SENT if result.success else MessageStatus.FAILED,
        meta_message_id=result.meta_message_id,
        error=None if result.success else result.error,
    )


@router.post(
    "/{order_id}/retry-confirmation",
    response_model=MessageActionResponse,
    dependencies=[Depends(require_staff)],
)
def retry_confirmation(order_id: str, service: OrderService = Depends(get_order_service)) -> MessageActionResponse:
    try:
        result = service.retry_confirmation(order_id)
    except OrderNotFound as exc:
        raise HTTPException(status_code=404, detail="Order not found.") from exc
    from app.models.order import MessageStatus

    return MessageActionResponse(
        success=result.success,
        message_status=MessageStatus.SENT if result.success else MessageStatus.FAILED,
        meta_message_id=result.meta_message_id,
        error=None if result.success else result.error,
    )


@router.post("/{order_id}/cancel", response_model=OrderPublic, dependencies=[Depends(require_staff)])
def cancel_order(order_id: str, service: OrderService = Depends(get_order_service)) -> OrderPublic:
    try:
        order = service.cancel_order(order_id)
    except OrderNotFound as exc:
        raise HTTPException(status_code=404, detail="Order not found.") from exc
    return OrderPublic.from_internal(order)
