import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ITEM_H = 50;
const VISIBLE = 5; // must be odd — center item is selected
const PAD = ITEM_H * Math.floor(VISIBLE / 2); // padding so first/last items can center

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function buildDays(month: number, year: number) {
  return Array.from({ length: getDaysInMonth(month, year) }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
}

// ─── Wheel column ────────────────────────────────────────────────────────────
function WheelColumn({
  data,
  selectedIndex,
  onChange,
}: {
  data: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}) {
  const ref = useRef<ScrollView>(null);
  const hasMomentum = useRef(false);

  const snapToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(data.length - 1, index));
      onChange(clamped);
      ref.current?.scrollTo({ y: clamped * ITEM_H, animated: true });
    },
    [data.length, onChange],
  );

  const onLayout = useCallback(() => {
    ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
  }, [selectedIndex]);

  // Fling ended — snap to nearest
  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      hasMomentum.current = false;
      const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      snapToIndex(index);
    },
    [snapToIndex],
  );

  // Finger lifted — only snap if no momentum fling followed
  const onDragEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      hasMomentum.current = false;
      // Delay to let onMomentumScrollBegin fire first if there's a fling
      const y = e.nativeEvent.contentOffset.y;
      setTimeout(() => {
        if (!hasMomentum.current) {
          const index = Math.round(y / ITEM_H);
          snapToIndex(index);
        }
      }, 50);
    },
    [snapToIndex],
  );

  return (
    <View style={{ flex: 1, height: ITEM_H * VISIBLE, overflow: "hidden" }}>
      {/* highlight band */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: PAD,
          left: 4,
          right: 4,
          height: ITEM_H,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: "#3a3a3a",
          zIndex: 10,
        }}
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={32}
        onLayout={onLayout}
        onMomentumScrollBegin={() => {
          hasMomentum.current = true;
        }}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onDragEnd}
        contentContainerStyle={{ paddingVertical: PAD }}
      >
        {data.map((item, i) => {
          const isSelected = i === selectedIndex;
          return (
            <View
              key={item + i}
              style={{
                height: ITEM_H,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "CircularStd",
                  fontSize: isSelected ? 18 : 14,
                  fontWeight: isSelected ? "700" : "400",
                  color: isSelected ? "#ffffff" : "#444444",
                }}
              >
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function SignUpDobScreen() {
  const router = useRouter();
  const { email, password } = useLocalSearchParams<{
    email: string;
    password: string;
  }>();

  const today = new Date();
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [yearIndex, setYearIndex] = useState(0);
  const [dayIndex, setDayIndex] = useState(today.getDate() - 1);

  const days = useMemo(
    () => buildDays(monthIndex, Number(YEARS[yearIndex])),
    [monthIndex, yearIndex],
  );

  const handleMonthChange = useCallback(
    (index: number) => {
      setMonthIndex(index);
      const max = getDaysInMonth(index, Number(YEARS[yearIndex])) - 1;
      setDayIndex((d) => Math.min(d, max));
    },
    [yearIndex],
  );

  const handleYearChange = useCallback(
    (index: number) => {
      setYearIndex(index);
      const max = getDaysInMonth(monthIndex, Number(YEARS[index])) - 1;
      setDayIndex((d) => Math.min(d, max));
    },
    [monthIndex],
  );

  const clampedDay = Math.min(dayIndex, days.length - 1);
  const [ageError, setAgeError] = useState<string | null>(null);

  const onNext = () => {
    const year = Number(YEARS[yearIndex]);
    const month = monthIndex;
    const day = clampedDay + 1;

    const dob = new Date(year, month, day);
    const today = new Date();
    const age =
      today.getFullYear() -
      dob.getFullYear() -
      (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
        ? 1
        : 0);

    if (age < 15) {
      setAgeError("You must be at least 15 years old to sign up.");
      return;
    }

    setAgeError(null);
    const dobStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    router.push({
      pathname: "/(auth)/signup/gender" as any,
      params: { email, password, dob: dobStr },
    });
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
          What's your date{"\n"}of birth?
        </Text>
        <Text className="text-[#a7a7a7] text-sm mb-8">
          This won't be shown on your profile.
        </Text>

        {/* Labels */}
        <View className="flex-row mb-1">
          {["Month", "Day", "Year"].map((l) => (
            <Text
              key={l}
              className="flex-1 text-center text-[#a7a7a7] text-xs uppercase tracking-widest"
            >
              {l}
            </Text>
          ))}
        </View>

        {/* Pickers */}
        <View style={{ flexDirection: "row" }}>
          <WheelColumn
            data={MONTHS}
            selectedIndex={monthIndex}
            onChange={(i) => {
              handleMonthChange(i);
              setAgeError(null);
            }}
          />
          <WheelColumn
            key={`day-${days.length}`}
            data={days}
            selectedIndex={clampedDay}
            onChange={(i) => {
              setDayIndex(i);
              setAgeError(null);
            }}
          />
          <WheelColumn
            data={YEARS}
            selectedIndex={yearIndex}
            onChange={(i) => {
              handleYearChange(i);
              setAgeError(null);
            }}
          />
        </View>

        <View className="items-center mt-8">
          {ageError && (
            <Text className="text-[#e91429] text-sm text-center mb-4 px-4">
              {ageError}
            </Text>
          )}
          <TouchableOpacity
            onPress={onNext}
            className="bg-white rounded-full py-4 px-16 items-center"
            activeOpacity={0.85}
          >
            <Text className="text-black font-CircularStd text-base">Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
