"""Shared FastAPI dependencies."""
from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status

from app.core.config import get_settings
from app.services.auth_service import AuthService, get_auth_service


def get_session(request: Request, auth: AuthService = Depends(get_auth_service)) -> dict | None:
    settings = get_settings()
    token = request.cookies.get(settings.session_cookie_name)
    return auth.verify(token)


def require_staff(session: dict | None = Depends(get_session)) -> dict:
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    return session
