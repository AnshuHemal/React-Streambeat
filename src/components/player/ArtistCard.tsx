import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  artistName: string;
  artistImage: string;
  songTitle: string;
};

export const ArtistCard = React.memo(function ArtistCard({
  artistName,
  artistImage,
  songTitle,
}: Props) {
  return (
    <>
      {/* About the artist */}
      <View
        style={{
          marginTop: 16,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: "#1e1e1e",
        }}
      >
        <View style={{ height: 220 }}>
          <Image
            source={{ uri: artistImage }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={300}
          />
          <View style={{ position: "absolute", top: 14, left: 16 }}>
            <Text
              style={{
                color: "#fff",
                fontSize: 15,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              About the artist
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 8,
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={{
                color: "#fff",
                fontSize: 20,
                fontFamily: "CircularStd",
                fontWeight: "600",
                marginBottom: 3,
              }}
            >
              {artistName}
            </Text>
            <Text
              style={{
                color: "#b3b3b3",
                fontSize: 13,
                fontFamily: "CircularStd",
              }}
            >
              11.9M monthly listeners
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              borderWidth: 1,
              borderColor: "#b3b3b3",
              paddingHorizontal: 20,
              paddingVertical: 8,
              borderRadius: 50,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 14,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              Follow
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Text
            style={{
              color: "#b3b3b3",
              fontSize: 14,
              fontFamily: "CircularStd",
              lineHeight: 21,
            }}
          >
            {artistName} — the name setting the Indian pop scene on fire! This
            20-year-old singer, songwriter, and composer from Dehradun, is a
            powerhouse of t...{" "}
            <Text style={{ color: "#fff", fontWeight: "600" }}>see more</Text>
          </Text>
        </View>
      </View>

      {/* Explore artist */}
      <View
        style={{
          marginTop: 16,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: "#1e1e1e",
          padding: 16,
          paddingBottom: 20,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontFamily: "CircularStd",
            fontWeight: "600",
            marginBottom: 14,
          }}
        >
          Explore {artistName}
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            `Songs by\n${artistName}`,
            `Similar to\n${artistName}`,
            `Similar to\n${songTitle}`,
          ].map((label, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.8}
              style={{
                flex: 1,
                aspectRatio: 0.75,
                borderRadius: 10,
                overflow: "hidden",
                backgroundColor: "#2a2a2a",
              }}
            >
              <Image
                source={{ uri: artistImage }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                contentFit="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.75)"]}
                locations={[0.4, 1]}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "60%",
                }}
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontFamily: "CircularStd",
                    fontWeight: "600",
                    lineHeight: 18,
                  }}
                >
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
});
