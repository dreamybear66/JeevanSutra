"""
Sanjeevani v2 — Supabase Client (Shared)
"""

from supabase import create_client, Client
from settings import get_settings
from functools import lru_cache


@lru_cache()
def get_supabase_client() -> Client:
    """Returns a cached Supabase client instance."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
