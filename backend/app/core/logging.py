"""Structured, secret-safe logging helpers.

Never log full WhatsApp tokens, Google private keys, passwords, the Meta app
secret, or full customer phone numbers. ``mask_mobile`` is the only approved way
to put a phone number into a log line.
"""
from __future__ import annotations

import logging
import sys

_CONFIGURED = False


def configure_logging(level: int = logging.INFO) -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s")
    )
    root = logging.getLogger()
    root.setLevel(level)
    root.addHandler(handler)
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    configure_logging()
    return logging.getLogger(name)


def mask_mobile(mobile: str | None) -> str:
    """Return a masked mobile safe for logs, e.g. +9198XXXXXX10."""
    if not mobile:
        return "<none>"
    digits = mobile.strip()
    if len(digits) <= 4:
        return "X" * len(digits)
    return digits[:4] + "X" * max(0, len(digits) - 6) + digits[-2:]
