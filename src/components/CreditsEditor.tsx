/**
 * CreditsEditor.tsx
 * Reusable admin component for adding/editing song credits + sources.
 */

import {
  CREDIT_ROLES,
  CreditDraft,
  CreditRole,
  SourceDraft,
} from "@/services/credits";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Artist {
  id: string;
  name: string;
}

interface Props {
  credits: CreditDraft[];
  onCreditsChange: (credits: CreditDraft[]) => void;
  sources: SourceDraft[];
  onSourcesChange: (sources: SourceDraft[]) => void;
  artists: Artist[];
}

// ─── Role Pill ────────────────────────────────────────────────────────────────

function RolePill({
  role,
  selected,
  onToggle,
}: {
  role: CreditRole;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: selected ? "#1DB954" : "#2a2a2a",
        borderWidth: 1,
        borderColor: selected ? "#1DB954" : "#3a3a3a",
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      <Text
        style={{
          color: selected ? "#000" : "#B3B3B3",
          fontSize: 12,
          fontFamily: "CircularStd",
          fontWeight: selected ? "600" : "400",
        }}
      >
        {role}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Credit Row ───────────────────────────────────────────────────────────────

function CreditRow({
  credit,
  onRemove,
  onToggleRole,
}: {
  credit: CreditDraft;
  onRemove: () => void;
  onToggleRole: (role: CreditRole) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={{
        backgroundColor: "#1e1e1e",
        borderRadius: 10,
        marginBottom: 8,
        overflow: "hidden",
      }}
    >
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: "#2a2a2a",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          <Ionicons name="person" size={15} color="#B3B3B3" />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 14,
              fontFamily: "CircularStd",
              fontWeight: "600",
            }}
          >
            {credit.artist_name}
          </Text>
          <Text
            style={{
              color: "#7A7A7A",
              fontSize: 11,
              fontFamily: "CircularStd",
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {credit.roles.length > 0
              ? credit.roles.join(" • ")
              : "Tap to select roles"}
          </Text>
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color="#7A7A7A"
          style={{ marginRight: 8 }}
        />
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close-circle" size={20} color="#E91429" />
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded && (
        <View
          style={{
            paddingHorizontal: 14,
            paddingBottom: 12,
            borderTopWidth: 1,
            borderTopColor: "#2a2a2a",
          }}
        >
          <Text
            style={{
              color: "#B3B3B3",
              fontSize: 10,
              fontFamily: "CircularStd",
              marginTop: 10,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            Roles
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {CREDIT_ROLES.map((role) => (
              <RolePill
                key={role}
                role={role}
                selected={credit.roles.includes(role)}
                onToggle={() => onToggleRole(role)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreditsEditor({
  credits,
  onCreditsChange,
  sources,
  onSourcesChange,
  artists,
}: Props) {
  const [artistSearch, setArtistSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [newSource, setNewSource] = useState("");

  const filteredArtists = artistSearch.trim()
    ? artists.filter((a) =>
        a.name.toLowerCase().includes(artistSearch.toLowerCase()),
      )
    : artists;

  const availableArtists = filteredArtists.filter(
    (a) => !credits.find((c) => c.artist_id === a.id),
  );

  const addArtist = (artist: Artist) => {
    const draft: CreditDraft = {
      key: `${artist.id}-${Date.now()}`,
      artist_id: artist.id,
      artist_name: artist.name,
      roles: [],
      credit_order: credits.length,
    };
    onCreditsChange([...credits, draft]);
    setArtistSearch("");
    setShowPicker(false);
  };

  const removeCredit = (key: string) => {
    onCreditsChange(credits.filter((c) => c.key !== key));
  };

  const toggleRole = (key: string, role: CreditRole) => {
    onCreditsChange(
      credits.map((c) => {
        if (c.key !== key) return c;
        const has = c.roles.includes(role);
        return {
          ...c,
          roles: has ? c.roles.filter((r) => r !== role) : [...c.roles, role],
        };
      }),
    );
  };

  const addSource = () => {
    const trimmed = newSource.trim();
    if (!trimmed) return;
    onSourcesChange([
      ...sources,
      { key: `source-${Date.now()}`, name: trimmed },
    ]);
    setNewSource("");
  };

  const removeSource = (key: string) => {
    onSourcesChange(sources.filter((s) => s.key !== key));
  };

  return (
    <View style={{ marginBottom: 16 }}>
      {/* ── Credits section ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="ribbon-outline" size={17} color="#1DB954" />
          <Text
            style={{
              color: "#fff",
              fontSize: 14,
              fontFamily: "CircularStd",
              fontWeight: "600",
            }}
          >
            Credits
          </Text>
          {credits.length > 0 && (
            <View
              style={{
                backgroundColor: "#1DB954",
                borderRadius: 10,
                paddingHorizontal: 7,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  color: "#000",
                  fontSize: 11,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                }}
              >
                {credits.length}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowPicker((v) => !v)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: showPicker ? "#1DB954" : "#282828",
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 8,
          }}
        >
          <Ionicons
            name={showPicker ? "close" : "add"}
            size={15}
            color={showPicker ? "#000" : "#fff"}
          />
          <Text
            style={{
              color: showPicker ? "#000" : "#fff",
              fontSize: 13,
              fontFamily: "CircularStd",
              fontWeight: "600",
            }}
          >
            {showPicker ? "Close" : "Add Artist"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Artist picker dropdown */}
      {showPicker && (
        <View
          style={{
            backgroundColor: "#1a1a1a",
            borderRadius: 10,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: "#2a2a2a",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#2a2a2a",
            }}
          >
            <Ionicons
              name="search"
              size={15}
              color="#7A7A7A"
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Search artists..."
              placeholderTextColor="#7A7A7A"
              value={artistSearch}
              onChangeText={setArtistSearch}
              style={{
                flex: 1,
                color: "#fff",
                fontSize: 14,
                fontFamily: "CircularStd",
                height: 42,
              }}
            />
            {artistSearch.length > 0 && (
              <TouchableOpacity onPress={() => setArtistSearch("")}>
                <Ionicons name="close-circle" size={16} color="#7A7A7A" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
            {availableArtists.length === 0 ? (
              <View style={{ padding: 14, alignItems: "center" }}>
                <Text
                  style={{
                    color: "#7A7A7A",
                    fontSize: 13,
                    fontFamily: "CircularStd",
                  }}
                >
                  {credits.length === artists.length
                    ? "All artists added"
                    : "No artists found"}
                </Text>
              </View>
            ) : (
              availableArtists.slice(0, 15).map((artist) => (
                <TouchableOpacity
                  key={artist.id}
                  onPress={() => addArtist(artist)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: "#2a2a2a",
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: "#2a2a2a",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                    }}
                  >
                    <Ionicons name="person" size={13} color="#B3B3B3" />
                  </View>
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 14,
                      fontFamily: "CircularStd",
                      flex: 1,
                    }}
                  >
                    {artist.name}
                  </Text>
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color="#1DB954"
                  />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Credit rows */}
      {credits.length === 0 ? (
        <View
          style={{
            backgroundColor: "#1a1a1a",
            borderRadius: 10,
            padding: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#2a2a2a",
            borderStyle: "dashed",
            marginBottom: 16,
          }}
        >
          <Ionicons name="ribbon-outline" size={22} color="#3a3a3a" />
          <Text
            style={{
              color: "#7A7A7A",
              fontSize: 12,
              fontFamily: "CircularStd",
              marginTop: 6,
              textAlign: "center",
            }}
          >
            No credits yet. Tap "Add Artist" to begin.
          </Text>
        </View>
      ) : (
        <View style={{ marginBottom: 16 }}>
          {credits.map((credit) => (
            <CreditRow
              key={credit.key}
              credit={credit}
              onRemove={() => removeCredit(credit.key)}
              onToggleRole={(role) => toggleRole(credit.key, role)}
            />
          ))}
        </View>
      )}

      {/* ── Sources section ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Ionicons name="business-outline" size={17} color="#1DB954" />
        <Text
          style={{
            color: "#fff",
            fontSize: 14,
            fontFamily: "CircularStd",
            fontWeight: "600",
          }}
        >
          Sources
        </Text>
        {sources.length > 0 && (
          <View
            style={{
              backgroundColor: "#1DB954",
              borderRadius: 10,
              paddingHorizontal: 7,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                color: "#000",
                fontSize: 11,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              {sources.length}
            </Text>
          </View>
        )}
      </View>

      {/* Existing source chips */}
      {sources.map((source) => (
        <View
          key={source.key}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#1e1e1e",
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 11,
            marginBottom: 8,
          }}
        >
          <Ionicons
            name="business"
            size={15}
            color="#B3B3B3"
            style={{ marginRight: 10 }}
          />
          <Text
            style={{
              flex: 1,
              color: "#fff",
              fontSize: 14,
              fontFamily: "CircularStd",
            }}
          >
            {source.name}
          </Text>
          <TouchableOpacity
            onPress={() => removeSource(source.key)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color="#E91429" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Add source input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#282828",
          borderRadius: 8,
          paddingHorizontal: 14,
          height: 48,
          gap: 8,
        }}
      >
        <Ionicons name="add-circle-outline" size={18} color="#7A7A7A" />
        <TextInput
          placeholder="Add source (e.g. EYP Creations)"
          placeholderTextColor="#7A7A7A"
          value={newSource}
          onChangeText={setNewSource}
          onSubmitEditing={addSource}
          returnKeyType="done"
          style={{
            flex: 1,
            color: "#fff",
            fontSize: 14,
            fontFamily: "CircularStd",
            height: 48,
          }}
        />
        {newSource.trim().length > 0 && (
          <TouchableOpacity
            onPress={addSource}
            activeOpacity={0.7}
            style={{
              backgroundColor: "#1DB954",
              borderRadius: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                color: "#000",
                fontSize: 12,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              Add
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
