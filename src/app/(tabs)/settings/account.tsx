import BottomDialog from "@/components/BottomDialog";
import SettingHighlightRow from "@/components/SettingHighlightRow";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
        paddingBottom: 12,
      }}
    >
      {title}
    </Text>
  );
}

function Divider() {
  return (
    <View
      style={{ height: 1, backgroundColor: "#2a2a2a", marginHorizontal: 20 }}
    />
  );
}

function AccountRow({
  label,
  value,
  showExternal = false,
  onPress,
}: {
  label: string;
  value: string;
  showExternal?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#ffffff",
            fontSize: 16,
            fontFamily: "CircularStd",
            marginBottom: 3,
          }}
        >
          {label}
        </Text>
        <Text
          style={{ color: "#a7a7a7", fontSize: 14, fontFamily: "CircularStd" }}
        >
          {value}
        </Text>
      </View>
      {showExternal && (
        <Ionicons
          name="open-outline"
          size={18}
          color="#a7a7a7"
          style={{ marginLeft: 12 }}
        />
      )}
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format username: remove hyphens and join into one word
  const rawUsername = user?.id?.slice(0, 28) ?? "";
  const username = rawUsername ? rawUsername.replace(/-/g, "") : "—";
  const email = user?.email ?? "—";

  // Delete all user data and close account
  const handleCloseAccount = async () => {
    if (!user?.id) return;
    setIsDeleting(true);

    try {
      // Delete user data from all related tables
      await Promise.all([
        // Delete liked songs
        supabase.from("user_liked_songs").delete().eq("user_id", user.id),
        // Delete search history
        supabase.from("user_search_history").delete().eq("user_id", user.id),
        // Delete play history
        supabase.from("user_play_history").delete().eq("user_id", user.id),
        // Delete profile
        supabase.from("profiles").delete().eq("id", user.id),
      ]);

      // Sign out the user
      await signOut();

      // Navigate to login screen
      router.replace("/login");
    } catch (error) {
      console.error("Error closing account:", error);
    } finally {
      setIsDeleting(false);
      setShowCloseDialog(false);
    }
  };

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
          Account
        </Text>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => router.push("/(tabs)/settings/search" as any)}
        >
          <Ionicons name="search" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Account details */}
        <SectionHeader title="Account details" />
        <Divider />

        <SettingHighlightRow label="Username">
          <AccountRow label="Username" value={username} />
        </SettingHighlightRow>
        <Divider />

        <SettingHighlightRow label="Email">
          <AccountRow label="Email" value={email} showExternal />
        </SettingHighlightRow>
        <Divider />

        <SettingHighlightRow label="Address">
          <AccountRow label="Address" value="View and change your address." />
        </SettingHighlightRow>
        <Divider />

        <SettingHighlightRow label="Account overview">
          <AccountRow
            label="Account overview"
            value="View more account details on the web."
            showExternal
          />
        </SettingHighlightRow>
        <Divider />

        {/* Your plan */}
        <SectionHeader title="Your plan" />
        <Divider />

        <SettingHighlightRow label="Your plan">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(tabs)/premium" as any)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 16,
              gap: 16,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 8,
                backgroundColor: "#2a2a2a",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={require("@/assets/images/logo-white.png")}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 16,
                  fontFamily: "CircularStd",
                  fontWeight: "600",
                }}
              >
                Free plan
              </Text>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontSize: 13,
                  fontFamily: "CircularStd",
                }}
              >
                View your plan
              </Text>
            </View>
          </TouchableOpacity>
        </SettingHighlightRow>
        <Divider />

        {/* Delete account */}
        <SettingHighlightRow label="Close account">
          <TouchableOpacity
            onPress={() => setShowCloseDialog(true)}
            style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}
          >
            <Text
              style={{
                color: "#a7a7a7",
                fontSize: 12,
                fontFamily: "CircularStd",
                lineHeight: 20,
              }}
            >
              To delete your data permanently,{" "}
              <Text
                style={{ color: "#a7a7a7", textDecorationLine: "underline" }}
              >
                close your account.
              </Text>
            </Text>
          </TouchableOpacity>
        </SettingHighlightRow>
      </ScrollView>

      {/* Close Account Confirmation Dialog */}
      <BottomDialog
        visible={showCloseDialog}
        title="Close your account?"
        description="This will permanently delete all your data including your liked songs, search history, and play history. This action cannot be undone."
        confirmLabel={isDeleting ? "Closing..." : "Close Account"}
        dismissLabel="Cancel"
        onConfirm={handleCloseAccount}
        onDismiss={() => setShowCloseDialog(false)}
      />

      {/* Loading overlay during deletion */}
      {isDeleting && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <ActivityIndicator size="large" color="#ffffff" />
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 14,
              marginTop: 12,
            }}
          >
            Deleting your data...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
