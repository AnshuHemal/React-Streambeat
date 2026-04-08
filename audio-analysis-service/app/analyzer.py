"""
analyzer.py — Core audio feature extraction engine.

Uses librosa for signal processing. All heavy computation happens here,
isolated from the HTTP layer so it can be tested independently.

Features extracted
──────────────────
  tempo          BPM (beats per minute)
  energy         Normalised RMS energy  [0.0 – 1.0]
  valence        Estimated emotional positivity  [0.0 – 1.0]
                 Approximated from: mode, spectral brightness,
                 tempo, and energy — the same signals Spotify uses.
  danceability   Rhythm regularity + tempo suitability  [0.0 – 1.0]
  acousticness   Confidence the track is acoustic  [0.0 – 1.0]
  instrumentalness  Confidence there are no vocals  [0.0 – 1.0]
  key            Detected musical key  (0=C … 11=B)
  mode           0 = minor, 1 = major
  loudness       Mean loudness in dBFS
  duration_ms    Track duration in milliseconds
  mood           Derived label: happy | sad | calm | energetic |
                               romantic | party
"""

from __future__ import annotations

import io
import logging
import time
from dataclasses import dataclass
from typing import Optional

import librosa
import numpy as np

logger = logging.getLogger(__name__)


# ─── Result dataclass ──────────────────────────────────────────────────────────

@dataclass
class AudioFeatures:
    tempo: float
    energy: float
    valence: float
    danceability: float
    acousticness: float
    instrumentalness: float
    key: int
    mode: int          # 0 = minor, 1 = major
    loudness: float    # dBFS
    duration_ms: int
    mood: str


# ─── Mood derivation ───────────────────────────────────────────────────────────

def _derive_mood(
    valence: float,
    energy: float,
    mode: int,
    danceability: float,
    tempo: float,
) -> str:
    """
    Maps audio features to a mood label using the valence-energy model.
    Thresholds are tuned for Bollywood / Indian pop content.
    """
    # Party: high energy, high valence, very danceable
    if valence >= 0.65 and energy >= 0.75 and danceability >= 0.70:
        return "party"

    # Romantic: high valence, low-medium energy, major key, slow tempo
    if valence >= 0.58 and energy < 0.50 and mode == 1 and tempo < 105:
        return "romantic"

    # Happy: high valence, medium-high energy
    if valence >= 0.60 and energy >= 0.45:
        return "happy"

    # Energetic: high energy regardless of valence
    if energy >= 0.72:
        return "energetic"

    # Calm: medium-high valence, low energy
    if valence >= 0.45 and energy < 0.45:
        return "calm"

    # Sad: low valence, low-medium energy (default)
    return "sad"


# ─── Feature extraction helpers ────────────────────────────────────────────────

def _compute_energy(y: np.ndarray) -> float:
    """Normalised RMS energy in [0, 1]."""
    rms = librosa.feature.rms(y=y)[0]
    mean_rms = float(np.mean(rms))
    # Normalise: typical music RMS sits between 0.01 and 0.3
    return float(np.clip(mean_rms / 0.25, 0.0, 1.0))


def _compute_loudness(y: np.ndarray) -> float:
    """Mean loudness in dBFS."""
    rms = librosa.feature.rms(y=y)[0]
    mean_rms = float(np.mean(rms))
    if mean_rms < 1e-10:
        return -80.0
    return float(20.0 * np.log10(mean_rms))


def _compute_spectral_brightness(y: np.ndarray, sr: int) -> float:
    """
    Spectral centroid normalised to [0, 1].
    Higher = brighter / more treble = correlates with higher valence.
    """
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    mean_centroid = float(np.mean(centroid))
    # Normalise: typical range 500 Hz – 4000 Hz
    return float(np.clip((mean_centroid - 500) / 3500, 0.0, 1.0))


def _compute_mode_and_key(y: np.ndarray, sr: int) -> tuple[int, int]:
    """
    Detect musical key (0–11) and mode (0=minor, 1=major)
    using chroma features and a Krumhansl-Schmuckler key profile.
    """
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)

    # Krumhansl-Schmuckler key profiles
    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
                               2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
                               2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

    major_scores = [
        np.corrcoef(np.roll(major_profile, i), chroma_mean)[0, 1]
        for i in range(12)
    ]
    minor_scores = [
        np.corrcoef(np.roll(minor_profile, i), chroma_mean)[0, 1]
        for i in range(12)
    ]

    best_major_key = int(np.argmax(major_scores))
    best_minor_key = int(np.argmax(minor_scores))
    best_major_score = major_scores[best_major_key]
    best_minor_score = minor_scores[best_minor_key]

    if best_major_score >= best_minor_score:
        return best_major_key, 1   # major
    else:
        return best_minor_key, 0   # minor


def _compute_danceability(
    y: np.ndarray,
    sr: int,
    tempo: float,
) -> float:
    """
    Danceability approximation based on:
    - Tempo suitability (80–130 BPM is most danceable)
    - Beat strength (onset strength regularity)
    - Low-frequency energy ratio
    """
    # Tempo score: peaks at 110 BPM, falls off at extremes
    tempo_score = float(np.exp(-((tempo - 110) ** 2) / (2 * 30 ** 2)))

    # Beat regularity
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    beat_regularity = float(np.std(onset_env))
    beat_score = float(np.clip(1.0 - beat_regularity / 10.0, 0.0, 1.0))

    # Low-frequency energy (bass presence)
    stft = np.abs(librosa.stft(y))
    freqs = librosa.fft_frequencies(sr=sr)
    low_mask = freqs < 250
    low_energy = float(np.mean(stft[low_mask]))
    total_energy = float(np.mean(stft)) + 1e-10
    bass_ratio = float(np.clip(low_energy / total_energy, 0.0, 1.0))

    return float(np.clip(
        0.40 * tempo_score + 0.35 * beat_score + 0.25 * bass_ratio,
        0.0, 1.0
    ))


def _compute_acousticness(y: np.ndarray, sr: int) -> float:
    """
    Acousticness: high spectral rolloff + low zero-crossing rate
    correlates with acoustic instruments.
    """
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85)[0]
    zcr = librosa.feature.zero_crossing_rate(y)[0]

    mean_rolloff = float(np.mean(rolloff))
    mean_zcr = float(np.mean(zcr))

    # Low rolloff + low ZCR = acoustic
    rolloff_score = float(np.clip(1.0 - mean_rolloff / (sr / 2), 0.0, 1.0))
    zcr_score = float(np.clip(1.0 - mean_zcr * 20, 0.0, 1.0))

    return float(np.clip(0.6 * rolloff_score + 0.4 * zcr_score, 0.0, 1.0))


def _compute_instrumentalness(y: np.ndarray, sr: int) -> float:
    """
    Instrumentalness: tracks with vocals have strong mid-frequency
    energy in the 300–3000 Hz range (formant region).
    Low mid-energy → more likely instrumental.
    """
    stft = np.abs(librosa.stft(y))
    freqs = librosa.fft_frequencies(sr=sr)

    vocal_mask = (freqs >= 300) & (freqs <= 3000)
    vocal_energy = float(np.mean(stft[vocal_mask]))
    total_energy = float(np.mean(stft)) + 1e-10

    vocal_ratio = float(np.clip(vocal_energy / total_energy, 0.0, 1.0))
    # Invert: high vocal energy = low instrumentalness
    return float(np.clip(1.0 - vocal_ratio * 1.5, 0.0, 1.0))


def _compute_valence(
    mode: int,
    brightness: float,
    energy: float,
    tempo: float,
    acousticness: float,
) -> float:
    """
    Valence approximation — the hardest feature to compute without
    a trained model. Uses a weighted combination of signals that
    correlate with perceived emotional positivity:

      mode (major=1)     → strongest single predictor
      spectral brightness → brighter = happier
      energy             → moderate contribution
      tempo              → faster = slightly happier
      acousticness       → acoustic = slightly calmer/sadder
    """
    mode_score = 0.65 if mode == 1 else 0.35

    # Tempo score: normalise 60–180 BPM to [0, 1]
    tempo_score = float(np.clip((tempo - 60) / 120, 0.0, 1.0))

    valence = (
        0.40 * mode_score
        + 0.25 * brightness
        + 0.15 * energy
        + 0.12 * tempo_score
        + 0.08 * (1.0 - acousticness)   # less acoustic = slightly more positive
    )
    return float(np.clip(valence, 0.0, 1.0))


# ─── Public API ────────────────────────────────────────────────────────────────

def analyze_audio_bytes(audio_bytes: bytes, filename: str = "audio") -> AudioFeatures:
    """
    Analyse raw audio bytes and return AudioFeatures.

    Parameters
    ----------
    audio_bytes : bytes
        Raw audio file content (MP3, WAV, FLAC, OGG, M4A, etc.)
    filename : str
        Original filename — used only for logging.

    Returns
    -------
    AudioFeatures
        All extracted features + derived mood label.

    Raises
    ------
    ValueError
        If the audio cannot be decoded or is too short (< 10 seconds).
    RuntimeError
        If feature extraction fails unexpectedly.
    """
    t_start = time.perf_counter()
    logger.info("Starting analysis: %s (%d bytes)", filename, len(audio_bytes))

    try:
        # Load audio — librosa handles MP3/WAV/FLAC/OGG/M4A via audioread
        # sr=22050 is standard for music analysis (matches Spotify's pipeline)
        # mono=True collapses stereo — all features are mono-based
        y, sr = librosa.load(io.BytesIO(audio_bytes), sr=22050, mono=True)
    except Exception as exc:
        raise ValueError(f"Failed to decode audio '{filename}': {exc}") from exc

    duration_s = len(y) / sr
    if duration_s < 10:
        raise ValueError(
            f"Audio too short ({duration_s:.1f}s). Minimum is 10 seconds."
        )

    logger.info("Loaded %.1fs of audio at %dHz", duration_s, sr)

    try:
        # ── Tempo ──────────────────────────────────────────────────────────────
        # Use librosa's beat tracker — very accurate for music
        tempo_arr, _ = librosa.beat.beat_track(y=y, sr=sr)
        tempo = float(tempo_arr[0]) if hasattr(tempo_arr, '__len__') else float(tempo_arr)

        # ── Key and mode ───────────────────────────────────────────────────────
        key, mode = _compute_mode_and_key(y, sr)

        # ── Energy ────────────────────────────────────────────────────────────
        energy = _compute_energy(y)

        # ── Loudness ──────────────────────────────────────────────────────────
        loudness = _compute_loudness(y)

        # ── Spectral brightness (used for valence) ─────────────────────────────
        brightness = _compute_spectral_brightness(y, sr)

        # ── Danceability ──────────────────────────────────────────────────────
        danceability = _compute_danceability(y, sr, tempo)

        # ── Acousticness ──────────────────────────────────────────────────────
        acousticness = _compute_acousticness(y, sr)

        # ── Instrumentalness ──────────────────────────────────────────────────
        instrumentalness = _compute_instrumentalness(y, sr)

        # ── Valence ───────────────────────────────────────────────────────────
        valence = _compute_valence(mode, brightness, energy, tempo, acousticness)

        # ── Mood ──────────────────────────────────────────────────────────────
        mood = _derive_mood(valence, energy, mode, danceability, tempo)

        duration_ms = int(duration_s * 1000)

        elapsed = time.perf_counter() - t_start
        logger.info(
            "Analysis complete in %.2fs | tempo=%.1f key=%d mode=%d "
            "energy=%.3f valence=%.3f mood=%s",
            elapsed, tempo, key, mode, energy, valence, mood,
        )

        return AudioFeatures(
            tempo=round(tempo, 2),
            energy=round(energy, 4),
            valence=round(valence, 4),
            danceability=round(danceability, 4),
            acousticness=round(acousticness, 4),
            instrumentalness=round(instrumentalness, 4),
            key=key,
            mode=mode,
            loudness=round(loudness, 2),
            duration_ms=duration_ms,
            mood=mood,
        )

    except Exception as exc:
        raise RuntimeError(f"Feature extraction failed for '{filename}': {exc}") from exc
