"""Lightweight in-memory rate limiting.

NOTE: state is per-process. With multiple FastAPI instances behind a load
balancer each instance limits independently, so effective limits are multiplied
by the instance count. For a single-instance event deployment this is fine; for
horizontal scaling move this to a shared store. No Redis by design for the MVP.
"""
from __future__ import annotations

import threading
import time

from fastapi import HTTPException, Request, status


class FixedWindowLimiter:
    def __init__(self, max_requests: int, window_seconds: float = 60.0) -> None:
        self._max = max_requests
        self._window = window_seconds
        self._hits: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str) -> bool:
        now = time.monotonic()
        cutoff = now - self._window
        with self._lock:
            bucket = [t for t in self._hits.get(key, []) if t > cutoff]
            if len(bucket) >= self._max:
                self._hits[key] = bucket
                return False
            bucket.append(now)
            self._hits[key] = bucket
            return True


def _client_key(request: Request, scope: str) -> str:
    client = request.client.host if request.client else "unknown"
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        client = fwd.split(",")[0].strip()
    return f"{scope}:{client}"


def rate_limiter(limiter: FixedWindowLimiter, scope: str):
    def dependency(request: Request) -> None:
        if not limiter.check(_client_key(request, scope)):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please slow down.",
            )

    return dependency
