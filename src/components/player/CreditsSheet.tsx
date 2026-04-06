import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  ROLE_TO_SECTION,
  SECTION_ORDER,
  SongCreditsPayload,
} from "@/services/credits";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import type { CreditEntry } from "./CreditsCard";
import LoadingDots from "../LoadingDots";

const { height: SCREEN_H } = Dimensions.get("window");
const DISMISS_THRESHOLD = 80;

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionEntry = {
  artistId: string;
  name: string;
  sectionRoles: string;
};

type CreditSection = {
  title: string;
  entries: SectionEntry[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  songTitle: string;
  artistNames: string;
  payload: SongCreditsPayload;
};

// ─── Grouping ─────────────────────────────────────────────────────────────────

function groupCredits(
  credits: CreditEntry[],
  sources: string[],
): CreditSection[] {
  const sectionMap: Record<string, SectionEntry[]> = {};

  credits.forEach((credit) => {
    const roles = credit.roles
      .split(" • ")
      .map((r) => r.trim())
      .filter(Boolean);

    const rolesBySection: Record<string, string[]> = {};
    roles.forEach((role) => {
      const section =
        ROLE_TO_SECTION[role as keyof typeof ROLE_TO_SECTION] ?? "Artist";
      if (!rolesBySection[section]) rolesBySection[section] = [];
      rolesBySection[section].push(role);
    });

    Object.entries(rolesBySection).forEach(([section, sectionRoles]) => {
      if (!sectionMap[section]) sectionMap[section] = [];
      if (!sectionMap[section].find((e) => e.artistId === credit.artistId)) {
        sectionMap[section].push({
          artistId: credit.artistId,
          name: credit.name,
          sectionRoles: sectionRoles.join(" • "),
        });
      }
    });
  });

  const sections: CreditSection[] = SECTION_ORDER.filter(
    (s) => sectionMap[s]?.length > 0,
  ).map((title) => ({ title, entries: sectionMap[title] }));

  if (sources.length > 0) {
    sections.push({
      title: "Sources",
      entries: sources.map((name) => ({
        artistId: `source-${name}`,
        name,
        sectionRoles: "",
      })),
    });
  }

  return sections;
}

function buildFollowMap(
  prefs: string[] | null | undefined,
  credits: CreditEntry[],
): Record<string, boolean> {
  const list = prefs ?? [];
  const map: Record<string, boolean> = {};
  credits.forEach((c) => {
    map[c.artistId] = list.includes(c.artistId);
  });
  return map;
}

// ─── Animated row wrapper ─────────────────────────────────────────────────────

function AnimatedRow({
  index,
  sheetVisible,
  children,
}: {
  index: number;
  sheetVisible: boolean;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (sheetVisible) {
      // Stagger each row by 40ms
      const delay = 180 + index * 40;
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      translateY.setValue(12);
    }
  }, [sheetVisible]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── ArtistRow ────────────────────────────────────────────────────────────────

function ArtistRow({
  entry,
  isFollowing,
  isLoading,
  onToggle,
  showFollow,
}: {
  entry: SectionEntry;
  isFollowing: boolean;
  isLoading: boolean;
  onToggle: () => void;
  showFollow: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 15,
            fontFamily: "CircularStd",
            fontWeight: "600",
            marginBottom: 2,
          }}
        >
          {entry.name}
        </Text>
        {!!entry.sectionRoles && (
          <Text
            style={{
              color: "#a7a7a7",
              fontSize: 13,
              fontFamily: "CircularStd",
            }}
          >
            {entry.sectionRoles}
          </Text>
        )}
      </View>

      {showFollow && (
        <TouchableOpacity
          onPress={onToggle}
          activeOpacity={0.75}
          disabled={isLoading}
          style={{
            borderWidth: 1,
            borderColor: "#727272",
            paddingHorizontal: 22,
            paddingVertical: 8,
            borderRadius: 50,
            minWidth: 96,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isLoading ? (
            <LoadingDots />
          ) : (
            <Text
              style={{
                color: "#fff",
                fontSize: 13,
                fontFamily: "CircularStd",
                fontWeight: "600",
              }}
            >
              {isFollowing ? "Following" : "Follow"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── SourceRow ────────────────────────────────────────────────────────────────

function SourceRow({ name }: { name: string }) {
  return (
    <View style={{ paddingVertical: 12 }}>
      <Text
        style={{
          color: "#fff",
          fontSize: 15,
          fontFamily: "CircularStd",
          fontWeight: "400",
        }}
      >
        {name}
      </Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreditsSheet({
  visible,
  onClose,
  songTitle,
  artistNames,
  payload,
}: Props) {
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();

  const [following, setFollowing] = useState<Record<string, boolean>>(() =>
    buildFollowMap(profile?.artist_preferences, payload.credits),
  );
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFollowing(buildFollowMap(profile?.artist_preferences, payload.credits));
  }, [profile?.artist_preferences, payload.credits]);

  // ── Sheet animations ─────────────────────────────────────────────────────────

  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // Header fade-in
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_H);
      dragY.setValue(0);
      backdropOpacity.setValue(0);
      headerOpacity.setValue(0);
      headerY.setValue(8);

      Animated.parallel([
        // Sheet slides up
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
          easing: (t) => 1 - Math.pow(1 - t, 3),
        }),
        // Backdrop fades in
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        // Header fades in slightly after sheet starts
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 240,
          delay: 120,
          useNativeDriver: true,
        }),
        Animated.timing(headerY, {
          toValue: 0,
          duration: 240,
          delay: 120,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 260,
          useNativeDriver: true,
          easing: (t) => t * t * t,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // ── Drag to dismiss ──────────────────────────────────────────────────────────

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, gs) => gs.dy > 4,
      onPanResponderGrant: () => {
        dragY.setValue(0);
      },
      onPanResponderMove: (_e, gs) => {
        if (gs.dy > 0) {
          dragY.setValue(gs.dy);
          backdropOpacity.setValue(
            1 - Math.min(gs.dy / DISMISS_THRESHOLD, 1) * 0.6,
          );
        }
      },
      onPanResponderRelease: (_e, gs) => {
        if (gs.dy > DISMISS_THRESHOLD || gs.vy > 0.5) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: SCREEN_H,
              duration: 220,
              useNativeDriver: true,
              easing: (t) => t * t,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 180,
              useNativeDriver: true,
            }),
          ]).start(() => {
            dragY.setValue(0);
            onClose();
          });
        } else {
          Animated.parallel([
            Animated.spring(dragY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 80,
              friction: 12,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  const combinedY = Animated.add(translateY, dragY);

  // ── Follow toggle ────────────────────────────────────────────────────────────

  const toggle = useCallback(
    async (artistId: string, artistName: string) => {
      if (!user) {
        toast.error("Sign in to follow artists");
        return;
      }
      if (artistId.startsWith("unknown-") || artistId === "mock") {
        toast.error("Cannot follow an unverified artist.");
        return;
      }

      const isFollowing = following[artistId] ?? false;
      setFollowing((prev) => ({ ...prev, [artistId]: !isFollowing }));
      setLoading((prev) => ({ ...prev, [artistId]: true }));

      try {
        const current = profile?.artist_preferences ?? [];
        const updated = isFollowing
          ? current.filter((id) => id !== artistId)
          : [...current, artistId];

        const { error } = await supabase
          .from("profiles")
          .update({ artist_preferences: updated })
          .eq("id", user.id);

        if (error) throw error;
        await refreshProfile();
        toast.success(
          isFollowing ? `Unfollowed ${artistName}` : `Following ${artistName}`,
        );
      } catch {
        setFollowing((prev) => ({ ...prev, [artistId]: isFollowing }));
        toast.error("Something went wrong. Try again.");
      } finally {
        setLoading((prev) => ({ ...prev, [artistId]: false }));
      }
    },
    [user, profile?.artist_preferences, following, refreshProfile],
  );

  // ── Build sections + flat row index for stagger ───────────────────────────

  const sections = groupCredits(payload.credits, payload.sources);

  // Assign a global row index across all sections for stagger timing
  let rowIndex = 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            opacity: backdropOpacity,
          }}
        />
      </TouchableWithoutFeedback>

      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View
          style={{
            backgroundColor: "#1e1e1e",
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            maxHeight: SCREEN_H * 0.92,
            paddingBottom: insets.bottom + 20,
            transform: [{ translateY: combinedY }],
          }}
        >
          {/* ── Drag handle ── */}
          <View
            {...panResponder.panHandlers}
            style={{ alignItems: "center", paddingTop: 12, paddingBottom: 6 }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                backgroundColor: "#535353",
                borderRadius: 2,
              }}
            />
          </View>

          {/* ── Header: song title + artist names ── */}
          <Animated.View
            {...panResponder.panHandlers}
            style={{
              alignItems: "center",
              paddingHorizontal: 24,
              paddingTop: 10,
              paddingBottom: 18,
              borderBottomWidth: 1,
              borderBottomColor: "#2a2a2a",
              opacity: headerOpacity,
              transform: [{ translateY: headerY }],
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: "#fff",
                fontSize: 16,
                fontFamily: "CircularStd",
                fontWeight: "600",
                marginBottom: 5,
              }}
            >
              {songTitle}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color: "#a7a7a7",
                fontSize: 13,
                fontFamily: "CircularStd",
              }}
            >
              {artistNames}
            </Text>
          </Animated.View>

          {/* ── Scrollable sections ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: 12,
            }}
            bounces={false}
          >
            {sections.map((section, sectionIndex) => {
              const sectionHeadingIndex = rowIndex++;

              return (
                <AnimatedRow
                  key={section.title}
                  index={sectionHeadingIndex}
                  sheetVisible={visible}
                >
                  {/* ── Section block ── */}
                  <View
                    style={{
                      borderTopWidth: sectionIndex === 0 ? 0 : 1,
                      borderTopColor: "#2a2a2a",
                      paddingHorizontal: 24,
                      paddingTop: sectionIndex === 0 ? 16 : 28,
                      paddingBottom: 8,
                    }}
                  >
                    {/* Section heading */}
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 19,
                        fontFamily: "CircularStd",
                        fontWeight: "600",
                        marginBottom: 4,
                      }}
                    >
                      {section.title}
                    </Text>

                    {/* Entries */}
                    {section.title === "Sources"
                      ? section.entries.map((entry, entryIndex) => {
                          const idx = rowIndex++;
                          return (
                            <AnimatedRow
                              key={entry.artistId}
                              index={idx}
                              sheetVisible={visible}
                            >
                              <View
                                style={{
                                  borderTopWidth: entryIndex === 0 ? 0 : 1,
                                  borderTopColor: "#1e1e1e",
                                }}
                              >
                                <SourceRow name={entry.name} />
                              </View>
                            </AnimatedRow>
                          );
                        })
                      : section.entries.map((entry, entryIndex) => {
                          const idx = rowIndex++;
                          return (
                            <AnimatedRow
                              key={`${section.title}-${entry.artistId}`}
                              index={idx}
                              sheetVisible={visible}
                            >
                              <View
                                style={{
                                  borderTopWidth: entryIndex === 0 ? 0 : 1,
                                  borderTopColor: "#1e1e1e",
                                }}
                              >
                                <ArtistRow
                                  entry={entry}
                                  isFollowing={
                                    following[entry.artistId] ?? false
                                  }
                                  isLoading={loading[entry.artistId] ?? false}
                                  onToggle={() =>
                                    toggle(entry.artistId, entry.name)
                                  }
                                  showFollow={section.title === "Artist"}
                                />
                              </View>
                            </AnimatedRow>
                          );
                        })}
                  </View>
                </AnimatedRow>
              );
            })}

            {/* ── Report error ── */}
            <AnimatedRow index={rowIndex} sheetVisible={visible}>
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "#2a2a2a",
                  alignItems: "center",
                  paddingTop: 28,
                  paddingBottom: 4,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{
                    borderWidth: 1,
                    borderColor: "#535353",
                    paddingHorizontal: 26,
                    paddingVertical: 12,
                    borderRadius: 50,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 12,
                      fontFamily: "CircularStd",
                      fontWeight: "600",
                    }}
                  >
                    Report error
                  </Text>
                </TouchableOpacity>
              </View>
            </AnimatedRow>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
