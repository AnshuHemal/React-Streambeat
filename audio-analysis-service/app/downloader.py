"""
downloader.py — Downloads audio from a URL into memory.

Uses streaming to avoid loading the entire file before we know its size.
Enforces a max file size limit to prevent OOM on the analysis worker.
"""

from __future__ import annotations

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

MAX_BYTES = settings.max_audio_size_mb * 1024 * 1024


async def download_audio(url: str) -> tuple[bytes, str]:
    """
    Download audio from *url* and return (raw_bytes, filename).

    Raises
    ------
    ValueError
        If the file exceeds MAX_BYTES or the download fails.
    """
    logger.info("Downloading audio: %s", url)

    async with httpx.AsyncClient(timeout=settings.audio_download_timeout) as client:
        async with client.stream("GET", url) as response:
            response.raise_for_status()

            # Check Content-Length header first (fast path)
            content_length = response.headers.get("content-length")
            if content_length and int(content_length) > MAX_BYTES:
                raise ValueError(
                    f"Audio file too large: {int(content_length) // (1024*1024)}MB "
                    f"(max {settings.max_audio_size_mb}MB)"
                )

            chunks: list[bytes] = []
            total = 0

            async for chunk in response.aiter_bytes(chunk_size=65536):
                total += len(chunk)
                if total > MAX_BYTES:
                    raise ValueError(
                        f"Audio file exceeds {settings.max_audio_size_mb}MB limit"
                    )
                chunks.append(chunk)

    audio_bytes = b"".join(chunks)
    # Extract filename from URL path
    filename = url.split("/")[-1].split("?")[0] or "audio"
    logger.info("Downloaded %d bytes (%s)", len(audio_bytes), filename)
    return audio_bytes, filename
