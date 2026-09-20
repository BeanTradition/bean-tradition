"""Public customer tracking endpoint. Privacy-critical: only the requester's
own order details are exposed; all other orders appear as order numbers only.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import get_settings
from app.middleware.rate_limit import FixedWindowLimiter, rate_limiter
from app.models.order import OrderStatus
from app.schemas.tracking import TrackingOrder, TrackingResponse
from app.services.google_sheets import GoogleSheetsService, get_sheets_service
from app.services.order_service import OrderService, get_order_service
from app.utils.tokens import utc_now_iso

router = APIRouter(prefix="/api/track", tags=["tracking"])

_track_limiter = FixedWindowLimiter(get_settings().track_rate_limit_per_min)


@router.get(
    "/{token}",
    response_model=TrackingResponse,
    dependencies=[Depends(rate_limiter(_track_limiter, "track"))],
)
def track(
    token: str,
    sheets: GoogleSheetsService = Depends(get_sheets_service),
    orders: OrderService = Depends(get_order_service),
) -> TrackingResponse:
    mine = sheets.find_by_tracking_token(token)
    if not mine:
        raise HTTPException(status_code=404, detail="Invalid tracking link.")

    limit = orders.queue_limit()
    active = sheets.active_orders()
    active.sort(key=lambda o: o.created_at)

    ready = [o.order_number for o in active if o.status == OrderStatus.READY]
    preparing = [
        o.order_number
        for o in active
        if o.status in (OrderStatus.PREPARING, OrderStatus.RECEIVED)
    ]

    ready_limited = _limit_including_mine(ready, mine.order_number, mine.status == OrderStatus.READY, limit)
    preparing_limited = _limit_including_mine(
        preparing,
        mine.order_number,
        mine.status in (OrderStatus.PREPARING, OrderStatus.RECEIVED),
        limit,
    )

    return TrackingResponse(
        my_order=TrackingOrder(
            order_number=mine.order_number,
            status=mine.status,
            items_display=mine.items_display,
        ),
        ready_orders=ready_limited,
        preparing_orders=preparing_limited,
        server_time=utc_now_iso(),
    )


def _limit_including_mine(numbers: list[str], mine: str, is_in_list: bool, limit: int) -> list[str]:
    limited = numbers[:limit]
    if is_in_list and mine not in limited:
        limited.append(mine)
    return limited
