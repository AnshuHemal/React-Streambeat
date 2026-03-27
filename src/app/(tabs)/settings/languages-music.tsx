import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Custom Toggle ──────────────────────────────────────────────
function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  const translateX = useRef(new Animated.Value(value ? 24 : 2)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 24 : 2,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  }, [value]);

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      style={{
        width: 52,
        height: 30,
        borderRadius: 15,
        backgroundColor: value ? "#1DB954" : "transparent",
        borderWidth: value ? 0 : 2,
        borderColor: "#888888",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: value ? "#121212" : "#888888",
          transform: [{ translateX }],
        }}
      />
    </TouchableOpacity>
  );
}

// ── Screen ─────────────────────────────────────────────────────
type Genre = { id: string; slug: string; label: string };

export default function LanguagesMusicScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [genres, setGenres] = useState<Genre[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch genres + current preferences
  useEffect(() => {
    const load = async () => {
      const [{ data: genreData }, { data: profileData }] = await Promise.all([
        supabase
          .from("genres")
          .select("id, slug, label")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("profiles")
          .select("music_preferences")
          .eq("id", user!.id)
          .single(),
      ]);

      setGenres(genreData ?? []);
      setSelected(new Set(profileData?.music_preferences ?? []));
      setLoading(false);
    };
    if (user) load();
  }, [user]);

  const toggle = async (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);

    setSaving(true);
    await supabase
      .from("profiles")
      .update({ music_preferences: Array.from(next) })
      .eq("id", user!.id);
    await refreshProfile();
    setSaving(false);
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
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            color: "#ffffff",
            fontSize: 18,
            fontWeight: "600",
            fontFamily: "CircularStd",
            textAlign: "center",
            marginRight: 36, // balance the back button
          }}
        >
          Languages for music
        </Text>
        {saving && (
          <ActivityIndicator
            size="small"
            color="#1DB954"
            style={{ position: "absolute", right: 16 }}
          />
        )}
      </View>

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color="#1DB954" size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 12,
              fontFamily: "CircularStd",
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 16,
            }}
          >
            What are your preferred languages for music?
          </Text>

          {genres.map((genre) => (
            <TouchableOpacity
              key={genre.id}
              onPress={() => toggle(genre.id)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 16,
                  fontFamily: "CircularStd",
                }}
              >
                {genre.label}
              </Text>
              <Toggle
                value={selected.has(genre.id)}
                onToggle={() => toggle(genre.id)}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
