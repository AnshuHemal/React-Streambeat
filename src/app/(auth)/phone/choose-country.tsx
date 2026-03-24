import { countries, Country } from "@/constants/countries";
import { setCountrySelection } from "@/constants/countryStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    FlatList,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChooseCountryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.includes(searchQuery),
  );

  const onSelectCountry = (country: Country) => {
    setCountrySelection(country.name, country.code);
    router.back();
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      onPress={() => onSelectCountry(item)}
      className="flex-row items-center justify-between py-5 border-b border-[#222]"
      activeOpacity={0.7}
    >
      <Text className="text-white text-lg font-CircularStd">{item.name}</Text>
      <Text className="text-gray-400 text-lg font-CircularStd">
        {item.code}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#121212]">
      <View className="flex-row items-center justify-center px-4 py-4 relative">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-4 z-10 p-2"
        >
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold font-CircularStd">
          Choose your country
        </Text>
      </View>

      <View className="flex-1 px-4">
        <View className="bg-[#2a2a2a] rounded-xl flex-row items-center px-4 py-3 mb-6 mt-4">
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#888"
            className="flex-1 text-white ml-3 text-lg font-CircularStd"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredCountries}
          renderItem={renderCountryItem}
          keyExtractor={(item) => item.name}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}
