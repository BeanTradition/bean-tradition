"""Shared pytest fixtures.

Test config is set in the environment BEFORE any app module imports settings.
No test ever touches real Google Sheets or sends a real WhatsApp message: the
sheets layer uses the in-memory backend and the Meta transport is faked.
"""
from __future__ import annotations

import os

os.environ.setdefault("EVENT_ADMIN_PASSWORD", "testpass")
os.environ.setdefault("SESSION_SECRET", "test-session-secret-value")
os.environ.setdefault("SHEET_WEBHOOK_SECRET", "test-sheet-secret")
os.environ.setdefault("META_WEBHOOK_VERIFY_TOKEN", "verify-me")
os.environ.setdefault("META_APP_SECRET", "")  # no signature enforcement by default
os.environ.setdefault("WHATSAPP_SEND_ENABLED", "true")
os.environ.setdefault("WHATSAPP_PHONE_NUMBER_ID", "1234567890")
os.environ.setdefault("WHATSAPP_ACCESS_TOKEN", "test-token")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")

import httpx  # noqa: E402
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.services.google_sheets import GoogleSheetsService, InMemoryBackend, set_sheets_service  # noqa: E402
from app.services.messaging.messaging_service import MessagingService, set_messaging_service  # noqa: E402
from app.services.messaging.meta_whatsapp import MetaWhatsAppService, set_meta_service  # noqa: E402
from app.services.order_service import OrderService, set_order_service  # noqa: E402


class FakeTransport:
    """Deterministic Meta transport. Feed it responses; it records requests."""

    def __init__(self, responses: list[httpx.Response] | None = None) -> None:
        self.responses = responses or []
        self.requests: list[dict] = []

    def post(self, url, *, headers, json):  # noqa: A002
        self.requests.append({"url": url, "headers": headers, "json": json})
        if self.responses:
            return self.responses.pop(0)
        return httpx.Response(200, json={"messages": [{"id": f"wamid.MOCK{len(self.requests)}"}]})


def ok_response(mid: str = "wamid.OK") -> httpx.Response:
    return httpx.Response(200, json={"messages": [{"id": mid}]})


def error_response(status: int, code: int, message: str = "err") -> httpx.Response:
    return httpx.Response(status, json={"error": {"code": code, "message": message}})


@pytest.fixture
def settings():
    get_settings.cache_clear()
    return get_settings()


@pytest.fixture
def transport() -> FakeTransport:
    return FakeTransport()


@pytest.fixture
def env(settings, transport):
    """Wire an isolated in-memory environment and return the key objects."""
    sheets = GoogleSheetsService(
        InMemoryBackend(settings={"Initial Order Status": "PREPARING", "Queue Display Limit": "20"}),
        settings,
    )
    meta = MetaWhatsAppService(settings=settings, transport=transport)
    messaging = MessagingService(meta=meta, settings=settings, sleeper=lambda _s: None)
    service = OrderService(sheets=sheets, messaging=messaging, settings=settings)

    set_sheets_service(sheets)
    set_meta_service(meta)
    set_messaging_service(messaging)
    set_order_service(service)

    yield {"sheets": sheets, "meta": meta, "messaging": messaging, "service": service, "transport": transport}

    set_sheets_service(None)
    set_meta_service(None)
    set_messaging_service(None)
    set_order_service(None)


@pytest.fixture
def client(env):
    from app.main import create_app

    app = create_app()
    c = TestClient(app)
    return c


@pytest.fixture
def auth_client(client):
    resp = client.post("/api/auth/login", json={"password": "testpass"})
    assert resp.status_code == 200
    return client


def make_order_payload(**overrides) -> dict:
    payload = {
        "customer_name": "Rahul",
        "mobile": "9876543210",
        "items": [{"product": "Cold Coffee", "quantity": 2}],
        "notes": "",
        "amount": 240,
        "payment_method": "UPI",
        "created_by": "Counter 1",
        "idempotency_key": "idem-key-0001",
    }
    payload.update(overrides)
    return payload
