---
description: How to use the Streambeat Admin Panel for managing artists, albums, and songs
---

# Streambeat Admin Panel Workflow

## Overview
The Admin Panel provides a comprehensive interface for managing your music catalog including artists, albums, and songs with many-to-many artist relationships.

## Features

### 1. Artist Management
**Create Artist:**
1. Select "Artist" tab
2. Click "Add New Artist"
3. Fill in:
   - Artist Name (required)
   - Slug (optional - auto-generated from name)
   - Image URL (optional)
4. Tap Save

**Edit Artist:**
- Tap any artist in the list to edit
- Modify fields and save

**Delete Artist:**
- Tap the trash icon on any artist
- Confirm deletion (soft delete - sets is_active=false)

### 2. Album Management
**Create Album:**
1. Select "Album" tab
2. Click "Add New Album"
3. Select Artists (at least one required):
   - Use search bar to filter artists
   - Tap artist chips to select/deselect
   - Selected artists appear in green chips
   - ★ Star icon indicates primary artist (tap to change)
4. Fill album details:
   - Album Title (required)
   - Album Type: Album, Single, EP, or Compilation
   - Image URL (optional)
   - Release Date YYYY-MM-DD (optional)
5. Tap Save

**Key Features:**
- **Primary Artist**: First selected artist automatically becomes primary
- **Multi-artist albums**: Select multiple artists for collaborations
- **Album filter**: In Songs tab, filter by album to see its tracks

### 3. Song Management
**Create Song:**
1. Select "Song" tab
2. Click "Add New Song"
3. Select Artists (at least one required):
   - Works same as album artist selection
   - Primary artist stored in song's artist_id column
   - All artists stored in song_artists junction table
4. Select Album (optional)
5. Fill song details:
   - Song Title (required)
   - Duration in milliseconds (optional)
   - Track Number (optional)
   - Disc Number (defaults to 1)
   - Explicit toggle
   - Image URL (optional)
   - Audio URL (optional)
   - Preview URL 30s clip (optional)
6. Tap Save

**Artist Assignment:**
- Primary artist is stored in `songs.artist_id` column
- All artists are stored in `song_artists` junction table
- Both are required for proper functionality

## Database Schema Notes

### Required Tables
- `artists` - Artist information
- `albums` - Album information (requires artist_id)
- `songs` - Song information (requires artist_id)

### Optional Junction Tables
These are optional but recommended for full functionality:

**album_artists** (for multi-artist albums):
```sql
CREATE TABLE public.album_artists (
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  artist_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (album_id, artist_id)
);
```

**song_artists** (for multi-artist songs):
```sql
CREATE TABLE public.song_artists (
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  artist_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (song_id, artist_id)
);
```

### Optional Columns
These columns are gracefully handled if missing:
- `songs.preview_url` - 30 second preview clip URL
- `songs.audio_url` - Full audio file URL

## Troubleshooting

**Song/Album not appearing after creation:**
- Check that `artist_id` column exists and is not null
- Verify `is_active` is set to true
- Check for missing junction tables

**Artist links not saving:**
- Verify `song_artists` or `album_artists` table exists
- Check console for specific error messages
- Toast notifications will indicate if save was partial

**Database constraint errors:**
- The app now handles missing columns/tables gracefully
- Check Supabase logs for specific constraint violations
- Add missing columns as needed

## UI Features

### Search & Filter
- **Search bar**: Filter lists by name/title
- **Album filter** (Songs tab): Filter songs by album
- **Artist search**: Find artists quickly when selecting

### Visual Indicators
- **Green chips**: Selected items
- **★ Star**: Primary artist
- **Count badges**: Number of tracks/songs
- **Album filter chip**: Shows active filter with clear option

### Navigation
- **Tabs**: Switch between Artist/Album/Song management
- **View modes**: List view and Form view
- **Back button**: Return to list from form
- **Toast notifications**: Success/error feedback
