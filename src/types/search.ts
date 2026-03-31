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
