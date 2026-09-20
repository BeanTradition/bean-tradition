"""FastAPI application entrypoint."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, internal, orders, tracking, webhooks
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    docs_url = "/docs" if (settings.enable_docs and not settings.is_production) else None
    redoc_url = "/redoc" if (settings.enable_docs and not settings.is_production) else None

    app = FastAPI(
        title="Bean Tradition Event Ordering API",
        version="1.0.0",
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url="/openapi.json" if docs_url else None,
    )

    origins = settings.cors_origin_list or [settings.frontend_url]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Sheet-Secret"],
    )

    app.include_router(auth.router)
    app.include_router(orders.router)
    app.include_router(tracking.router)
    app.include_router(webhooks.router)
    app.include_router(internal.router)

    @app.get("/api/health", tags=["health"])
    def health() -> dict:
        s = get_settings()
        google_ready = bool(s.google_sheet_id and s.google_service_account_email and s.google_private_key)
        whatsapp_ready = bool(s.whatsapp_access_token and s.whatsapp_phone_number_id)
        return {
            "status": "ok",
            "environment": s.environment,
            "dependencies": {
                "google_sheets": "configured" if google_ready else "in-memory-fallback",
                "whatsapp": "configured" if whatsapp_ready else "not-configured",
                "whatsapp_send_enabled": s.whatsapp_send_enabled,
            },
        }

    logger.info("Bean Tradition API started (env=%s, origins=%s)", settings.environment, origins)
    return app


app = create_app()
