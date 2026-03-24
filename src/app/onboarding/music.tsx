import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Genre = {
  id: string;
  slug: string;
  label: string;
  color: string;
  image_url: string | null;
};

export default function OnboardingMusicScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("genres")
      .select("id, slug, label, color, image_url")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setGenres(data ?? []);
        setLoading(false);
      });
  }, []);

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  const onDone = async () => {
    if (selected.size === 0 || !user) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          music_preferences: Array.from(selected),
          onboarding_complete: true,
        })
        .eq("id", user.id);
      router.replace("/(tabs)");
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: Genre }) => {
    const isSelected = selected.has(item.slug);
    return (
      <TouchableOpacity
        onPress={() => toggle(item.slug)}
        activeOpacity={0.85}
        style={{
          flex: 1,
          margin: 5,
          height: 110,
          borderRadius: 10,
          backgroundColor: item.color,
          overflow: "hidden",
          borderWidth: isSelected ? 3 : 0,
          borderColor: "#ffffff",
        }}
      >
        {/* Artist image — bottom-right cutout style */}
        {item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 80,
              height: 100,
            }}
            resizeMode="cover"
          />
        )}

        {/* Genre label — top-left */}
        <Text
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            color: "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 15,
            fontWeight: "700",
          }}
        >
          {item.label}
        </Text>

        {/* Checkmark badge — top-right when selected */}
        {isSelected && (
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Image
              source={require("@/assets/images/icon-check.png")}
              style={{ width: 16, height: 16 }}
              resizeMode="contain"
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <View
        style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 }}
      >
        <Text
          style={{
            color: "#ffffff",
            fontSize: 28,
            fontWeight: "700",
            fontFamily: "CircularStd",
            marginBottom: 8,
          }}
        >
          What music do you like?
        </Text>
        <Text
          style={{ color: "#a7a7a7", fontSize: 14, fontFamily: "CircularStd" }}
        >
          Pick a few genres to get started. You can always change this later.
        </Text>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color="#1DB954" size="large" />
        </View>
      ) : (
        <FlatList
          data={genres}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Sticky bottom button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: 36,
          paddingTop: 16,
          backgroundColor: "#121212",
          borderTopWidth: 1,
          borderTopColor: "#2a2a2a",
        }}
      >
        <TouchableOpacity
          onPress={onDone}
          disabled={selected.size === 0 || saving}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 50,
            paddingVertical: 16,
            alignItems: "center",
            opacity: selected.size === 0 ? 0.4 : 1,
          }}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#121212" />
          ) : (
            <Text
              style={{
                color: "#121212",
                fontWeight: "700",
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
