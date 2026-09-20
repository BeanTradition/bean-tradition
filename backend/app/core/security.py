"""Security primitives: session signing, constant-time comparisons, webhook
signature verification, and Google Sheets formula-injection sanitisation.
"""
from __future__ import annotations

import hashlib
import hmac
import secrets

from itsdangerous import BadSignature, URLSafeTimedSerializer

from app.core.config import get_settings

_SESSION_SALT = "bt-session-v1"


def _serializer() -> URLSafeTimedSerializer:
    settings = get_settings()
    return URLSafeTimedSerializer(settings.session_secret, salt=_SESSION_SALT)


def create_session_token(subject: str = "staff") -> str:
    """Create a signed, timestamped session token."""
    return _serializer().dumps({"sub": subject})


def verify_session_token(token: str | None) -> dict | None:
    """Return the payload if the token is valid and not expired, else None."""
    if not token:
        return None
    settings = get_settings()
    try:
        return _serializer().loads(token, max_age=settings.session_max_age_seconds)
    except BadSignature:
        return None
    except Exception:  # noqa: BLE001 - any decode error means no session
        return None


def verify_password(candidate: str, expected: str) -> bool:
    """Constant-time password comparison."""
    return hmac.compare_digest(candidate.encode("utf-8"), expected.encode("utf-8"))


def verify_shared_secret(candidate: str | None, expected: str) -> bool:
    if not candidate or not expected:
        return False
    return hmac.compare_digest(candidate.encode("utf-8"), expected.encode("utf-8"))


def verify_meta_signature(raw_body: bytes, header_signature: str | None, app_secret: str) -> bool:
    """Validate the ``X-Hub-Signature-256`` header from Meta webhooks.

    Returns False when either the signature or the app secret is missing so the
    caller can decide how strict to be.
    """
    if not header_signature or not app_secret:
        return False
    prefix = "sha256="
    if not header_signature.startswith(prefix):
        return False
    provided = header_signature[len(prefix):]
    expected = hmac.new(app_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(provided, expected)


_INJECTION_PREFIXES = ("=", "+", "-", "@")


def sanitize_for_sheet(value: str | None) -> str:
    """Neutralise spreadsheet formula injection.

    If a user-supplied string begins with a formula trigger character, prefix a
    single quote so Google Sheets treats it as text. Numbers handled elsewhere.
    """
    if value is None:
        return ""
    text = str(value)
    if text and text[0] in _INJECTION_PREFIXES:
        return "'" + text
    return text


def new_secret(nbytes: int = 32) -> str:
    return secrets.token_urlsafe(nbytes)
