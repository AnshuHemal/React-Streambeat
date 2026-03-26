import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");

const ALBUMS = [
  { color: "#7B2FBE", label: "HONK" },
  { color: "#4A7C59", label: "Easy on\nFriday" },
  { color: "#1a1a2e", label: "my life\nis a movie" },
  { color: "#B8860B", label: "HOUSEWERK" },
  { color: "#2C3E7A", label: "Old School\nReggaeton" },
  { color: "#8B1A1A", label: "Indie Mix" },
  { color: "#1DB954", label: "Chill Hits" },
  { color: "#E91E63", label: "Top 50" },
];

function AlbumGrid() {
  const size = W * 0.32;
  const gap = 8;
  return (
    <View
      style={{
        position: "absolute",
        top: -20,
        left: -20,
        right: -20,
        height: H * 0.28,
        transform: [{ rotate: "-12deg" }],
        flexDirection: "row",
        flexWrap: "wrap",
        gap,
        padding: 8,
      }}
      pointerEvents="none"
    >
      {ALBUMS.map((a, i) => (
        <View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: 6,
            backgroundColor: a.color,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontFamily: "CircularStd",
              fontSize: 13,
              fontWeight: "600",
              textAlign: "center",
              padding: 8,
            }}
          >
            {a.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function PremiumScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero section */}
        <View style={{ height: H * 0.52, overflow: "hidden" }}>
          <AlbumGrid />

          <LinearGradient
            colors={["rgba(18,18,18,0)", "rgba(18,18,18,0.6)", "#121212"]}
            locations={[0.2, 0.6, 1]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          <SafeAreaView
            edges={["top"]}
            style={{
              flex: 1,
              justifyContent: "flex-end",
              paddingHorizontal: 20,
              paddingBottom: 24,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <Image
                source={require("@/assets/images/logo-white.png")}
                style={{ width: 28, height: 28 }}
                resizeMode="contain"
              />
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "CircularStd",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Premium
              </Text>
            </View>

            <Text
              style={{
                color: "#ffffff",
                fontFamily: "CircularStd",
                fontSize: 24,
                fontWeight: "600",
                lineHeight: 38,
                marginBottom: 20,
              }}
            >
              Listen without limits. Try 3 months of Premium Standard for ₹99
              with Streambeat.
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.12)",
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                gap: 10,
                alignSelf: "flex-start",
              }}
            >
              <Ionicons
                name="notifications-outline"
                size={18}
                color="#ffffff"
              />
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "CircularStd",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Offer ends today
              </Text>
            </View>
          </SafeAreaView>
        </View>

        {/* CTA + legal */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 50,
              paddingVertical: 18,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: "#121212",
                fontFamily: "CircularStd",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Try 3 months for ₹99
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              color: "#a7a7a7",
              fontFamily: "CircularStd",
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            ₹99 for 3 months, then ₹199 per month after. Offer only available if
            you haven't tried Premium before and you subscribe via Streambeat.{" "}
            <Text style={{ color: "#ffffff", textDecorationLine: "underline" }}>
              Terms apply.
            </Text>
            {"\n"}Offer ends March 26, 2026. See other plans below.
          </Text>
        </View>

        {/* Feature highlights */}
        <View style={{ paddingHorizontal: 20, marginTop: 36 }}>
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 22,
              fontWeight: "600",
              marginBottom: 16,
            }}
          >
            Feature highlights
          </Text>

          {/* Music Videos card */}
          <View
            style={{
              backgroundColor: "#5C2000",
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                height: 180,
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
              }}
            >
              <View style={{ position: "relative", width: 200, height: 130 }}>
                <View
                  style={{
                    position: "absolute",
                    top: 20,
                    right: 10,
                    width: 110,
                    height: 80,
                    backgroundColor: "#A0400A",
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="play" size={20} color="#C85A10" />
                </View>
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 130,
                    height: 95,
                    backgroundColor: "#C85A10",
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="play-circle-outline"
                    size={36}
                    color="#E07030"
                  />
                </View>
              </View>
            </View>
            <View style={{ paddingHorizontal: 18, paddingBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <Ionicons
                  name="play-circle-outline"
                  size={14}
                  color="#1DB954"
                />
                <Text
                  style={{
                    color: "#1DB954",
                    fontFamily: "CircularStd",
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Music Videos
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "CircularStd",
                    fontSize: 20,
                    fontWeight: "600",
                    flex: 1,
                    lineHeight: 26,
                  }}
                >
                  The music you love, now in motion.
                </Text>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 22,
                    backgroundColor: "#ffffff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 12,
                  }}
                >
                  <Ionicons name="add" size={24} color="#121212" />
                </View>
              </View>
            </View>
          </View>

          {/* Jam card */}
          <View
            style={{
              backgroundColor: "#4A0A5E",
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                height: 180,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: "#7B2090",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: -16,
                    zIndex: 1,
                  }}
                >
                  <Ionicons name="person" size={36} color="#9B40B0" />
                </View>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: "#9B30B0",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: -16,
                    zIndex: 2,
                  }}
                >
                  <Ionicons name="person" size={36} color="#C060D0" />
                </View>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: "#E040C0",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 3,
                  }}
                >
                  <Ionicons name="add" size={36} color="#4A0A5E" />
                </View>
              </View>
            </View>
            <View style={{ paddingHorizontal: 18, paddingBottom: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <Ionicons name="people-outline" size={14} color="#1DB954" />
                <Text
                  style={{
                    color: "#1DB954",
                    fontFamily: "CircularStd",
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  Jam
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "CircularStd",
                    fontSize: 20,
                    fontWeight: "600",
                    flex: 1,
                    lineHeight: 26,
                  }}
                >
                  Turn any hangout into a Jam
                </Text>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 22,
                    backgroundColor: "#ffffff",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 12,
                  }}
                >
                  <Ionicons name="add" size={24} color="#121212" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Why join Premium Standard? */}
        <View style={{ paddingHorizontal: 20, marginTop: 12, marginBottom: 8 }}>
          <View
            style={{
              paddingVertical: 20,
              backgroundColor: "#1a1a1a",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontFamily: "CircularStd",
                fontSize: 20,
                marginTop: 8,
                paddingHorizontal: 20,
                paddingBottom: 16,
              }}
            >
              Why join Premium Standard?
            </Text>

            <View
              style={{
                height: 1,
                backgroundColor: "#2a2a2a",
                marginHorizontal: 20,
              }}
            />

            {[
              { icon: "volume-mute-outline", label: "Ad-free music listening" },
              { icon: "shuffle-outline", label: "Play songs in any order" },
              { icon: "headset-outline", label: "Very high audio quality" },
              {
                icon: "people-outline",
                label: "Listen with friends in real time",
              },
              { icon: "play-circle-outline", label: "Watch music videos" },
            ].map((item, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                }}
              >
                <Ionicons name={item.icon as any} size={24} color="#ffffff" />
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "CircularStd",
                    fontSize: 14,
                    fontWeight: "300",
                  }}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Available plans */}
        <View style={{ paddingHorizontal: 20, marginTop: 32, marginBottom: 8 }}>
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "CircularStd",
              fontSize: 22,
              fontWeight: "600",
              marginBottom: 16,
            }}
          >
            Available plans
          </Text>

          {[
            {
              name: "Lite",
              price: "₹139",
              period: "/ month",
              buttonLabel: "Get Premium Lite",
              buttonColor: "#C8E6FF",
              features: [
                "1 Lite account",
                "High audio quality (up to ~160kbps)",
                "Cancel anytime",
              ],
            },
          ].map((plan, i) => (
            <View
              key={i}
              style={{
                backgroundColor: "#1a1a1a",
                borderRadius: 16,
                padding: 20,
                marginBottom: 12,
              }}
            >
              {/* Logo + Premium label */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Image
                  source={require("@/assets/images/logo-white.png")}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "CircularStd",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Premium
                </Text>
              </View>

              {/* Plan name */}
              <Text
                style={{
                  color: "#90CAF9",
                  fontFamily: "CircularStd",
                  fontSize: 32,
                  fontWeight: "600",
                  marginBottom: 4,
                }}
              >
                {plan.name}
              </Text>

              {/* Price */}
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "CircularStd",
                  fontSize: 18,
                  fontWeight: "600",
                  marginBottom: 16,
                }}
              >
                {plan.price}{" "}
                <Text style={{ fontWeight: "400", fontSize: 16 }}>
                  {plan.period}
                </Text>
              </Text>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: "#2a2a2a",
                  marginBottom: 16,
                }}
              />

              {/* Features */}
              {plan.features.map((f, j) => (
                <View
                  key={j}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{ color: "#ffffff", fontSize: 16, lineHeight: 22 }}
                  >
                    •
                  </Text>
                  <Text
                    style={{
                      color: "#ffffff",
                      fontFamily: "CircularStd",
                      fontSize: 14,
                      lineHeight: 22,
                      flex: 1,
                    }}
                  >
                    {f}
                  </Text>
                </View>
              ))}

              {/* CTA button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={{
                  backgroundColor: plan.buttonColor,
                  borderRadius: 50,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Text
                  style={{
                    color: "#121212",
                    fontFamily: "CircularStd",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  {plan.buttonLabel}
                </Text>
              </TouchableOpacity>

              {/* Terms */}
              <Text
                style={{
                  color: "#777777",
                  fontFamily: "CircularStd",
                  fontSize: 13,
                  textAlign: "center",
                  marginTop: 12,
                  textDecorationLine: "underline",
                }}
              >
                Terms apply.
              </Text>
            </View>
          ))}

          {/* Standard plan — special layout with promo badge + two buttons */}
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            {/* Green promo badge — top-left corner */}
            <View
              style={{
                backgroundColor: "#1DB954",
                paddingHorizontal: 14,
                paddingVertical: 8,
                alignSelf: "flex-start",
                borderBottomRightRadius: 12,
              }}
            >
              <Text
                style={{
                  color: "#000000",
                  fontFamily: "CircularStd",
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                ₹99 for 3 months
              </Text>
            </View>

            <View style={{ padding: 20 }}>
              {/* Logo + Premium label */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Image
                  source={require("@/assets/images/logo-white.png")}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "CircularStd",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Premium
                </Text>
              </View>

              {/* Plan name — green */}
              <Text
                style={{
                  color: "#1DB954",
                  fontFamily: "CircularStd",
                  fontSize: 32,
                  fontWeight: "600",
                  marginBottom: 6,
                }}
              >
                Standard
              </Text>

              {/* Price — two lines */}
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "CircularStd",
                  fontSize: 17,
                  fontWeight: "600",
                  marginBottom: 2,
                }}
              >
                ₹99 for 3 months
              </Text>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontFamily: "CircularStd",
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                ₹199 / month after
              </Text>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: "#2a2a2a",
                  marginBottom: 16,
                }}
              />

              {/* Features */}
              {[
                "1 Standard account",
                "Download to listen offline",
                "Very high audio quality (up to ~320kbps)",
                "Cancel anytime",
                "Subscribe or one-time payment",
              ].map((f, j) => (
                <View
                  key={j}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{ color: "#ffffff", fontSize: 16, lineHeight: 22 }}
                  >
                    •
                  </Text>
                  <Text
                    style={{
                      color: "#ffffff",
                      fontFamily: "CircularStd",
                      fontSize: 14,
                      lineHeight: 22,
                      flex: 1,
                    }}
                  >
                    {f}
                  </Text>
                </View>
              ))}

              {/* Primary CTA — green */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={{
                  backgroundColor: "#1DB954",
                  borderRadius: 50,
                  paddingVertical: 18,
                  alignItems: "center",
                  marginTop: 8,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: "#000000",
                    fontFamily: "CircularStd",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Try 3 months for ₹99
                </Text>
              </TouchableOpacity>

              {/* Secondary CTA — outlined */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={{
                  borderRadius: 50,
                  paddingVertical: 18,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#535353",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "CircularStd",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  One-time payment
                </Text>
              </TouchableOpacity>

              {/* Legal text */}
              <Text
                style={{
                  color: "#a7a7a7",
                  fontFamily: "CircularStd",
                  fontSize: 12,
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                ₹99 for 3 months, then ₹199 per month after. Offer only
                available if you haven't tried Premium before and you subscribe
                via Streambeat. Offers via Google Play may differ.{" "}
                <Text style={{ textDecorationLine: "underline" }}>
                  Terms apply.
                </Text>
                {"\n"}Offer ends March 26, 2026.
              </Text>
            </View>
          </View>
          {/* Platinum plan */}
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 16,
              padding: 20,
              marginBottom: 12,
            }}
          >
            {/* Logo + Premium label */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Image
                source={require("@/assets/images/logo-white.png")}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "CircularStd",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Premium
              </Text>
            </View>

            {/* Plan name — yellow/lime */}
            <Text
              style={{
                color: "#E8FF47",
                fontFamily: "CircularStd",
                fontSize: 32,
                fontWeight: "600",
                marginBottom: 6,
              }}
            >
              Platinum
            </Text>

            {/* Price */}
            <Text
              style={{
                color: "#ffffff",
                fontFamily: "CircularStd",
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 16,
              }}
            >
              ₹299 / month
            </Text>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: "#2a2a2a",
                marginBottom: 16,
              }}
            />

            {/* Features */}
            {[
              "Up to 3 Platinum accounts",
              "Download to listen offline",
              "Lossless audio quality (up to ~24-bit/44.1kHz)",
              "Mix your playlists",
              "Your personal AI DJ",
              "AI playlist creation",
              "Connect your DJ software",
              "Cancel anytime",
            ].map((f, j) => (
              <View
                key={j}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{ color: "#ffffff", fontSize: 16, lineHeight: 22 }}
                >
                  •
                </Text>
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "CircularStd",
                    fontSize: 14,
                    lineHeight: 22,
                    flex: 1,
                  }}
                >
                  {f}
                </Text>
              </View>
            ))}

            {/* CTA — yellow */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={{
                backgroundColor: "#E8FF47",
                borderRadius: 50,
                paddingVertical: 18,
                alignItems: "center",
                marginTop: 8,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: "#000000",
                  fontFamily: "CircularStd",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Get Premium Platinum
              </Text>
            </TouchableOpacity>

            {/* Legal text */}
            <Text
              style={{
                color: "#a7a7a7",
                fontFamily: "CircularStd",
                fontSize: 12,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              For up to 3 individuals residing at the same address.{" "}
              <Text style={{ textDecorationLine: "underline" }}>
                Terms apply.
              </Text>
            </Text>
          </View>

          {/* Student plan */}
          <View
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            {/* Savings badge — top-left */}
            <View
              style={{
                backgroundColor: "#4CAF50",
                paddingHorizontal: 14,
                paddingVertical: 8,
                alignSelf: "flex-start",
                borderBottomRightRadius: 12,
              }}
            >
              <Text
                style={{
                  color: "#000000",
                  fontFamily: "CircularStd",
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                Savings available
              </Text>
            </View>

            <View style={{ padding: 20 }}>
              {/* Logo + Premium label */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Image
                  source={require("@/assets/images/logo-white.png")}
                  style={{ width: 20, height: 20 }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "CircularStd",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Premium
                </Text>
              </View>

              {/* Plan name — green */}
              <Text
                style={{
                  color: "#1DB954",
                  fontFamily: "CircularStd",
                  fontSize: 32,
                  fontWeight: "600",
                  marginBottom: 6,
                }}
              >
                Student
              </Text>

              {/* Price — two lines */}
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "CircularStd",
                  fontSize: 17,
                  fontWeight: "600",
                  marginBottom: 2,
                }}
              >
                ₹99 for 2 months
              </Text>
              <Text
                style={{
                  color: "#a7a7a7",
                  fontFamily: "CircularStd",
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                ₹99 / month after
              </Text>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: "#2a2a2a",
                  marginBottom: 16,
                }}
              />

              {/* Features */}
              {[
                "1 verified Standard account",
                "Download to listen offline",
                "Very high audio quality (up to ~320kbps)",
                "Cancel anytime",
              ].map((f, j) => (
                <View
                  key={j}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{ color: "#ffffff", fontSize: 16, lineHeight: 22 }}
                  >
                    •
                  </Text>
                  <Text
                    style={{
                      color: "#ffffff",
                      fontFamily: "CircularStd",
                      fontSize: 14,
                      lineHeight: 22,
                      flex: 1,
                    }}
                  >
                    {f}
                  </Text>
                </View>
              ))}

              {/* CTA — mint green */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={{
                  backgroundColor: "#A8E6CF",
                  borderRadius: 50,
                  paddingVertical: 18,
                  alignItems: "center",
                  marginTop: 8,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    color: "#000000",
                    fontFamily: "CircularStd",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Try 2 months for ₹99
                </Text>
              </TouchableOpacity>

              {/* Legal text */}
              <Text
                style={{
                  color: "#a7a7a7",
                  fontFamily: "CircularStd",
                  fontSize: 12,
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                ₹99 for 2 months, then ₹99 per month after. Offer reserved for
                students enrolled in an eligible accredited institution of
                higher education. Not available to users who have already tried
                Premium. Subject to the Streambeat Student Discount{" "}
                <Text style={{ textDecorationLine: "underline" }}>
                  Terms and Conditions
                </Text>
                .
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
