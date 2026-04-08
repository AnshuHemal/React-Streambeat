"""
main.py — FastAPI application entry point.

Endpoints
─────────
  GET  /health          Liveness probe (Railway / Render health checks)
  POST /analyze         Analyze a song and write features to Supabase
  POST /analyze/batch   Analyze multiple songs (backfill existing catalog)

Authentication
──────────────
  All POST endpoints require:
    Authorization: Bearer <API_SECRET_KEY>

  The Supabase Edge Function sends this header. The secret is shared
  between the Edge Function environment and this service's .env.
"""

from __future__ import annotations

import asyncio
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.analyzer import analyze_audio_bytes
from app.config import settings
from app.db import update_song_features
from app.downloader import download_audio
from app.models import AnalyzeRequest, AudioFeaturesResponse, HealthResponse

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ─── App lifecycle ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Audio Analysis Service starting up")
    # Warm up librosa — first import loads numba JIT caches
    import librosa  # noqa: F401
    logger.info("librosa loaded and ready")
    yield
    logger.info("Audio Analysis Service shutting down")


app = FastAPI(
    title="Streambeat Audio Analysis Service",
    description="Extracts audio features (tempo, energy, valence, mood …) from songs.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow calls from Supabase Edge Functions (they run on Deno Deploy)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# ─── Auth dependency ───────────────────────────────────────────────────────────

async def verify_api_key(request: Request) -> None:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = auth.removeprefix("Bearer ").strip()
    if token != settings.api_secret_key:
        raise HTTPException(status_code=403, detail="Invalid API key")


# ─── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["ops"])
async def health() -> HealthResponse:
    """Railway / Render health check — always returns 200 if the process is alive."""
    return HealthResponse(status="ok", version="1.0.0")


@app.post(
    "/analyze",
    response_model=AudioFeaturesResponse,
    dependencies=[Depends(verify_api_key)],
    tags=["analysis"],
)
async def analyze(body: AnalyzeRequest) -> AudioFeaturesResponse:
    """
    Download the audio at *audio_url*, extract features, write to Supabase,
    and return the full feature set.

    Called by the Supabase Edge Function immediately after a song is inserted.
    """
    t_start = time.perf_counter()

    # 1. Download
    try:
        audio_bytes, filename = await download_audio(body.audio_url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.error("Download failed for song %s: %s", body.song_id, exc)
        raise HTTPException(status_code=502, detail=f"Audio download failed: {exc}")

    # 2. Analyse (CPU-bound — run in thread pool to avoid blocking the event loop)
    try:
        loop = asyncio.get_running_loop()
        features = await loop.run_in_executor(
            None,
            analyze_audio_bytes,
            audio_bytes,
            filename,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        logger.error("Analysis failed for song %s: %s", body.song_id, exc)
        raise HTTPException(status_code=500, detail=str(exc))

    # 3. Persist to Supabase
    updated = await update_song_features(body.song_id, features)

    elapsed = time.perf_counter() - t_start
    logger.info("Total request time for song %s: %.2fs", body.song_id, elapsed)

    return AudioFeaturesResponse(
        song_id=body.song_id,
        tempo=features.tempo,
        energy=features.energy,
        valence=features.valence,
        danceability=features.danceability,
        acousticness=features.acousticness,
        instrumentalness=features.instrumentalness,
        key=features.key,
        mode=features.mode,
        loudness=features.loudness,
        duration_ms=features.duration_ms,
        mood=features.mood,
        updated_in_db=updated,
    )


@app.post(
    "/analyze/batch",
    dependencies=[Depends(verify_api_key)],
    tags=["analysis"],
)
async def analyze_batch(body: list[AnalyzeRequest]) -> JSONResponse:
    """
    Backfill endpoint — analyze up to 20 songs in one request.
    Each song is processed sequentially to avoid OOM on the worker.
    Returns a summary of successes and failures.
    """
    if len(body) > 20:
        raise HTTPException(status_code=422, detail="Maximum 20 songs per batch")

    results = []
    for req in body:
        try:
            audio_bytes, filename = await download_audio(req.audio_url)
            loop = asyncio.get_running_loop()
            features = await loop.run_in_executor(
                None, analyze_audio_bytes, audio_bytes, filename
            )
            updated = await update_song_features(req.song_id, features)
            results.append({
                "song_id": req.song_id,
                "status": "ok",
                "mood": features.mood,
                "updated_in_db": updated,
            })
        except Exception as exc:
            logger.error("Batch item failed for song %s: %s", req.song_id, exc)
            results.append({
                "song_id": req.song_id,
                "status": "error",
                "error": str(exc),
            })

    ok_count = sum(1 for r in results if r["status"] == "ok")
    return JSONResponse(content={
        "total": len(body),
        "succeeded": ok_count,
        "failed": len(body) - ok_count,
        "results": results,
    })
