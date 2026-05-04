"""
Sanjeevani v2 — Application Settings (Pydantic Settings)
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Google Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # ChromaDB
    chroma_persist_dir: str = "./chroma_data"

    # App
    app_env: str = "development"
    app_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # Security
    pin_max_attempts: int = 5
    pin_lockout_minutes: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
