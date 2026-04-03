import { ArtistCreationModal } from "@/components/ArtistCreationModal";
import AudioUploadForm from "@/components/AudioUploadForm";
import BottomDialog from "@/components/BottomDialog";
import { supabase } from "@/lib/supabase";
import {
  AudioUploadResult,
  generateAudioQualityUrls,
  uploadAudioToCloudinary,
} from "@/services/cloudinary";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import * as SystemUI from "expo-system-ui";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

type TabType = "artist" | "album" | "song";
type ViewMode = "list" | "form" | "audio-upload";

interface FormData {
  artist: {
    name: string;
    slug: string;
    image_url: string;
  };
  album: {
    title: string;
    artist_ids: string[];
    primary_artist_id: string;
    album_type: "album" | "single" | "ep" | "compilation";
    image_url: string;
    release_date: string;
  };
  song: {
    title: string;
    artist_ids: string[];
    primary_artist_id: string;
    album_id: string;
    duration_ms: string;
    track_number: string;
    disc_number: string;
    explicit: boolean;
    image_url: string;
    audio_url: string;
    preview_url: string;
  };
}

const INITIAL_FORM_DATA: FormData = {
  artist: { name: "", slug: "", image_url: "" },
  album: {
    title: "",
    artist_ids: [],
    primary_artist_id: "",
    album_type: "album",
    image_url: "",
    release_date: "",
  },
  song: {
    title: "",
    artist_ids: [],
    primary_artist_id: "",
    album_id: "",
    duration_ms: "",
    track_number: "",
    disc_number: "1",
    explicit: false,
    image_url: "",
    audio_url: "",
    preview_url: "",
  },
};

// List item types
interface ArtistItem {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  song_count?: number;
}

interface AlbumItem {
  id: string;
  title: string;
  album_type: string;
  image_url: string | null;
  artist_id?: string;
  artists: { name: string }[];
  total_tracks?: number;
}

interface SongItem {
  id: string;
  title: string;
  duration_ms: number | null;
  explicit: boolean;
  image_url: string | null;
  artists: { name: string }[];
  album?: { id: string; title: string } | null;
  album_id?: string;
  artist_id?: string;
  track_number?: number | null;
  disc_number?: number | null;
  audio_url?: string | null;
  preview_url?: string | null;
}

/**
 * Calls the Supabase edge function to extract the dominant color from an image URL.
 * Returns a hex color string or null if extraction fails.
 */
async function extractAlbumColor(imageUrl: string): Promise<string | null> {
  try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const res = await fetch(`${supabaseUrl}/functions/v1/extract-album-color`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.color ?? null;
  } catch {
    return null;
  }
}

export default function AdminPanelScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("artist");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // State for audio file selection during song edit
  const [editAudioFile, setEditAudioFile] = useState<{
    uri: string;
    name: string;
    size: number;
  } | null>(null);
  const [editAudioUploading, setEditAudioUploading] = useState(false);

  // List data
  const [artistsList, setArtistsList] = useState<ArtistItem[]>([]);
  const [albumsList, setAlbumsList] = useState<AlbumItem[]>([]);
  const [songsList, setSongsList] = useState<SongItem[]>([]);

  // Search queries
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [artistSearchQuery, setArtistSearchQuery] = useState("");
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState<string | null>(
    null,
  );

  // Dropdown data
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  const [albums, setAlbums] = useState<{ id: string; title: string }[]>([]);

  // Modal state
  const [artistModalVisible, setArtistModalVisible] = useState(false);
  const [artistModalTarget, setArtistModalTarget] = useState<"album" | "song">(
    "album",
  );

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const filteredArtists = useMemo(() => {
    if (!artistSearchQuery.trim()) return artists;
    return artists.filter((a) =>
      a.name.toLowerCase().includes(artistSearchQuery.toLowerCase()),
    );
  }, [artists, artistSearchQuery]);

  // Set system navigation bar to match app theme (white icons, dark background)
  useEffect(() => {
    SystemUI.setBackgroundColorAsync("#121212");
  }, []);
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Fetch list data
  useEffect(() => {
    if (viewMode === "list") {
      fetchListData();
    }
  }, [activeTab, viewMode]);

  const fetchDropdownData = async () => {
    const [artistsRes, albumsRes] = await Promise.all([
      supabase
        .from("artists")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("albums")
        .select("id, title")
        .eq("is_active", true)
        .order("title"),
    ]);
    setArtists(artistsRes.data || []);
    setAlbums(albumsRes.data || []);
  };

  const fetchListData = async () => {
    setLoading(true);
    try {
      if (activeTab === "artist") {
        const { data: artistsData } = await supabase
          .from("artists")
          .select("id, name, slug, image_url")
          .order("name");

        // Fetch song counts for each artist
        const artistsWithCounts = await Promise.all(
          (artistsData || []).map(async (artist) => {
            try {
              // Try to count via song_artists junction table first
              const { count } = await supabase
                .from("song_artists")
                .select("*", { count: "exact", head: true })
                .eq("artist_id", artist.id);
              return { ...artist, song_count: count || 0 };
            } catch {
              // Fallback to artist_id column on songs
              try {
                const { count } = await supabase
                  .from("songs")
                  .select("*", { count: "exact", head: true })
                  .eq("artist_id", artist.id);
                return { ...artist, song_count: count || 0 };
              } catch {
                return { ...artist, song_count: 0 };
              }
            }
          }),
        );
        setArtistsList(artistsWithCounts);
      } else if (activeTab === "album") {
        const { data: albumsData } = await supabase
          .from("albums")
          .select(
            `
            id, title, album_type, image_url, artist_id, total_tracks
          `,
          )
          .order("created_at", { ascending: false });

        // Fetch artists for each album in parallel
        const albumsWithData = await Promise.all(
          (albumsData || []).map(async (album) => {
            // Get artists
            let albumArtists: { name: string }[] = [];
            try {
              const { data: artistsData } = await supabase
                .from("album_artists")
                .select("artists(name)")
                .eq("album_id", album.id)
                .order("artist_order");
              albumArtists = (artistsData || []).map((item: any) => ({
                name: item.artists?.name || "Unknown",
              }));
            } catch {
              // album_artists table doesn't exist
              albumArtists = [];
            }

            return {
              ...album,
              artists: albumArtists,
            };
          }),
        );
        setAlbumsList(albumsWithData);
      } else if (activeTab === "song") {
        try {
          const { data } = await supabase
            .from("songs")
            .select(
              `
              id, title, duration_ms, explicit, image_url, album_id,
              album:albums(id, title),
              song_artists(artists(name))
            `,
            )
            .order("created_at", { ascending: false });
          const transformed = (data || []).map((song: any) => ({
            ...song,
            artists:
              song.song_artists?.map((sa: any) => sa.artists).filter(Boolean) ||
              [],
          }));
          setSongsList(transformed);
        } catch (error) {
          const { data } = await supabase
            .from("songs")
            .select(
              `
              id, title, duration_ms, explicit, image_url, album_id,
              album:albums(id, title)
            `,
            )
            .order("created_at", { ascending: false });
          const transformed = (data || []).map((song: any) => ({
            ...song,
            artists: [],
          }));
          setSongsList(transformed);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Filtered list data
  const filteredListData = useMemo(() => {
    if (activeTab === "song" && selectedAlbumFilter) {
      const albumSongs = songsList.filter(
        (s) =>
          s.album?.id === selectedAlbumFilter ||
          s.album_id === selectedAlbumFilter,
      );
      if (!listSearchQuery.trim()) return albumSongs;
      const query = listSearchQuery.toLowerCase();
      return albumSongs.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.artists?.some((artist) =>
            artist.name.toLowerCase().includes(query),
          ),
      );
    }
    if (!listSearchQuery.trim()) {
      if (activeTab === "artist") return artistsList;
      if (activeTab === "album") return albumsList;
      if (activeTab === "song") return songsList;
      return [];
    }
    const query = listSearchQuery.toLowerCase();
    if (activeTab === "artist") {
      return artistsList.filter((a) => a.name.toLowerCase().includes(query));
    } else if (activeTab === "album") {
      return albumsList.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.artists?.some((artist) =>
            artist.name.toLowerCase().includes(query),
          ),
      );
    } else {
      return songsList.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.artists?.some((artist) =>
            artist.name.toLowerCase().includes(query),
          ) ||
          s.album?.title.toLowerCase().includes(query),
      );
    }
  }, [
    activeTab,
    artistsList,
    albumsList,
    songsList,
    listSearchQuery,
    selectedAlbumFilter,
  ]);

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: tab === "artist" ? 0 : tab === "album" ? 1 : 2,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setActiveTab(tab);
    setViewMode("list");
    setListSearchQuery("");
    setSelectedAlbumFilter(null);
    setEditingId(null);
    setFormData(INITIAL_FORM_DATA);
  };

  // Helper function to update album's total_tracks count
  const updateAlbumTrackCount = async (albumId: string | null) => {
    if (!albumId) return;
    try {
      const { count, error: countError } = await supabase
        .from("songs")
        .select("*", { count: "exact", head: true })
        .eq("album_id", albumId);
      if (countError) {
        return;
      }
      const { error: updateError } = await supabase
        .from("albums")
        .update({ total_tracks: count || 0 })
        .eq("id", albumId);
      if (updateError) {
      }
    } catch (err) {}
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (activeTab === "artist") {
        if (!formData.artist.name.trim()) {
          toast.error("Artist name is required");
          setLoading(false);
          return;
        }
        if (editingId) {
          const { data, error } = await supabase
            .from("artists")
            .update({
              name: formData.artist.name.trim(),
              slug:
                formData.artist.slug.trim() ||
                formData.artist.name.toLowerCase().replace(/\s+/g, "-"),
              image_url: formData.artist.image_url.trim() || null,
            })
            .eq("id", editingId)
            .select();
          if (error) {
            throw error;
          }
          toast.success("Artist updated successfully!");
        } else {
          const { data, error } = await supabase
            .from("artists")
            .insert({
              name: formData.artist.name.trim(),
              slug:
                formData.artist.slug.trim() ||
                formData.artist.name.toLowerCase().replace(/\s+/g, "-"),
              image_url: formData.artist.image_url.trim() || null,
              is_active: true,
            })
            .select();
          if (error) {
            throw error;
          }
          toast.success("Artist created successfully!");
        }
        fetchDropdownData();
      } else if (activeTab === "album") {
        if (formData.album.artist_ids.length === 0) {
          toast.error("Please select at least one artist");
          setLoading(false);
          return;
        }

        // Extract dominant color from image URL via edge function
        const dominantColor = formData.album.image_url
          ? await extractAlbumColor(formData.album.image_url)
          : null;

        if (editingId) {
          const { error: updateError } = await supabase
            .from("albums")
            .update({
              title: formData.album.title,
              album_type: formData.album.album_type,
              image_url: formData.album.image_url || null,
              release_date: formData.album.release_date || null,
              ...(dominantColor ? { dominant_color: dominantColor } : {}),
            })
            .eq("id", editingId);
          if (updateError) throw updateError;

          // Try to update album_artists junction table (may not exist)
          try {
            await supabase
              .from("album_artists")
              .delete()
              .eq("album_id", editingId);
            const albumArtists = formData.album.artist_ids.map((id, i) => ({
              album_id: editingId,
              artist_id: id,
              artist_order: i,
            }));
            await supabase.from("album_artists").insert(albumArtists);
          } catch {}
          toast.success("Album updated successfully!");
        } else {
          const primaryArtistId =
            formData.album.primary_artist_id || formData.album.artist_ids[0];
          const { data, error: insertError } = await supabase
            .from("albums")
            .insert({
              title: formData.album.title,
              album_type: formData.album.album_type,
              image_url: formData.album.image_url || null,
              release_date: formData.album.release_date || null,
              artist_id: primaryArtistId,
              is_active: true,
              ...(dominantColor ? { dominant_color: dominantColor } : {}),
            })
            .select("id")
            .single();
          if (insertError) throw insertError;

          // Try to insert into album_artists junction table (may not exist)
          try {
            const albumArtists = formData.album.artist_ids.map((id, i) => ({
              album_id: data?.id,
              artist_id: id,
              artist_order: i,
            }));
            await supabase.from("album_artists").insert(albumArtists);
          } catch {}

          toast.success("Album created successfully!");
        }
        fetchDropdownData();
      } else if (activeTab === "song") {
        if (formData.song.artist_ids.length === 0) {
          toast.error("Please select at least one artist");
          setLoading(false);
          return;
        }
        if (editingId) {
          const { data: currentSong } = await supabase
            .from("songs")
            .select("album_id, cloudinary_public_id")
            .eq("id", editingId)
            .single();
          const oldAlbumId = currentSong?.album_id;
          const oldPublicId = currentSong?.cloudinary_public_id;

          let updateData: any = {
            title: formData.song.title,
            album_id: formData.song.album_id || null,
            duration_ms: parseInt(formData.song.duration_ms) || null,
            track_number: parseInt(formData.song.track_number) || null,
            disc_number: parseInt(formData.song.disc_number) || 1,
            explicit: formData.song.explicit,
            image_url: formData.song.image_url || null,
          };

          // If new audio file selected, upload it and update URLs
          if (editAudioFile) {
            setEditAudioUploading(true);
            toast.info("Uploading new audio file...");

            const uploadResult: AudioUploadResult = await uploadAudioToCloudinary(
              editAudioFile.uri,
              {
                title: formData.song.title,
                artist_id: formData.song.primary_artist_id || formData.song.artist_ids[0],
                album_id: formData.song.album_id || undefined,
              }
            );

            const qualityUrls = generateAudioQualityUrls(uploadResult.public_id);

            updateData.cloudinary_public_id = uploadResult.public_id;
            updateData.audio_url = qualityUrls.medium;
            updateData.preview_url = qualityUrls.preview;
            updateData.quality_urls = {
              medium: qualityUrls.medium,
              high: qualityUrls.high,
              preview: qualityUrls.preview,
            };
            updateData.duration_ms = Math.round(uploadResult.duration * 1000);

            setEditAudioUploading(false);
            toast.success("New audio uploaded successfully!");
          } else {
            // Only update audio URLs if manually edited
            if (formData.song.audio_url)
              updateData.audio_url = formData.song.audio_url;
            if (formData.song.preview_url)
              updateData.preview_url = formData.song.preview_url;
          }

          const { error: updateError } = await supabase
            .from("songs")
            .update(updateData)
            .eq("id", editingId);
          if (updateError) throw updateError;

          // Try to update song_artists junction table
          try {
            await supabase
              .from("song_artists")
              .delete()
              .eq("song_id", editingId);
            const songArtists = formData.song.artist_ids.map((id, i) => ({
              song_id: editingId,
              artist_id: id,
              artist_order: i,
            }));
            const { error: junctionError } = await supabase
              .from("song_artists")
              .insert(songArtists);
            if (junctionError) {
              toast.warning("Song saved but artist links failed", {
                description: junctionError.message,
              });
            }
          } catch (err) {
            toast.warning("Song saved without artist links");
          }

          // Update track counts for old and new albums
          const newAlbumId = formData.song.album_id || null;
          if (oldAlbumId && oldAlbumId !== newAlbumId) {
            await updateAlbumTrackCount(oldAlbumId);
          }
          if (newAlbumId) {
            await updateAlbumTrackCount(newAlbumId);
          }

          toast.success("Song updated successfully!");
        } else {
          const primaryArtistId =
            formData.song.primary_artist_id || formData.song.artist_ids[0];
          const insertData: any = {
            title: formData.song.title,
            artist_id: primaryArtistId,
            album_id: formData.song.album_id || null,
            duration_ms: parseInt(formData.song.duration_ms) || null,
            track_number: parseInt(formData.song.track_number) || null,
            disc_number: parseInt(formData.song.disc_number) || 1,
            explicit: formData.song.explicit,
            image_url: formData.song.image_url || null,
            is_active: true,
          };
          // Only add optional fields if they have values (columns may not exist)
          if (formData.song.audio_url)
            insertData.audio_url = formData.song.audio_url;
          if (formData.song.preview_url)
            insertData.preview_url = formData.song.preview_url;

          const { data, error: insertError } = await supabase
            .from("songs")
            .insert(insertData)
            .select("id")
            .single();
          if (insertError) throw insertError;

          // Try to insert into song_artists junction table (may not exist)
          try {
            const songArtists = formData.song.artist_ids.map((id, i) => ({
              song_id: data?.id,
              artist_id: id,
              artist_order: i,
            }));
            const { error: junctionError } = await supabase
              .from("song_artists")
              .insert(songArtists);
            if (junctionError) {
              toast.warning("Song created but artist links failed", {
                description: junctionError.message,
              });
            } else {
              toast.success("Song created with artists!");
             }
          } catch (err) {
            toast.warning("Song created without artist links");
          }

          // Update album track count if album is selected
          if (formData.song.album_id) {
            await updateAlbumTrackCount(formData.song.album_id);
          }

          toast.success("Song created successfully!");
        }
      }
      setFormData(INITIAL_FORM_DATA);
      setViewMode("list");
      setEditingId(null);
      setEditAudioFile(null);
      fetchListData();
    } catch (error: any) {
      toast.error("Failed to save item", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (item: ArtistItem | AlbumItem | SongItem) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (activeTab === "artist") {
      const artist = item as ArtistItem;
      setFormData((prev) => ({
        ...prev,
        artist: {
          name: artist.name,
          slug: artist.slug || "",
          image_url: artist.image_url || "",
        },
      }));
    } else if (activeTab === "album") {
      const album = item as AlbumItem;
      let artistIds: string[] = [];
      try {
        const { data } = await supabase
          .from("album_artists")
          .select("artist_id")
          .eq("album_id", album.id)
          .order("artist_order");
        artistIds = data?.map((a: any) => a.artist_id) || [];
      } catch {
        // album_artists table doesn't exist - fallback to primary artist only
        artistIds = album.artist_id ? [album.artist_id] : [];
      }
      setFormData((prev) => ({
        ...prev,
        album: {
          title: album.title,
          artist_ids: artistIds,
          primary_artist_id: artistIds[0] || album.artist_id || "",
          album_type: (album.album_type as any) || "album",
          image_url: album.image_url || "",
          release_date: "",
        },
      }));
    } else {
      const song = item as SongItem;
      let artistIds: string[] = [];
      try {
        const { data } = await supabase
          .from("song_artists")
          .select("artist_id")
          .eq("song_id", song.id)
          .order("artist_order");
        artistIds = data?.map((s: any) => s.artist_id) || [];
      } catch {
        // song_artists table doesn't exist - fallback to primary artist only
        artistIds = song.artist_id ? [song.artist_id] : [];
      }
      setFormData((prev) => ({
        ...prev,
        song: {
          title: song.title,
          artist_ids: artistIds,
          primary_artist_id: artistIds[0] || song.artist_id || "",
          album_id: song.album_id || "",
          duration_ms: song.duration_ms?.toString() || "",
          track_number: song.track_number?.toString() || "",
          disc_number: song.disc_number?.toString() || "1",
          explicit: song.explicit || false,
          image_url: song.image_url || "",
          audio_url: song.audio_url || "",
          preview_url: song.preview_url || "",
        },
      }));
    }

    setEditingId(item.id);
    setViewMode("form");
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteItem({ id, name });
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    setDeleteDialogVisible(false);
    setLoading(true);
    try {
      const table =
        activeTab === "artist"
          ? "artists"
          : activeTab === "album"
            ? "albums"
            : "songs";

      // For songs, get album_id before deletion and clean up junction table
      let songAlbumId: string | null = null;
      if (activeTab === "song") {
        const { data: songData } = await supabase
          .from("songs")
          .select("album_id")
          .eq("id", deleteItem.id)
          .single();
        songAlbumId = songData?.album_id || null;
        try {
          await supabase
            .from("song_artists")
            .delete()
            .eq("song_id", deleteItem.id);
        } catch {
          // song_artists table might not exist - ignore error
        }
      }

      // For albums, clean up junction table records first
      if (activeTab === "album") {
        try {
          await supabase
            .from("album_artists")
            .delete()
            .eq("album_id", deleteItem.id);
        } catch {
          // album_artists table might not exist - ignore error
        }
      }

      // Hard delete the record
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", deleteItem.id);
      if (error) {
        throw error;
      }

      // Update album track count if a song with album was deleted
      if (activeTab === "song" && songAlbumId) {
        await updateAlbumTrackCount(songAlbumId);
      }

      toast.success("Deleted successfully!");
      fetchListData();
    } catch (error: any) {
      toast.error("Failed to delete", {
        description: error.message || "Unknown error",
      });
    } finally {
      setLoading(false);
      setDeleteItem(null);
    }
  };

  const toggleArtistSelection = (artistId: string) => {
    setFormData((prev) => {
      const currentIds = prev.album.artist_ids;
      const isSelected = currentIds.includes(artistId);
      let newIds: string[];
      let newPrimaryId = prev.album.primary_artist_id;

      if (isSelected) {
        newIds = currentIds.filter((id) => id !== artistId);
        if (newPrimaryId === artistId) {
          newPrimaryId = newIds[0] || "";
        }
      } else {
        newIds = [...currentIds, artistId];
        if (!newPrimaryId) {
          newPrimaryId = artistId;
        }
      }

      return {
        ...prev,
        album: {
          ...prev.album,
          artist_ids: newIds,
          primary_artist_id: newPrimaryId,
        },
      };
    });
  };

  const removeArtist = (artistId: string) => {
    setFormData((prev) => {
      const newIds = prev.album.artist_ids.filter((id) => id !== artistId);
      const newPrimaryId =
        prev.album.primary_artist_id === artistId
          ? newIds[0] || ""
          : prev.album.primary_artist_id;
      return {
        ...prev,
        album: {
          ...prev.album,
          artist_ids: newIds,
          primary_artist_id: newPrimaryId,
        },
      };
    });
  };

  const toggleSongArtistSelection = (artistId: string) => {
    setFormData((prev) => {
      const currentIds = prev.song.artist_ids;
      const isSelected = currentIds.includes(artistId);
      let newIds: string[];
      let newPrimaryId = prev.song.primary_artist_id;

      if (isSelected) {
        newIds = currentIds.filter((id) => id !== artistId);
        if (newPrimaryId === artistId) {
          newPrimaryId = newIds[0] || "";
        }
      } else {
        newIds = [...currentIds, artistId];
        if (!newPrimaryId) {
          newPrimaryId = artistId;
        }
      }

      return {
        ...prev,
        song: {
          ...prev.song,
          artist_ids: newIds,
          primary_artist_id: newPrimaryId,
        },
      };
    });
  };

  const removeSongArtist = (artistId: string) => {
    setFormData((prev) => ({
      ...prev,
      song: {
        ...prev.song,
        artist_ids: prev.song.artist_ids.filter((id) => id !== artistId),
        primary_artist_id:
          prev.song.primary_artist_id === artistId
            ? prev.song.artist_ids.find((id) => id !== artistId) || ""
            : prev.song.primary_artist_id,
      },
    }));
  };

  const handleArtistCreated = (newArtist: { id: string; name: string }) => {
    setArtists((prev) =>
      [...prev, newArtist].sort((a, b) => a.name.localeCompare(b.name)),
    );
    if (artistModalTarget === "album") {
      setFormData((prev) => ({
        ...prev,
        album: {
          ...prev.album,
          artist_ids: [...prev.album.artist_ids, newArtist.id],
          primary_artist_id: prev.album.primary_artist_id || newArtist.id,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        song: {
          ...prev.song,
          artist_ids: [...prev.song.artist_ids, newArtist.id],
          primary_artist_id: prev.song.primary_artist_id || newArtist.id,
        },
      }));
    }
    toast.success(`"${newArtist.name}" has been created and selected.`);
  };

  const handleViewAlbumSongs = (albumId: string, albumTitle: string) => {
    setSelectedAlbumFilter(albumId);
    setActiveTab("song");
    setListSearchQuery("");
    toast.info(`Showing songs from "${albumTitle}"`, {
      description: "Filter applied automatically",
    });
  };

  const handleClearAlbumFilter = () => {
    setSelectedAlbumFilter(null);
    toast.info("Album filter cleared");
  };

  const openArtistModal = (target: "album" | "song") => {
    setArtistModalTarget(target);
    setArtistModalVisible(true);
  };

  const pickEditAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/aac"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setEditAudioFile({
          uri: file.uri,
          name: file.name,
          size: file.size || 0,
        });
        toast.success("New audio file selected", {
          description: file.name,
        });
      }
    } catch (error) {
      toast.error("Failed to pick audio file");
    }
  };

  const updateFormField = (
    tab: TabType,
    field: string,
    value: string | string[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], [field]: value },
    }));
  };

  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: keyof typeof Ionicons.glyphMap,
    keyboardType: "default" | "number-pad" = "default",
    multiline = false,
  ) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: multiline ? "flex-start" : "center",
        backgroundColor: "#282828",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: multiline ? 12 : 0,
        marginBottom: 16,
        height: multiline ? 100 : 56,
      }}
    >
      <Ionicons
        name={icon}
        size={22}
        color="#B3B3B3"
        style={{ marginRight: 12, marginTop: multiline ? 4 : 0 }}
      />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#7A7A7A"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          flex: 1,
          color: "#FFFFFF",
          fontSize: 15,
          fontFamily: "CircularStd",
          height: multiline ? 80 : 56,
          paddingTop: multiline ? 4 : 0,
        }}
      />
    </View>
  );

  const setPrimaryArtist = (artistId: string) => {
    setFormData((prev) => ({
      ...prev,
      album: { ...prev.album, primary_artist_id: artistId },
    }));
  };

  const renderSearchableArtistSelector = () => {
    const selectedArtists = artists.filter((a) =>
      formData.album.artist_ids.includes(a.id),
    );
    const primaryArtistId = formData.album.primary_artist_id;
    return (
      <View style={{ marginBottom: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          <Text
            style={{
              color: "#B3B3B3",
              fontSize: 13,
              fontFamily: "CircularStd",
            }}
          >
            Select Artists *
          </Text>
          <TouchableOpacity
            onPress={() => openArtistModal("album")}
            activeOpacity={0.7}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons name="add-circle" size={16} color="#1DB954" />
            <Text
              style={{
                color: "#1DB954",
                fontSize: 12,
                fontFamily: "CircularStd",
                fontWeight: "500",
              }}
            >
              New Artist
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#282828",
            borderRadius: 8,
            paddingHorizontal: 16,
            marginBottom: 12,
            height: 48,
          }}
        >
          <Ionicons
            name="search"
            size={20}
            color="#B3B3B3"
            style={{ marginRight: 12 }}
          />
          <TextInput
            placeholder="Search artists..."
            placeholderTextColor="#7A7A7A"
            value={artistSearchQuery}
            onChangeText={setArtistSearchQuery}
            style={{
              flex: 1,
              color: "#FFFFFF",
              fontSize: 15,
              fontFamily: "CircularStd",
              height: 48,
            }}
          />
          {artistSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setArtistSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#7A7A7A" />
            </TouchableOpacity>
          )}
        </View>
        {selectedArtists.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                }}
              >
                Selected ({selectedArtists.length})
              </Text>
              {primaryArtistId && (
                <Text
                  style={{
                    color: "#1DB954",
                    fontSize: 11,
                    fontFamily: "CircularStd",
                  }}
                >
                  ★{" "}
                  {selectedArtists.find((a) => a.id === primaryArtistId)?.name}{" "}
                  is Primary
                </Text>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {selectedArtists.map((artist) => {
                const isPrimary = primaryArtistId === artist.id;
                return (
                  <View
                    key={artist.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isPrimary ? "#1DB954" : "#282828",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 16,
                      gap: 6,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setPrimaryArtist(artist.id)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons
                        name={isPrimary ? "star" : "star-outline"}
                        size={14}
                        color={isPrimary ? "#000000" : "#B3B3B3"}
                      />
                      <Text
                        style={{
                          color: isPrimary ? "#000000" : "#FFFFFF",
                          fontSize: 13,
                          fontFamily: "CircularStd",
                          fontWeight: isPrimary ? "600" : "500",
                        }}
                      >
                        {artist.name}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeArtist(artist.id)}>
                      <Ionicons
                        name="close"
                        size={16}
                        color={isPrimary ? "#000000" : "#B3B3B3"}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            {filteredArtists.slice(0, 20).map((artist) => {
              const isSelected = formData.album.artist_ids.includes(artist.id);
              return (
                <TouchableOpacity
                  key={artist.id}
                  onPress={() => toggleArtistSelection(artist.id)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: isSelected ? "#1DB954" : "#282828",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 20,
                    minWidth: 120,
                    alignItems: "center",
                    flexDirection: "row",
                    gap: 6,
                  }}
                >
                  <Ionicons
                    name={
                      isSelected ? "checkmark-circle" : "add-circle-outline"
                    }
                    size={16}
                    color={isSelected ? "#000000" : "#B3B3B3"}
                  />
                  <Text
                    style={{
                      color: isSelected ? "#000000" : "#FFFFFF",
                      fontSize: 13,
                      fontFamily: "CircularStd",
                      fontWeight: isSelected ? "600" : "500",
                    }}
                    numberOfLines={1}
                  >
                    {artist.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderSearchableArtistSelectorForSongs = () => {
    const selectedArtists = artists.filter((a) =>
      formData.song.artist_ids.includes(a.id),
    );
    return (
      <View style={{ marginBottom: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
            marginLeft: 4,
          }}
        >
          <Text
            style={{
              color: "#B3B3B3",
              fontSize: 13,
              fontFamily: "CircularStd",
            }}
          >
            Select Artists *
          </Text>
          <TouchableOpacity
            onPress={() => openArtistModal("song")}
            activeOpacity={0.7}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons name="add-circle" size={16} color="#1DB954" />
            <Text
              style={{
                color: "#1DB954",
                fontSize: 12,
                fontFamily: "CircularStd",
                fontWeight: "500",
              }}
            >
              New Artist
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#282828",
            borderRadius: 8,
            paddingHorizontal: 16,
            marginBottom: 12,
            height: 48,
          }}
        >
          <Ionicons
            name="search"
            size={20}
            color="#B3B3B3"
            style={{ marginRight: 12 }}
          />
          <TextInput
            placeholder="Search artists..."
            placeholderTextColor="#7A7A7A"
            value={artistSearchQuery}
            onChangeText={setArtistSearchQuery}
            style={{
              flex: 1,
              color: "#FFFFFF",
              fontSize: 15,
              fontFamily: "CircularStd",
              height: 48,
            }}
          />
          {artistSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setArtistSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#7A7A7A" />
            </TouchableOpacity>
          )}
        </View>
        {selectedArtists.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 12,
                fontFamily: "CircularStd",
                marginBottom: 8,
              }}
            >
              Selected ({selectedArtists.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {selectedArtists.map((artist) => (
                <View
                  key={artist.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#1DB954",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 16,
                    gap: 6,
                  }}
                >
                  <Text
                    style={{
                      color: "#000000",
                      fontSize: 13,
                      fontFamily: "CircularStd",
                      fontWeight: "500",
                    }}
                  >
                    {artist.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeSongArtist(artist.id)}>
                    <Ionicons name="close" size={16} color="#000000" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            {filteredArtists.slice(0, 20).map((artist) => {
              const isSelected = formData.song.artist_ids.includes(artist.id);
              return (
                <TouchableOpacity
                  key={artist.id}
                  onPress={() => toggleSongArtistSelection(artist.id)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: isSelected ? "#1DB954" : "#282828",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 20,
                    minWidth: 120,
                    alignItems: "center",
                    flexDirection: "row",
                    gap: 6,
                  }}
                >
                  <Ionicons
                    name={
                      isSelected ? "checkmark-circle" : "add-circle-outline"
                    }
                    size={16}
                    color={isSelected ? "#000000" : "#B3B3B3"}
                  />
                  <Text
                    style={{
                      color: isSelected ? "#000000" : "#FFFFFF",
                      fontSize: 13,
                      fontFamily: "CircularStd",
                      fontWeight: isSelected ? "600" : "500",
                    }}
                    numberOfLines={1}
                  >
                    {artist.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderDropdown = (
    label: string,
    value: string,
    onSelect: (id: string) => void,
    options: { id: string; name?: string; title?: string }[],
  ) => (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          color: "#B3B3B3",
          fontSize: 13,
          fontFamily: "CircularStd",
          marginBottom: 8,
          marginLeft: 4,
        }}
      >
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20 }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          {options.map((option) => {
            const isSelected = value === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => onSelect(option.id)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: isSelected ? "#1DB954" : "#282828",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 20,
                  minWidth: 120,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: isSelected ? "#000000" : "#FFFFFF",
                    fontSize: 14,
                    fontFamily: "CircularStd",
                    fontWeight: isSelected ? "600" : "500",
                  }}
                  numberOfLines={1}
                >
                  {option.name || option.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const renderArtistForm = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {renderInput(
        "Artist Name *",
        formData.artist.name,
        (text) => updateFormField("artist", "name", text),
        "person",
      )}
      {renderInput(
        "Slug (optional)",
        formData.artist.slug,
        (text) => updateFormField("artist", "slug", text),
        "link",
      )}
      {renderInput(
        "Image URL (optional)",
        formData.artist.image_url,
        (text) => updateFormField("artist", "image_url", text),
        "image",
      )}
    </Animated.View>
  );

  const renderAlbumForm = () => {
    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;
        updateFormField("album", "release_date", formattedDate);
      }
    };

    const parsedDate = formData.album.release_date
      ? new Date(formData.album.release_date)
      : new Date();

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {renderSearchableArtistSelector()}
        {renderInput(
          "Album Title *",
          formData.album.title,
          (text) => updateFormField("album", "title", text),
          "disc",
        )}
        {renderDropdown(
          "Album Type",
          formData.album.album_type,
          (type) => updateFormField("album", "album_type", type),
          [
            { id: "album", name: "Album" },
            { id: "single", name: "Single" },
            { id: "ep", name: "EP" },
            { id: "compilation", name: "Compilation" },
          ],
        )}
        {renderInput(
          "Image URL (optional)",
          formData.album.image_url,
          (text) => updateFormField("album", "image_url", text),
          "image",
        )}

        {/* Release Date Picker */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              color: "#B3B3B3",
              fontSize: 13,
              fontFamily: "CircularStd",
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            Release Date
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#282828",
              borderRadius: 8,
              paddingHorizontal: 16,
              height: 56,
            }}
          >
            <Ionicons
              name="calendar"
              size={22}
              color="#B3B3B3"
              style={{ marginRight: 12 }}
            />
            <Text
              style={{
                flex: 1,
                color: formData.album.release_date ? "#FFFFFF" : "#7A7A7A",
                fontSize: 15,
                fontFamily: "CircularStd",
              }}
            >
              {formData.album.release_date || "Select a date"}
            </Text>
            {formData.album.release_date && (
              <TouchableOpacity
                onPress={() => updateFormField("album", "release_date", "")}
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={20} color="#7A7A7A" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={parsedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </Animated.View>
    );
  };

  const renderSongForm = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {renderSearchableArtistSelectorForSongs()}
      {renderDropdown(
        "Select Album (optional)",
        formData.song.album_id,
        (id) => updateFormField("song", "album_id", id),
        albums,
      )}
      {renderInput(
        "Song Title *",
        formData.song.title,
        (text) => updateFormField("song", "title", text),
        "musical-note",
      )}
      {renderInput(
        "Duration (ms)",
        formData.song.duration_ms,
        (text) => updateFormField("song", "duration_ms", text),
        "time",
        "number-pad",
      )}
      {renderInput(
        "Track Number",
        formData.song.track_number,
        (text) => updateFormField("song", "track_number", text),
        "list",
        "number-pad",
      )}
      {renderInput(
        "Disc Number",
        formData.song.disc_number,
        (text) => updateFormField("song", "disc_number", text),
        "disc-outline",
        "number-pad",
      )}
      <TouchableOpacity
        onPress={() =>
          setFormData((prev) => ({
            ...prev,
            song: { ...prev.song, explicit: !prev.song.explicit },
          }))
        }
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
          paddingHorizontal: 4,
        }}
      >
        <Ionicons
          name={formData.song.explicit ? "checkbox" : "square-outline"}
          size={24}
          color={formData.song.explicit ? "#1DB954" : "#B3B3B3"}
          style={{ marginRight: 12 }}
        />
        <Text
          style={{
            color: formData.song.explicit ? "#FFFFFF" : "#B3B3B3",
            fontSize: 14,
            fontFamily: "CircularStd",
          }}
        >
          Explicit Content
        </Text>
      </TouchableOpacity>
      {renderInput(
        "Image URL (optional)",
        formData.song.image_url,
        (text) => updateFormField("song", "image_url", text),
        "image",
      )}

      {/* Audio File Upload - Only when editing */}
      {editingId && (
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontFamily: "CircularStd",
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            Audio File
          </Text>
          <TouchableOpacity
            onPress={pickEditAudioFile}
            disabled={editAudioUploading}
            style={{
              backgroundColor: editAudioFile ? "#1a3a1a" : "#2a2a2a",
              borderWidth: 2,
              borderColor: editAudioFile ? "#1DB954" : "#3a3a3a",
              borderStyle: "dashed",
              borderRadius: 8,
              padding: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons
              name={editAudioFile ? "checkmark-circle" : "cloud-upload"}
              size={24}
              color={editAudioFile ? "#1DB954" : "#B3B3B3"}
            />
            <Text
              style={{
                color: editAudioFile ? "#1DB954" : "#FFFFFF",
                fontSize: 14,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              {editAudioFile
                ? editAudioFile.name
                : "Select New MP3 (optional)"}
            </Text>
          </TouchableOpacity>
          {editAudioFile && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 8,
              }}
            >
              <Text
                style={{
                  color: "#7A7A7A",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                }}
              >
                {(editAudioFile.size / 1024 / 1024).toFixed(2)} MB
              </Text>
              <TouchableOpacity
                onPress={() => setEditAudioFile(null)}
                style={{ padding: 4 }}
              >
                <Text
                  style={{
                    color: "#E91429",
                    fontSize: 12,
                    fontFamily: "CircularStd",
                  }}
                >
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <Text
            style={{
              color: "#7A7A7A",
              fontSize: 11,
              fontFamily: "CircularStd",
              marginTop: 8,
            }}
          >
            Leave empty to keep current audio. New file will generate Medium (192kbps) + High (320kbps) versions.
          </Text>
        </View>
      )}

      {renderInput(
        "Audio URL (optional)",
        formData.song.audio_url,
        (text) => updateFormField("song", "audio_url", text),
        "play-circle",
      )}
      {renderInput(
        "Preview URL (30s clip)",
        formData.song.preview_url,
        (text) => updateFormField("song", "preview_url", text),
        "musical-notes",
      )}
    </Animated.View>
  );

  const renderListItem = ({
    item,
    index,
  }: {
    item: ArtistItem | AlbumItem | SongItem;
    index: number;
  }) => {
    const isArtist = activeTab === "artist";
    const isAlbum = activeTab === "album";
    const name = isArtist
      ? (item as ArtistItem).name
      : isAlbum
        ? (item as AlbumItem).title
        : (item as SongItem).title;
    const imageUrl = isArtist
      ? (item as ArtistItem).image_url
      : isAlbum
        ? (item as AlbumItem).image_url
        : (item as SongItem).image_url;
    const artists = isAlbum
      ? (item as AlbumItem).artists
      : isAlbum
        ? []
        : (item as SongItem).artists;
    const subtitle = isArtist
      ? (item as ArtistItem).slug
      : isAlbum
        ? `${(item as AlbumItem).album_type} • ${artists?.map((a) => a.name).join(", ") || "No artists"}`
        : `${(item as SongItem).album?.title || "No album"} • ${artists?.map((a) => a.name).join(", ") || "No artists"}`;
    const countBadge = isArtist
      ? {
          count: (item as ArtistItem).song_count || 0,
          label: "songs",
          color: "#1DB954",
        }
      : isAlbum
        ? {
            count: (item as AlbumItem).total_tracks || 0,
            label: "tracks",
            color: "#FFA500",
          }
        : null;

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: index % 2 === 0 ? "#1a1a1a" : "#121212",
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          <Image
            source={{ uri: imageUrl || "https://via.placeholder.com/50" }}
            style={{
              width: 50,
              height: 50,
              borderRadius: isArtist ? 25 : 4,
              marginRight: 12,
              backgroundColor: "#282828",
            }}
          />
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                }}
                numberOfLines={1}
              >
                {name}
              </Text>
              {countBadge && (
                <View
                  style={{
                    backgroundColor: countBadge.color,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#000000",
                      fontSize: 10,
                      fontFamily: "CircularStd",
                      fontWeight: "600",
                    }}
                  >
                    {countBadge.count} {countBadge.label}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={{
                color: "#B3B3B3",
                fontSize: 13,
                fontFamily: "CircularStd",
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>
          {isAlbum && (
            <TouchableOpacity
              onPress={() =>
                handleViewAlbumSongs(item.id, (item as AlbumItem).title)
              }
              style={{ padding: 8, marginRight: 4 }}
            >
              <Ionicons name="list" size={22} color="#1DB954" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleEdit(item)}
            style={{ padding: 8, marginRight: 8 }}
          >
            <Ionicons name="create-outline" size={22} color="#1DB954" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id, name)}
            style={{ padding: 8 }}
          >
            <Ionicons name="trash-outline" size={22} color="#E91429" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderListView = () => (
    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
      {/* Album Filter Chip - Only show in Songs tab when filter is active */}
      {activeTab === "song" && selectedAlbumFilter && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#1DB954",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 16,
          }}
        >
          <Ionicons
            name="filter"
            size={18}
            color="#000000"
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              flex: 1,
              color: "#000000",
              fontSize: 14,
              fontFamily: "CircularStd",
              fontWeight: "500",
            }}
            numberOfLines={1}
          >
            {albums.find((a) => a.id === selectedAlbumFilter)?.title ||
              "Filtered Album"}
          </Text>
          <TouchableOpacity
            onPress={handleClearAlbumFilter}
            style={{ padding: 4 }}
          >
            <Ionicons name="close-circle" size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      )}

      {/* Album Filter Dropdown - Only in Songs tab */}
      {activeTab === "song" && !selectedAlbumFilter && (
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              color: "#B3B3B3",
              fontSize: 13,
              fontFamily: "CircularStd",
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            Filter by Album
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[{ id: "all", title: "All Songs" }, ...albums].map((album) => {
                const isSelected =
                  selectedAlbumFilter === album.id ||
                  (album.id === "all" && !selectedAlbumFilter);
                return (
                  <TouchableOpacity
                    key={album.id}
                    onPress={() =>
                      album.id === "all"
                        ? setSelectedAlbumFilter(null)
                        : setSelectedAlbumFilter(album.id)
                    }
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: isSelected ? "#1DB954" : "#282828",
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      minWidth: 100,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#000000" : "#FFFFFF",
                        fontSize: 13,
                        fontFamily: "CircularStd",
                        fontWeight: isSelected ? "600" : "500",
                      }}
                      numberOfLines={1}
                    >
                      {album.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Search Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#282828",
          borderRadius: 8,
          paddingHorizontal: 16,
          marginBottom: 16,
          height: 48,
        }}
      >
        <Ionicons
          name="search"
          size={20}
          color="#B3B3B3"
          style={{ marginRight: 12 }}
        />
        <TextInput
          placeholder={`Search ${activeTab}s...`}
          placeholderTextColor="#7A7A7A"
          value={listSearchQuery}
          onChangeText={setListSearchQuery}
          style={{
            flex: 1,
            color: "#FFFFFF",
            fontSize: 15,
            fontFamily: "CircularStd",
            height: 48,
          }}
        />
        {listSearchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setListSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#7A7A7A" />
          </TouchableOpacity>
        )}
      </View>

      {/* Add Button */}
      {activeTab === "song" ? (
        // Two buttons for Songs tab: Create Manual and Upload Audio
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setEditingId(null);
              setFormData(INITIAL_FORM_DATA);
              setViewMode("form");
            }}
            activeOpacity={0.7}
            style={{
              flex: 1,
              backgroundColor: "#282828",
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="create" size={20} color="#FFFFFF" />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              Manual Entry
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setEditingId(null);
              setViewMode("audio-upload");
            }}
            activeOpacity={0.7}
            style={{
              flex: 1,
              backgroundColor: "#1DB954",
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="cloud-upload" size={20} color="#000000" />
            <Text
              style={{
                color: "#000000",
                fontSize: 14,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              Upload Audio
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setEditingId(null);
            setFormData(INITIAL_FORM_DATA);
            setViewMode("form");
          }}
          activeOpacity={0.7}
          style={{
            backgroundColor: "#1DB954",
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Ionicons name="add-circle" size={20} color="#000000" />
          <Text
            style={{
              color: "#000000",
              fontSize: 16,
              fontFamily: "CircularStd",
              fontWeight: "600",
            }}
          >
            Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </Text>
        </TouchableOpacity>
      )}

      {/* List */}
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator color="#1DB954" size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredListData}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                marginTop: 60,
              }}
            >
              <Ionicons name="musical-notes" size={60} color="#282828" />
              <Text
                style={{
                  color: "#7A7A7A",
                  fontSize: 16,
                  fontFamily: "CircularStd",
                  marginTop: 16,
                }}
              >
                No {activeTab}s found
              </Text>
            </View>
          }
        />
      )}
    </Animated.View>
  );

  const renderFormView = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setViewMode("list");
          setEditingId(null);
          setEditAudioFile(null);
          setFormData(INITIAL_FORM_DATA);
        }}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 20,
          paddingVertical: 8,
        }}
      >
        <Ionicons
          name="arrow-back"
          size={20}
          color="#B3B3B3"
          style={{ marginRight: 8 }}
        />
        <Text
          style={{ color: "#B3B3B3", fontSize: 14, fontFamily: "CircularStd" }}
        >
          Back to List
        </Text>
      </TouchableOpacity>

      {/* Form Title */}
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 20,
          fontFamily: "CircularStd",
          fontWeight: "600",
          marginBottom: 20,
        }}
      >
        {editingId ? "Edit" : "Create"}{" "}
        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
      </Text>

      {/* Form Fields */}
      {activeTab === "artist" && renderArtistForm()}
      {activeTab === "album" && renderAlbumForm()}
      {activeTab === "song" && renderSongForm()}

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.7}
        style={{
          backgroundColor: "#1DB954",
          paddingVertical: 16,
          borderRadius: 8,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          marginTop: 8,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#000000" size="small" />
        ) : (
          <>
            <Ionicons
              name={editingId ? "save" : "add-circle"}
              size={20}
              color="#000000"
            />
            <Text
              style={{
                color: "#000000",
                fontSize: 16,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              {editingId ? "Update" : "Create"}{" "}
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Cancel Button when editing */}
      {editingId && (
        <TouchableOpacity
          onPress={() => {
            setViewMode("list");
            setEditingId(null);
            setEditAudioFile(null);
            setFormData(INITIAL_FORM_DATA);
          }}
          activeOpacity={0.7}
          style={{
            backgroundColor: "#282828",
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 16,
              fontFamily: "CircularStd",
              fontWeight: "500",
            }}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#121212" }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#282828",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 22,
              fontWeight: "600",
              fontFamily: "CircularStd",
            }}
          >
            Admin Panel
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              color: "#B3B3B3",
              fontSize: 14,
              fontFamily: "CircularStd",
            }}
          >
            {viewMode === "list" 
              ? "View Mode" 
              : viewMode === "audio-upload"
              ? "Upload Mode"
              : "Edit Mode"}
          </Text>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: viewMode === "list" ? "#1DB954" : viewMode === "audio-upload" ? "#3B82F6" : "#FFA500",
            }}
          />
        </View>
      </View>

      {/* Tab Navigation */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          marginBottom: 24,
          gap: 12,
        }}
      >
        {[
          { key: "artist", label: "Artists", icon: "person" },
          { key: "album", label: "Albums", icon: "disc" },
          { key: "song", label: "Songs", icon: "musical-note" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => handleTabChange(tab.key as TabType)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                backgroundColor: isActive ? "#1DB954" : "#282828",
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={isActive ? "#000000" : "#FFFFFF"}
              />
              <Text
                style={{
                  color: isActive ? "#000000" : "#FFFFFF",
                  fontSize: 14,
                  fontFamily: "CircularStd",
                  fontWeight: isActive ? "600" : "500",
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {viewMode === "list" ? (
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            {renderListView()}
          </View>
        ) : viewMode === "audio-upload" ? (
          <View style={{ flex: 1 }}>
            <AudioUploadForm
              artists={artists}
              albums={albums}
              onSuccess={() => {
                setViewMode("list");
                fetchListData();
                toast.success("Song uploaded successfully!");
              }}
              onCancel={() => setViewMode("list")}
            />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 100,
            }}
          >
            {renderFormView()}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Delete Confirmation Dialog */}
      <BottomDialog
        visible={deleteDialogVisible}
        title="Confirm Delete"
        description={
          deleteItem
            ? `Are you sure you want to delete "${deleteItem.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        dismissLabel="Cancel"
        onConfirm={confirmDelete}
        onDismiss={() => {
          setDeleteDialogVisible(false);
          setDeleteItem(null);
        }}
      />

      {/* Quick Artist Creation Modal */}
      <ArtistCreationModal
        visible={artistModalVisible}
        onClose={() => setArtistModalVisible(false)}
        onArtistCreated={handleArtistCreated}
      />
    </SafeAreaView>
  );
}
