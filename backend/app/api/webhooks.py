"""Meta WhatsApp webhook: verification (GET) and status events (POST)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import PlainTextResponse

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.security import verify_meta_signature, verify_shared_secret
from app.services.order_service import OrderService, get_order_service

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])
logger = get_logger(__name__)

# Remember processed webhook message-status pairs to stay idempotent.
_seen: set[str] = set()
_SEEN_MAX = 5000


@router.get("/meta-whatsapp")
def verify(request: Request) -> Response:
    settings = get_settings()
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge", "")
    if mode == "subscribe" and verify_shared_secret(token, settings.meta_webhook_verify_token):
        return PlainTextResponse(content=challenge, status_code=200)
    return PlainTextResponse(content="verification failed", status_code=403)


@router.post("/meta-whatsapp")
async def receive(
    request: Request,
    service: OrderService = Depends(get_order_service),
) -> Response:
    settings = get_settings()
    raw = await request.body()

    # Validate signature when an app secret is configured. Never blindly trust.
    if settings.meta_app_secret:
        signature = request.headers.get("x-hub-signature-256")
        if not verify_meta_signature(raw, signature, settings.meta_app_secret):
            logger.warning("rejected Meta webhook with bad signature")
            return Response(status_code=status.HTTP_403_FORBIDDEN)

    try:
        payload = await request.json()
    except Exception:  # noqa: BLE001
        return Response(status_code=200)  # ack malformed to stop Meta retrying

    _process(payload, service)
    # Always ack quickly so Meta does not retry storms.
    return Response(status_code=200)


def _process(payload: dict, service: OrderService) -> None:
    try:
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                for st in value.get("statuses", []):
                    message_id = st.get("id")
                    new_status = st.get("status")
                    if not message_id or not new_status:
                        continue
                    dedup_key = f"{message_id}:{new_status}"
                    if dedup_key in _seen:
                        continue
                    if service.apply_message_status(message_id, new_status):
                        _remember(dedup_key)
                # Inbound customer messages are logged and ignored (no chatbot).
                for _msg in value.get("messages", []):
                    logger.info("inbound WhatsApp message received (ignored for MVP)")
    except Exception as exc:  # noqa: BLE001 - never let webhook processing 500
        logger.warning("error processing webhook: %s", type(exc).__name__)


def _remember(key: str) -> None:
    if len(_seen) >= _SEEN_MAX:
        _seen.clear()
    _seen.add(key)
