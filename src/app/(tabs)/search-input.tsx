import { supabase } from "@/lib/supabase";
import { Album, Artist, Song } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    BackHandler,
    FlatList,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ResultItem =
  | { kind: "header"; title: string; id: string }
  | { kind: "artist"; data: Artist; id: string }
  | { kind: "album"; data: Album; id: string }
  | { kind: "song"; data: Song; id: string };

function formatDuration(ms: number | null): string {
  if (!ms) return "";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Placeholder() {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 4,
        backgroundColor: "#2a2a2a",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name="musical-notes" size={20} color="#535353" />
    </View>
  );
}

export default function SearchInputScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [flatItems, setFlatItems] = useState<ResultItem[]>([]);

  // Only active when this screen is focused
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        router.navigate("/(tabs)/search" as any);
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  useEffect(() => {
    if (query.trim().length === 0) {
      setFlatItems([]);
      return;
    }

    const q = query.trim();
    const timer = setTimeout(async () => {
      setLoading(true);
      const [artistsRes, albumsRes, songsRes] = await Promise.all([
        supabase
          .from("artists")
          .select("id, slug, name, image_url")
          .ilike("name", `%${q}%`)
          .eq("is_active", true)
          .limit(5),
        supabase
          .from("albums")
          .select("id, title, artist_id, image_url, release_date")
          .ilike("title", `%${q}%`)
          .eq("is_active", true)
          .limit(5),
        supabase
          .from("songs")
          .select(
            "id, title, artist_id, album_id, duration_ms, image_url, audio_url",
          )
          .ilike("title", `%${q}%`)
          .eq("is_active", true)
          .limit(10),
      ]);

      const items: ResultItem[] = [];

      const artists: Artist[] = artistsRes.data ?? [];
      const albums: Album[] = albumsRes.data ?? [];
      const songs: Song[] = songsRes.data ?? [];

      if (artists.length > 0) {
        items.push({ kind: "header", title: "Artists", id: "h-artists" });
        artists.forEach((a) =>
          items.push({ kind: "artist", data: a, id: `artist-${a.id}` }),
        );
      }
      if (albums.length > 0) {
        items.push({ kind: "header", title: "Albums", id: "h-albums" });
        albums.forEach((a) =>
          items.push({ kind: "album", data: a, id: `album-${a.id}` }),
        );
      }
      if (songs.length > 0) {
        items.push({ kind: "header", title: "Songs", id: "h-songs" });
        songs.forEach((s) =>
          items.push({ kind: "song", data: s, id: `song-${s.id}` }),
        );
      }

      setFlatItems(items);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const isEmpty = query.trim().length === 0;
  const hasResults = flatItems.length > 0;

  const renderItem = ({ item }: { item: ResultItem }) => {
    if (item.kind === "header") {
      return (
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 8,
            backgroundColor: "#121212",
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {item.title}
          </Text>
        </View>
      );
    }

    if (item.kind === "artist") {
      const a = item.data;
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 10,
            gap: 14,
          }}
        >
          {a.image_url ? (
            <Image
              source={{ uri: a.image_url }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#2a2a2a",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person" size={22} color="#535353" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#ffffff",
                fontFamily: "CircularStd",
                fontSize: 15,
                fontWeight: "600",
              }}
              numberOfLines={1}
            >
              {a.name}
            </Text>
            <Text
              style={{
                color: "#a7a7a7",
                fontFamily: "CircularStd",
                fontSize: 12,
              }}
            >
              Artist
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.kind === "album") {
      const al = item.data;
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 10,
            gap: 14,
          }}
        >
          {al.image_url ? (
            <Image
              source={{ uri: al.image_url }}
              style={{ width: 44, height: 44, borderRadius: 4 }}
              resizeMode="cover"
            />
          ) : (
            <Placeholder />
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#ffffff",
                fontFamily: "CircularStd",
                fontSize: 15,
                fontWeight: "600",
              }}
              numberOfLines={1}
            >
              {al.title}
            </Text>
            <Text
              style={{
                color: "#a7a7a7",
                fontFamily: "CircularStd",
                fontSize: 12,
              }}
            >
              Album
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // song
    const s = item.data;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 10,
          gap: 14,
        }}
      >
        {s.image_url ? (
          <Image
            source={{ uri: s.image_url }}
            style={{ width: 44, height: 44, borderRadius: 4 }}
            resizeMode="cover"
          />
        ) : (
          <Placeholder />
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 15,
              fontWeight: "600",
            }}
            numberOfLines={1}
          >
            {s.title}
          </Text>
          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 12,
            }}
          >
            Song
          </Text>
        </View>
        {s.duration_ms && (
          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 12,
            }}
          >
            {formatDuration(s.duration_ms)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

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
          backgroundColor: "#2a2a2a",
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.navigate("/(tabs)/search" as any)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          autoFocus
          placeholder="What do you want to listen to?"
          placeholderTextColor="#777777"
          value={query}
          onChangeText={setQuery}
          style={{
            flex: 1,
            color: "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 16,
            padding: 0,
          }}
          selectionColor="#1DB954"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {loading ? (
          <ActivityIndicator size="small" color="#1DB954" />
        ) : query.length > 0 ? (
          <TouchableOpacity
            onPress={() => setQuery("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={20} color="#777777" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Empty state */}
      {isEmpty ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 22,
              fontWeight: "600",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Play what you love
          </Text>
          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 14,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Search for artists, songs, podcasts, and more.
          </Text>
        </View>
      ) : !hasResults && !loading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 15,
              textAlign: "center",
            }}
          >
            No results for "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={flatItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
    </SafeAreaView>
  );
}
