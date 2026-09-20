"""Meta WhatsApp Cloud API transport.

All WhatsApp traffic goes through here, server-side only. Credentials never
reach React. A pluggable :class:`Transport` lets tests inject a mock so no real
message is ever sent during testing, and ``WHATSAPP_SEND_ENABLED=false`` returns
a simulated success for local development.
"""
from __future__ import annotations

from typing import Any, Protocol

import httpx

from app.core.config import Settings, get_settings
from app.core.logging import get_logger, mask_mobile
from app.schemas.whatsapp import WhatsAppSendResult

logger = get_logger(__name__)

# Meta error codes that are permanent - retrying will not help.
_PERMANENT_CODES = {
    190: "auth",            # access token expired/invalid
    100: "template",        # invalid parameter / template mismatch
    132000: "template",     # template param count mismatch
    132001: "template",     # template does not exist
    132005: "template",     # template hydration / format
    131026: "invalid_number",  # message undeliverable / not a WA user
    131047: "invalid_number",
}
_RATE_LIMIT_CODES = {4, 80007, 130429, 131048}


class Transport(Protocol):
    def post(self, url: str, *, headers: dict[str, str], json: dict[str, Any]) -> httpx.Response: ...


class HttpxTransport:
    def __init__(self, timeout: float = 15.0) -> None:
        self._timeout = timeout

    def post(self, url: str, *, headers: dict[str, str], json: dict[str, Any]) -> httpx.Response:
        with httpx.Client(timeout=self._timeout) as client:
            return client.post(url, headers=headers, json=json)


class MetaWhatsAppService:
    def __init__(self, settings: Settings | None = None, transport: Transport | None = None) -> None:
        self._settings = settings or get_settings()
        self._transport = transport or HttpxTransport()

    @property
    def _base_url(self) -> str:
        s = self._settings
        return f"https://graph.facebook.com/{s.whatsapp_api_version}/{s.whatsapp_phone_number_id}/messages"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._settings.whatsapp_access_token}",
            "Content-Type": "application/json",
        }

    def send_template(
        self,
        recipient: str,
        template_name: str,
        body_params: list[str],
        url_button_suffix: str | None = None,
    ) -> WhatsAppSendResult:
        """Send an approved template message.

        ``body_params`` fill the template's ``{{1}}``, ``{{2}}`` ... placeholders.
        ``url_button_suffix`` is the dynamic suffix for a URL CTA button (index 0)
        - for us, the tracking token appended to the template's base URL.
        """
        if not self._settings.whatsapp_send_enabled:
            logger.info(
                "WHATSAPP_SEND_ENABLED=false - simulating send template=%s to=%s",
                template_name,
                mask_mobile(recipient),
            )
            return WhatsAppSendResult(
                success=True,
                meta_message_id=f"SIMULATED-{template_name}-{recipient[-4:]}",
                simulated=True,
            )

        components: list[dict[str, Any]] = []
        if body_params:
            components.append(
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": p} for p in body_params],
                }
            )
        if url_button_suffix is not None:
            components.append(
                {
                    "type": "button",
                    "sub_type": "url",
                    "index": "0",
                    "parameters": [{"type": "text", "text": url_button_suffix}],
                }
            )

        payload = {
            "messaging_product": "whatsapp",
            "to": recipient,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": self._settings.whatsapp_template_language},
                "components": components,
            },
        }

        try:
            resp = self._transport.post(self._base_url, headers=self._headers(), json=payload)
        except httpx.HTTPError as exc:
            logger.warning("WhatsApp network error to=%s: %s", mask_mobile(recipient), type(exc).__name__)
            return WhatsAppSendResult(
                success=False,
                error="Network error contacting WhatsApp. Will retry.",
                error_category="network",
            )

        return self._parse_response(resp, recipient)

    def _parse_response(self, resp: httpx.Response, recipient: str) -> WhatsAppSendResult:
        try:
            data = resp.json()
        except ValueError:
            return WhatsAppSendResult(
                success=False,
                error=f"Malformed WhatsApp response (HTTP {resp.status_code}).",
                error_category="malformed",
            )

        if resp.status_code == 200 and "messages" in data:
            mid = data["messages"][0].get("id")
            logger.info("WhatsApp sent to=%s message_id=%s", mask_mobile(recipient), mid)
            return WhatsAppSendResult(success=True, meta_message_id=mid)

        error = data.get("error", {}) if isinstance(data, dict) else {}
        code = error.get("code")
        category = self._categorise(code, resp.status_code)
        safe_msg = self._safe_error_message(category, error.get("message"))
        logger.warning(
            "WhatsApp send failed to=%s http=%s code=%s category=%s",
            mask_mobile(recipient),
            resp.status_code,
            code,
            category,
        )
        return WhatsAppSendResult(success=False, error=safe_msg, error_category=category)

    @staticmethod
    def _categorise(code: int | None, http_status: int) -> str:
        if code in _PERMANENT_CODES:
            return _PERMANENT_CODES[code]
        if code in _RATE_LIMIT_CODES or http_status == 429:
            return "rate_limit"
        if http_status >= 500:
            return "server"
        return "unknown"

    @staticmethod
    def _safe_error_message(category: str, _raw: str | None) -> str:
        # Never surface raw Meta text (may include ids/tokens) to staff UI.
        return {
            "auth": "WhatsApp access token invalid or expired. Notify admin.",
            "template": "WhatsApp template not approved or parameters mismatch.",
            "invalid_number": "Customer number is not reachable on WhatsApp.",
            "rate_limit": "WhatsApp rate limit hit. Will retry shortly.",
            "server": "WhatsApp service temporarily unavailable. Will retry.",
            "network": "Network error contacting WhatsApp. Will retry.",
            "malformed": "Unexpected WhatsApp response.",
        }.get(category, "WhatsApp message could not be sent.")

    @staticmethod
    def is_retryable(category: str | None) -> bool:
        return category in {"rate_limit", "server", "network", "unknown"}


_singleton: MetaWhatsAppService | None = None


def get_meta_service() -> MetaWhatsAppService:
    global _singleton
    if _singleton is None:
        _singleton = MetaWhatsAppService()
    return _singleton


def set_meta_service(service: MetaWhatsAppService | None) -> None:
    global _singleton
    _singleton = service
