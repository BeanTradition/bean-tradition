from app.models.order import (
    COLUMN_COUNT,
    MessageStatus,
    OrderInternal,
    OrderItemModel,
    OrderStatus,
    build_items_display,
    order_to_sheet_row,
    sheet_row_to_order,
)


def _sample() -> OrderInternal:
    items = [OrderItemModel(product="Cold Coffee", quantity=2), OrderItemModel(product="Espresso", quantity=1)]
    return OrderInternal(
        order_id="uuid-1",
        order_number="BT0147",
        tracking_token="tok123",
        created_at="2026-09-20T10:00:00Z",
        customer_name="Rahul",
        mobile="+919876543210",
        items=items,
        items_display=build_items_display(items),
        quantity_total=3,
        notes="extra hot",
        amount=240.0,
        payment_method="UPI",
        status=OrderStatus.PREPARING,
        confirmation_status=MessageStatus.SENT,
        confirmation_message_id="wamid.1",
        created_by="Counter 1",
        updated_at="2026-09-20T10:00:00Z",
        idempotency_key="idem-1",
    )


def test_row_has_25_columns():
    row = order_to_sheet_row(_sample())
    assert len(row) == COLUMN_COUNT == 25


def test_sheet_roundtrip_preserves_fields():
    original = _sample()
    row = order_to_sheet_row(original)
    restored = sheet_row_to_order(row, row_number=5)
    assert restored.order_number == "BT0147"
    assert restored.customer_name == "Rahul"
    assert restored.mobile == "+919876543210"
    assert restored.quantity_total == 3
    assert restored.amount == 240.0
    assert restored.status == OrderStatus.PREPARING
    assert restored.confirmation_status == MessageStatus.SENT
    assert [(i.product, i.quantity) for i in restored.items] == [("Cold Coffee", 2), ("Espresso", 1)]
    assert restored.row_number == 5


def test_formula_injection_is_sanitised():
    o = _sample()
    o.customer_name = "=HYPERLINK(evil)"
    o.notes = "+1+2"
    o.items_display = "@cmd"
    row = order_to_sheet_row(o)
    # E=customer name(idx4), H=items display(idx7), J=notes(idx9)
    assert row[4].startswith("'=")
    assert row[7].startswith("'@")
    assert row[9].startswith("'+")
    # reading back strips the guard quote for display
    restored = sheet_row_to_order(row)
    assert restored.customer_name == "=HYPERLINK(evil)"
    assert restored.notes == "+1+2"


def test_blank_amount_parses_to_none():
    o = _sample()
    o.amount = None
    row = order_to_sheet_row(o)
    restored = sheet_row_to_order(row)
    assert restored.amount is None
