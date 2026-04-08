"""
models.py — Pydantic request/response models for the API.
"""

from pydantic import BaseModel, HttpUrl, field_validator


class AnalyzeRequest(BaseModel):
    """Payload sent by the Supabase Edge Function after a song is uploaded."""
    song_id: str
    audio_url: str   # Cloudinary or any public HTTPS URL

    @field_validator("audio_url")
    @classmethod
    def must_be_https(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("audio_url must be an HTTPS URL")
        return v


class AudioFeaturesResponse(BaseModel):
    """Returned to the caller and also written to Supabase."""
    song_id: str
    tempo: float
    energy: float
    valence: float
    danceability: float
    acousticness: float
    instrumentalness: float
    key: int
    mode: int
    loudness: float
    duration_ms: int
    mood: str
    updated_in_db: bool


class HealthResponse(BaseModel):
    status: str
    version: str
