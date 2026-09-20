from app.models.order import MessageStatus
from app.tests.conftest import make_order_payload


def test_health_ok(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_protected_routes_require_auth(client):
    assert client.post("/api/orders", json=make_order_payload()).status_code == 401
    assert client.get("/api/orders/active").status_code == 401


def test_login_and_create_order(auth_client):
    resp = auth_client.post("/api/orders", json=make_order_payload())
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["order_created"] is True
    assert data["order"]["order_number"] == "BT0001"
    assert data["order"]["tracking_url"].endswith("/track/" + _token_from(auth_client, "BT0001"))
    assert data["whatsapp"]["confirmation_sent"] is True


def _token_from(client, order_number: str) -> str:
    from app.services.google_sheets import get_sheets_service

    return get_sheets_service().find_by_order_number(order_number).tracking_token


def test_bad_login_rejected(client):
    resp = client.post("/api/auth/login", json={"password": "wrong"})
    assert resp.status_code == 401
    assert resp.json()["success"] is False


def test_tracking_privacy(auth_client):
    auth_client.post("/api/orders", json=make_order_payload(idempotency_key="idem-key-aa", customer_name="Rahul"))
    auth_client.post(
        "/api/orders",
        json=make_order_payload(
            idempotency_key="idem-key-bb", customer_name="Priya", mobile="9812345678",
            items=[{"product": "Espresso", "quantity": 1}],
        ),
    )
    token_a = _token_from(auth_client, "BT0001")

    resp = auth_client.get(f"/api/track/{token_a}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["my_order"]["order_number"] == "BT0001"
    assert set(data["preparing_orders"]) >= {"BT0001", "BT0002"}

    raw = resp.text
    # No other customer's PII may appear anywhere in the public payload.
    assert "Priya" not in raw
    assert "9812345678" not in raw
    assert "9876543210" not in raw
    assert token_a not in str(data["preparing_orders"])  # tokens never in queue lists


def test_invalid_tracking_token_404(client):
    assert client.get("/api/track/does-not-exist").status_code == 404


def test_meta_webhook_verification(client):
    resp = client.get(
        "/api/webhooks/meta-whatsapp",
        params={"hub.mode": "subscribe", "hub.verify_token": "verify-me", "hub.challenge": "12345"},
    )
    assert resp.status_code == 200
    assert resp.text == "12345"

    bad = client.get(
        "/api/webhooks/meta-whatsapp",
        params={"hub.mode": "subscribe", "hub.verify_token": "nope", "hub.challenge": "x"},
    )
    assert bad.status_code == 403


def test_webhook_status_update_is_idempotent(auth_client):
    auth_client.post("/api/orders", json=make_order_payload())
    mid = _confirmation_mid(auth_client, "BT0001")

    payload = {
        "object": "whatsapp_business_account",
        "entry": [{"changes": [{"value": {"statuses": [{"id": mid, "status": "delivered"}]}}]}],
    }
    r1 = auth_client.post("/api/webhooks/meta-whatsapp", json=payload)
    r2 = auth_client.post("/api/webhooks/meta-whatsapp", json=payload)
    assert r1.status_code == 200 and r2.status_code == 200

    from app.services.google_sheets import get_sheets_service

    order = get_sheets_service().find_by_order_number("BT0001", fresh=True)
    assert order.confirmation_status == MessageStatus.DELIVERED


def _confirmation_mid(client, order_number: str) -> str:
    from app.services.google_sheets import get_sheets_service

    return get_sheets_service().find_by_order_number(order_number).confirmation_message_id


def test_sheet_status_change_triggers_ready(auth_client):
    auth_client.post("/api/orders", json=make_order_payload())
    resp = auth_client.post(
        "/api/internal/sheet-status-change",
        json={"order_number": "BT0001", "status": "READY", "secret": "test-sheet-secret"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "READY"

    from app.services.google_sheets import get_sheets_service

    order = get_sheets_service().find_by_order_number("BT0001", fresh=True)
    assert order.ready_status == MessageStatus.SENT
    assert order.ready_at


def test_sheet_status_change_rejects_bad_secret(auth_client):
    auth_client.post("/api/orders", json=make_order_payload())
    resp = auth_client.post(
        "/api/internal/sheet-status-change",
        json={"order_number": "BT0001", "status": "READY", "secret": "wrong"},
    )
    assert resp.status_code == 401


def test_status_update_via_api(auth_client):
    create = auth_client.post("/api/orders", json=make_order_payload())
    order_id = create.json()["order"]["order_id"]
    resp = auth_client.patch(f"/api/orders/{order_id}/status", json={"status": "READY"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "READY"
    assert resp.json()["ready_status"] == "SENT"
