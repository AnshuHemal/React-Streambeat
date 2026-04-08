# Streambeat — Audio Analysis Service

Production-grade audio feature extraction service.  
Extracts tempo, energy, valence, danceability, key, mode, loudness, and derives a **mood label** for every song uploaded via the admin panel.

---

## Architecture

```
Admin uploads song (React Native)
        ↓
Song row inserted into Supabase songs table
        ↓
Supabase Database Webhook fires
        ↓
Supabase Edge Function: analyze-song-mood
        ↓
POST /analyze → this service (Railway)
        ↓
librosa extracts audio features
        ↓
Mood label derived from features
        ↓
songs row updated in Supabase
        ↓
App reads mood from songs table
```

---

## Features extracted

| Feature            | Range  | Description                                       |
| ------------------ | ------ | ------------------------------------------------- |
| `tempo`            | BPM    | Beats per minute                                  |
| `energy`           | 0–1    | Loudness / intensity                              |
| `valence`          | 0–1    | Emotional positivity                              |
| `danceability`     | 0–1    | Rhythm suitability for dancing                    |
| `acousticness`     | 0–1    | Confidence track is acoustic                      |
| `instrumentalness` | 0–1    | Confidence track has no vocals                    |
| `key`              | 0–11   | Musical key (C=0 … B=11)                          |
| `mode`             | 0 or 1 | 0=minor, 1=major                                  |
| `loudness`         | dBFS   | Mean loudness                                     |
| `mood`             | label  | happy / sad / calm / energetic / romantic / party |

---

## Local development

```bash
cd audio-analysis-service

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials and API secret key

# 4. Run the service
python run.py
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

---

## Deploy to Render (free)

### One-time setup

1. Push this repo (or the whole monorepo) to GitHub.

2. Go to [render.com](https://render.com) → **New** → **Web Service**.

3. Connect your GitHub repo.

4. Set **Root Directory** to `audio-analysis-service`.

5. Render auto-detects the `Dockerfile` — no extra config needed.

6. In **Environment Variables**, add:

   | Key                         | Value                                           |
   | --------------------------- | ----------------------------------------------- |
   | `SUPABASE_URL`              | `https://your-project.supabase.co`              |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service role key                           |
   | `API_SECRET_KEY`            | any random secret (e.g. `openssl rand -hex 32`) |

7. Click **Create Web Service**.  
   Render builds the Docker image and gives you a URL like  
   `https://streambeat-audio-analysis.onrender.com`

### Important: free tier cold starts

The free tier spins down after **15 minutes of inactivity**.  
When a song is uploaded after a period of inactivity, the service takes ~30 seconds to wake up before analysis begins.  
For an admin panel this is fine — the mood appears within ~60 seconds of upload.

### Keep-alive ping (optional)

To avoid cold starts entirely, add a free UptimeRobot monitor:

1. Go to [uptimerobot.com](https://uptimerobot.com) → Add Monitor
2. Type: HTTP(s), URL: `https://your-service.onrender.com/health`
3. Interval: every 14 minutes

This keeps the service warm 24/7 at zero cost.

---

## Set up Supabase Edge Function

```bash
# From the project root
supabase functions deploy analyze-song-mood

# Set environment variables for the Edge Function
supabase secrets set AUDIO_ANALYSIS_SERVICE_URL=https://streambeat-audio-analysis.onrender.com
supabase secrets set AUDIO_ANALYSIS_API_KEY=your-api-secret-key
```

---

## Set up Database Webhook

In Supabase Dashboard → Database → Webhooks → Create:

- **Name**: `on-song-insert-analyze-mood`
- **Table**: `songs`
- **Events**: `INSERT`
- **URL**: `https://your-project.supabase.co/functions/v1/analyze-song-mood`
- **HTTP Headers**:
  - `Authorization: Bearer <your-supabase-anon-key>`

---

## Run the SQL migration

In Supabase Dashboard → SQL Editor, run:

```sql
-- contents of sql/001_add_audio_features.sql
```

---

## API reference

### `GET /health`

Liveness probe. Returns `{"status": "ok"}`.

### `POST /analyze`

Analyze a single song.

**Headers**: `Authorization: Bearer <API_SECRET_KEY>`

**Body**:

```json
{
  "song_id": "uuid",
  "audio_url": "https://res.cloudinary.com/..."
}
```

**Response**:

```json
{
  "song_id": "uuid",
  "tempo": 118.5,
  "energy": 0.72,
  "valence": 0.65,
  "danceability": 0.81,
  "acousticness": 0.12,
  "instrumentalness": 0.03,
  "key": 5,
  "mode": 1,
  "loudness": -8.4,
  "duration_ms": 214000,
  "mood": "happy",
  "updated_in_db": true
}
```

### `POST /analyze/batch`

Backfill up to 20 songs. Same auth. Body is an array of `{song_id, audio_url}`.

---

## Backfill existing catalog

```bash
# Using the batch endpoint — process 20 songs at a time
curl -X POST https://your-service.railway.app/analyze/batch \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '[
    {"song_id": "uuid1", "audio_url": "https://..."},
    {"song_id": "uuid2", "audio_url": "https://..."}
  ]'
```

Or run the SQL backfill cron (see `sql/001_add_audio_features.sql`).
