import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GENDER_OPTIONS = [
  "Female",
  "Male",
  "Non-binary",
  "Other",
  "Prefer not to say",
];

export default function SignUpGenderScreen() {
  const router = useRouter();
  const { email, password, dob } = useLocalSearchParams<{
    email: string;
    password: string;
    dob: string;
  }>();

  const [selected, setSelected] = useState<string | null>(null);

  const onSelect = (gender: string) => {
    setSelected(gender);
    setTimeout(() => {
      router.push({
        pathname: "/(auth)/signup/username" as any,
        params: { email, password, dob, gender },
      });
    }, 300);
  };

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
        <Text className="text-white text-lg font-CircularStd">
          Create account
        </Text>
      </View>

      <View className="flex-1 px-6 pt-4">
        <Text className="text-white text-3xl font-CircularStd mb-2">
          What's your gender?
        </Text>
        <Text className="text-[#a7a7a7] text-sm mb-8">
          We use your gender to personalise your experience.
        </Text>

        <View className="flex-row flex-wrap gap-3">
          {GENDER_OPTIONS.map((option) => {
            const isSelected = selected === option;
            const isDimmed = selected !== null && !isSelected;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => onSelect(option)}
                activeOpacity={0.7}
                style={{ opacity: isDimmed ? 0.3 : 1 }}
                className="border border-[#535353] rounded-full py-3 px-5 items-center"
              >
                <Text className="text-white font-CircularStd text-base">
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
