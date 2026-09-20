"""Secure identifiers: tracking tokens, internal UUIDs, timestamps."""
from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone

# 32 URL-safe bytes -> 256 bits of entropy, comfortably above the 128-bit floor.
_TRACKING_TOKEN_BYTES = 32


def new_tracking_token() -> str:
    """A high-entropy, URL-safe customer tracking token.

    Contains no order id, mobile, name, or sequence - it is unguessable and
    reveals nothing about the order.
    """
    return secrets.token_urlsafe(_TRACKING_TOKEN_BYTES)


def new_order_id() -> str:
    return str(uuid.uuid4())


def utc_now_iso() -> str:
    """Current time as an ISO-8601 UTC string, e.g. 2026-09-20T10:15:30Z."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
