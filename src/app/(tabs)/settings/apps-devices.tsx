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

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: "#ffffff",
        fontSize: 22,
        fontWeight: "600",
        fontFamily: "CircularStd",
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 16,
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
}: {
  title: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
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
        </View>
        <Toggle value={value} onToggle={onToggle} />
      </View>
    </View>
  );
}

// App row with icon placeholder + action button
function AppRow({
  name,
  description,
  actionLabel,
  iconBg,
  iconName,
}: {
  name: string;
  description: string;
  actionLabel: string;
  iconBg: string;
  iconName: string;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            flex: 1,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: iconBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={iconName as any} size={24} color="#ffffff" />
          </View>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
              fontFamily: "CircularStd",
            }}
          >
            {name}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            borderWidth: 1,
            borderColor: "#ffffff",
            borderRadius: 50,
            paddingVertical: 8,
            paddingHorizontal: 18,
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 14,
              fontWeight: "600",
              fontFamily: "CircularStd",
            }}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      </View>
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
    </View>
  );
}

export default function AppsDevicesScreen() {
  const router = useRouter();

  const [voiceAssistant, setVoiceAssistant] = useState(true);
  const [connectControl, setConnectControl] = useState(true);
  const [localVisibility, setLocalVisibility] = useState(false);
  const [localAudioFiles, setLocalAudioFiles] = useState(false);
  const [keepOpen, setKeepOpen] = useState(true);

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
          Apps and devices
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
        {/* Connected apps */}
        <SectionHeader title="Connected apps" />

        <AppRow
          name="Google Maps"
          description="Connect your Streambeat account to play directly in the Google Maps app."
          actionLabel="Connect"
          iconBg="#4285F4"
          iconName="map-outline"
        />

        <AppRow
          name="Waze"
          description="Connect your Streambeat account to play directly in the Waze app."
          actionLabel="Get app"
          iconBg="#33CCFF"
          iconName="navigate-outline"
        />

        <ToggleRow
          title="Voice assistant suggestions"
          description="You'll get notifications suggesting voice assistants to connect to on this device."
          value={voiceAssistant}
          onToggle={() => setVoiceAssistant((v) => !v)}
        />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#2a2a2a", marginTop: 8 }} />

        {/* Other devices */}
        <SectionHeader title="Other devices" />

        <ToggleRow
          title="Streambeat Connect control"
          description="Lets you control Streambeat from your phone's lock screen when listening on another device."
          value={connectControl}
          onToggle={() => setConnectControl((v) => !v)}
        />

        <ToggleRow
          title="Local device visibility"
          description="Only devices connected to your local Wi-Fi or ethernet are shown in the Devices menu."
          value={localVisibility}
          onToggle={() => setLocalVisibility((v) => !v)}
        />

        <ToggleRow
          title="Local audio files"
          description="Lets you add tracks from this device to Your Library."
          value={localAudioFiles}
          onToggle={() => setLocalAudioFiles((v) => !v)}
        />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#2a2a2a", marginTop: 8 }} />

        {/* In the car */}
        <SectionHeader title="In the car" />

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
            paddingHorizontal: 20,
            paddingBottom: 12,
          }}
        >
          <Ionicons
            name="information-circle-outline"
            size={16}
            color="#a7a7a7"
            style={{ marginTop: 2 }}
          />
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 12,
              fontFamily: "CircularStd",
              lineHeight: 18,
              flex: 1,
            }}
          >
            Always pay full attention to the road and abide by all traffic
            regulations.
          </Text>
        </View>

        <ToggleRow
          title="Keep Streambeat open"
          description="Prevents your phone from going to sleep whenever you're controlling Streambeat in the car."
          value={keepOpen}
          onToggle={() => setKeepOpen((v) => !v)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
