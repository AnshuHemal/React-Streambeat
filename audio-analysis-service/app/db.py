"""
db.py — Supabase client and song update helper.

Uses the service role key so it can write to the songs table
without being blocked by RLS policies.
"""

from __future__ import annotations

import logging

from supabase import create_client, Client

from app.config import settings
from app.analyzer import AudioFeatures

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _client


async def update_song_features(song_id: str, features: AudioFeatures) -> bool:
    """
    Write extracted audio features back to the songs table.

    Returns True on success, False on failure (caller decides whether
    to surface the error — the HTTP response is still 200 so the
    Edge Function doesn't retry unnecessarily).
    """
    try:
        client = get_supabase()
        result = (
            client.table("songs")
            .update({
                "tempo":            features.tempo,
                "energy":           features.energy,
                "valence":          features.valence,
                "danceability":     features.danceability,
                "acousticness":     features.acousticness,
                "instrumentalness": features.instrumentalness,
                "key":              features.key,
                "mode":             features.mode,
                "loudness":         features.loudness,
                "mood":             features.mood,
                "mood_analyzed_at": "now()",
            })
            .eq("id", song_id)
            .execute()
        )
        logger.info("Updated song %s in Supabase: mood=%s", song_id, features.mood)
        return True
    except Exception as exc:
        logger.error("Failed to update song %s in Supabase: %s", song_id, exc)
        return False
