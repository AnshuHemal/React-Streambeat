import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LoadingDots from "./LoadingDots";

interface ArtistCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onArtistCreated: (artist: { id: string; name: string }) => void;
}

export function ArtistCreationModal({
  visible,
  onClose,
  onArtistCreated,
}: ArtistCreationModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [genresText, setGenresText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Artist name is required");
      return;
    }

    // Parse comma-separated genres into a clean array
    const genres = genresText
      .split(",")
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean);

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("artists")
        .insert({
          name: name.trim(),
          slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, "-"),
          image_url: imageUrl.trim() || null,
          genres,
          is_active: true,
        })
        .select("id, name")
        .single();

      if (error) throw error;

      if (data) {
        onArtistCreated(data);
        handleClose();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create artist");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setSlug("");
    setImageUrl("");
    setGenresText("");
    onClose();
  };

  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: keyof typeof Ionicons.glyphMap,
    required = false,
  ) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#282828",
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 12,
        height: 52,
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color="#B3B3B3"
        style={{ marginRight: 12 }}
      />
      <TextInput
        placeholder={`${placeholder}${required ? " *" : ""}`}
        placeholderTextColor="#7A7A7A"
        value={value}
        onChangeText={onChangeText}
        style={{
          flex: 1,
          color: "#FFFFFF",
          fontSize: 15,
          fontFamily: "CircularStd",
        }}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ width: "100%", maxWidth: 400 }}
        >
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 16,
              padding: 24,
              width: "100%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "#1DB954",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="person-add" size={20} color="#000000" />
                </View>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 18,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                  }}
                >
                  Quick Add Artist
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color="#B3B3B3" />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text
              style={{
                color: "#B3B3B3",
                fontSize: 13,
                fontFamily: "CircularStd",
                marginBottom: 16,
                lineHeight: 18,
              }}
            >
              Create a new artist without leaving this form. The artist will be
              immediately available for selection.
            </Text>

            {/* Form Fields */}
            {renderInput("Artist Name", name, setName, "person", true)}
            {renderInput("Slug (optional)", slug, setSlug, "link")}
            {renderInput(
              "Image URL (optional)",
              imageUrl,
              setImageUrl,
              "image",
            )}
            {renderInput(
              "Genres (comma-separated)",
              genresText,
              setGenresText,
              "musical-notes",
            )}
            <Text
              style={{
                color: "#7A7A7A",
                fontSize: 11,
                fontFamily: "CircularStd",
                marginTop: -8,
                marginBottom: 12,
                paddingHorizontal: 4,
              }}
            >
              e.g. bollywood, romantic, indie
            </Text>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: "#282828",
                  paddingVertical: 14,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontFamily: "CircularStd",
                    fontWeight: "500",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading || !name.trim()}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: "#1DB954",
                  paddingVertical: 14,
                  borderRadius: 8,
                  alignItems: "center",
                  opacity: loading || !name.trim() ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <LoadingDots inline color="#000000" />
                ) : (
                  <Text
                    style={{
                      color: "#000000",
                      fontSize: 15,
                      fontFamily: "CircularStd",
                      fontWeight: "600",
                    }}
                  >
                    Create & Select
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
