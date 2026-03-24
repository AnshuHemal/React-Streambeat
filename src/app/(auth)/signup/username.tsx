import useSignUp from "@/hooks/useSignUp";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function deriveNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const clean = local.replace(/[^a-zA-Z]/g, "");
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

function RadioButton({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: checked ? "#ffffff" : "#535353",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
      }}
    >
      {checked && (
        <View
          style={{
            width: 11,
            height: 11,
            borderRadius: 6,
            backgroundColor: "#ffffff",
          }}
        />
      )}
    </TouchableOpacity>
  );
}

function LoadingDots() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay((dots.length - i) * 150),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#121212",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ flexDirection: "row", gap: 10 }}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#ffffff",
              opacity: dot,
              transform: [
                {
                  scale: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                },
              ],
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default function SignUpUsernameScreen() {
  const router = useRouter();
  const { email, password, dob, gender } = useLocalSearchParams<{
    email: string;
    password: string;
    dob: string;
    gender: string;
  }>();

  const { signUp, signingUp } = useSignUp();

  const [name, setName] = useState(() => deriveNameFromEmail(email ?? ""));
  const [noMarketing, setNoMarketing] = useState(false);
  const [shareData, setShareData] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    setName(deriveNameFromEmail(email ?? ""));
  }, [email]);

  const isNameValid = name.trim().length >= 2;

  const validateName = (value: string) => {
    setName(value);
    if (value.trim().length < 2) {
      setNameError("Name must be at least 2 characters.");
    } else if (value.trim().length > 50) {
      setNameError("Name must be 50 characters or fewer.");
    } else {
      setNameError(null);
    }
  };

  const onCreateAccount = async () => {
    if (!isNameValid) return;
    const success = await signUp(email, password, {
      display_name: name.trim(),
      dob,
      gender,
      no_marketing: noMarketing,
      share_data: shareData,
    });
    if (success) {
      router.replace("/(auth)/signup/notifications" as any);
    } else {
      Alert.alert("Error", "Could not create account. Please try again.");
    }
  };

  if (signingUp) return <LoadingDots />;

  return (
    <SafeAreaView className="flex-1 bg-[#121212]">
      <View className="flex-row items-center justify-center px-4 py-4 relative">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-4 p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold font-CircularStd">
          Create account
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 48,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white text-3xl font-bold font-CircularStd mb-2">
          What's your name?
        </Text>
        <Text className="text-[#a7a7a7] text-sm font-CircularStd mb-6">
          This appears on your Streambeat profile.
        </Text>

        <View
          className={`border rounded-lg px-4 py-4 bg-[#1a1a1a] mb-1 ${nameError ? "border-[#e91429]" : "border-[#535353]"}`}
        >
          <TextInput
            autoFocus
            placeholder="Name"
            placeholderTextColor="#535353"
            className="text-white text-base font-CircularStd"
            value={name}
            onChangeText={validateName}
            selectionColor="#1DB954"
            maxLength={50}
            returnKeyType="done"
          />
        </View>
        {nameError ? (
          <Text className="text-[#e91429] text-xs font-CircularStd mb-4">
            {nameError}
          </Text>
        ) : (
          <Text className="text-[#a7a7a7] text-xs font-CircularStd mb-6">
            This appears on your Streambeat profile.
          </Text>
        )}

        <View className="border-t border-[#2a2a2a] mb-6" />

        <Text className="text-[#a7a7a7] text-sm font-CircularStd mb-3 leading-5">
          Streambeat is a personalized service.{"\n"}By tapping "Create
          account", you agree to the Streambeat{" "}
          <Text className="text-[#1DB954] font-CircularStd">Terms of Use</Text>.
        </Text>

        <Text className="text-[#a7a7a7] text-sm font-CircularStd mb-6 leading-5">
          By tapping "Create account", you confirm that you have read how we
          process your personal data in our{" "}
          <Text className="text-[#1DB954] font-CircularStd">
            Privacy Policy
          </Text>
          .
        </Text>

        <View className="gap-y-4 mb-8">
          <TouchableOpacity
            onPress={() => setNoMarketing((v) => !v)}
            activeOpacity={0.7}
            className="flex-row items-start gap-x-3"
          >
            <Text className="flex-1 text-[#a7a7a7] text-sm font-CircularStd leading-5">
              I would prefer not to receive marketing messages from Streambeat.
            </Text>
            <RadioButton
              checked={noMarketing}
              onToggle={() => setNoMarketing((v) => !v)}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShareData((v) => !v)}
            activeOpacity={0.7}
            className="flex-row items-start gap-x-3"
          >
            <Text className="flex-1 text-[#a7a7a7] text-sm font-CircularStd leading-5">
              Share my registration data with Streambeat's content providers for
              marketing purposes.
            </Text>
            <RadioButton
              checked={shareData}
              onToggle={() => setShareData((v) => !v)}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onCreateAccount}
          disabled={!isNameValid}
          className={`bg-white rounded-full py-4 w-full items-center ${!isNameValid ? "opacity-40" : ""}`}
          activeOpacity={0.85}
        >
          <Text className="text-black font-bold text-base font-CircularStd">
            Create account
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
