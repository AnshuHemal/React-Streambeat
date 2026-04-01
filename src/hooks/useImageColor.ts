/**
 * useImageColor
 *
 * Simply returns the pre-computed dominant_color stored in the albums table.
 * Color extraction happens server-side via the `extract-album-color` edge function
 * when an album is created/updated in the admin panel.
 *
 * Falls back to a deterministic vibrant color from the URL hash if no color is stored.
 */
export function useAlbumColor(
  dominantColor: string | null | undefined,
): string {
  if (
    dominantColor &&
    dominantColor.startsWith("#") &&
    dominantColor.length === 7
  ) {
    return dominantColor;
  }
  return "#1a1a1a";
}

/** Deterministic vibrant fallback from any string (e.g. album ID or image URL) */
export function fallbackAlbumColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const h = Math.abs(hash) % 360;
  return hslToHex(h, 60, 38);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v * 255)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
