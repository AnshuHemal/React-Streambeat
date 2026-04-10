import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function CreatePlaylistScreen() {
  const router = useRouter();
  const [playlistName, setPlaylistName] = useState("My playlist");
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const inputFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonsFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Focus input after navigation
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);

    // Entrance animations
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(inputFadeAnim, {
          toValue: 1,
          duration: 300,
          delay: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonsFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCancel = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  const handleCreate = () => {
    // TODO: Create playlist logic
    console.log("Creating playlist:", playlistName);
    router.back();
  };

  const handleClear = () => {
    setPlaylistName("");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2a2a2a" />

      {/* Gradient background */}
      <LinearGradient
        colors={["#4a4a4a", "#2a2a2a", "#121212", "#000000"]}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.title}>Give your playlist a name</Text>
        </Animated.View>

        {/* Input Section */}
        <Animated.View
          style={[styles.inputContainer, { opacity: inputFadeAnim }]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={playlistName}
              onChangeText={setPlaylistName}
              placeholder="My playlist #2"
              placeholderTextColor="#666"
              selectionColor="#1DB954"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {playlistName.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <View style={styles.clearIconContainer}>
                  <Ionicons name="close" size={14} color="#000" />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Divider line */}
          <View style={styles.divider} />
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={[styles.buttonContainer, { opacity: buttonsFadeAnim }]}
        >
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.cancelButton}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCreate}
            style={[
              styles.createButton,
              playlistName.trim().length === 0 && styles.createButtonDisabled,
            ]}
            activeOpacity={playlistName.trim().length > 0 ? 0.8 : 1}
            disabled={playlistName.trim().length === 0}
          >
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Spacer for keyboard */}
        <View style={styles.keyboardSpacer} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#ffffff",
    fontFamily: "CircularStd",
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 60,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    fontSize: 32,
    fontWeight: "600",
    color: "#ffffff",
    fontFamily: "CircularStd",
    textAlign: "center",
    paddingVertical: 8,
    minWidth: 200,
    flex: 1,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#b3b3b3",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#b3b3b3",
    marginTop: 4,
    opacity: 0.5,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#b3b3b3",
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    fontFamily: "CircularStd",
  },
  createButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    backgroundColor: "#1DB954",
  },
  createButtonDisabled: {
    backgroundColor: "#1DB954",
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    fontFamily: "CircularStd",
  },
  keyboardSpacer: {
    height: 100,
  },
});
