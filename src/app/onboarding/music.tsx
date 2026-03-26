import LoadingDots from "@/components/LoadingDots";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

type Genre = {
  id: string;
  slug: string;
  label: string;
  color: string;
  image_url: string | null;
};

const CARD_HEIGHT = (Dimensions.get("window").width / 2) * 0.5;

export default function OnboardingMusicScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const fetchGenres = useCallback(async () => {
    const { data } = await supabase
      .from("genres")
      .select("id, slug, label, color, image_url")
      .eq("is_active", true)
      .order("sort_order");
    setGenres(data ?? []);
  }, []);

  useEffect(() => {
    fetchGenres().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGenres();
    setRefreshing(false);
  }, [fetchGenres]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const onDone = async () => {
    if (!user) return;
    if (selected.size < 3) {
      toast.info("Select at least 3 genres", {
        description: "Pick a few more to personalize your experience.",
      });
      return;
    }
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ music_preferences: Array.from(selected) })
        .eq("id", user.id);
      router.replace("/onboarding/artists" as any);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingDots />;

  const renderItem = ({ item }: { item: Genre }) => {
    const isSelected = selected.has(item.id);
    return (
      <TouchableOpacity
        onPress={() => toggle(item.id)}
        activeOpacity={0.85}
        style={{
          flex: 1,
          margin: 5,
          height: CARD_HEIGHT,
          borderRadius: 12,
          backgroundColor: item.color,
          overflow: "hidden",
        }}
      >
        {/* Artist image — bottom-right, fixed size, cover fills regardless of source dimensions */}
        {item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: "80%",
              height: "80%",
            }}
            resizeMode="center"
          />
        )}

        {/* Genre label — top-left */}
        <Text
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            color: "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 15,
            fontWeight: "600",
            textShadowColor: "rgba(0,0,0,0.25)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
        >
          {item.label}
        </Text>

        {/* Checkmark badge — white circle, top-right, only when selected */}
        {isSelected && (
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 14,
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
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
        <Text
          style={{
            color: "#ffffff",
            fontSize: 28,
            fontWeight: "600",
            fontFamily: "CircularStd",
          }}
        >
          What music do you like?
        </Text>
      </View>

      <FlatList
        data={genres}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingBottom: 10,
          marginTop: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1DB954"
            colors={["#1DB954"]}
          />
        }
      />

      {/* Centered pill Next button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: 44,
          paddingTop: 12,
          alignItems: "center",
        }}
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
              Next
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
