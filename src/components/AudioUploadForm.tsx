import { supabase } from "@/lib/supabase";
import { CreditDraft, saveSongCredits, SourceDraft } from "@/services/credits";
import { fetchLyricsFromLrclib } from "@/services/lyrics";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";
import {
  AudioUploadResult,
  generateAudioQualityUrls,
  uploadAudioToCloudinary,
} from "../services/cloudinary";
import CreditsEditor from "./CreditsEditor";
import LoadingDots from "./LoadingDots";

interface Artist {
  id: string;
  name: string;
}

interface Album {
  id: string;
  title: string;
}

interface AudioUploadFormProps {
  artists: Artist[];
  albums: Album[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface SongFormData {
  title: string;
  artist_ids: string[];
  primary_artist_id: string;
  album_id: string;
  track_number: string;
  disc_number: string;
  explicit: boolean;
  image_url: string;
  lyrics: string;
}

export default function AudioUploadForm({
  artists,
  albums,
  onSuccess,
  onCancel,
}: AudioUploadFormProps) {
  const [formData, setFormData] = useState<SongFormData>({
    title: "",
    artist_ids: [],
    primary_artist_id: "",
    album_id: "",
    track_number: "",
    disc_number: "1",
    explicit: false,
    image_url: "",
    lyrics: "",
  });

  const [credits, setCredits] = useState<CreditDraft[]>([]);
  const [sources, setSources] = useState<SourceDraft[]>([]);
  const [fetchingLyrics, setFetchingLyrics] = useState(false);

  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size: number;
  } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [artistSearchQuery, setArtistSearchQuery] = useState("");
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);

  const filteredArtists = artistSearchQuery.trim()
    ? artists.filter((a) =>
        a.name.toLowerCase().includes(artistSearchQuery.toLowerCase()),
      )
    : artists;

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/aac"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile({
          uri: file.uri,
          name: file.name,
          size: file.size || 0,
        });
        toast.success("Audio file selected", {
          description: file.name,
        });
      }
    } catch (error) {
      toast.error("Failed to pick file");
    }
  };

  const toggleArtistSelection = (artistId: string) => {
    setFormData((prev) => {
      const currentIds = prev.artist_ids;
      const isSelected = currentIds.includes(artistId);
      let newIds: string[];
      let newPrimaryId = prev.primary_artist_id;

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
        artist_ids: newIds,
        primary_artist_id: newPrimaryId,
      };
    });
  };

  const removeArtist = (artistId: string) => {
    setFormData((prev) => {
      const newIds = prev.artist_ids.filter((id) => id !== artistId);
      const newPrimaryId =
        prev.primary_artist_id === artistId
          ? newIds[0] || ""
          : prev.primary_artist_id;
      return {
        ...prev,
        artist_ids: newIds,
        primary_artist_id: newPrimaryId,
      };
    });
  };

  const handleAutoFetchLyrics = async () => {
    if (!formData.title.trim()) {
      toast.error("Enter a song title first");
      return;
    }
    const artistName = formData.artist_ids
      .map((id) => artists.find((a) => a.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    if (!artistName) {
      toast.error("Select at least one artist first");
      return;
    }
    setFetchingLyrics(true);
    try {
      const lrc = await fetchLyricsFromLrclib({
        trackName: formData.title.trim(),
        artistName,
      });
      if (lrc) {
        setFormData((prev) => ({ ...prev, lyrics: lrc }));
        toast.success("Lyrics fetched from LRCLIB");
      } else {
        toast.info("No lyrics found on LRCLIB");
      }
    } catch {
      toast.error("Failed to fetch lyrics");
    } finally {
      setFetchingLyrics(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Song title is required");
      return;
    }

    if (formData.artist_ids.length === 0) {
      toast.error("Please select at least one artist");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select an audio file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload to Cloudinary
      toast.info("Uploading audio to Cloudinary...");
      const uploadResult: AudioUploadResult = await uploadAudioToCloudinary(
        selectedFile.uri,
        {
          title: formData.title,
          artist_id: formData.primary_artist_id || formData.artist_ids[0],
          album_id: formData.album_id || undefined,
        },
      );

      setUploadProgress(50);

      // Generate quality URLs
      const qualityUrls = generateAudioQualityUrls(uploadResult.public_id);

      // Insert into database
      const primaryArtistId =
        formData.primary_artist_id || formData.artist_ids[0];

      const insertData = {
        title: formData.title.trim(),
        artist_id: primaryArtistId,
        album_id: formData.album_id || null,
        duration_ms: Math.round(uploadResult.duration * 1000),
        track_number: parseInt(formData.track_number) || null,
        disc_number: parseInt(formData.disc_number) || 1,
        explicit: formData.explicit,
        image_url: formData.image_url.trim() || null,
        is_active: true,
        lyrics: formData.lyrics.trim() || null,
        // Cloudinary data
        cloudinary_public_id: uploadResult.public_id,
        audio_url: qualityUrls.medium,
        preview_url: qualityUrls.preview,
        quality_urls: {
          medium: qualityUrls.medium,
          high: qualityUrls.high,
          preview: qualityUrls.preview,
        },
      };

      const { data: songData, error: insertError } = await supabase
        .from("songs")
        .insert(insertData)
        .select("id")
        .single();

      if (insertError) throw insertError;

      setUploadProgress(75);

      // Insert into song_artists junction table
      if (songData) {
        const songArtists = formData.artist_ids.map((id, i) => ({
          song_id: songData.id,
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
      }

      setUploadProgress(90);

      // Save credits if any were added
      if (songData && (credits.length > 0 || sources.length > 0)) {
        try {
          await saveSongCredits(songData.id, credits, sources);
        } catch (creditsErr: any) {
          toast.warning("Song saved but credits failed", {
            description: creditsErr.message,
          });
        }
      }

      setUploadProgress(100);

      // Update album track count if album selected
      if (formData.album_id) {
        await updateAlbumTrackCount(formData.album_id);
      }

      toast.success("Song uploaded successfully!", {
        description: `${formData.title} - Medium (192kbps) + High (320kbps) versions created`,
      });

      onSuccess();
    } catch (error: any) {
      toast.error("Failed to upload song", {
        description: error.message || "Unknown error",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const updateAlbumTrackCount = async (albumId: string) => {
    try {
      const { count } = await supabase
        .from("songs")
        .select("*", { count: "exact", head: true })
        .eq("album_id", albumId);

      await supabase
        .from("albums")
        .update({ total_tracks: count || 0 })
        .eq("id", albumId);
    } catch (err) {}
  };

  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: keyof typeof Ionicons.glyphMap,
    keyboardType: "default" | "number-pad" = "default",
  ) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#282828",
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 12,
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color="#B3B3B3"
        style={{ marginRight: 12 }}
      />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#7A7A7A"
        value={value}
        onChangeText={onChangeText}
        style={{
          flex: 1,
          color: "#FFFFFF",
          fontSize: 15,
          fontFamily: "CircularStd",
        }}
        keyboardType={keyboardType}
        autoCapitalize="sentences"
        selectionColor="#1DB954"
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: "#121212" }}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#1DB954",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="musical-note" size={22} color="#000000" />
            </View>
            <View>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 20,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                }}
              >
                Upload Song
              </Text>
              <Text
                style={{
                  color: "#B3B3B3",
                  fontSize: 13,
                  fontFamily: "CircularStd",
                  marginTop: 2,
                }}
              >
                Audio file + Metadata
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#B3B3B3" />
          </TouchableOpacity>
        </View>

        {/* Audio File Picker */}
        <TouchableOpacity
          onPress={pickAudioFile}
          disabled={uploading}
          style={{
            backgroundColor: selectedFile ? "#1a3a1a" : "#2a2a2a",
            borderWidth: 2,
            borderColor: selectedFile ? "#1DB954" : "#3a3a3a",
            borderStyle: "dashed",
            borderRadius: 12,
            padding: 20,
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Ionicons
            name={selectedFile ? "checkmark-circle" : "cloud-upload"}
            size={32}
            color={selectedFile ? "#1DB954" : "#B3B3B3"}
          />
          <Text
            style={{
              color: selectedFile ? "#1DB954" : "#FFFFFF",
              fontSize: 16,
              fontFamily: "CircularStd",
              fontWeight: "600",
              marginTop: 8,
            }}
          >
            {selectedFile ? selectedFile.name : "Select MP3 Audio File"}
          </Text>
          <Text
            style={{
              color: "#7A7A7A",
              fontSize: 12,
              fontFamily: "CircularStd",
              marginTop: 4,
            }}
          >
            {selectedFile
              ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
              : "Supports: MP3, WAV, AAC"}
          </Text>
        </TouchableOpacity>

        {/* Song Title */}
        {renderInput(
          "Song Title *",
          formData.title,
          (text) => setFormData((prev) => ({ ...prev, title: text })),
          "musical-note",
        )}

        {/* Artists Selection */}
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
            Artists *
          </Text>

          {/* Selected Artists */}
          {formData.artist_ids.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {formData.artist_ids.map((id) => {
                const artist = artists.find((a) => a.id === id);
                if (!artist) return null;
                const isPrimary = formData.primary_artist_id === id;
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => removeArtist(id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isPrimary ? "#1DB954" : "#2a2a2a",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      gap: 6,
                    }}
                  >
                    <Text
                      style={{
                        color: isPrimary ? "#000000" : "#FFFFFF",
                        fontSize: 13,
                        fontFamily: "CircularStd",
                      }}
                    >
                      {artist.name} {isPrimary && "(Primary)"}
                    </Text>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={isPrimary ? "#000000" : "#B3B3B3"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Artist Search */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#282828",
              borderRadius: 8,
              paddingHorizontal: 12,
              height: 44,
            }}
          >
            <Ionicons name="search" size={18} color="#B3B3B3" />
            <TextInput
              placeholder="Search artists..."
              placeholderTextColor="#7A7A7A"
              value={artistSearchQuery}
              onChangeText={setArtistSearchQuery}
              onFocus={() => setShowArtistDropdown(true)}
              style={{
                flex: 1,
                color: "#FFFFFF",
                fontSize: 14,
                fontFamily: "CircularStd",
                marginLeft: 8,
              }}
            />
            {artistSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setArtistSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color="#B3B3B3" />
              </TouchableOpacity>
            )}
          </View>

          {/* Artist Dropdown */}
          {showArtistDropdown && filteredArtists.length > 0 && (
            <View
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: 8,
                marginTop: 8,
                maxHeight: 200,
                borderWidth: 1,
                borderColor: "#333333",
              }}
            >
              <ScrollView>
                {filteredArtists.slice(0, 10).map((artist) => {
                  const isSelected = formData.artist_ids.includes(artist.id);
                  return (
                    <TouchableOpacity
                      key={artist.id}
                      onPress={() => {
                        toggleArtistSelection(artist.id);
                        setArtistSearchQuery("");
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: "#2a2a2a",
                        backgroundColor: isSelected ? "#1a3a1a" : "transparent",
                      }}
                    >
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "person"}
                        size={18}
                        color={isSelected ? "#1DB954" : "#B3B3B3"}
                        style={{ marginRight: 10 }}
                      />
                      <Text
                        style={{
                          color: isSelected ? "#1DB954" : "#FFFFFF",
                          fontSize: 14,
                          fontFamily: "CircularStd",
                          flex: 1,
                        }}
                      >
                        {artist.name}
                      </Text>
                      {isSelected && (
                        <Text
                          style={{
                            color: "#1DB954",
                            fontSize: 12,
                            fontFamily: "CircularStd",
                          }}
                        >
                          Selected
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Album Selection */}
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
            Album (Optional)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <TouchableOpacity
              onPress={() => setFormData((prev) => ({ ...prev, album_id: "" }))}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 16,
                backgroundColor:
                  formData.album_id === "" ? "#1DB954" : "#2a2a2a",
              }}
            >
              <Text
                style={{
                  color: formData.album_id === "" ? "#000000" : "#FFFFFF",
                  fontSize: 13,
                  fontFamily: "CircularStd",
                }}
              >
                No Album
              </Text>
            </TouchableOpacity>
            {albums.map((album) => (
              <TouchableOpacity
                key={album.id}
                onPress={() =>
                  setFormData((prev) => ({ ...prev, album_id: album.id }))
                }
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor:
                    formData.album_id === album.id ? "#1DB954" : "#2a2a2a",
                }}
              >
                <Text
                  style={{
                    color:
                      formData.album_id === album.id ? "#000000" : "#FFFFFF",
                    fontSize: 13,
                    fontFamily: "CircularStd",
                  }}
                  numberOfLines={1}
                >
                  {album.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Track Number & Disc Number */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            {renderInput(
              "Track #",
              formData.track_number,
              (text) =>
                setFormData((prev) => ({ ...prev, track_number: text })),
              "list",
              "number-pad",
            )}
          </View>
          <View style={{ flex: 1 }}>
            {renderInput(
              "Disc #",
              formData.disc_number,
              (text) => setFormData((prev) => ({ ...prev, disc_number: text })),
              "disc",
              "number-pad",
            )}
          </View>
        </View>

        {/* Song Cover Image URL */}
        {renderInput(
          "Cover Image URL (Optional)",
          formData.image_url,
          (text) => setFormData((prev) => ({ ...prev, image_url: text })),
          "image",
        )}

        {/* Credits */}
        <CreditsEditor
          credits={credits}
          onCreditsChange={setCredits}
          sources={sources}
          onSourcesChange={setSources}
          artists={artists}
        />

        {/* Lyrics */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ionicons
                name="musical-notes-outline"
                size={16}
                color="#1DB954"
              />
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                }}
              >
                Synced Lyrics (LRC)
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              {formData.lyrics.trim().length > 0 && (
                <TouchableOpacity
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, lyrics: "" }))
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#7A7A7A" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleAutoFetchLyrics}
                disabled={fetchingLyrics}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "#1a3a1a",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#1DB954",
                }}
              >
                {fetchingLyrics ? (
                  <ActivityIndicator size="small" color="#1DB954" />
                ) : (
                  <Ionicons
                    name="cloud-download-outline"
                    size={14}
                    color="#1DB954"
                  />
                )}
                <Text
                  style={{
                    color: "#1DB954",
                    fontSize: 12,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                  }}
                >
                  {fetchingLyrics ? "Fetching..." : "Auto-fetch"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#282828",
              borderRadius: 8,
              padding: 14,
              borderWidth: formData.lyrics.trim() ? 1 : 0,
              borderColor: "#1DB954",
            }}
          >
            <TextInput
              placeholder={`[00:12.50] First lyric line\n[00:15.80] Second lyric line\n[00:19.20] ...`}
              placeholderTextColor="#4a4a4a"
              value={formData.lyrics}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, lyrics: text }))
              }
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              style={{
                color: "#FFFFFF",
                fontSize: 13,
                fontFamily: "CircularStd",
                minHeight: 140,
                lineHeight: 20,
              }}
            />
          </View>
          <Text
            style={{
              color: "#535353",
              fontSize: 11,
              fontFamily: "CircularStd",
              marginTop: 6,
            }}
          >
            Paste LRC format or tap "Auto-fetch" to search LRCLIB.
          </Text>
        </View>

        {/* Explicit Toggle */}
        <TouchableOpacity
          onPress={() =>
            setFormData((prev) => ({ ...prev, explicit: !prev.explicit }))
          }
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#282828",
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ionicons name="warning" size={18} color="#B3B3B3" />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                fontFamily: "CircularStd",
              }}
            >
              Explicit Content
            </Text>
          </View>
          <View
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              backgroundColor: formData.explicit ? "#1DB954" : "#3a3a3a",
              padding: 2,
              justifyContent: "center",
              alignItems: formData.explicit ? "flex-end" : "flex-start",
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "#FFFFFF",
              }}
            />
          </View>
        </TouchableOpacity>

        {/* Quality Info */}
        <View
          style={{
            backgroundColor: "#1a1a1a",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontFamily: "CircularStd",
              fontWeight: "600",
              marginBottom: 12,
            }}
          >
            Audio Quality Tiers
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {[
              {
                label: "Medium",
                kbps: "192kbps",
                desc: "Regular",
                color: "#1DB954",
                flex: 1,
              },
              {
                label: "High",
                kbps: "320kbps",
                desc: "Premium",
                color: "#535353",
                flex: 1,
              },
            ].map((quality) => (
              <View
                key={quality.label}
                style={{
                  flex: quality.flex,
                  backgroundColor: quality.color,
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: quality.label === "Medium" ? "#000000" : "#FFFFFF",
                    fontSize: 14,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                  }}
                >
                  {quality.label}
                </Text>
                <Text
                  style={{
                    color: quality.label === "Medium" ? "#000000" : "#B3B3B3",
                    fontSize: 12,
                    fontFamily: "CircularStd",
                    marginTop: 2,
                  }}
                >
                  {quality.kbps}
                </Text>
                <Text
                  style={{
                    color: quality.label === "Medium" ? "#1a5c30" : "#888888",
                    fontSize: 10,
                    fontFamily: "CircularStd",
                    marginTop: 4,
                  }}
                >
                  {quality.desc}
                </Text>
              </View>
            ))}
          </View>
          <Text
            style={{
              color: "#7A7A7A",
              fontSize: 11,
              fontFamily: "CircularStd",
              marginTop: 12,
              textAlign: "center",
            }}
          >
            Regular users: Medium (192kbps) | Premium users: High (320kbps)
          </Text>
        </View>

        {/* Upload Progress */}
        {uploading && (
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                height: 4,
                backgroundColor: "#2a2a2a",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${uploadProgress}%`,
                  height: "100%",
                  backgroundColor: "#1DB954",
                  borderRadius: 2,
                }}
              />
            </View>
            <Text
              style={{
                color: "#B3B3B3",
                fontSize: 12,
                fontFamily: "CircularStd",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Uploading... {uploadProgress}%
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={uploading}
          style={{
            backgroundColor: "#1DB954",
            borderRadius: 50,
            paddingVertical: 16,
            alignItems: "center",
            opacity: uploading ? 0.6 : 1,
          }}
        >
          {uploading ? (
            <LoadingDots inline color="#000000" />
          ) : (
            <Text
              style={{
                color: "#000000",
                fontSize: 16,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              Upload Song
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
