import { AuthProvider } from "@/context/AuthContext";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";
import "../../global.css";
import { StatusBar } from "expo-status-bar";

// Set CircularStd as the default font for all Text and TextInput components
const defaultTextStyle = { fontFamily: "CircularStd" };
const RNText = Text as any;
const RNTextInput = TextInput as any;
if (!RNText.defaultProps) RNText.defaultProps = {};
RNText.defaultProps.style = defaultTextStyle;
if (!RNTextInput.defaultProps) RNTextInput.defaultProps = {};
RNTextInput.defaultProps.style = defaultTextStyle;

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CircularStd: require("@/assets/fonts/Circular-Std.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" translucent={false} />
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: "#121212" },
          }}
        />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              backgroundColor: "#1e1e1e",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#2a2a2a",
            },
            titleStyle: {
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 14,
              fontWeight: "700",
            },
            descriptionStyle: {
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 12,
            },
          }}
        />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
