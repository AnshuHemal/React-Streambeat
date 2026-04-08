import { RecentSearchRow } from "@/components/search/RecentSearchRow";
import { SearchAlbumRow } from "@/components/search/SearchAlbumRow";
import { SearchArtistRow } from "@/components/search/SearchArtistRow";
import { SearchSongRow } from "@/components/search/SearchSongRow";
import { SuggestionRow } from "@/components/search/SuggestionRow";
import { TrendingRow } from "@/components/search/TrendingRow";
import SongOptionsSheet from "@/components/SongOptionsSheet";
import { useMusicPlayer } from "@/context/MusicPlayerContext";
import { usePlayHistoryContext } from "@/context/PlayHistoryContext";
import { useFuzzySpellSuggest } from "@/hooks/useFuzzySpellSuggest";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useSearch } from "@/hooks/useSearch";
import { useSuggestions } from "@/hooks/useSuggestions";
import { useTrendingSearches } from "@/hooks/useTrendingSearches";
import {
  RecentSearchEntry,
  SearchResultItem,
  SearchSong,
  Suggestion,
  TrendingSearch,
} from "@/types/search";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 28,
        paddingBottom: 8,
      }}
    >
      <Text
        style={{
          color: "#ffffff",
          fontFamily: "CircularStd",
          fontSize: 18,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
      {action && onAction && (
        <TouchableOpacity
          onPress={onAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 13,
            }}
          >
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function SearchInputScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");

  // useSearch is driven directly by query — results load as you type
  const { artistPlayCounts } = usePlayHistoryContext();
  const {
    results,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    hasPartialResults,
    isNetworkError,
  } = useSearch(query, { artistPlayCounts });

  // Suggestions fire on every keystroke (100ms debounce inside useSuggestions)
  const { suggestions } = useSuggestions(query);

  const { isOnline, retry } = useNetworkStatus();
  const { playSong, setQueue, currentSong } = useMusicPlayer();
  const { recents, addRecent, removeRecent, clearRecents } =
    useRecentSearches();
  const { trending } = useTrendingSearches();
  const { suggestion: didYouMean } = useFuzzySpellSuggest(
    query,
    results.length > 0,
  );

  const [selectedSong, setSelectedSong] = useState<SearchSong | null>(null);

  useFocusEffect(
    useCallback(() => {
      setQuery("");
      setSelectedSong(null);
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        router.back();
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  // ── Fill input from suggestion (keeps keyboard open) ──────────────────────
  const handleSuggestionPress = useCallback((s: Suggestion) => {
    setQuery(s.text);
    Keyboard.dismiss();
  }, []);

  // ── Song play helper ───────────────────────────────────────────────────────
  const playSongItem = useCallback(
    (song: SearchSong, allSongs: SearchSong[]) => {
      const idx = allSongs.findIndex((s) => s.id === song.id);
      const queue = allSongs.map((s) => ({
        id: s.id,
        title: s.title,
        image_url: s.image_url,
        audio_url: s.audio_url,
        preview_url: s.preview_url,
        duration_ms: s.duration_ms,
        artist_name: s.artist_name,
        artists: s.artists,
        album_title: s.album_title ?? undefined,
      }));
      setQueue(queue, idx >= 0 ? idx : 0);
      playSong(queue[idx >= 0 ? idx : 0] as any);
    },
    [playSong, setQueue],
  );

  // ── Result handlers ────────────────────────────────────────────────────────
  const handleSongPress = useCallback(
    (item: SearchResultItem & { kind: "song" }) => {
      Keyboard.dismiss();
      addRecent({ kind: "song", data: item.data });
      const songItems = (
        results.filter((r) => r.kind === "song") as (SearchResultItem & {
          kind: "song";
        })[]
      ).map((s) => s.data);
      playSongItem(item.data, songItems);
    },
    [results, playSongItem, addRecent],
  );

  const handleArtistPress = useCallback(
    (item: SearchResultItem & { kind: "artist" }) => {
      Keyboard.dismiss();
      addRecent({ kind: "artist", data: item.data });
      router.push(`/artist/${item.data.id}` as any);
    },
    [router, addRecent],
  );

  const handleAlbumPress = useCallback(
    (item: SearchResultItem & { kind: "album" }) => {
      Keyboard.dismiss();
      addRecent({ kind: "album", data: item.data });
      router.push(`/album/${item.data.id}` as any);
    },
    [router, addRecent],
  );

  // ── Recent handlers ────────────────────────────────────────────────────────
  const handleRecentPress = useCallback(
    (entry: RecentSearchEntry) => {
      Keyboard.dismiss();
      addRecent({ kind: entry.kind, data: entry.data } as any);
      if (entry.kind === "song") {
        playSongItem(entry.data, [entry.data]);
      } else if (entry.kind === "artist") {
        router.push(`/artist/${entry.data.id}` as any);
      } else {
        router.push(`/album/${entry.data.id}` as any);
      }
    },
    [addRecent, playSongItem, router],
  );

  const handleRecentAdd = useCallback(
    (entry: RecentSearchEntry) => {
      if (entry.kind === "song") setSelectedSong(entry.data);
      else if (entry.kind === "artist")
        router.push(`/artist/${entry.data.id}` as any);
      else router.push(`/album/${entry.data.id}` as any);
    },
    [router],
  );

  // ── Trending handler ───────────────────────────────────────────────────────
  const handleTrendingPress = useCallback((t: TrendingSearch) => {
    setQuery(t.query);
    Keyboard.dismiss();
  }, []);

  // ── Render result row ──────────────────────────────────────────────────────
  const renderResult = ({ item }: { item: SearchResultItem }) => {
    if (item.kind === "song") {
      return (
        <SearchSongRow
          song={item.data}
          isActive={currentSong?.id === item.data.id}
          onPress={() => handleSongPress(item)}
          onOptionsPress={() => setSelectedSong(item.data)}
        />
      );
    }
    if (item.kind === "artist") {
      return (
        <SearchArtistRow
          artist={item.data}
          onPress={() => handleArtistPress(item)}
        />
      );
    }
    if (item.kind === "album") {
      return (
        <SearchAlbumRow
          album={item.data}
          onPress={() => handleAlbumPress(item)}
        />
      );
    }
    return null;
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const trimmed = query.trim();
  const isIdle = trimmed.length === 0;
  const isSearching = trimmed.length >= 2;
  const hasResults = results.length > 0;
  const hasRecents = recents.length > 0;
  const hasTrending = trending.length > 0;
  const showIdleContent = isIdle && (hasRecents || hasTrending);

  // Suggestions header — shown above results while typing
  const suggestionsHeader =
    isSearching && suggestions.length > 0 ? (
      <>
        <View
          style={{ height: 1, backgroundColor: "#2a2a2a", marginBottom: 4 }}
        />
        {suggestions.map((s) => (
          <SuggestionRow
            key={s.id}
            suggestion={s}
            query={query}
            onPress={() => handleSuggestionPress(s)}
          />
        ))}
        {hasResults && (
          <View
            style={{
              height: 1,
              backgroundColor: "#2a2a2a",
              marginTop: 4,
              marginBottom: 4,
            }}
          />
        )}
      </>
    ) : null;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#121212" }}
      edges={["top"]}
    >
      {/* ── Search bar ── */}
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
          onSubmitEditing={() => Keyboard.dismiss()}
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

        {loading && !hasResults ? (
          <ActivityIndicator size="small" color="#1DB954" />
        ) : query.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={20} color="#777777" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Content ── */}
      {isSearching ? (
        /* ── Searching: suggestions header + results ── */
        !hasResults && !loading ? (
          /* No results state */
          <View style={{ flex: 1 }}>
            {/* Still show suggestions even when no results */}
            {suggestions.length > 0 && (
              <>
                <View style={{ height: 1, backgroundColor: "#2a2a2a" }} />
                {suggestions.map((s) => (
                  <SuggestionRow
                    key={s.id}
                    suggestion={s}
                    query={query}
                    onPress={() => handleSuggestionPress(s)}
                  />
                ))}
              </>
            )}
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 40,
              }}
            >
              {!isOnline || isNetworkError ? (
                <>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={56}
                    color="#535353"
                    style={{ marginBottom: 16 }}
                  />
                  <Text
                    style={{
                      color: "#ffffff",
                      fontFamily: "CircularStd",
                      fontSize: 18,
                      fontWeight: "600",
                      textAlign: "center",
                      marginBottom: 8,
                    }}
                  >
                    You're offline
                  </Text>
                  <Text
                    style={{
                      color: "#a7a7a7",
                      fontFamily: "CircularStd",
                      fontSize: 14,
                      textAlign: "center",
                      lineHeight: 20,
                      marginBottom: 24,
                    }}
                  >
                    Check your connection and try again.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      retry();
                      const q = query;
                      setQuery("");
                      setTimeout(() => setQuery(q), 50);
                    }}
                    style={{
                      backgroundColor: "#ffffff",
                      paddingHorizontal: 28,
                      paddingVertical: 12,
                      borderRadius: 24,
                    }}
                  >
                    <Text
                      style={{
                        color: "#121212",
                        fontFamily: "CircularStd",
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      Retry
                    </Text>
                  </TouchableOpacity>
                </>
              ) : didYouMean ? (
                <>
                  <Ionicons
                    name="search-outline"
                    size={52}
                    color="#535353"
                    style={{ marginBottom: 16 }}
                  />
                  <Text
                    style={{
                      color: "#a7a7a7",
                      fontFamily: "CircularStd",
                      fontSize: 15,
                      textAlign: "center",
                      marginBottom: 12,
                    }}
                  >
                    No results for "{query}"
                  </Text>
                  <TouchableOpacity
                    onPress={() => setQuery(didYouMean)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontFamily: "CircularStd",
                        fontSize: 15,
                        textAlign: "center",
                      }}
                    >
                      Did you mean{" "}
                      <Text
                        style={{
                          color: "#1DB954",
                          fontWeight: "600",
                          textDecorationLine: "underline",
                        }}
                      >
                        {didYouMean}
                      </Text>
                      ?
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Ionicons
                    name="search-outline"
                    size={52}
                    color="#535353"
                    style={{ marginBottom: 16 }}
                  />
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
                </>
              )}
            </View>
          </View>
        ) : (
          /* Results list with suggestions pinned above */
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderResult}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            onEndReached={() => {
              if (hasMore && !loadingMore) loadMore();
            }}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={
              <>
                {suggestionsHeader}
                {hasPartialResults && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginHorizontal: 16,
                      marginVertical: 8,
                      backgroundColor: "#1a1a1a",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Ionicons
                      name="warning-outline"
                      size={16}
                      color="#f59e0b"
                    />
                    <Text
                      style={{
                        color: "#a7a7a7",
                        fontFamily: "CircularStd",
                        fontSize: 12,
                        flex: 1,
                      }}
                    >
                      Some results couldn't load. Showing partial results.
                    </Text>
                  </View>
                )}
              </>
            }
            ListFooterComponent={
              loadingMore && hasResults ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  {/* <ActivityIndicator size="small" color="#1DB954" /> */}
                </View>
              ) : null
            }
          />
        )
      ) : showIdleContent ? (
        /* ── Idle: Recents + Trending ── */
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {hasRecents && (
            <>
              <SectionHeader
                title="Recents"
                action="Clear all"
                onAction={clearRecents}
              />
              {recents.map((entry) => (
                <RecentSearchRow
                  key={`${entry.kind}-${entry.data.id}-${entry.timestamp}`}
                  entry={entry}
                  onPress={() => handleRecentPress(entry)}
                  onAdd={() => handleRecentAdd(entry)}
                  onRemove={() => removeRecent(entry)}
                />
              ))}
            </>
          )}
          {hasTrending && (
            <>
              <SectionHeader title="Trending" />
              {trending.map((t, i) => (
                <TrendingRow
                  key={t.id}
                  item={t}
                  rank={i + 1}
                  onPress={() => handleTrendingPress(t)}
                />
              ))}
            </>
          )}
        </ScrollView>
      ) : (
        /* ── Empty idle ── */
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
            Search for songs, artists, albums, and more.
          </Text>
        </View>
      )}

      <SongOptionsSheet
        visible={selectedSong !== null}
        onClose={() => setSelectedSong(null)}
        songId={selectedSong?.id ?? null}
        songTitle={selectedSong?.title ?? ""}
        artistName={selectedSong?.artist_name ?? ""}
        albumTitle={selectedSong?.album_title ?? ""}
        imageUrl={selectedSong?.image_url ?? null}
        artists={selectedSong?.artists ?? []}
      />
    </SafeAreaView>
  );
}
