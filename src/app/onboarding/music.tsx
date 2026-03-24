import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Genre = {
  id: string;
  label: string;
  color: string;
};

const GENRES: Genre[] = [
  { id: "hindi", label: "Hindi", color: "#E8474C" },
  { id: "international", label: "International", color: "#D4A017" },
  { id: "punjabi", label: "Punjabi", color: "#7B3FA0" },
  { id: "tamil", label: "Tamil", color: "#C8A020" },
  { id: "telugu", label: "Telugu", color: "#1AA34A" },
  { id: "malayalam", label: "Malayalam", color: "#2ECC71" },
  { id: "marathi", label: "Marathi", color: "#A0522D" },
  { id: "gujarati", label: "Gujarati", color: "#E91E8C" },
  { id: "bengali", label: "Bengali", color: "#4A90D9" },
  { id: "kannada", label: "Kannada", color: "#E53935" },
  { id: "pop", label: "Pop", color: "#8E44AD" },
  { id: "hiphop", label: "Hip-Hop", color: "#2C3E50" },
  { id: "rock", label: "Rock", color: "#C0392B" },
  { id: "jazz", label: "Jazz", color: "#16A085" },
  { id: "classical", label: "Classical", color: "#D35400" },
  { id: "electronic", label: "Electronic", color: "#1ABC9C" },
];

export default function OnboardingMusicScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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
    const isSelected = selected.has(item.id);
    return (
      <TouchableOpacity
        onPress={() => toggle(item.id)}
        activeOpacity={0.85}
        style={{
          flex: 1,
          margin: 5,
          height: 110,
          borderRadius: 10,
          backgroundColor: item.color,
          overflow: "hidden",
          justifyContent: "flex-end",
          borderWidth: isSelected ? 3 : 0,
          borderColor: isSelected ? "#ffffff" : "transparent",
        }}
      >
        {/* Subtle dark gradient overlay at bottom for text readability */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 50,
            backgroundColor: "rgba(0,0,0,0.25)",
          }}
        />

        <Text
          style={{
            color: "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 14,
            fontWeight: "700",
            padding: 10,
            paddingBottom: 12,
          }}
        >
          {item.label}
        </Text>

        {/* Checkmark badge — top right, only when selected */}
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
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Text
              style={{
                color: "#121212",
                fontSize: 14,
                fontWeight: "900",
                lineHeight: 16,
                marginTop: 1,
              }}
            >
              ✓
            </Text>
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
          style={{
            color: "#a7a7a7",
            fontSize: 14,
            fontFamily: "CircularStd",
          }}
        >
          Pick a few genres to get started. You can always change this later.
        </Text>
      </View>

      <FlatList
        data={GENRES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />

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
