import {
  AudioPlayer,
  AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from "expo-audio";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated } from "react-native";
import { PlayerPositionContext } from "./PlayerPositionContext";

// ─── Global play-record bridge ────────────────────────────────────────────────
// PlayHistoryProvider sets this ref so MusicPlayerContext can call recordPlay
// without a circular context dependency.
export const globalRecordPlayRef = {
  current: null as ((songId: string, artistIds: string[]) => void) | null,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Song = {
  id: string;
  title: string;
  artist_name?: string;
  artists?: { id: string; name: string; image_url: string | null }[];
  album_title?: string;
  image_url: string | null;
  audio_url: string | null;
  preview_url: string | null;
  duration_ms: number | null;
  lyrics?: string | null;
  quality_urls?: {
    medium: string;
    high: string;
    preview: string;
  };
};

type PlayingFromSource = "LIBRARY" | "ALBUM" | "SEARCH" | "ARTIST" | "HOME" | "LIKED_SONGS" | null;

type MusicPlayerContextType = {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  isLoading: boolean;
  isBuffering: boolean;
  isExpanded: boolean;
  expandAnim: Animated.Value;
  playSong: (song: Song) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  setIsExpanded: (expanded: boolean) => void;
  toggleExpand: () => void;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  playQueue: Song[];
  currentIndex: number;
  setQueue: (songs: Song[], startIndex?: number, source?: PlayingFromSource) => void;
  /** Where the current playback originated from (Library, Album, Search, etc.) */
  playingFrom: PlayingFromSource;
  /** Stops playback, clears the current song, and hides the player */
  stopPlayer: () => void;
};

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
  undefined,
);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MusicPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── React state ────────────────────────────────────────────────────────────
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playQueue, setPlayQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playingFrom, setPlayingFrom] = useState<PlayingFromSource>(null);

  // ── Refs (never cause re-renders) ──────────────────────────────────────────
  const playerRef = useRef<AudioPlayer | null>(null);
  const durationRef = useRef(0);
  const seekLockUntilRef = useRef(0); // ms timestamp — block position updates until this time
  const lastPositionUpdateRef = useRef(0); // throttle position setState calls
  const currentSongRef = useRef<Song | null>(null);
  const playQueueRef = useRef<Song[]>([]);
  const currentIndexRef = useRef(0);
  const expandAnim = useRef(new Animated.Value(0)).current;

  // Keep refs in sync with state (so callbacks always see latest values)
  currentSongRef.current = currentSong;
  playQueueRef.current = playQueue;
  currentIndexRef.current = currentIndex;

  // ── Audio session setup ────────────────────────────────────────────────────
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch(() => {
      setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: "doNotMix",
      }).catch(() => {});
    });

    // Create a single long-lived player instance
    const p = createAudioPlayer(null as any);
    playerRef.current = p;

    // Subscribe to status updates
    const sub = p.addListener("playbackStatusUpdate", (status: AudioStatus) => {
      const now = Date.now();
      const inSeekLock = now < seekLockUntilRef.current;

      // Playing state
      setIsPlaying(status.playing);
      setIsBuffering(status.isBuffering ?? false);

      // Position — throttled to 500ms, blocked during seek lock
      if (!inSeekLock && now - lastPositionUpdateRef.current > 500) {
        const newPos = (status.currentTime ?? 0) * 1000;
        if (!isNaN(newPos) && newPos >= 0) {
          setPosition(newPos);
          lastPositionUpdateRef.current = now;
        }
      }

      // Duration — only update when we have a real value and not in seek lock
      if (!inSeekLock) {
        const newDur = (status.duration ?? 0) * 1000;
        if (
          !isNaN(newDur) &&
          newDur > 0 &&
          Math.abs(newDur - durationRef.current) > 500
        ) {
          durationRef.current = newDur;
          setDuration(newDur);
        }
      }

      // Auto-advance queue on track finish
      if (status.didJustFinish && !inSeekLock) {
        const queue = playQueueRef.current;
        const idx = currentIndexRef.current;
        if (queue.length > 0 && idx < queue.length - 1) {
          const nextIdx = idx + 1;
          currentIndexRef.current = nextIdx;
          setCurrentIndex(nextIdx);
          // playSong uses the ref so it's safe to call here
          _playSongInternal(queue[nextIdx]);
        }
      }
    });

    return () => {
      sub.remove();
      p.release();
    };
  }, []); // runs once — player lives for the app lifetime

  // ── Expand animation ───────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: true,
      friction: 10,
      tension: 40,
    }).start();
  }, [isExpanded]);

  // ── Internal play helper (no React deps — uses refs) ──────────────────────
  const _playSongInternal = useCallback((song: Song) => {
    const p = playerRef.current;
    if (!p) return;

    const audioUrl =
      song.audio_url || song.quality_urls?.medium || song.preview_url;
    if (!audioUrl) return;

    // Reset seek lock and position tracking for the new track
    seekLockUntilRef.current = 0;
    lastPositionUpdateRef.current = 0;
    durationRef.current = song.duration_ms ?? 0;

    setCurrentSong(song);
    setPosition(0);
    setDuration(song.duration_ms ?? 0);
    setIsLoading(true);

    // Record play for personalisation ranking (fire-and-forget via global ref)
    const artistIds = (song.artists ?? []).map((a) => a.id).filter(Boolean);
    globalRecordPlayRef.current?.(song.id, artistIds);

    p.replace({ uri: audioUrl });

    // Play once loaded — listen for the first isLoaded=true event
    const waitForLoad = p.addListener(
      "playbackStatusUpdate",
      (s: AudioStatus) => {
        if (s.isLoaded) {
          waitForLoad.remove();
          setIsLoading(false);
          p.play();
        }
      },
    );
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────

  const playSong = useCallback(
    async (song: Song) => {
      _playSongInternal(song);
    },
    [_playSongInternal],
  );

  const togglePlayPause = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) {
      p.pause();
    } else {
      p.play();
    }
  }, [isPlaying]);

  const pause = useCallback(async () => {
    playerRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    playerRef.current?.play();
  }, []);

  const stopPlayer = useCallback(() => {
    // Pause native audio
    playerRef.current?.pause();
    // Reset all state — this hides the mini player (currentSong === null)
    setCurrentSong(null);
    setPosition(0);
    setDuration(0);
    setIsPlaying(false);
    setIsExpanded(false);
    setPlayQueue([]);
    setCurrentIndex(0);
    playQueueRef.current = [];
    currentIndexRef.current = 0;
    durationRef.current = 0;
    seekLockUntilRef.current = 0;
    lastPositionUpdateRef.current = 0;
  }, []);

  const seekTo = useCallback(async (positionMillis: number) => {
    const p = playerRef.current;
    if (!p || isNaN(positionMillis)) return;

    const dur = durationRef.current;
    if (dur <= 0) return;

    const clamped = Math.max(0, Math.min(positionMillis, dur - 100));
    if (isNaN(clamped)) return;

    // Set seek lock BEFORE the native call — prevents the 0-flash
    seekLockUntilRef.current = Date.now() + 2500;
    lastPositionUpdateRef.current = Date.now();

    // Update UI immediately
    setPosition(clamped);

    // Native seek (expects seconds)
    p.seekTo(clamped / 1000);
  }, []);

  const setQueue = useCallback((songs: Song[], startIndex = 0, source?: PlayingFromSource) => {
    setPlayQueue(songs);
    setCurrentIndex(startIndex);
    if (source) setPlayingFrom(source);
    playQueueRef.current = songs;
    currentIndexRef.current = startIndex;
  }, []);

  const skipToNext = useCallback(async () => {
    const queue = playQueueRef.current;
    const idx = currentIndexRef.current;
    if (queue.length === 0 || idx >= queue.length - 1) return;
    const nextIdx = idx + 1;
    setCurrentIndex(nextIdx);
    currentIndexRef.current = nextIdx;
    _playSongInternal(queue[nextIdx]);
  }, [_playSongInternal]);

  const skipToPrevious = useCallback(async () => {
    const queue = playQueueRef.current;
    const idx = currentIndexRef.current;
    if (queue.length === 0 || idx <= 0) return;
    const prevIdx = idx - 1;
    setCurrentIndex(prevIdx);
    currentIndexRef.current = prevIdx;
    _playSongInternal(queue[prevIdx]);
  }, [_playSongInternal]);

  const toggleExpand = useCallback(() => {
    setIsExpanded((v) => !v);
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────

  const value: MusicPlayerContextType = {
    currentSong,
    isPlaying,
    position,
    duration,
    isLoading,
    isBuffering,
    isExpanded,
    expandAnim,
    playSong,
    togglePlayPause,
    pause,
    resume,
    seekTo,
    setIsExpanded,
    toggleExpand,
    skipToNext,
    skipToPrevious,
    playQueue,
    currentIndex,
    setQueue,
    playingFrom,
    stopPlayer,
  };

  const positionValue = useMemo(
    () => ({ position, duration }),
    [position, duration],
  );

  return (
    <PlayerPositionContext.Provider value={positionValue}>
      <MusicPlayerContext.Provider value={value}>
        {children}
      </MusicPlayerContext.Provider>
    </PlayerPositionContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx)
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  return ctx;
}
