import pytest

from app.models.order import MessageStatus, OrderStatus
from app.schemas.order import OrderCreate
from app.services.order_service import InvalidStatusTransition
from app.tests.conftest import error_response, make_order_payload, ok_response


def _create(env, **overrides):
    payload = OrderCreate(**make_order_payload(**overrides))
    return env["service"].create_order(payload)


def test_create_order_writes_and_confirms(env):
    order, wa, is_new = _create(env)
    assert is_new is True
    assert order.order_number == "BT0001"
    assert order.mobile == "+919876543210"
    assert order.status == OrderStatus.PREPARING
    assert wa.success is True
    assert order.confirmation_status == MessageStatus.SENT
    assert order.confirmation_message_id


def test_order_numbers_increment(env):
    o1, _, _ = _create(env, idempotency_key="idem-key-1")
    o2, _, _ = _create(env, idempotency_key="idem-key-2")
    o3, _, _ = _create(env, idempotency_key="idem-key-3")
    assert [o1.order_number, o2.order_number, o3.order_number] == ["BT0001", "BT0002", "BT0003"]


def test_idempotent_creation_returns_same_order(env):
    o1, _, new1 = _create(env, idempotency_key="idem-same-key")
    o2, _, new2 = _create(env, idempotency_key="idem-same-key")
    assert new1 is True and new2 is False
    assert o1.order_id == o2.order_id
    assert o1.order_number == o2.order_number
    # only one confirmation send happened
    assert len(env["transport"].requests) == 1


def test_valid_transition_preparing_to_ready_sends_once(env):
    order, _, _ = _create(env)
    updated, wa = env["service"].update_status(order.order_id, OrderStatus.READY)
    assert updated.status == OrderStatus.READY
    assert updated.ready_at
    assert wa is not None and wa.success
    assert updated.ready_status == MessageStatus.SENT


def test_invalid_transition_rejected(env):
    order, _, _ = _create(env)
    with pytest.raises(InvalidStatusTransition):
        env["service"].update_status(order.order_id, OrderStatus.DELIVERED)


def test_duplicate_ready_not_sent_on_reentry(env):
    order, _, _ = _create(env)
    env["service"].update_status(order.order_id, OrderStatus.READY)
    sends_after_first = len(env["transport"].requests)
    # READY -> PREPARING -> READY again must NOT auto-send a second ready
    env["service"].update_status(order.order_id, OrderStatus.PREPARING)
    _, wa = env["service"].update_status(order.order_id, OrderStatus.READY)
    assert wa is None
    assert len(env["transport"].requests) == sends_after_first


def test_resend_ready_is_explicit_and_sends(env):
    order, _, _ = _create(env)
    env["service"].update_status(order.order_id, OrderStatus.READY)
    before = len(env["transport"].requests)
    result = env["service"].resend_ready(order.order_id)
    assert result.success
    assert len(env["transport"].requests) == before + 1


def test_delivered_sets_timestamp_and_leaves_queue(env):
    order, _, _ = _create(env)
    env["service"].update_status(order.order_id, OrderStatus.READY)
    delivered, _ = env["service"].update_status(order.order_id, OrderStatus.DELIVERED)
    assert delivered.status == OrderStatus.DELIVERED
    assert delivered.delivered_at
    assert delivered.order_id not in [o.order_id for o in env["sheets"].active_orders()]


def test_failed_confirmation_keeps_order(env):
    # Permanent template error -> no retry, order still created
    env["transport"].responses = [error_response(400, 132001, "template missing")]
    order, wa, is_new = _create(env)
    assert is_new is True
    assert wa.success is False
    assert order.confirmation_status == MessageStatus.FAILED
    assert order.last_messaging_error
    # order is durably present despite messaging failure
    assert env["sheets"].find_by_order_id(order.order_id) is not None


def test_retry_confirmation_after_failure(env):
    env["transport"].responses = [error_response(500, 1, "server"), ok_response("wamid.retry")]
    order, wa, _ = _create(env)
    # 500 is retryable; with backoff it should already have retried to success
    assert wa.success is True
    assert order.confirmation_status == MessageStatus.SENT
