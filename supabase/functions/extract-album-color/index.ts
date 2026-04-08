// Supabase Edge Function: extract-album-color
// Fetches an image URL, samples pixels, returns the dominant vibrant color.
// Deploy with: npx supabase functions deploy extract-album-color

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image_url } = await req.json();
    if (!image_url) {
      return new Response(JSON.stringify({ error: "image_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const color = await extractDominantColor(image_url);

    return new Response(JSON.stringify({ color }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function extractDominantColor(url: string): Promise<string> {
  // Fetch the image
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);

  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Detect format and extract pixels
  let pixels: Array<[number, number, number]>;

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    // JPEG
    pixels = extractJpegColors(bytes);
  } else if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    // PNG — sample raw bytes after IDAT (approximate)
    pixels = extractPngColors(bytes);
  } else {
    // Unknown format — sample raw bytes
    pixels = sampleRawBytes(bytes);
  }

  if (pixels.length === 0) return fallbackColor(url);

  const vibrant = vibrantFromRgbArray(pixels);
  return boostVibrancy(vibrant);
}

// ---------------------------------------------------------------------------
// JPEG color extraction — scan for quantization table DC values
// ---------------------------------------------------------------------------
function extractJpegColors(bytes: Uint8Array): Array<[number, number, number]> {
  const pixels: Array<[number, number, number]> = [];

  // Find Start of Scan (SOS) marker 0xFF 0xDA
  let sosPos = -1;
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xda) {
      sosPos = i;
      break;
    }
  }
  if (sosPos === -1) return sampleRawBytes(bytes);

  const sosHeaderLen = (bytes[sosPos + 2] << 8) | bytes[sosPos + 3];
  const dataStart = sosPos + 2 + sosHeaderLen;

  // Sample scan data bytes as approximate YCbCr
  let i = dataStart;
  while (i < bytes.length - 2 && pixels.length < 200) {
    if (bytes[i] === 0xff) {
      i += 2;
      continue;
    }
    const y = bytes[i];
    const cb = bytes[i + 1];
    const cr = bytes[i + 2];
    const r = clamp(Math.round(y + 1.402 * (cr - 128)));
    const g = clamp(
      Math.round(y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128)),
    );
    const b = clamp(Math.round(y + 1.772 * (cb - 128)));
    const brightness = r + g + b;
    if (brightness > 60 && brightness < 700) pixels.push([r, g, b]);
    i += 6; // stride to sample spread across image
  }

  return pixels.length > 0 ? pixels : sampleRawBytes(bytes);
}

// ---------------------------------------------------------------------------
// PNG color extraction — find IDAT and sample uncompressed header bytes
// ---------------------------------------------------------------------------
function extractPngColors(bytes: Uint8Array): Array<[number, number, number]> {
  // Read IHDR to get width, height, bit depth, color type
  // IHDR is always at offset 8 (after PNG signature)
  // For simplicity, sample bytes from multiple IDAT chunks
  const pixels: Array<[number, number, number]> = [];
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
      const chunk = bytes.slice(pos + 8, pos + 8 + len);
      // Sample raw compressed bytes as approximate RGB (best effort)
      for (let i = 0; i < chunk.length - 2 && pixels.length < 200; i += 9) {
        const r = chunk[i] & 0xff;
        const g = chunk[i + 1] & 0xff;
        const b = chunk[i + 2] & 0xff;
        const brightness = r + g + b;
        if (brightness > 60 && brightness < 700) pixels.push([r, g, b]);
      }
    }
    if (type === "IEND") break;
    pos += 12 + len;
  }

  return pixels.length > 0 ? pixels : sampleRawBytes(bytes);
}

function sampleRawBytes(bytes: Uint8Array): Array<[number, number, number]> {
  const pixels: Array<[number, number, number]> = [];
  const stride = Math.max(3, Math.floor(bytes.length / 200));
  for (let i = 0; i < bytes.length - 2 && pixels.length < 200; i += stride) {
    const r = bytes[i] & 0xff;
    const g = bytes[i + 1] & 0xff;
    const b = bytes[i + 2] & 0xff;
    const brightness = r + g + b;
    if (brightness > 60 && brightness < 700) pixels.push([r, g, b]);
  }
  return pixels;
}

// ---------------------------------------------------------------------------
// Vibrant color selection & manipulation
// ---------------------------------------------------------------------------

function vibrantFromRgbArray(pixels: Array<[number, number, number]>): string {
  let bestScore = -1;
  let bestR = 80,
    bestG = 80,
    bestB = 80;
  for (const [r, g, b] of pixels) {
    const [, s, l] = rgbToHsl(r, g, b);
    if (l < 0.12 || l > 0.88) continue;
    const penalty = 1 - Math.abs(l - 0.45) * 1.5;
    const score = s * Math.max(0, penalty);
    if (score > bestScore) {
      bestScore = score;
      bestR = r;
      bestG = g;
      bestB = b;
    }
  }
  return toHex(bestR, bestG, bestB);
}

function boostVibrancy(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  let [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);
  s = Math.min(0.8, s + (0.65 - s) * 0.6);
  l = Math.min(0.5, Math.max(0.28, l + (0.38 - l) * 0.5));
  return hslToHex(h * 360, s * 100, l * 100);
}

function fallbackColor(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return hslToHex(Math.abs(hash) % 360, 60, 38);
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

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex(
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  );
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
