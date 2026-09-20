"""High-level WhatsApp orchestration: template params, retry/backoff, and the
tracking URL. Duplicate-send *policy* lives in ``order_service``; this module
only performs a single logical send with controlled retries.
"""
from __future__ import annotations

import time
from collections.abc import Callable

from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.models.order import OrderInternal
from app.schemas.whatsapp import WhatsAppSendResult
from app.services.messaging.meta_whatsapp import MetaWhatsAppService, get_meta_service
from app.utils.phone import to_whatsapp_recipient

logger = get_logger(__name__)

# Exponential backoff (seconds) between retry attempts for transient failures.
DEFAULT_BACKOFF = (0.5, 1.5, 3.0)


class MessagingService:
    def __init__(
        self,
        meta: MetaWhatsAppService | None = None,
        settings: Settings | None = None,
        sleeper: Callable[[float], None] = time.sleep,
        backoff: tuple[float, ...] = DEFAULT_BACKOFF,
    ) -> None:
        self._meta = meta or get_meta_service()
        self._settings = settings or get_settings()
        self._sleep = sleeper
        self._backoff = backoff

    def tracking_url(self, token: str) -> str:
        base = self._settings.frontend_url.rstrip("/")
        return f"{base}/track/{token}"

    def _send_with_retry(
        self,
        recipient: str,
        template: str,
        body_params: list[str],
        suffix: str,
    ) -> WhatsAppSendResult:
        max_attempts = len(self._backoff) + 1
        result = WhatsAppSendResult(success=False, error="not attempted")
        for attempt in range(max_attempts):
            result = self._meta.send_template(
                recipient=recipient,
                template_name=template,
                body_params=body_params,
                url_button_suffix=suffix,
            )
            if result.success or not MetaWhatsAppService.is_retryable(result.error_category):
                return result
            if attempt < len(self._backoff):
                wait = self._backoff[attempt]
                logger.info("retry %s/%s for template=%s after %ss", attempt + 1, max_attempts, template, wait)
                self._sleep(wait)
        return result

    def send_confirmation(self, order: OrderInternal) -> WhatsAppSendResult:
        recipient = to_whatsapp_recipient(order.mobile)
        return self._send_with_retry(
            recipient=recipient,
            template=self._settings.whatsapp_confirmation_template,
            body_params=[order.customer_name or "there", order.order_number],
            suffix=order.tracking_token,
        )

    def send_ready(self, order: OrderInternal) -> WhatsAppSendResult:
        recipient = to_whatsapp_recipient(order.mobile)
        return self._send_with_retry(
            recipient=recipient,
            template=self._settings.whatsapp_ready_template,
            body_params=[order.order_number],
            suffix=order.tracking_token,
        )


_singleton: MessagingService | None = None


def get_messaging_service() -> MessagingService:
    global _singleton
    if _singleton is None:
        _singleton = MessagingService()
    return _singleton


def set_messaging_service(service: MessagingService | None) -> None:
    global _singleton
    _singleton = service
