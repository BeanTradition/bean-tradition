from app.services.messaging.messaging_service import MessagingService
from app.services.messaging.meta_whatsapp import MetaWhatsAppService
from app.tests.conftest import FakeTransport, error_response, ok_response


def _meta(settings, transport):
    return MetaWhatsAppService(settings=settings, transport=transport)


def test_send_template_success_builds_correct_payload(settings):
    transport = FakeTransport([ok_response("wamid.ABC")])
    meta = _meta(settings, transport)
    result = meta.send_template("919876543210", "order_confirmation", ["Rahul", "BT0147"], "tok123")
    assert result.success
    assert result.meta_message_id == "wamid.ABC"
    sent = transport.requests[0]["json"]
    assert sent["to"] == "919876543210"
    assert sent["template"]["name"] == "order_confirmation"
    body = next(c for c in sent["template"]["components"] if c["type"] == "body")
    assert [p["text"] for p in body["parameters"]] == ["Rahul", "BT0147"]
    button = next(c for c in sent["template"]["components"] if c["type"] == "button")
    assert button["sub_type"] == "url"
    assert button["parameters"][0]["text"] == "tok123"


def test_auth_error_is_permanent(settings):
    transport = FakeTransport([error_response(401, 190, "OAuthException token EAAG-secret-123")])
    meta = _meta(settings, transport)
    result = meta.send_template("919876543210", "t", ["x"], "s")
    assert not result.success
    assert result.error_category == "auth"
    assert MetaWhatsAppService.is_retryable("auth") is False
    # staff-safe message never echoes the raw Meta text / any token material
    assert "EAAG-secret-123" not in (result.error or "")
    assert "OAuthException" not in (result.error or "")


def test_rate_limit_is_retryable(settings):
    transport = FakeTransport([error_response(429, 130429, "slow down")])
    meta = _meta(settings, transport)
    result = meta.send_template("919876543210", "t", ["x"], "s")
    assert result.error_category == "rate_limit"
    assert MetaWhatsAppService.is_retryable("rate_limit") is True


def test_messaging_retries_then_succeeds(settings):
    transport = FakeTransport([error_response(500, 1, "server"), ok_response("wamid.OK2")])
    meta = _meta(settings, transport)
    messaging = MessagingService(meta=meta, settings=settings, sleeper=lambda _s: None, backoff=(0.0, 0.0))

    class _O:
        mobile = "+919876543210"
        customer_name = "Rahul"
        order_number = "BT0147"
        tracking_token = "tok123"

    result = messaging.send_confirmation(_O())
    assert result.success
    assert len(transport.requests) == 2


def test_messaging_gives_up_after_retries(settings):
    transport = FakeTransport([error_response(500, 1, "server")] * 10)
    meta = _meta(settings, transport)
    messaging = MessagingService(meta=meta, settings=settings, sleeper=lambda _s: None, backoff=(0.0, 0.0))

    class _O:
        mobile = "+919876543210"
        customer_name = "Rahul"
        order_number = "BT0147"
        tracking_token = "tok123"

    result = messaging.send_ready(_O())
    assert not result.success
    # 1 initial + 2 backoff retries = 3 attempts
    assert len(transport.requests) == 3


def test_simulation_mode_makes_no_calls(settings, monkeypatch):
    monkeypatch.setattr(settings, "whatsapp_send_enabled", False)
    transport = FakeTransport()
    meta = _meta(settings, transport)
    result = meta.send_template("919876543210", "t", ["x"], "s")
    assert result.success and result.simulated
    assert len(transport.requests) == 0
