import os
from functools import lru_cache

from supabase import create_client, Client


class Settings:
    SUPABASE_URL: str = os.environ["SUPABASE_URL"]
    SUPABASE_SERVICE_ROLE_KEY: str = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    SUPABASE_JWT_SECRET: str = os.environ["SUPABASE_JWT_SECRET"]
    ANTHROPIC_API_KEY: str = os.environ.get("ANTHROPIC_API_KEY", "")
    INNGEST_EVENT_KEY: str = os.environ.get("INNGEST_EVENT_KEY", "")
    TWILIO_ACCOUNT_SID: str = os.environ.get("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.environ.get("TWILIO_AUTH_TOKEN", "")
    TWILIO_WHATSAPP_FROM: str = os.environ.get("TWILIO_WHATSAPP_FROM", "")  # e.g. "whatsapp:+14155238886"
    RESEND_API_KEY: str = os.environ.get("RESEND_API_KEY", "")
    RESEND_FROM_EMAIL: str = os.environ.get("RESEND_FROM_EMAIL", "alerts@aisalesforesight.com")
    INTERNAL_JOBS_SECRET: str = os.environ.get("INTERNAL_JOBS_SECRET", "")


@lru_cache
def get_settings() -> Settings:
    return Settings()


@lru_cache
def get_supabase() -> Client:
    """
    Service-role client: bypasses RLS. Every query MUST be filtered
    explicitly by org_id resolved from a verified user JWT.
    """
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
