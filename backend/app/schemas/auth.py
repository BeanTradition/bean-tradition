"""Authentication schemas."""
from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    password: str = Field(min_length=1, max_length=200)


class LoginResponse(BaseModel):
    success: bool


class MeResponse(BaseModel):
    authenticated: bool
    subject: str | None = None
