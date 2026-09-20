"""Order business logic: idempotent creation, concurrency-safe numbering,
status transitions, and duplicate-safe WhatsApp automation.
"""
from __future__ import annotations

import threading
from collections import defaultdict

import httpx

from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.models.order import (
    ALLOWED_TRANSITIONS,
    MessageStatus,
    OrderInternal,
    OrderItemModel,
    OrderStatus,
    build_items_display,
)
from app.schemas.order import OrderCreate
from app.schemas.whatsapp import WhatsAppSendResult
from app.services.google_sheets import GoogleSheetsService, get_sheets_service
from app.services.messaging.messaging_service import MessagingService, get_messaging_service
from app.utils.order_numbers import format_order_number
from app.utils.phone import normalize_phone
from app.utils.tokens import new_order_id, new_tracking_token, utc_now_iso

logger = get_logger(__name__)


class InvalidStatusTransition(ValueError):
    pass


class OrderNotFound(LookupError):
    pass


class OrderNumberAllocator:
    """Concurrency-safe next-number allocation.

    Preferred path is the Apps Script LockService web app (cross-instance safe).
    Fallback is the Sheet counter cell guarded by a process lock (single
    instance). Formatting is delegated to ``utils.order_numbers``.
    """

    def __init__(self, sheets: GoogleSheetsService, settings: Settings) -> None:
        self._sheets = sheets
        self._settings = settings

    def next_number(self) -> str:
        seq = self._next_sequence()
        return format_order_number(seq, prefix=self._settings.order_prefix)

    def _next_sequence(self) -> int:
        url = self._settings.order_number_script_url
        if url:
            try:
                return self._from_apps_script(url)
            except Exception as exc:  # noqa: BLE001 - fall back rather than fail an order
                logger.warning("Apps Script counter failed (%s); falling back to sheet counter", type(exc).__name__)
        return self._sheets.next_order_sequence()

    def _from_apps_script(self, url: str) -> int:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json={"secret": self._settings.order_number_script_secret})
        resp.raise_for_status()
        data = resp.json()
        if "sequence" in data:
            return int(data["sequence"])
        if "order_number" in data:
            from app.utils.order_numbers import parse_order_number

            return parse_order_number(str(data["order_number"]), prefix=self._settings.order_prefix)
        raise ValueError("Apps Script counter returned no sequence")


class OrderService:
    def __init__(
        self,
        sheets: GoogleSheetsService | None = None,
        messaging: MessagingService | None = None,
        settings: Settings | None = None,
    ) -> None:
        self._sheets = sheets or get_sheets_service()
        self._messaging = messaging or get_messaging_service()
        self._settings = settings or get_settings()
        self._allocator = OrderNumberAllocator(self._sheets, self._settings)
        # Per-idempotency-key locks so concurrent identical submissions serialise.
        self._key_locks: dict[str, threading.Lock] = defaultdict(threading.Lock)
        self._key_locks_guard = threading.Lock()

    # -- settings resolution ----------------------------------------------
    def _runtime(self) -> dict[str, str]:
        return self._sheets.get_settings_map()

    def initial_status(self) -> OrderStatus:
        raw = self._runtime().get("Initial Order Status") or self._settings.initial_order_status
        try:
            return OrderStatus(raw.strip().upper())
        except (ValueError, AttributeError):
            return OrderStatus.PREPARING

    def queue_limit(self) -> int:
        raw = self._runtime().get("Queue Display Limit")
        try:
            return int(raw) if raw else self._settings.queue_display_limit
        except (ValueError, TypeError):
            return self._settings.queue_display_limit

    # -- creation ----------------------------------------------------------
    def _lock_for(self, key: str) -> threading.Lock:
        with self._key_locks_guard:
            return self._key_locks[key]

    def create_order(self, payload: OrderCreate) -> tuple[OrderInternal, WhatsAppSendResult, bool]:
        """Create (or resolve a duplicate of) an order.

        Returns (order, whatsapp_result, is_new).
        """
        with self._lock_for(payload.idempotency_key):
            existing = self._sheets.find_by_idempotency_key(payload.idempotency_key)
            if existing:
                logger.info("idempotent replay for key -> order_number=%s", existing.order_number)
                wa = WhatsAppSendResult(
                    success=existing.confirmation_status == MessageStatus.SENT,
                    meta_message_id=existing.confirmation_message_id or None,
                )
                return existing, wa, False

            mobile = normalize_phone(payload.mobile, self._settings.default_country_code)
            items = [OrderItemModel(product=i.product, quantity=i.quantity) for i in payload.items]
            now = utc_now_iso()
            order = OrderInternal(
                order_id=new_order_id(),
                order_number=self._allocator.next_number(),
                tracking_token=new_tracking_token(),
                created_at=now,
                customer_name=payload.customer_name,
                mobile=mobile,
                items=items,
                items_display=build_items_display(items),
                quantity_total=sum(i.quantity for i in items),
                notes=payload.notes,
                amount=payload.amount,
                payment_method=payload.payment_method,
                status=self.initial_status(),
                confirmation_status=MessageStatus.SEND_PENDING,
                created_by=payload.created_by,
                updated_at=now,
                idempotency_key=payload.idempotency_key,
            )

            # Order must be durably written BEFORE we claim success.
            self._sheets.append_order(order)
            logger.info("order created order_number=%s status=%s", order.order_number, order.status.value)

        # Messaging happens outside the key lock; the order already exists.
        wa = self._send_confirmation(order)
        return order, wa, True

    def _send_confirmation(self, order: OrderInternal) -> WhatsAppSendResult:
        order.confirmation_last_attempt = utc_now_iso()
        result = self._messaging.send_confirmation(order)
        order.confirmation_status = MessageStatus.SENT if result.success else MessageStatus.FAILED
        if result.meta_message_id:
            order.confirmation_message_id = result.meta_message_id
        order.last_messaging_error = "" if result.success else (result.error or "")
        order.updated_at = utc_now_iso()
        self._sheets.update_order(order)
        return result

    def retry_confirmation(self, order_id: str) -> WhatsAppSendResult:
        order = self._require(order_id)
        if order.confirmation_status == MessageStatus.SENT:
            return WhatsAppSendResult(success=True, meta_message_id=order.confirmation_message_id or None)
        return self._send_confirmation(order)

    # -- status transitions -----------------------------------------------
    def update_status(
        self, order_id: str, new_status: OrderStatus, force: bool = False
    ) -> tuple[OrderInternal, WhatsAppSendResult | None]:
        order = self._require(order_id)
        current = order.status
        if new_status == current:
            return order, None
        if not force and new_status not in ALLOWED_TRANSITIONS.get(current, set()):
            raise InvalidStatusTransition(f"{current.value} -> {new_status.value} not allowed")

        now = utc_now_iso()
        order.status = new_status
        order.updated_at = now
        wa: WhatsAppSendResult | None = None

        if new_status == OrderStatus.READY:
            if not order.ready_at:
                order.ready_at = now
            wa = self._maybe_send_ready(order)
        elif new_status == OrderStatus.DELIVERED:
            order.delivered_at = now

        self._sheets.update_order(order)
        return order, wa

    def _maybe_send_ready(self, order: OrderInternal) -> WhatsAppSendResult | None:
        """Send the Ready message unless it has already been sent successfully."""
        if order.ready_status == MessageStatus.SENT:
            logger.info("ready message already sent for %s - skipping duplicate", order.order_number)
            return None
        return self._do_send_ready(order)

    def _do_send_ready(self, order: OrderInternal) -> WhatsAppSendResult:
        order.ready_last_attempt = utc_now_iso()
        result = self._messaging.send_ready(order)
        order.ready_status = MessageStatus.SENT if result.success else MessageStatus.FAILED
        if result.meta_message_id:
            order.ready_message_id = result.meta_message_id
        order.last_messaging_error = "" if result.success else (result.error or "")
        order.updated_at = utc_now_iso()
        return result

    def resend_ready(self, order_id: str) -> WhatsAppSendResult:
        """Explicit staff action - always attempts a send and persists."""
        order = self._require(order_id)
        result = self._do_send_ready(order)
        self._sheets.update_order(order)
        return result

    def cancel_order(self, order_id: str, force: bool = True) -> OrderInternal:
        order, _ = self.update_status(order_id, OrderStatus.CANCELLED, force=force)
        return order

    # -- sheet-driven status change (Apps Script webhook) ------------------
    def apply_sheet_status_change(self, order_number: str, new_status: OrderStatus) -> OrderInternal | None:
        order = self._sheets.find_by_order_number(order_number, fresh=True)
        if not order:
            logger.warning("sheet-status-change for unknown order_number=%s", order_number)
            return None
        now = utc_now_iso()
        order.status = new_status
        order.updated_at = now
        if new_status == OrderStatus.READY:
            if not order.ready_at:
                order.ready_at = now
            self._maybe_send_ready(order)
        elif new_status == OrderStatus.DELIVERED and not order.delivered_at:
            order.delivered_at = now
        self._sheets.update_order(order)
        return order

    # -- webhook status ingestion -----------------------------------------
    def apply_message_status(self, message_id: str, status: str) -> bool:
        order, which = self._sheets.find_by_message_id(message_id)
        if not order or not which:
            return False
        mapped = {
            "sent": MessageStatus.SENT,
            "delivered": MessageStatus.DELIVERED,
            "read": MessageStatus.READ,
            "failed": MessageStatus.FAILED,
        }.get(status.lower())
        if mapped is None:
            return False
        if which == "confirmation":
            order.confirmation_status = mapped
        else:
            order.ready_status = mapped
        order.updated_at = utc_now_iso()
        self._sheets.update_order(order)
        return True

    # -- helpers -----------------------------------------------------------
    def _require(self, order_id: str) -> OrderInternal:
        order = self._sheets.find_by_order_id(order_id, fresh=True)
        if not order:
            raise OrderNotFound(order_id)
        return order


_singleton: OrderService | None = None


def get_order_service() -> OrderService:
    global _singleton
    if _singleton is None:
        _singleton = OrderService()
    return _singleton


def set_order_service(service: OrderService | None) -> None:
    global _singleton
    _singleton = service
