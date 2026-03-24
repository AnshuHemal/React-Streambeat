import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpNotificationsScreen() {
  const router = useRouter();

  const proceed = () => router.replace("/onboarding/music" as any);

  return (
    <SafeAreaView className="flex-1 bg-[#121212]">
      <View className="flex-1 items-center justify-center px-8">
        {/* Mock notification card */}
        <View
          style={{
            backgroundColor: "#1e1e1e",
            borderRadius: 16,
            padding: 16,
            width: "85%",
            marginBottom: 48,
            shadowColor: "#000",
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center gap-x-3 mb-3">
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "#1DB954",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={require("@/assets/images/logo-white.png")}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
            </View>
            <Text
              style={{
                color: "#ffffff",
                fontFamily: "CircularStd",
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              Streambeat
            </Text>
          </View>
          <View
            style={{
              height: 10,
              backgroundColor: "#2a2a2a",
              borderRadius: 5,
              marginBottom: 8,
              width: "80%",
            }}
          />
          <View
            style={{
              height: 10,
              backgroundColor: "#2a2a2a",
              borderRadius: 5,
              width: "55%",
            }}
          />
        </View>

        <Text className="text-white text-2xl font-bold  text-center mb-4">
          Turn on notifications
        </Text>
        <Text className="text-[#a7a7a7] text-base  text-center mb-10 leading-6">
          Get updates about new music, special offers, events and more.
        </Text>

        <TouchableOpacity
          onPress={proceed}
          className="bg-white rounded-full py-4 w-full items-center mb-4"
          activeOpacity={0.85}
        >
          <Text className="text-black font-bold text-base ">
            Turn on notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={proceed}
          activeOpacity={0.7}
          className="py-3"
        >
          <Text className="text-white font-bold text-base ">Not now</Text>
        </TouchableOpacity>

        <Text className="text-[#a7a7a7] text-xs  text-center mt-10 leading-5 px-4">
          Manage your notification categories in Settings at any time.
        </Text>
      </View>
    </SafeAreaView>
  );
}
