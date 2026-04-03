import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

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
  quality_urls?: {
    medium: string;
    high: string;
    preview: string;
  };
};

type PlayerState = {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  isLoading: boolean;
  isBuffering: boolean;
};

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
  setQueue: (songs: Song[], startIndex?: number) => void;
};

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playQueue, setPlayQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioSource, setAudioSource] = useState<string | null>(null);
  const [optimisticIsPlaying, setOptimisticIsPlaying] = useState(false);
  const isTogglingRef = useRef(false);
  const lastToggleTimeRef = useRef(0);

  const player = useAudioPlayer(audioSource || "");
  const playerStatus = useAudioPlayerStatus(player);

  const expandAnim = useRef(new Animated.Value(0)).current;

  // Update position with 500ms throttling for smooth slider updates
  const lastUpdateRef = useRef(0);
  useEffect(() => {
    if (playerStatus) {
      setIsPlaying(playerStatus.playing);
      setIsBuffering(playerStatus.isBuffering ?? false);
      
      const now = Date.now();
      if (now - lastUpdateRef.current > 500) {
        setPosition(playerStatus.currentTime * 1000);
        lastUpdateRef.current = now;
      }
      
      const newDuration = playerStatus.duration * 1000;
      if (Math.abs(newDuration - duration) > 1000) {
        setDuration(newDuration);
      }
      
      const timeSinceLastToggle = Date.now() - lastToggleTimeRef.current;
      if (!isTogglingRef.current && timeSinceLastToggle > 300) {
        setOptimisticIsPlaying(playerStatus.playing);
      }
    }
  }, [playerStatus, duration]);

  // Handle playback completion
  useEffect(() => {
    if (playerStatus?.didJustFinish) {
      skipToNext();
    }
  }, [playerStatus?.didJustFinish]);

  // Update expand animation
  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: true,
      friction: 10,
      tension: 40,
    }).start();
  }, [isExpanded, expandAnim]);

  const playSong = useCallback(async (song: Song) => {
    try {
      setIsLoading(true);
      setCurrentSong(song);
      setPosition(0);
      setDuration(song.duration_ms || 0);

      const audioUrl = song.audio_url || song.quality_urls?.medium || song.preview_url;
      
      if (!audioUrl) {
        setIsLoading(false);
        return;
      }

      setAudioSource(audioUrl);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  }, []);

  // Play when audio source changes
  useEffect(() => {
    if (audioSource && player) {
      player.play();
    }
  }, [audioSource, player]);

  const togglePlayPause = useCallback(async () => {
    if (!player) return;
    
    // Optimistic update - immediately toggle UI state
    const newPlayingState = !optimisticIsPlaying;
    setOptimisticIsPlaying(newPlayingState);
    
    try {
      if (playerStatus?.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      // Revert optimistic state on error
      setOptimisticIsPlaying(optimisticIsPlaying);
    }
  }, [player, playerStatus?.playing, optimisticIsPlaying]);

  const pause = useCallback(async () => {
    if (!player) return;
    try {
      player.pause();
    } catch (error) {
    }
  }, [player]);

  const resume = useCallback(async () => {
    if (!player) return;
    try {
      player.play();
    } catch (error) {
    }
  }, [player]);

  const seekTo = useCallback(async (positionMillis: number) => {
    if (!player) return;
    try {
      player.seekTo(positionMillis / 1000);
      setPosition(positionMillis);
    } catch (error) {
    }
  }, [player]);

  const setQueue = useCallback((songs: Song[], startIndex = 0) => {
    setPlayQueue(songs);
    setCurrentIndex(startIndex);
  }, []);

  const skipToNext = useCallback(async () => {
    if (playQueue.length === 0 || currentIndex >= playQueue.length - 1) return;
    
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    await playSong(playQueue[nextIndex]);
  }, [playQueue, currentIndex, playSong]);

  const skipToPrevious = useCallback(async () => {
    if (playQueue.length === 0 || currentIndex <= 0) return;
    
    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    await playSong(playQueue[prevIndex]);
  }, [playQueue, currentIndex, playSong]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const value: MusicPlayerContextType = {
    currentSong,
    isPlaying: optimisticIsPlaying,
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
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return context;
}
