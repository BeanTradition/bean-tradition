"""Phone normalisation to E.164 for the Meta WhatsApp API.

Indian inputs like ``9876543210``, ``919876543210`` and ``+919876543210`` all
resolve to ``+919876543210``. International numbers are supported when written
with a ``+`` country code. Obvious junk raises :class:`InvalidPhoneError`.
"""
from __future__ import annotations

import phonenumbers


class InvalidPhoneError(ValueError):
    """Raised when a phone number cannot be parsed into a valid E.164 value."""


def normalize_phone(raw: str, default_country_code: str = "+91") -> str:
    if raw is None:
        raise InvalidPhoneError("mobile is required")

    cleaned = raw.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if not cleaned:
        raise InvalidPhoneError("mobile is required")

    default_region = _region_from_country_code(default_country_code)

    try:
        if cleaned.startswith("+"):
            parsed = phonenumbers.parse(cleaned, None)
        elif default_country_code == "+91" and _is_bare_indian(cleaned):
            # 10-digit local or 12-digit 91-prefixed number without a plus.
            local = cleaned[2:] if cleaned.startswith("91") and len(cleaned) == 12 else cleaned
            parsed = phonenumbers.parse(local, "IN")
        else:
            parsed = phonenumbers.parse(cleaned, default_region)
    except phonenumbers.NumberParseException as exc:
        raise InvalidPhoneError(f"could not parse phone number: {exc.error_type}") from exc

    if not phonenumbers.is_valid_number(parsed):
        raise InvalidPhoneError("phone number failed validation")

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def _is_bare_indian(cleaned: str) -> bool:
    return cleaned.isdigit() and (
        len(cleaned) == 10 or (len(cleaned) == 12 and cleaned.startswith("91"))
    )


def _region_from_country_code(country_code: str) -> str:
    try:
        cc = int(country_code.replace("+", ""))
    except ValueError:
        return "IN"
    region = phonenumbers.region_code_for_country_code(cc)
    return region if region and region != "ZZ" else "IN"


def to_whatsapp_recipient(e164: str) -> str:
    """Meta expects the recipient without the leading ``+``."""
    return e164[1:] if e164.startswith("+") else e164
