"""
config.py — centralised settings loaded from environment variables.
Pydantic-settings validates types and raises clear errors on startup
if required values are missing.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # Service auth — Supabase Edge Function must send this as Bearer token
    api_secret_key: str

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Audio limits
    audio_download_timeout: int = 60   # seconds
    max_audio_size_mb: int = 50


settings = Settings()
