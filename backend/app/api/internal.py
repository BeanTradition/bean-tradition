"""Internal endpoints called by Google Apps Script (not by browsers).

Authenticated with ``SHEET_WEBHOOK_SECRET`` sent by the Apps Script onEdit
trigger. This is what makes a manual Status edit inside Google Sheets still
trigger the customer's Ready WhatsApp message.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.security import verify_shared_secret
from app.models.order import OrderStatus
from app.schemas.order import OrderPublic
from app.services.order_service import OrderService, get_order_service
from pydantic import BaseModel

router = APIRouter(prefix="/api/internal", tags=["internal"])
logger = get_logger(__name__)


class SheetStatusChange(BaseModel):
    order_number: str
    status: OrderStatus
    secret: str | None = None


def _authorize(body_secret: str | None, header_secret: str | None) -> None:
    expected = get_settings().sheet_webhook_secret
    provided = header_secret or body_secret
    if not verify_shared_secret(provided, expected):
        raise HTTPException(status_code=401, detail="Unauthorized.")


@router.post("/sheet-status-change", response_model=OrderPublic)
def sheet_status_change(
    body: SheetStatusChange,
    x_sheet_secret: str | None = Header(default=None, alias="X-Sheet-Secret"),
    service: OrderService = Depends(get_order_service),
) -> OrderPublic:
    _authorize(body.secret, x_sheet_secret)
    order = service.apply_sheet_status_change(body.order_number, body.status)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    logger.info("sheet-driven status change order_number=%s -> %s", body.order_number, body.status.value)
    return OrderPublic.from_internal(order)
