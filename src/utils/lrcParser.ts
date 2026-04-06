/**
 * lrcParser.ts
 * Parses LRC (Lyric) format into a sorted array of timed lines.
 *
 * Supported formats:
 *   [mm:ss.xx]  text        — standard LRC (centiseconds)
 *   [mm:ss.xxx] text        — extended (milliseconds)
 *   [mm:ss]     text        — no sub-second precision
 *   Multiple timestamps on one line: [00:12.00][00:14.50] text
 *   Metadata tags ([ti:], [ar:], [al:], etc.) are silently skipped.
 */

export type LyricLine = {
  /** Start time in milliseconds */
  time: number;
  /** Display text — empty string for instrumental gaps */
  text: string;
};

// Matches [mm:ss.xx], [mm:ss.xxx], [mm:ss]
const TIMESTAMP_RE = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

// Metadata tags we want to skip entirely
const METADATA_RE = /^\[(ti|ar|al|au|by|offset|re|ve|length):/i;

/**
 * Converts mm, ss, sub-second string → milliseconds.
 * sub can be 1–3 digits (centiseconds or milliseconds).
 */
function toMs(mm: string, ss: string, sub?: string): number {
  const minutes = parseInt(mm, 10);
  const seconds = parseInt(ss, 10);
  let ms = 0;
  if (sub) {
    // Normalise to milliseconds: 2 digits = centiseconds, 3 digits = ms
    ms = sub.length === 3 ? parseInt(sub, 10) : parseInt(sub, 10) * 10;
  }
  return (minutes * 60 + seconds) * 1000 + ms;
}

/**
 * Parses a raw LRC string and returns lines sorted by time.
 * Returns [] if input is null/empty/unparseable.
 */
export function parseLrc(raw: string | null | undefined): LyricLine[] {
  if (!raw?.trim()) return [];

  const lines: LyricLine[] = [];

  for (const rawLine of raw.split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Skip metadata tags
    if (METADATA_RE.test(trimmed)) continue;

    // Extract all timestamps from this line
    const timestamps: number[] = [];
    let match: RegExpExecArray | null;
    TIMESTAMP_RE.lastIndex = 0;

    while ((match = TIMESTAMP_RE.exec(trimmed)) !== null) {
      timestamps.push(toMs(match[1], match[2], match[3]));
    }

    if (timestamps.length === 0) continue;

    // Text is everything after the last timestamp bracket
    const lastBracket = trimmed.lastIndexOf("]");
    const text = lastBracket >= 0 ? trimmed.slice(lastBracket + 1).trim() : "";

    // One line entry per timestamp (handles multi-timestamp lines)
    for (const time of timestamps) {
      lines.push({ time, text });
    }
  }

  // Sort ascending by time
  return lines.sort((a, b) => a.time - b.time);
}

/**
 * Given a sorted LyricLine[] and current position (ms),
 * returns the index of the currently active line (-1 if before first line).
 */
export function getActiveLyricIndex(
  lines: LyricLine[],
  positionMs: number,
): number {
  if (lines.length === 0) return -1;

  let active = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= positionMs) {
      active = i;
    } else {
      break;
    }
  }
  return active;
}
