"""Vercel Python serverless entrypoint.

Deploy the backend as a Vercel project with **Root Directory = `backend`**.
Vercel's Python runtime serves the module-level ASGI ``app`` exported here, and
``backend/vercel.json`` rewrites every path to this function so FastAPI does the
routing.

Serverless notes (see docs/vercel-only-deploy.md):
- In-memory cache / rate-limit / webhook-dedup reset between invocations.
- Order-number allocation MUST use the Apps Script LockService counter
  (set ORDER_NUMBER_SCRIPT_URL); the in-process lock does not span instances.
"""
import os
import sys

# Make the backend package importable (this file lives in backend/api/).
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: E402  (re-exported for Vercel)

__all__ = ["app"]
