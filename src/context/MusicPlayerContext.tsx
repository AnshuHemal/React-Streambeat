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

type PlayingFromSource =
  | "LIBRARY"
  | "ALBUM"
  | "SEARCH"
  | "ARTIST"
  | "HOME"
  | "LIKED_SONGS"
  | null;

/**
 * Internal player state machine:
 *  IDLE        — no song loaded
 *  LOADING     — replace() called, waiting for isLoaded=true, then auto-play
 *  PLAYING     — playing normally
 *  PAUSED      — paused by user
 *  SEEKING     — seekTo() issued; all status updates blocked until ExoPlayer
 *                confirms the position OR 6-second timeout fires
 */
type PlayerState = "IDLE" | "LOADING" | "PLAYING" | "PAUSED" | "SEEKING";

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
  startSeeking: () => void;
  setIsExpanded: (expanded: boolean) => void;
  toggleExpand: () => void;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  playQueue: Song[];
  currentIndex: number;
  setQueue: (
    songs: Song[],
    startIndex?: number,
    source?: PlayingFromSource
  ) => void;
  playingFrom: PlayingFromSource;
  stopPlayer: () => void;
  isSeeking: boolean;
};

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
  undefined
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
  const [isSeeking, setIsSeeking] = useState(false);

  // ── Player ref ─────────────────────────────────────────────────────────────
  const playerRef = useRef<AudioPlayer | null>(null);

  // ── State machine ref ──────────────────────────────────────────────────────
  const playerStateRef = useRef<PlayerState>("IDLE");

  // ── Seek refs ──────────────────────────────────────────────────────────────
  const seekTargetMsRef = useRef<number>(0);   // target position for current seek
  const seekStartedAtRef = useRef<number>(0);  // timestamp seek began
  const wasPlayingRef = useRef(false);         // restore play state after seek

  // ── Position / duration refs ───────────────────────────────────────────────
  const durationRef = useRef(0);
  const lastPositionUpdateRef = useRef(0);

  // ── Queue refs ─────────────────────────────────────────────────────────────
  const currentSongRef = useRef<Song | null>(null);
  const playQueueRef = useRef<Song[]>([]);
  const currentIndexRef = useRef(0);

  // ── Animation ──────────────────────────────────────────────────────────────
  const expandAnim = useRef(new Animated.Value(0)).current;

  // Keep refs in sync with latest state
  currentSongRef.current = currentSong;
  playQueueRef.current = playQueue;
  currentIndexRef.current = currentIndex;

  // Used to call _playSongInternal from the status listener without stale closure
  const playSongInternalRef = useRef<(song: Song) => void>(() => {});

  // ── Audio session ──────────────────────────────────────────────────────────
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).catch(() => {});
  }, []);

  /**
   * Transforms a Cloudinary audio URL to use a seekable format.
   *
   * Raw ADTS AAC (f_aac) has no seek index — ExoPlayer cannot seek it and
   * silently resets to position 0 after any seekTo() call.
   * MP3 (f_mp3) at constant bitrate allows ExoPlayer to calculate byte
   * offsets from timestamps, enabling proper mid-stream seeking.
   * Cloudinary serves MP3 with Content-Length, satisfying ExoPlayer's
   * range-request requirements.
   */
  const getSeekableAudioUrl = useCallback((url: string): string => {
    if (
      url.includes('res.cloudinary.com') &&
      url.includes('/f_aac/')
    ) {
      let transformed = url.replace('/f_aac/', '/f_m3u8/');
      // Replace file extension .aac at the end of the path with .m3u8
      const parts = transformed.split('?');
      if (parts[0].endsWith('.aac')) {
        parts[0] = parts[0].slice(0, -4) + '.m3u8';
      }
      transformed = parts.join('?');
      return transformed;
    }
    return url;
  }, []);

  // ── Single long-lived player + unified status listener ────────────────────
  useEffect(() => {
    const p = createAudioPlayer(null as any);
    playerRef.current = p;

    const sub = p.addListener(
      "playbackStatusUpdate",
      (status: AudioStatus) => {
        const state = playerStateRef.current;
        const now = Date.now();

        const posMs =
          status.currentTime != null && !isNaN(status.currentTime)
            ? status.currentTime * 1000
            : null;

        // ── Duration — update any time ExoPlayer gives us a real value ──────
        if (
          status.duration != null &&
          !isNaN(status.duration) &&
          status.duration > 0
        ) {
          const newDurMs = status.duration * 1000;
          if (Math.abs(newDurMs - durationRef.current) > 500) {
            durationRef.current = newDurMs;
            setDuration(newDurMs);
          }
        }

        // ════════════════════════════════════════════════════════════════════
        // LOADING — song was just replaced, waiting for first isLoaded event
        // ════════════════════════════════════════════════════════════════════
        if (state === "LOADING") {
          if (status.isLoaded) {
            playerStateRef.current = "PLAYING";
            setIsLoading(false);
            p.play();
          }
          return;
        }

        // ════════════════════════════════════════════════════════════════════
        // SEEKING — seekTo() was called; block ALL position and state updates
        // until ExoPlayer confirms it is at the target position.
        // ════════════════════════════════════════════════════════════════════
        if (state === "SEEKING") {
          const elapsed = now - seekStartedAtRef.current;
          const dist = posMs !== null ? Math.abs(posMs - seekTargetMsRef.current) : -1;

          // Safety timeout: 6 s max — release the lock regardless
          if (elapsed > 6000) {
            playerStateRef.current = wasPlayingRef.current
              ? "PLAYING"
              : "PAUSED";
            setIsSeeking(false);
            setIsBuffering(false);
            if (posMs !== null) {
              setPosition(posMs);
              lastPositionUpdateRef.current = now;
            }
            return;
          }

          // Confirm seek success: player is loaded AND near the target
          if (posMs !== null && status.isLoaded) {
            if (dist < 3000) {
              playerStateRef.current = wasPlayingRef.current
                ? "PLAYING"
                : "PAUSED";
              setIsSeeking(false);
              setIsPlaying(status.playing);
              setIsBuffering(false);
              setPosition(posMs);
              lastPositionUpdateRef.current = now;
            }
          }
          // Never fall through during SEEKING
          return;
        }

        // ════════════════════════════════════════════════════════════════════
        // PLAYING / PAUSED — normal playback updates
        // ════════════════════════════════════════════════════════════════════
        setIsPlaying(status.playing);
        setIsBuffering(status.isBuffering ?? false);

        // Auto-advance queue on track finish
        if (status.didJustFinish) {
          const queue = playQueueRef.current;
          const idx = currentIndexRef.current;
          if (queue.length > 0 && idx < queue.length - 1) {
            const nextIdx = idx + 1;
            currentIndexRef.current = nextIdx;
            setCurrentIndex(nextIdx);
            playSongInternalRef.current(queue[nextIdx]);
          }
          return;
        }

        // Throttled position update (500 ms)
        if (posMs !== null && now - lastPositionUpdateRef.current > 500) {
          setPosition(posMs);
          lastPositionUpdateRef.current = now;
        }
      }
    );

    return () => {
      sub.remove();
      p.release();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Expand animation ───────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: true,
      friction: 10,
      tension: 40,
    }).start();
  }, [isExpanded]);

  // ── Internal song loader ───────────────────────────────────────────────────
  const _playSongInternal = useCallback((song: Song) => {
    const p = playerRef.current;
    if (!p) return;

    const rawUrl =
      song.audio_url || song.quality_urls?.medium || song.preview_url;
    if (!rawUrl) return;

    // Transform non-seekable ADTS AAC → seekable MP3 on Cloudinary URLs
    const audioUrl = getSeekableAudioUrl(rawUrl);

    // Transition to LOADING — status listener handles p.play() on isLoaded
    playerStateRef.current = "LOADING";

    // Clear seek state
    seekTargetMsRef.current = 0;
    seekStartedAtRef.current = 0;
    wasPlayingRef.current = false;
    lastPositionUpdateRef.current = 0;
    durationRef.current = song.duration_ms ?? 0;

    setCurrentSong(song);
    setPosition(0);
    setDuration(song.duration_ms ?? 0);
    setIsLoading(true);
    setIsPlaying(false);

    const artistIds = (song.artists ?? []).map((a) => a.id).filter(Boolean);
    globalRecordPlayRef.current?.(song.id, artistIds);

    p.replace({ uri: audioUrl });
  }, [getSeekableAudioUrl]);

  playSongInternalRef.current = _playSongInternal;

  // ── Public API ─────────────────────────────────────────────────────────────

  const playSong = useCallback(
    async (song: Song) => {
      _playSongInternal(song);
    },
    [_playSongInternal]
  );

  const togglePlayPause = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) {
      playerStateRef.current = "PAUSED";
      p.pause();
    } else {
      playerStateRef.current = "PLAYING";
      p.play();
    }
  }, [isPlaying]);

  const pause = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    playerStateRef.current = "PAUSED";
    p.pause();
  }, []);

  const resume = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    playerStateRef.current = "PLAYING";
    p.play();
  }, []);

  const stopPlayer = useCallback(() => {
    playerRef.current?.pause();
    playerStateRef.current = "IDLE";
    seekTargetMsRef.current = 0;
    seekStartedAtRef.current = 0;
    wasPlayingRef.current = false;
    durationRef.current = 0;
    lastPositionUpdateRef.current = 0;
    setCurrentSong(null);
    setPosition(0);
    setDuration(0);
    setIsPlaying(false);
    setIsExpanded(false);
    setPlayQueue([]);
    setCurrentIndex(0);
    playQueueRef.current = [];
    currentIndexRef.current = 0;
  }, []);

  /**
   * startSeeking — called by SeekBar on drag START.
   * Immediately enters SEEKING state so position updates are blocked
   * while the user is still dragging (prevents seekbar jitter).
   */
  const startSeeking = useCallback(() => {
    wasPlayingRef.current =
      playerStateRef.current === "PLAYING" ||
      playerRef.current?.playing === true;
    seekStartedAtRef.current = Date.now();
    playerStateRef.current = "SEEKING";
    setIsSeeking(true);
  }, []);

  /**
   * seekTo — called by SeekBar on drag END.
   *
   * Does NOT reload the song. Simply:
   *  1. Pins UI at target immediately
   *  2. Pauses native player (ExoPlayer seeks more reliably when paused)
   *  3. Issues native seekTo()
   *  4. Resumes playback
   *
   * The SEEKING state in the status listener blocks all ExoPlayer transient
   * updates (currentTime=0 during re-buffer) from reaching the UI or
   * triggering any unintended p.play() calls.
   */
  const seekTo = useCallback(async (positionMillis: number) => {
    const p = playerRef.current;
    if (!p || isNaN(positionMillis)) {
      playerStateRef.current = wasPlayingRef.current ? "PLAYING" : "PAUSED";
      setIsSeeking(false);
      return;
    }

    const dur = durationRef.current;
    if (dur <= 0) {
      playerStateRef.current = wasPlayingRef.current ? "PLAYING" : "PAUSED";
      setIsSeeking(false);
      return;
    }

    const clamped = Math.max(0, Math.min(positionMillis, dur - 100));

    seekTargetMsRef.current = clamped;
    seekStartedAtRef.current = Date.now();
    playerStateRef.current = "SEEKING";
    setIsSeeking(true);

    // Pin UI at target immediately
    setPosition(clamped);
    lastPositionUpdateRef.current = Date.now();

    try {
      await p.seekTo(clamped / 1000);
      
      if (wasPlayingRef.current && !p.playing) {
        p.play();
      }
    } catch (e) {
      playerStateRef.current = wasPlayingRef.current ? "PLAYING" : "PAUSED";
      setIsSeeking(false);
      if (wasPlayingRef.current) {
        p.play();
      }
    }
  }, []);

  const setQueue = useCallback(
    (songs: Song[], startIndex = 0, source?: PlayingFromSource) => {
      setPlayQueue(songs);
      setCurrentIndex(startIndex);
      if (source) setPlayingFrom(source);
      playQueueRef.current = songs;
      currentIndexRef.current = startIndex;
    },
    []
  );

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
    startSeeking,
    setIsExpanded,
    toggleExpand,
    skipToNext,
    skipToPrevious,
    playQueue,
    currentIndex,
    setQueue,
    playingFrom,
    stopPlayer,
    isSeeking,
  };

  const positionValue = useMemo(
    () => ({ position, duration }),
    [position, duration]
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
