import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View, StyleSheet, Image } from "react-native";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.replace("/(auth)/sign-in")
    }, 2500);
  }, []);
  
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <Image
        source={require("@/assets/images/logo.png")}
        className="w-[140px] h-[140px]"
        alt="logo"
        resizeMode="contain"
      />
    </View>
  );
}
