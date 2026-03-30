import {
    SEARCHABLE_SETTINGS,
    SearchableItem,
} from "@/constants/settingsSearch";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Renders text with matched substring highlighted in green */
function HighlightedText({
  text,
  query,
  style,
  highlightStyle,
}: {
  text: string;
  query: string;
  style?: any;
  highlightStyle?: any;
}) {
  if (!query.trim()) return <Text style={style}>{text}</Text>;

  const lower = text.toLowerCase();
  const lowerQ = query.toLowerCase();
  const idx = lower.indexOf(lowerQ);

  if (idx === -1) return <Text style={style}>{text}</Text>;

  return (
    <Text style={style}>
      {text.slice(0, idx)}
      <Text style={[style, highlightStyle]}>
        {text.slice(idx, idx + query.length)}
      </Text>
      {text.slice(idx + query.length)}
    </Text>
  );
}

function ResultItem({ item, query }: { item: SearchableItem; query: string }) {
  const router = useRouter();

  const handlePress = () => {
    router.replace({
      pathname: item.route as any,
      params: { highlight: item.label, ...item.params },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={{ paddingHorizontal: 20, paddingVertical: 14 }}
    >
      {/* Label with highlighted match */}
      <HighlightedText
        text={item.label}
        query={query}
        style={{
          color: "#ffffff",
          fontFamily: "CircularStd",
          fontSize: 16,
          marginBottom: 3,
        }}
        highlightStyle={{ color: "#1DB954" }}
      />

      {/* Description with highlighted match */}
      {item.description ? (
        <HighlightedText
          text={item.description}
          query={query}
          style={{
            color: "#a7a7a7",
            fontFamily: "CircularStd",
            fontSize: 13,
            marginBottom: 6,
          }}
          highlightStyle={{ color: "#1DB954" }}
        />
      ) : null}

      {/* Breadcrumb path */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        <Ionicons name="settings-outline" size={12} color="#777777" />
        {item.breadcrumb.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <Text
                style={{
                  color: "#777777",
                  fontFamily: "CircularStd",
                  fontSize: 12,
                }}
              >
                ›
              </Text>
            )}
            <Text
              style={{
                color: "#777777",
                fontFamily: "CircularStd",
                fontSize: 12,
              }}
            >
              {crumb}
            </Text>
          </React.Fragment>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsSearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");

  const results =
    query.trim().length > 0
      ? SEARCHABLE_SETTINGS.filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase()),
        )
      : [];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#121212" }}
      edges={["top"]}
    >
      {/* Search header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#2a2a2a",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          autoFocus
          placeholder="Search for a setting"
          placeholderTextColor="#535353"
          value={query}
          onChangeText={setQuery}
          style={{
            flex: 1,
            color: "#ffffff",
            fontFamily: "CircularStd",
            fontSize: 16,
            padding: 0,
          }}
          selectionColor="#1DB954"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Empty state */}
      {query.trim().length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 18,
              fontWeight: "600",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            What are you looking for?
          </Text>
          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 14,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Search for a specific setting or use a few keywords.
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 15,
              textAlign: "center",
            }}
          >
            No results for "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => <ResultItem item={item} query={query} />}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: "#1e1e1e",
                marginHorizontal: 20,
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
