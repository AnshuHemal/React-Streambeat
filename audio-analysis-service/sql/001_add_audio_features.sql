-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add audio feature columns to songs table
-- Run this in Supabase SQL Editor before deploying the service
-- ─────────────────────────────────────────────────────────────────────────────

alter table songs
  add column if not exists tempo            float,
  add column if not exists energy           float,
  add column if not exists valence          float,
  add column if not exists danceability     float,
  add column if not exists acousticness     float,
  add column if not exists instrumentalness float,
  add column if not exists key              int,
  add column if not exists mode             int,       -- 0=minor, 1=major
  add column if not exists loudness         float,
  add column if not exists mood             text,
  add column if not exists mood_analyzed_at timestamptz;

-- Index for mood filtering (used by Liked Songs mood filter)
create index if not exists idx_songs_mood on songs (mood)
  where mood is not null;

-- Index for finding un-analyzed songs (used by backfill cron)
create index if not exists idx_songs_mood_null on songs (created_at)
  where mood is null and is_active = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- Backfill cron: re-trigger analysis for songs that failed
-- Runs every hour, picks up songs older than 30 minutes with no mood
-- Requires pg_cron extension (enabled by default on Supabase)
-- ─────────────────────────────────────────────────────────────────────────────

select cron.schedule(
  'backfill-song-mood',
  '0 * * * *',   -- every hour
  $$
    select net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/analyze-song-mood',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'songs',
        'record', jsonb_build_object(
          'id', id,
          'audio_url', audio_url,
          'title', title,
          'mood', null,
          'mood_analyzed_at', null
        )
      )
    )
    from songs
    where mood is null
      and is_active = true
      and audio_url is not null
      and created_at < now() - interval '30 minutes'
    limit 10;
  $$
);
