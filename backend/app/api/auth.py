"""Authentication endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response

from app.api.deps import get_session
from app.core.config import get_settings
from app.middleware.rate_limit import FixedWindowLimiter, rate_limiter
from app.schemas.auth import LoginRequest, LoginResponse, MeResponse
from app.services.auth_service import AuthService, get_auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

_login_limiter = FixedWindowLimiter(get_settings().login_rate_limit_per_min)


def _set_session_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_max_age_seconds,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


@router.post("/login", response_model=LoginResponse)
def login(
    body: LoginRequest,
    response: Response,
    auth: AuthService = Depends(get_auth_service),
    _: None = Depends(rate_limiter(_login_limiter, "login")),
) -> LoginResponse:
    token = auth.login(body.password)
    if not token:
        response.status_code = 401
        return LoginResponse(success=False)
    _set_session_cookie(response, token)
    return LoginResponse(success=True)


@router.post("/logout", response_model=LoginResponse)
def logout(response: Response) -> LoginResponse:
    settings = get_settings()
    response.delete_cookie(settings.session_cookie_name, path="/")
    return LoginResponse(success=True)


@router.get("/me", response_model=MeResponse)
def me(session: dict | None = Depends(get_session)) -> MeResponse:
    if not session:
        return MeResponse(authenticated=False)
    return MeResponse(authenticated=True, subject=session.get("sub"))
