import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
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
  const { user, profile } = useAuth();

  const username = user?.id?.slice(0, 28) ?? "—";
  const email = user?.email ?? "—";

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

        <AccountRow label="Username" value={username} />
        <Divider />

        <AccountRow label="Email" value={email} showExternal />
        <Divider />

        <AccountRow label="Address" value="View and change your address." />
        <Divider />

        <AccountRow
          label="Account overview"
          value="View more account details on the web."
          showExternal
        />
        <Divider />

        {/* Your plan */}
        <SectionHeader title="Your plan" />
        <Divider />

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
        <Divider />

        {/* Delete account */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 13,
              fontFamily: "CircularStd",
              lineHeight: 20,
            }}
          >
            To delete your data permanently,{" "}
            <Text style={{ color: "#a7a7a7", textDecorationLine: "underline" }}>
              close your account.
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
