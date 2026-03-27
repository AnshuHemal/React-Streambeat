import BottomDialog from "@/components/BottomDialog";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
          borderWidth: value ? 2 : 0,
          borderColor: value ? "#121212" : "transparent",
          transform: [{ translateX }],
        }}
      />
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "600",
        fontFamily: "CircularStd",
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 8,
      }}
    >
      {title}
    </Text>
  );
}

function ToggleRow({
  title,
  description,
  value,
  onToggle,
  note,
}: {
  title: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  note?: string;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
              fontFamily: "CircularStd",
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 12,
              fontFamily: "CircularStd",
              lineHeight: 18,
            }}
          >
            {description}
          </Text>
          {note && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 10,
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#a7a7a7"
              />
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 11,
                  fontFamily: "CircularStd",
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                {note}
              </Text>
            </View>
          )}
        </View>
        <Toggle value={value} onToggle={onToggle} />
      </View>
    </View>
  );
}

function NavRow({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{ paddingHorizontal: 20, paddingVertical: 16 }}
    >
      <Text
        style={{
          color: "#ffffff",
          fontSize: 16,
          fontWeight: "600",
          fontFamily: "CircularStd",
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: "#a7a7a7",
          fontSize: 12,
          fontFamily: "CircularStd",
          lineHeight: 18,
        }}
      >
        {description}
      </Text>
    </TouchableOpacity>
  );
}

export default function ContentDisplayScreen() {
  const router = useRouter();

  const [reduceAnimations, setReduceAnimations] = useState(false);
  const [canvas, setCanvas] = useState(true);
  const [explicitContent, setExplicitContent] = useState(true);
  const [showUnplayable, setShowUnplayable] = useState(false);
  const [createButton, setCreateButton] = useState(true);
  const [langDialogVisible, setLangDialogVisible] = useState(false);

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
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 14,
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
            color: "#ffffff",
            fontSize: 18,
            fontWeight: "600",
            fontFamily: "CircularStd",
          }}
        >
          Content and display
        </Text>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="search" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Content preferences */}
        <SectionHeader title="Content preferences" />

        <NavRow
          title="Languages for music"
          description="Set your preferred languages for music recommendations."
          onPress={() => router.push("/(tabs)/settings/languages-music" as any)}
        />

        <ToggleRow
          title="Reduce animations"
          description="Disables various autoplaying animations that can be distracting."
          value={reduceAnimations}
          onToggle={() => setReduceAnimations((v) => !v)}
        />

        <ToggleRow
          title="Canvas"
          description="Displays short, looping visuals on the Now Playing View."
          value={canvas}
          onToggle={() => setCanvas((v) => !v)}
        />

        <ToggleRow
          title="Allow explicit content"
          description={`Explicit content (labeled with the E tag) is playable. When off, explicit music and podcasts are skipped, and explicit audiobooks (where available) are hidden.`}
          value={explicitContent}
          onToggle={() => setExplicitContent((v) => !v)}
          note="It may take some time for your experience to update."
        />

        <ToggleRow
          title="Show unplayable songs"
          description="Songs that aren't available (e.g., due to artist removal or region) are still visible."
          value={showUnplayable}
          onToggle={() => setShowUnplayable((v) => !v)}
        />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#2a2a2a", marginTop: 8 }} />

        {/* Display preferences */}
        <SectionHeader title="Display preferences" />

        <NavRow
          title="App language"
          description="Set your default language for the Streambeat app, plus notifications and emails."
          onPress={() => setLangDialogVisible(true)}
        />

        <ToggleRow
          title="Create button"
          description="The Create button will appear in your main navigation bar."
          value={createButton}
          onToggle={() => setCreateButton((v) => !v)}
        />
      </ScrollView>

      <BottomDialog
        visible={langDialogVisible}
        title="Change your app language"
        description="Tap Continue to select the language you want your app in"
        confirmLabel="Continue"
        dismissLabel="Dismiss"
        onConfirm={() => setLangDialogVisible(false)}
        onDismiss={() => setLangDialogVisible(false)}
      />
    </SafeAreaView>
  );
}
