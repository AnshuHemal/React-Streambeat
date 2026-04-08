export type SearchMood = {
  id: string;
  slug: string;
  label: string;
  video_url: string | null;
  thumbnail_url: string | null;
};

export type SearchCategory = {
  id: string;
  slug: string;
  label: string;
  color: string;
  image_url: string | null;
};

// ─── Search Result Types ───────────────────────────────────────────────────────

export type SearchSong = {
  id: string;
  title: string;
  image_url: string | null;
  audio_url: string | null;
  preview_url: string | null;
  duration_ms: number | null;
  artist_name: string;
  artists: { id: string; name: string; image_url: string | null }[];
  album_title: string | null;
  /** Total play count across all users — used for popularity ranking */
  play_count: number;
  /** ISO date string — used for recency boost */
  release_date: string | null;
};

export type SearchArtist = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
};

export type SearchAlbum = {
  id: string;
  title: string;
  album_type: string | null;
  image_url: string | null;
  artist_name: string;
  artist: { id: string; name: string; slug: string; image_url: string | null };
  /** ISO date string — used for recency boost */
  release_date: string | null;
};

/** Priority: song = 1 (highest), artist = 2, album = 3 (lowest) */
export type SearchResultItem =
  | { kind: "song"; data: SearchSong; id: string; priority: 1 }
  | { kind: "artist"; data: SearchArtist; id: string; priority: 2 }
  | { kind: "album"; data: SearchAlbum; id: string; priority: 3 };

// ─── Recent Search History ─────────────────────────────────────────────────────

export type RecentSearchEntry =
  | { kind: "song"; data: SearchSong; timestamp: number }
  | { kind: "artist"; data: SearchArtist; timestamp: number }
  | { kind: "album"; data: SearchAlbum; timestamp: number };

// ─── Suggestions ──────────────────────────────────────────────────────────────

export type Suggestion = {
  id: string;
  text: string;
  /** Where this suggestion came from */
  source: "song" | "artist" | "album";
};

// ─── Trending ─────────────────────────────────────────────────────────────────

export type TrendingSearch = {
  id: string;
  query: string;
  rank: number;
};
