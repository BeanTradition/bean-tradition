"""Shared-password staff authentication with signed session cookies."""
from __future__ import annotations

from app.core.config import Settings, get_settings
from app.core.security import create_session_token, verify_password, verify_session_token


class AuthService:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    def login(self, password: str) -> str | None:
        """Return a signed session token on success, else None."""
        if verify_password(password, self._settings.event_admin_password):
            return create_session_token("staff")
        return None

    def verify(self, token: str | None) -> dict | None:
        return verify_session_token(token)


_singleton: AuthService | None = None


def get_auth_service() -> AuthService:
    global _singleton
    if _singleton is None:
        _singleton = AuthService()
    return _singleton
