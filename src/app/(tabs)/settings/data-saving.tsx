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

// ── Radio button ───────────────────────────────────────────────
function RadioOption({
  label,
  description,
  selected,
  onSelect,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 16,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#ffffff",
            fontSize: 16,
            fontFamily: "CircularStd",
            marginBottom: description ? 4 : 0,
          }}
        >
          {label}
        </Text>
        {description && (
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
        )}
      </View>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: selected ? "#1DB954" : "#888888",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
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
    </TouchableOpacity>
  );
}

// ── Toggle row ─────────────────────────────────────────────────
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
              lineHeight: 22,
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
                alignItems: "flex-start",
                gap: 6,
                marginTop: 8,
              }}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#a7a7a7"
                style={{ marginTop: 1 }}
              />
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 12,
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

type DataSaverMode = "always_on" | "automatic" | "always_off";

export default function DataSavingScreen() {
  const router = useRouter();

  const [dataSaverMode, setDataSaverMode] =
    useState<DataSaverMode>("automatic");
  const [downloadsOverCellular, setDownloadsOverCellular] = useState(false);
  const [audioOnlyDownloads, setAudioOnlyDownloads] = useState(false);
  const [audioOnlyStreaming, setAudioOnlyStreaming] = useState(false);

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
          Data-saving and offline
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
        {/* Data saver mode */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
              fontFamily: "CircularStd",
              marginBottom: 6,
            }}
          >
            Data saver mode
          </Text>
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 12,
              fontFamily: "CircularStd",
              lineHeight: 18,
            }}
          >
            Choose if you'd like to optimize your data usage. "On" lowers
            streaming quality and disables other features that use a lot of
            data, like video previews.
          </Text>
        </View>

        <RadioOption
          label="Always on"
          selected={dataSaverMode === "always_on"}
          onSelect={() => setDataSaverMode("always_on")}
        />
        <RadioOption
          label="Automatic"
          description="Adjusts based on Android's Data Saver setting."
          selected={dataSaverMode === "automatic"}
          onSelect={() => setDataSaverMode("automatic")}
        />
        <RadioOption
          label="Always off"
          selected={dataSaverMode === "always_off"}
          onSelect={() => setDataSaverMode("always_off")}
        />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#2a2a2a", marginTop: 8 }} />

        {/* Downloads and streaming */}
        <Text
          style={{
            color: "#ffffff",
            fontSize: 22,
            fontWeight: "600",
            fontFamily: "CircularStd",
            paddingHorizontal: 20,
            paddingTop: 28,
            paddingBottom: 12,
          }}
        >
          Downloads and streaming
        </Text>

        <ToggleRow
          title="Downloads over cellular"
          description="Downloads start or continue when you're not connected to Wi-Fi."
          value={downloadsOverCellular}
          onToggle={() => setDownloadsOverCellular((v) => !v)}
        />

        <ToggleRow
          title="Audio-only downloads for video podcasts"
          description="Only the audio will save when you download video podcasts."
          value={audioOnlyDownloads}
          onToggle={() => setAudioOnlyDownloads((v) => !v)}
        />

        <ToggleRow
          title="Audio-only streaming for video podcasts"
          description="Video podcasts play as audio-only when you're not connected to Wi-Fi."
          value={audioOnlyStreaming}
          onToggle={() => setAudioOnlyStreaming((v) => !v)}
          note="Video is never streamed when the Streambeat app is running in the background."
        />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#2a2a2a", marginTop: 8 }} />

        {/* Storage */}
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
          Storage
        </Text>

        {/* Storage breakdown */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
              fontFamily: "CircularStd",
              marginBottom: 12,
            }}
          >
            Storage breakdown
          </Text>

          {/* Progress bar */}
          <View
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "#535353",
              flexDirection: "row",
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <View style={{ flex: 55.1, backgroundColor: "#4A90D9" }} />
            <View style={{ flex: 0.1, backgroundColor: "#1DB954" }} />
            <View style={{ flex: 3, backgroundColor: "#888888" }} />
            <View style={{ flex: 49.9, backgroundColor: "#2a2a2a" }} />
          </View>

          {/* Legend */}
          {[
            { color: "#4A90D9", label: "Other apps", value: "55.1 GB" },
            {
              color: "#1DB954",
              label: "Streambeat downloads",
              value: "0.0 MB",
            },
            { color: "#888888", label: "Streambeat cache", value: "3.0 MB" },
            { color: "#444444", label: "Free", value: "49.9 GB" },
          ].map((item, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: item.color,
                  }}
                />
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 14,
                    fontFamily: "CircularStd",
                  }}
                >
                  {item.label}
                </Text>
              </View>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 14,
                  fontFamily: "CircularStd",
                }}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Remove all downloads */}
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
                Remove all downloads
              </Text>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                  lineHeight: 18,
                }}
              >
                Remove all the Streambeat content you've downloaded to free up
                space.
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
                alignSelf: "flex-start",
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
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clear cache */}
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
                Clear cache
              </Text>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 12,
                  fontFamily: "CircularStd",
                  lineHeight: 18,
                }}
              >
                Free up space by clearing your data. (Your downloads won't be
                removed.)
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
                alignSelf: "flex-start",
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
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Storage location */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}
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
            Storage location
          </Text>
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 12,
              fontFamily: "CircularStd",
              lineHeight: 18,
              marginBottom: 16,
            }}
          >
            Choose where you'd like your downloads to be stored.
          </Text>

          {[
            {
              path: "/data/user/999/com.streambeat.music",
              info: "Currently using: 3.4 MB\nAvailable: 49.9 GB\nTotal: 105.0 GB",
              selected: true,
            },
            {
              path: "/storage/emulated/999",
              info: "Available: 49.9 GB\nTotal: 105.0 GB",
              selected: false,
            },
          ].map((loc, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 20,
                gap: 16,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: "600",
                    fontFamily: "CircularStd",
                    marginBottom: 4,
                  }}
                >
                  SD card
                </Text>
                <Text
                  style={{
                    color: "#a7a7a7",
                    fontSize: 12,
                    fontFamily: "CircularStd",
                    lineHeight: 18,
                  }}
                >
                  {loc.path}
                  {"\n"}
                  {loc.info}
                </Text>
              </View>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: loc.selected ? "#1DB954" : "#888888",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 2,
                }}
              >
                {loc.selected && (
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
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
