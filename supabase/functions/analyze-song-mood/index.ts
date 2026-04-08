/**
 * analyze-song-mood — Supabase Edge Function
 *
 * Triggered by a Supabase Database Webhook on INSERT into the songs table.
 * Calls the Audio Analysis Service and handles retries + error logging.
 *
 * Environment variables required (set in Supabase Dashboard → Edge Functions):
 *   AUDIO_ANALYSIS_SERVICE_URL   e.g. https://your-service.railway.app
 *   AUDIO_ANALYSIS_API_KEY       Must match API_SECRET_KEY in the Python service
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SERVICE_URL = Deno.env.get("AUDIO_ANALYSIS_SERVICE_URL")!;
const API_KEY = Deno.env.get("AUDIO_ANALYSIS_API_KEY")!;

// Retry config
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    id: string;
    audio_url: string | null;
    title: string;
    mood: string | null;
    mood_analyzed_at: string | null;
  };
}

async function callAnalysisService(
  songId: string,
  audioUrl: string,
  attempt: number,
): Promise<void> {
  const response = await fetch(`${SERVICE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ song_id: songId, audio_url: audioUrl }),
    // 5-minute timeout — large files can take a while
    signal: AbortSignal.timeout(300_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Service returned ${response.status}: ${body}`);
  }

  const result = await response.json();
  console.log(
    `[analyze-song-mood] Song ${songId} analyzed: mood=${result.mood} ` +
      `valence=${result.valence} energy=${result.energy} attempt=${attempt}`,
  );
}

serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json();

    // Only process INSERT events on the songs table
    if (payload.type !== "INSERT" || payload.table !== "songs") {
      return new Response("ignored", { status: 200 });
    }

    const { id: songId, audio_url: audioUrl, mood } = payload.record;

    // Skip if already analyzed or no audio URL
    if (!audioUrl) {
      console.log(
        `[analyze-song-mood] Song ${songId} has no audio_url, skipping`,
      );
      return new Response("no audio_url", { status: 200 });
    }

    if (mood) {
      console.log(
        `[analyze-song-mood] Song ${songId} already has mood=${mood}, skipping`,
      );
      return new Response("already analyzed", { status: 200 });
    }

    // Retry loop
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await callAnalysisService(songId, audioUrl, attempt);
        return new Response("ok", { status: 200 });
      } catch (err) {
        lastError = err as Error;
        console.error(
          `[analyze-song-mood] Attempt ${attempt}/${MAX_RETRIES} failed for song ${songId}: ${lastError.message}`,
        );
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        }
      }
    }

    // All retries exhausted — log and return 200 so the webhook doesn't
    // keep retrying (the pg_cron backfill job will pick it up later)
    console.error(
      `[analyze-song-mood] All retries exhausted for song ${songId}: ${lastError?.message}`,
    );
    return new Response("analysis failed after retries", { status: 200 });
  } catch (err) {
    console.error("[analyze-song-mood] Unexpected error:", err);
    return new Response("internal error", { status: 500 });
  }
});
