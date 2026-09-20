"""WhatsApp send-result and inbound webhook schemas."""
from __future__ import annotations

from pydantic import BaseModel


class WhatsAppSendResult(BaseModel):
    success: bool
    meta_message_id: str | None = None
    error: str | None = None          # staff-safe message, never raw credentials
    error_category: str | None = None  # e.g. auth, template, invalid_number, rate_limit, network
    simulated: bool = False            # True when WHATSAPP_SEND_ENABLED=false


# --- Inbound webhook payloads (partial - we only read what we need) ---


class WebhookStatus(BaseModel):
    id: str | None = None            # Meta message id
    status: str | None = None        # sent | delivered | read | failed
    recipient_id: str | None = None
    timestamp: str | None = None


class WhatsAppWebhookPayload(BaseModel):
    object: str | None = None
    entry: list[dict] = []
