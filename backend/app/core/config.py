"""Application configuration loaded from environment variables.

All secrets live here and nowhere else. Never import raw ``os.environ`` in
feature code - depend on ``get_settings()`` so tests can override cleanly.
"""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- Google Sheets ---
    google_sheet_id: str = Field(default="", alias="GOOGLE_SHEET_ID")
    google_service_account_email: str = Field(default="", alias="GOOGLE_SERVICE_ACCOUNT_EMAIL")
    google_private_key: str = Field(default="", alias="GOOGLE_PRIVATE_KEY")

    # --- Auth / sessions ---
    event_admin_password: str = Field(default="change-me", alias="EVENT_ADMIN_PASSWORD")
    session_secret: str = Field(default="dev-insecure-session-secret", alias="SESSION_SECRET")
    session_cookie_name: str = Field(default="bt_session", alias="SESSION_COOKIE_NAME")
    session_max_age_seconds: int = Field(default=60 * 60 * 16, alias="SESSION_MAX_AGE_SECONDS")
    # "lax" for same-site (local dev, single-domain prod). Set "none" when the
    # frontend and backend are on different domains (e.g. two *.vercel.app URLs);
    # "none" requires HTTPS + secure cookies, which hold in production.
    cookie_samesite: str = Field(default="lax", alias="COOKIE_SAMESITE")

    # --- URLs ---
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")
    backend_url: str = Field(default="http://localhost:8000", alias="BACKEND_URL")

    # --- Meta WhatsApp Cloud API ---
    whatsapp_access_token: str = Field(default="", alias="WHATSAPP_ACCESS_TOKEN")
    whatsapp_phone_number_id: str = Field(default="", alias="WHATSAPP_PHONE_NUMBER_ID")
    whatsapp_business_account_id: str = Field(default="", alias="WHATSAPP_BUSINESS_ACCOUNT_ID")
    whatsapp_confirmation_template: str = Field(default="order_confirmation", alias="WHATSAPP_CONFIRMATION_TEMPLATE")
    whatsapp_ready_template: str = Field(default="order_ready", alias="WHATSAPP_READY_TEMPLATE")
    whatsapp_template_language: str = Field(default="en", alias="WHATSAPP_TEMPLATE_LANGUAGE")
    whatsapp_api_version: str = Field(default="v21.0", alias="WHATSAPP_API_VERSION")
    meta_webhook_verify_token: str = Field(default="", alias="META_WEBHOOK_VERIFY_TOKEN")
    meta_app_secret: str = Field(default="", alias="META_APP_SECRET")
    whatsapp_send_enabled: bool = Field(default=False, alias="WHATSAPP_SEND_ENABLED")

    # --- Internal webhook + order numbering ---
    sheet_webhook_secret: str = Field(default="dev-sheet-webhook-secret", alias="SHEET_WEBHOOK_SECRET")
    order_number_script_url: str = Field(default="", alias="ORDER_NUMBER_SCRIPT_URL")
    order_number_script_secret: str = Field(default="", alias="ORDER_NUMBER_SCRIPT_SECRET")

    # --- Business config ---
    default_country_code: str = Field(default="+91", alias="DEFAULT_COUNTRY_CODE")
    order_prefix: str = Field(default="BT", alias="ORDER_PREFIX")
    initial_order_status: str = Field(default="RECEIVED", alias="INITIAL_ORDER_STATUS")
    tracking_poll_interval_ms: int = Field(default=3000, alias="TRACKING_POLL_INTERVAL_MS")
    queue_display_limit: int = Field(default=20, alias="QUEUE_DISPLAY_LIMIT")
    brand_name: str = Field(default="Bean Tradition", alias="BRAND_NAME")
    event_name: str = Field(default="Bean Tradition College Event", alias="EVENT_NAME")

    # --- Runtime ---
    environment: str = Field(default="development", alias="ENVIRONMENT")
    enable_docs: bool = Field(default=True, alias="ENABLE_DOCS")
    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")

    # --- Caching / rate limiting (in-memory, single instance) ---
    active_cache_ttl_seconds: float = Field(default=2.0, alias="ACTIVE_CACHE_TTL_SECONDS")
    track_rate_limit_per_min: int = Field(default=60, alias="TRACK_RATE_LIMIT_PER_MIN")
    login_rate_limit_per_min: int = Field(default=10, alias="LOGIN_RATE_LIMIT_PER_MIN")

    @field_validator("google_private_key")
    @classmethod
    def _normalise_private_key(cls, value: str) -> str:
        # Env files usually store the key with literal "\n"; restore real newlines.
        return value.replace("\\n", "\n") if value else value

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def cookie_secure(self) -> bool:
        return self.is_production


@lru_cache
def get_settings() -> Settings:
    return Settings()
