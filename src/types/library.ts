export type LibraryItemType = "playlist" | "album" | "artist" | "podcast";

export type LibraryItem = {
  id: string;
  title: string;
  subtitle: string;
  type: LibraryItemType;
  image_url: string | null;
  /** Artists have circular images */
  is_circular?: boolean;
};
