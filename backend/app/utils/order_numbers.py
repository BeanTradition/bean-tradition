"""Human-readable order-number formatting.

Numbers are ``<PREFIX><zero-padded sequence>`` - BT0001, BT0002, ... The pad
width is a minimum, so the sequence grows naturally past it: BT9999 -> BT10000.
The concurrency-safe *allocation* of the next sequence lives in
``services.order_service`` (Apps Script LockService or a locked counter cell);
this module only turns a number into text and back.
"""
from __future__ import annotations

import re

DEFAULT_PAD = 4


def format_order_number(sequence: int, prefix: str = "BT", pad: int = DEFAULT_PAD) -> str:
    if sequence < 1:
        raise ValueError("order sequence must be >= 1")
    return f"{prefix}{sequence:0{pad}d}"


def parse_order_number(order_number: str, prefix: str = "BT") -> int:
    match = re.fullmatch(rf"{re.escape(prefix)}(\d+)", order_number.strip())
    if not match:
        raise ValueError(f"invalid order number: {order_number!r}")
    return int(match.group(1))
