import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Quality =
  | "automatic"
  | "low"
  | "normal"
  | "high"
  | "very_high"
  | "lossless";

const QUALITY_OPTIONS: { value: Quality; label: string; premium?: boolean }[] =
  [
    { value: "automatic", label: "Automatic" },
    { value: "low", label: "Low" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "very_high", label: "Very high", premium: true },
    { value: "lossless", label: "Lossless", premium: true },
  ];

const DOWNLOAD_OPTIONS: { value: Quality; label: string; premium?: boolean }[] =
  [
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "very_high", label: "Very high", premium: true },
    { value: "lossless", label: "Lossless", premium: true },
  ];

function RadioOption({
  label,
  selected,
  onSelect,
  premium,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  premium?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={premium ? undefined : onSelect}
      activeOpacity={premium ? 1 : 0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
      }}
    >
      <Text
        style={{ color: "#ffffff", fontSize: 16, fontFamily: "CircularStd" }}
      >
        {label}
      </Text>
      {premium ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Image
            source={require("@/assets/images/logo-white.png")}
            style={{ width: 18, height: 18 }}
            resizeMode="contain"
          />
          <Text
            style={{
              color: "#1DB954",
              fontSize: 14,
              fontWeight: "700",
              fontFamily: "CircularStd",
            }}
          >
            Premium
          </Text>
        </View>
      ) : (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: selected ? "#1DB954" : "#888888",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected && (
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#1DB954",
              }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
      <Text
        style={{
          color: "#ffffff",
          fontSize: 18,
          fontWeight: "700",
          fontFamily: "CircularStd",
          marginBottom: description ? 6 : 0,
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            color: "#a7a7a7",
            fontSize: 13,
            fontFamily: "CircularStd",
            lineHeight: 18,
          }}
        >
          {description}
        </Text>
      )}
    </View>
  );
}

export default function MediaQualityScreen() {
  const router = useRouter();

  const [wifiQuality, setWifiQuality] = useState<Quality>("automatic");
  const [cellularQuality, setCellularQuality] = useState<Quality>("automatic");
  const [downloadQuality, setDownloadQuality] = useState<Quality>("normal");

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
            fontWeight: "700",
            fontFamily: "CircularStd",
          }}
        >
          Media quality
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
        {/* Audio streaming quality */}
        <Text
          style={{
            color: "#ffffff",
            fontSize: 22,
            fontWeight: "700",
            fontFamily: "CircularStd",
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 8,
          }}
        >
          Audio streaming quality
        </Text>

        {/* Info note */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
            paddingHorizontal: 20,
            paddingBottom: 16,
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
              fontSize: 13,
              fontFamily: "CircularStd",
              flex: 1,
              lineHeight: 18,
            }}
          >
            Quality changes on next track (unless downloaded or higher-quality
            cached track available).
          </Text>
        </View>

        {/* Wi-Fi streaming quality */}
        <SectionTitle
          title="Wi-Fi streaming quality"
          description="Choose the quality of your audio streaming when you're connected to the internet."
        />
        {QUALITY_OPTIONS.map((opt) => (
          <RadioOption
            key={opt.value}
            label={opt.label}
            selected={wifiQuality === opt.value}
            onSelect={() => setWifiQuality(opt.value)}
            premium={opt.premium}
          />
        ))}

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#2a2a2a", marginTop: 8 }} />

        {/* Cellular streaming quality */}
        <SectionTitle
          title="Cellular streaming quality"
          description="Choose the quality of your audio streaming when you're using cellular data."
        />
        {QUALITY_OPTIONS.map((opt) => (
          <RadioOption
            key={opt.value}
            label={opt.label}
            selected={cellularQuality === opt.value}
            onSelect={() => setCellularQuality(opt.value)}
            premium={opt.premium}
          />
        ))}

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#2a2a2a", marginTop: 8 }} />

        {/* Audio download quality */}
        <SectionTitle
          title="Audio download quality"
          description="Choose the quality of your audio downloads."
        />
        {DOWNLOAD_OPTIONS.map((opt) => (
          <RadioOption
            key={opt.value}
            label={opt.label}
            selected={downloadQuality === opt.value}
            onSelect={() => setDownloadQuality(opt.value)}
            premium={opt.premium}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
