import pytest

from app.utils.order_numbers import format_order_number, parse_order_number
from app.utils.phone import InvalidPhoneError, normalize_phone
from app.utils.tokens import new_tracking_token


def test_order_number_formatting():
    assert format_order_number(1) == "BT0001"
    assert format_order_number(147) == "BT0147"
    assert format_order_number(9999) == "BT9999"
    # grows naturally beyond the pad width
    assert format_order_number(10000) == "BT10000"
    assert format_order_number(3, prefix="CT") == "CT0003"


def test_order_number_parsing_roundtrip():
    assert parse_order_number("BT0147") == 147
    assert parse_order_number("BT10000") == 10000
    with pytest.raises(ValueError):
        parse_order_number("XX0001")


def test_tracking_token_entropy_and_uniqueness():
    tokens = {new_tracking_token() for _ in range(2000)}
    assert len(tokens) == 2000  # no collisions
    # 32 bytes url-safe base64 -> >= 43 chars, well over 128 bits
    assert all(len(t) >= 43 for t in tokens)


@pytest.mark.parametrize(
    "raw",
    ["9876543210", "919876543210", "+919876543210", "+91 98765 43210", "98765-43210", "98765 43210"],
)
def test_indian_phone_normalization(raw):
    assert normalize_phone(raw, "+91") == "+919876543210"


def test_international_phone_normalization():
    # US number in E.164 stays E.164
    assert normalize_phone("+14155552671", "+91") == "+14155552671"
    # UK number
    assert normalize_phone("+442071838750", "+91") == "+442071838750"


def test_invalid_phone_raises():
    with pytest.raises(InvalidPhoneError):
        normalize_phone("123", "+91")
    with pytest.raises(InvalidPhoneError):
        normalize_phone("", "+91")
    with pytest.raises(InvalidPhoneError):
        normalize_phone("notaphone", "+91")
