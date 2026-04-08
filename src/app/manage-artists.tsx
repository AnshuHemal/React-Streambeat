/**
 * manage-artists.tsx
 *
 * Reachable from the Library screen's "Add artists" card.
 * Pre-selects the user's current artist preferences so they can
 * add or remove artists and save back — no onboarding redirect.
 *
 * Data strategy:
 *  - Page size 30, infinite scroll via onEndReached + Supabase .range()
 *  - Search queries Supabase directly so it works across all 800 artists
 *  - Pre-selected artists are fetched by ID on mount so they always show
 *    regardless of which page they land on
 */

import LoadingDots from "@/components/LoadingDots";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Artist } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

const COLUMN_COUNT = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = (SCREEN_WIDTH - 40 - (COLUMN_COUNT - 1) * 12) / COLUMN_COUNT;
const PAGE_SIZE = 30;
const SEARCH_DEBOUNCE_MS = 300;

export default function ManageArtistsScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  // ── Browse state (paginated) ───────────────────────────────────────────────
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  // ── Search state (server-side, debounced) ─────────────────────────────────
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Selection ──────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // ── Fetch first page + pre-selected artists on mount ──────────────────────
  useEffect(() => {
    const existing = new Set<string>(profile?.artist_preferences ?? []);
    setSelected(existing);

    const fetchInitial = async () => {
      // Fetch first page (random-ish order via id ordering)
      const { data } = await supabase
        .from("artists")
        .select("id, slug, name, image_url")
        .eq("is_active", true)
        .order("name", { ascending: true })
        .range(0, PAGE_SIZE - 1);

      const page = data ?? [];
      offsetRef.current = page.length;
      setHasMore(page.length === PAGE_SIZE);

      // Also fetch the pre-selected artists so they're always visible
      // even if they fall outside the first page
      let preSelected: Artist[] = [];
      if (existing.size > 0) {
        const { data: preData } = await supabase
          .from("artists")
          .select("id, slug, name, image_url")
          .in("id", Array.from(existing));
        preSelected = preData ?? [];
      }

      // Merge: pre-selected first, then page (deduped)
      const preIds = new Set(preSelected.map((a) => a.id));
      const merged = [...preSelected, ...page.filter((a) => !preIds.has(a.id))];

      setArtists(merged);
      setLoadingInitial(false);
    };

    fetchInitial();
  }, []);

  // ── Load next page ─────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || isSearchFocused) return;
    setLoadingMore(true);

    const { data } = await supabase
      .from("artists")
      .select("id, slug, name, image_url")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1);

    const page = data ?? [];
    offsetRef.current += page.length;
    setHasMore(page.length === PAGE_SIZE);

    // Deduplicate against already-loaded artists
    setArtists((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      return [...prev, ...page.filter((a) => !existingIds.has(a.id))];
    });

    setLoadingMore(false);
  }, [loadingMore, hasMore, isSearchFocused]);

  // ── Server-side search with debounce ───────────────────────────────────────
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    const q = search.trim();
    if (q.length === 0) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("artists")
        .select("id, slug, name, image_url")
        .eq("is_active", true)
        .ilike("name", `%${q}%`)
        .order("name", { ascending: true })
        .limit(50);

      setSearchResults(data ?? []);
      setSearchLoading(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  // ── Toggle selection ───────────────────────────────────────────────────────
  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const exitSearch = useCallback(() => {
    setIsSearchFocused(false);
    setSearch("");
    inputRef.current?.blur();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSearchFocused) {
        exitSearch();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isSearchFocused, exitSearch]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const onDone = async () => {
    if (!user) return;
    if (selected.size < 3) {
      toast.info("Select at least 3 artists", {
        description: "Pick a few more to personalize your experience.",
      });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ artist_preferences: Array.from(selected) })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Artists updated");
      router.back();
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) return <LoadingDots />;

  const renderItem = ({ item }: { item: Artist }) => {
    const isSelected = selected.has(item.id);
    return (
      <TouchableOpacity
        onPress={() => toggle(item.id)}
        activeOpacity={0.8}
        style={{ width: ITEM_SIZE, alignItems: "center", marginBottom: 20 }}
      >
        <View
          style={{ width: ITEM_SIZE, height: ITEM_SIZE, position: "relative" }}
        >
          {/* Circle image */}
          <View
            style={{
              width: ITEM_SIZE,
              height: ITEM_SIZE,
              borderRadius: ITEM_SIZE / 2,
              overflow: "hidden",
              backgroundColor: "#2a2a2a",
            }}
          >
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#333",
                }}
              >
                <Ionicons name="person" size={ITEM_SIZE * 0.4} color="#666" />
              </View>
            )}

            {/* Dim overlay when selected */}
            {isSelected && (
              <View
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.35)",
                }}
              />
            )}
          </View>

          {/* White circle checkmark — same asset as onboarding */}
          {isSelected && (
            <View
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 26,
                height: 26,
                alignItems: "center",
                justifyContent: "center",
                elevation: 6,
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
            >
              <Image
                source={require("@/assets/images/icon-check.png")}
                style={{ width: 26, height: 26 }}
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        <Text
          numberOfLines={2}
          style={{
            color: "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 12,
            fontWeight: "600",
            textAlign: "center",
            marginTop: 8,
            paddingHorizontal: 4,
          }}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      {isSearchFocused ? (
        /* ── Search mode ── */
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#2a2a2a",
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 14,
            }}
          >
            <TouchableOpacity
              onPress={exitSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              autoFocus
              placeholder="Search"
              placeholderTextColor="#777"
              value={search}
              onChangeText={setSearch}
              style={{
                flex: 1,
                color: "#ffffff",
                fontFamily: "CircularStd",
                fontSize: 16,
                padding: 0,
              }}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor="#1DB954"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={20} color="#777" />
              </TouchableOpacity>
            )}
          </View>

          {search.trim().length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "CircularStd",
                  fontSize: 18,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                Find artists you like.
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              numColumns={COLUMN_COUNT}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 110,
              }}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                searchLoading ? (
                  <View style={{ alignItems: "center", paddingTop: 60 }}>
                    <ActivityIndicator size="small" color="#1DB954" />
                  </View>
                ) : (
                  <View style={{ alignItems: "center", paddingTop: 60 }}>
                    <Text
                      style={{
                        color: "#a7a7a7",
                        fontFamily: "CircularStd",
                        fontSize: 15,
                      }}
                    >
                      No results for "{search}"
                    </Text>
                  </View>
                )
              }
            />
          )}
        </>
      ) : (
        /* ── Normal mode ── */
        <>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View
            style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 28,
                fontWeight: "600",
                fontFamily: "CircularStd",
                lineHeight: 36,
                marginBottom: 20,
              }}
            >
              Choose more artists{"\n"}you like.
            </Text>

            {/* Search bar */}
            <TouchableOpacity
              onPress={() => setIsSearchFocused(true)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 14,
                gap: 10,
              }}
            >
              <Ionicons name="search" size={18} color="#777" />
              <Text
                style={{
                  color: "#777",
                  fontFamily: "CircularStd",
                  fontSize: 15,
                }}
              >
                Search
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={artists}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={COLUMN_COUNT}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 110,
            }}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <ActivityIndicator size="small" color="#1DB954" />
                </View>
              ) : null
            }
          />
        </>
      )}

      {/* Done button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: 48,
          paddingTop: 12,
          alignItems: "center",
          backgroundColor: "transparent",
        }}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={onDone}
          disabled={saving}
          activeOpacity={0.85}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 50,
            paddingVertical: 16,
            paddingHorizontal: 64,
            alignItems: "center",
            opacity: selected.size < 3 ? 0.35 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#121212" />
          ) : (
            <Text
              style={{
                color: "#121212",
                fontWeight: "600",
                fontSize: 16,
                fontFamily: "CircularStd",
              }}
            >
              Done
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
