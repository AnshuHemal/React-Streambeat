import LoadingDots from "@/components/LoadingDots";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

type Artist = {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
};

const COLUMN_COUNT = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_SIZE = (SCREEN_WIDTH - 40 - (COLUMN_COUNT - 1) * 12) / COLUMN_COUNT;

export default function OnboardingArtistsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("artists")
      .select("id, slug, name, image_url")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setArtists(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return artists;
    const q = search.toLowerCase();
    return artists.filter((a) => a.name.toLowerCase().includes(q));
  }, [artists, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exitSearch = () => {
    setIsSearchFocused(false);
    setSearch("");
    inputRef.current?.blur();
  };

  // Intercept hardware back press when search is open
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isSearchFocused) {
        exitSearch();
        return true; // consume the event — don't navigate back
      }
      return false; // let default back behavior happen
    });
    return () => sub.remove();
  }, [isSearchFocused]);

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
      await supabase
        .from("profiles")
        .update({
          artist_preferences: Array.from(selected),
          onboarding_complete: true,
        })
        .eq("id", user.id);

      const selectedImages = artists
        .filter((a) => selected.has(a.id) && a.image_url)
        .slice(0, 5)
        .map((a) => a.image_url as string);

      router.replace({
        pathname: "/onboarding/great-picks" as any,
        params: { images: JSON.stringify(selectedImages) },
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingDots />;

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
          </View>

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
              data={filtered}
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
              }
            />
          )}
        </>
      ) : (
        /* ── Normal mode ── */
        <>
          <View
            style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}
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
              Choose 3 or more artists{"\n"}you like.
            </Text>

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
              paddingBottom: 70,
            }}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </>
      )}

      {/* Done button — always visible */}
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
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 50,
            paddingVertical: 16,
            paddingHorizontal: 64,
            alignItems: "center",
            opacity: selected.size < 3 ? 0.35 : 1,
          }}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#121212" />
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
