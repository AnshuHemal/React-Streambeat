export type Genre = {
  id: string;
  slug: string;
  label: string;
  color: string;
  image_url: string | null;
};

/** Minimal genre — just id, slug, label — used for language/preference lists */
export type GenreBase = {
  id: string;
  slug: string;
  label: string;
};

export type Artist = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
};

export type Album = {
  id: string;
  title: string;
  artist: Artist;
  image_url: string | null;
  release_date: string | null;
  album_type: string | null;
};

export type Song = {
  id: string;
  title: string;
  artist_id: string;
  album_id: string | null;
  duration_ms: number | null;
  image_url: string | null;
  audio_url: string | null;
};
