/**
 * PlayHistoryContext
 *
 * Thin context wrapper around usePlayHistory so that search-input.tsx can
 * read artistPlayCounts without prop-drilling.
 *
 * Also wires recordPlay into globalRecordPlayRef so MusicPlayerContext can
 * call it without a circular context dependency.
 */

import { globalRecordPlayRef } from "@/context/MusicPlayerContext";
import { PlayHistory, usePlayHistory } from "@/hooks/usePlayHistory";
import React, { createContext, useContext, useEffect } from "react";

const PlayHistoryContext = createContext<PlayHistory>({
  artistPlayCounts: new Map(),
  isReady: false,
  recordPlay: () => {},
});

export function PlayHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const history = usePlayHistory();

  // Bridge: keep the global ref in sync so MusicPlayerContext can call
  // recordPlay without importing this context (avoids circular deps).
  useEffect(() => {
    globalRecordPlayRef.current = history.recordPlay;
    return () => {
      globalRecordPlayRef.current = null;
    };
  }, [history.recordPlay]);

  return (
    <PlayHistoryContext.Provider value={history}>
      {children}
    </PlayHistoryContext.Provider>
  );
}

export function usePlayHistoryContext(): PlayHistory {
  return useContext(PlayHistoryContext);
}
