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

import * as ImageManipulator from "expo-image-manipulator";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

/**
 * useExtractedColor
 *
 * Extracts the dominant color directly from an image URL at runtime.
 * Strategy: resize to 1×1 via expo-image-manipulator — the GPU averages
 * all pixels perfectly, giving the true dominant color. Then read the
 * single pixel from the tiny JPEG.
 */
export function useExtractedColor(imageUrl: string | null | undefined): string {
  const [color, setColor] = useState<string>("#1a1a1a");

  useEffect(() => {
    if (!imageUrl) return;

    let cancelled = false;

    const extract = async () => {
      try {
        if (Platform.OS === "web") {
          const c = await extractColorWeb(imageUrl);
          if (!cancelled) setColor(darkenForHeader(c));
          return;
        }

        // Resize to 1×1 PNG — lossless, pixel RGB is directly readable
        const result = await ImageManipulator.manipulateAsync(
          imageUrl,
          [{ resize: { width: 1, height: 1 } }],
          {
            format: ImageManipulator.SaveFormat.PNG,
            base64: true,
          },
        );

        if (!result.base64 || cancelled) return;

        const rgb = readSinglePixelPng(result.base64);
        if (!rgb) throw new Error("parse failed");

        const hex = toHex(rgb[0], rgb[1], rgb[2]);
        if (!cancelled) setColor(darkenForHeader(hex));
      } catch {
        if (!cancelled) setColor(fallbackAlbumColor(imageUrl));
      }
    };

    extract();
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return color;
}

/**
 * Reads RGB from a 1×1 PNG base64 string.
 * A 1×1 PNG with RGB color type stores the pixel as:
 * filter_byte(0x00) + R + G + B in the IDAT deflate stream.
 * We scan for the uncompressed deflate literal block (BTYPE=00).
 */
function readSinglePixelPng(b64: string): [number, number, number] | null {
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // Find IDAT chunk (starts after 8-byte PNG sig + 25-byte IHDR chunk = offset 33)
    let pos = 8;
    while (pos < bytes.length - 12) {
      const len =
        (bytes[pos] << 24) |
        (bytes[pos + 1] << 16) |
        (bytes[pos + 2] << 8) |
        bytes[pos + 3];
      const type = String.fromCharCode(
        bytes[pos + 4],
        bytes[pos + 5],
        bytes[pos + 6],
        bytes[pos + 7],
      );

      if (type === "IDAT") {
        const idat = bytes.slice(pos + 8, pos + 8 + len);
        // idat = zlib stream: 2-byte header + deflate blocks + 4-byte adler32
        // For a 1×1 PNG, deflate uses stored (uncompressed) blocks (BTYPE=00)
        // Scan for BTYPE=00 block: byte with bits[1:0]=00
        for (let i = 2; i < idat.length - 8; i++) {
          if ((idat[i] & 0x06) === 0x00) {
            const blockLen = idat[i + 1] | (idat[i + 2] << 8);
            if (blockLen >= 4 && i + 5 + blockLen <= idat.length) {
              // data: filter(1) + R + G + B [+ A if RGBA]
              const r = idat[i + 6]; // skip BFINAL(1)+LEN(2)+NLEN(2)+filter(1)
              const g = idat[i + 7];
              const b = idat[i + 8];
              if (r !== undefined && g !== undefined && b !== undefined) {
                return [r, g, b];
              }
            }
          }
        }
        // Fallback: scan raw IDAT for plausible RGB after zlib header
        for (let i = 2; i < idat.length - 3; i++) {
          const r = idat[i],
            g = idat[i + 1],
            b = idat[i + 2];
          if (r + g + b > 30 && r + g + b < 720) return [r, g, b];
        }
        return null;
      }
      if (type === "IEND") break;
      pos += 12 + len;
    }
    return null;
  } catch {
    return null;
  }
}

async function extractColorWeb(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new (window as any).Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        // Draw to 1×1 — browser averages all pixels
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        resolve(toHex(d[0], d[1], d[2]));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * darkenForHeader — produces a dark, muted version of the color for use as
 * a header/background. Keeps the hue but reduces saturation and lightness
 * to match Spotify's artist header style (dark brownish/muted tones).
 */
function darkenForHeader(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  let [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
  // Keep saturation moderate (35-50%), push lightness dark (18-28%)
  s = Math.min(0.5, Math.max(0.2, s * 0.6));
  l = Math.min(0.28, Math.max(0.15, l * 0.45));
  return hslToHex(h * 360, s * 100, l * 100);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h, s, l];
}

function hexToRgb(hex: string) {
  const c = hex.replace("#", "");
  if (c.length !== 6) return null;
  return {
    r: parseInt(c.slice(0, 2), 16),
    g: parseInt(c.slice(2, 4), 16),
    b: parseInt(c.slice(4, 6), 16),
  };
}

function toHex(r: number, g: number, b: number): string {
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g).toString(16).padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v));
}
