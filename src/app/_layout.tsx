import MiniPlayer from "@/components/MiniPlayer";
import PersistentTabBar from "@/components/PersistentTabBar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CreateButtonProvider } from "@/context/CreateButtonContext";
import { LikedSongsProvider } from "@/context/LikedSongsContext";
import { MusicPlayerProvider } from "@/context/MusicPlayerContext";
import { PlayHistoryProvider } from "@/context/PlayHistoryContext";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";
import "../../global.css";

const defaultTextStyle = { fontFamily: "CircularStd" };
const RNText = Text as any;
const RNTextInput = TextInput as any;
if (!RNText.defaultProps) RNText.defaultProps = {};
RNText.defaultProps.style = defaultTextStyle;
if (!RNTextInput.defaultProps) RNTextInput.defaultProps = {};
RNTextInput.defaultProps.style = defaultTextStyle;

SplashScreen.preventAutoHideAsync();

/**
 * Watches auth state — imperatively navigates to sign-in when session is null.
 * Must be rendered inside AuthProvider.
 */
function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !session) {
      router.replace("/(auth)/sign-in" as any);
    }
  }, [isLoaded, session]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CircularStd: require("@/assets/fonts/Circular-Std.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#121212");
      NavigationBar.setButtonStyleAsync("light");
    }
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#121212" }}>
      <StatusBar style="light" translucent={false} />
      <MusicPlayerProvider>
        <AuthProvider>
          <LikedSongsProvider>
            <PlayHistoryProvider>
              <CreateButtonProvider>
                <NavigationGuard>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "fade",
                    contentStyle: { backgroundColor: "#121212" },
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="search-input"
                    options={{ animation: "fade" }}
                  />
                  <Stack.Screen
                    name="album/[albumId]/index"
                    options={{ animation: "fade" }}
                  />
                  <Stack.Screen
                    name="artist/[artistId]/index"
                    options={{ animation: "fade" }}
                  />
                  <Stack.Screen
                    name="liked-songs/index"
                    options={{ animation: "fade" }}
                  />
                  <Stack.Screen
                    name="manage-artists"
                    options={{ animation: "fade" }}
                  />
                  <Stack.Screen
                    name="blend/index"
                    options={{ animation: "fade" }}
                  />
                </Stack>
                <PersistentTabBar />
                <MiniPlayer />
              </NavigationGuard>
              </CreateButtonProvider>
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 99999,
                    elevation: 99999,
                  }}
                  pointerEvents="box-none"
                >
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
                        fontWeight: "600",
                      },
                      descriptionStyle: {
                        color: "#a7a7a7",
                        fontFamily: "CircularStd",
                        fontSize: 12,
                      },
                    }}
                  />
                </View>
            </PlayHistoryProvider>
          </LikedSongsProvider>
        </AuthProvider>
      </MusicPlayerProvider>
    </GestureHandlerRootView>
  );
}
