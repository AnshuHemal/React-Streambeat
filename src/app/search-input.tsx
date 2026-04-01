import { supabase } from "@/lib/supabase";
import { Album, Artist } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    BackHandler,
    FlatList,
    Image,
    Keyboard,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ResultItem =
  | { kind: "suggestion"; title: string; id: string }
  | { kind: "header"; title: string; id: string }
  | { kind: "artist"; data: Artist; id: string }
  | { kind: "album"; data: Album & { artist_name?: string }; id: string };

export default function SearchInputScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [flatItems, setFlatItems] = useState<ResultItem[]>([]);

  // Only active when this screen is focused
  useFocusEffect(
    useCallback(() => {
      // Reset search when screen comes into focus
      setQuery("");
      setFlatItems([]);

      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        router.back();
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  useEffect(() => {
    if (query.trim().length < 2) {
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
          .select(
            `id, title, album_type, artist_id, image_url, release_date,
            album_artists!inner(artists(id, name, slug, image_url))`,
          )
          .ilike("title", `%${q}%`)
          .eq("is_active", true)
          .limit(10),
        supabase
          .from("songs")
          .select(
            "id, title, artist_id, album_id, duration_ms, image_url, audio_url, artists(name)",
          )
          .ilike("title", `%${q}%`)
          .eq("is_active", true)
          .limit(10),
      ]);

      const items: ResultItem[] = [];

      const artists: Artist[] = artistsRes.data ?? [];
      const albums: any[] = albumsRes.data ?? [];
      const songs = songsRes.data ?? [];

      if (artists.length > 0) {
        artists.forEach((a) =>
          items.push({ kind: "artist", data: a, id: `artist-${a.id}` }),
        );
      }
      if (albums.length > 0) {
        albums.forEach((a) =>
          items.push({
            kind: "album",
            data: {
              ...a,
              artist_name: Array.isArray(a.album_artists)
                ? a.album_artists
                    .map((aa: any) => {
                      const artist = Array.isArray(aa.artists)
                        ? aa.artists[0]
                        : aa.artists;
                      return artist?.name;
                    })
                    .filter(Boolean)
                    .join(", ")
                : "",
              artist:
                Array.isArray(a.album_artists) && a.album_artists.length > 0
                  ? {
                      id: (() => {
                        const artist = Array.isArray(a.album_artists[0].artists)
                          ? a.album_artists[0].artists[0]
                          : a.album_artists[0].artists;
                        return artist?.id || "";
                      })(),
                      name: (() => {
                        const artist = Array.isArray(a.album_artists[0].artists)
                          ? a.album_artists[0].artists[0]
                          : a.album_artists[0].artists;
                        return artist?.name || "";
                      })(),
                      slug: (() => {
                        const artist = Array.isArray(a.album_artists[0].artists)
                          ? a.album_artists[0].artists[0]
                          : a.album_artists[0].artists;
                        return artist?.slug || "";
                      })(),
                      image_url: (() => {
                        const artist = Array.isArray(a.album_artists[0].artists)
                          ? a.album_artists[0].artists[0]
                          : a.album_artists[0].artists;
                        return artist?.image_url || null;
                      })(),
                    }
                  : { id: "", name: "", slug: "", image_url: null },
            },
            id: `album-${a.id}`,
          }),
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
    if (item.kind === "suggestion") {
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setQuery(item.title)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 12,
            gap: 12,
          }}
        >
          <Ionicons name="search" size={20} color="#a7a7a7" />
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 15,
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </TouchableOpacity>
      );
    }

    if (item.kind === "header") {
      return (
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 14,
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
            paddingVertical: 8,
            gap: 12,
          }}
        >
          {a.image_url ? (
            <Image
              source={{ uri: a.image_url }}
              style={{ width: 48, height: 48, borderRadius: 24 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#2a2a2a",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person" size={24} color="#535353" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
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
            </View>
            <Text
              style={{
                color: "#a7a7a7",
                fontFamily: "CircularStd",
                fontSize: 13,
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
      const albumType =
        (al.album_type || "Album").charAt(0).toUpperCase() +
        (al.album_type || "Album").slice(1);
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Keyboard.dismiss();
            router.push(`/album/${al.id}` as any);
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 10,
            gap: 16,
          }}
        >
          {al.image_url ? (
            <Image
              source={{ uri: al.image_url }}
              style={{ width: 48, height: 48, borderRadius: 4 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 4,
                backgroundColor: "#2a2a2a",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="disc" size={28} color="#535353" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#ffffff",
                fontFamily: "CircularStd",
                fontSize: 16,
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
                marginTop: 8,
              }}
              numberOfLines={1}
            >
              {albumType}
              {al.artist_name ? ` • ${al.artist_name}` : ""}
            </Text>
          </View>
          <Image
            source={require("@/assets/images/ico-32-plus-circle.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      );
    }

    // Default fallback - should not reach here
    return null;
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
          onPress={() => router.back()}
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
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
        />
      )}
    </SafeAreaView>
  );
}
