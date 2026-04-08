/**
 * useRecentSearches
 *
 * Manages the user's recent search history with two layers:
 *
 *   1. Local (AsyncStorage) — optimistic, instant, works offline
 *   2. Server (Supabase user_search_history) — synced on focus, written on tap
 *
 * Strategy:
 *   - On mount: load from AsyncStorage immediately (instant UI)
 *   - On focus: fetch server history, merge with local (server wins for order,
 *     local wins for entries not yet synced), persist merged result locally
 *   - On addRecent: write to local first, then fire-and-forget to server
 *   - On removeRecent: remove locally + server
 *   - On clearRecents: clear locally + server
 *
 * Schema expected in Supabase:
 *
 *   user_search_history (
 *     id          uuid primary key default gen_random_uuid(),
 *     user_id     uuid references auth.users not null,
 *     kind        text not null,          -- 'song' | 'artist' | 'album'
 *     item_id     text not null,          -- the song/artist/album id
 *     payload     jsonb not null,         -- full SearchSong/Artist/Album object
 *     searched_at timestamptz not null default now(),
 *     unique(user_id, kind, item_id)
 *   )
 */

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { RecentSearchEntry } from "@/types/search";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "@streambeat:recent_searches_v2";
const MAX_ENTRIES = 20;

function entryId(entry: RecentSearchEntry): string {
  return `${entry.kind}-${entry.data.id}`;
}

function itemId(entry: RecentSearchEntry): string {
  return entry.data.id;
}

// ─── Local helpers ─────────────────────────────────────────────────────────────

async function readLocal(): Promise<RecentSearchEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeLocal(entries: RecentSearchEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

// ─── Server helpers ────────────────────────────────────────────────────────────

async function fetchServerHistory(
  userId: string,
): Promise<RecentSearchEntry[]> {
  const { data } = await supabase
    .from("user_search_history")
    .select("kind, item_id, payload, searched_at")
    .eq("user_id", userId)
    .order("searched_at", { ascending: false })
    .limit(MAX_ENTRIES);

  return (data ?? []).map((row: any) => ({
    kind: row.kind,
    data: row.payload,
    timestamp: new Date(row.searched_at).getTime(),
  })) as RecentSearchEntry[];
}

async function upsertServerEntry(
  userId: string,
  entry: RecentSearchEntry,
): Promise<void> {
  await supabase.from("user_search_history").upsert(
    {
      user_id: userId,
      kind: entry.kind,
      item_id: itemId(entry),
      payload: entry.data,
      searched_at: new Date(entry.timestamp).toISOString(),
    },
    { onConflict: "user_id,kind,item_id" },
  );
}

async function deleteServerEntry(
  userId: string,
  entry: RecentSearchEntry,
): Promise<void> {
  await supabase
    .from("user_search_history")
    .delete()
    .eq("user_id", userId)
    .eq("kind", entry.kind)
    .eq("item_id", itemId(entry));
}

async function clearServerHistory(userId: string): Promise<void> {
  await supabase.from("user_search_history").delete().eq("user_id", userId);
}

// ─── Merge helper ──────────────────────────────────────────────────────────────

/**
 * Merges server + local entries. Server entries take precedence for ordering
 * (they reflect cross-device activity). Local-only entries (not yet synced)
 * are appended after. Result is capped at MAX_ENTRIES.
 */
function mergeEntries(
  server: RecentSearchEntry[],
  local: RecentSearchEntry[],
): RecentSearchEntry[] {
  const seen = new Set<string>();
  const merged: RecentSearchEntry[] = [];

  for (const e of server) {
    const id = entryId(e);
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(e);
    }
  }
  for (const e of local) {
    const id = entryId(e);
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(e);
    }
  }

  return merged.slice(0, MAX_ENTRIES);
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useRecentSearches() {
  const { user } = useAuth();
  const [recents, setRecents] = useState<RecentSearchEntry[]>([]);
  const isSyncing = useRef(false);

  // ── Load local on mount ────────────────────────────────────────────────────
  useEffect(() => {
    readLocal().then(setRecents);
  }, []);

  // ── Sync with server on every focus ───────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!user?.id || isSyncing.current) return;
      isSyncing.current = true;

      fetchServerHistory(user.id)
        .then(async (serverEntries) => {
          const localEntries = await readLocal();
          const merged = mergeEntries(serverEntries, localEntries);
          await writeLocal(merged);
          setRecents(merged);
        })
        .catch(() => {
          // Server unavailable — local state is already shown, no-op
        })
        .finally(() => {
          isSyncing.current = false;
        });
    }, [user?.id]),
  );

  // ── Add ────────────────────────────────────────────────────────────────────
  const addRecent = useCallback(
    (entry: Omit<RecentSearchEntry, "timestamp">) => {
      const newEntry = { ...entry, timestamp: Date.now() } as RecentSearchEntry;
      const id = entryId(newEntry);

      setRecents((prev) => {
        const filtered = prev.filter((e) => entryId(e) !== id);
        const next = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
        writeLocal(next);
        return next;
      });

      // Fire-and-forget server write
      if (user?.id) {
        upsertServerEntry(user.id, newEntry).catch(() => {});
      }
    },
    [user?.id],
  );

  // ── Remove single ──────────────────────────────────────────────────────────
  const removeRecent = useCallback(
    (entry: RecentSearchEntry) => {
      const id = entryId(entry);
      setRecents((prev) => {
        const next = prev.filter((e) => entryId(e) !== id);
        writeLocal(next);
        return next;
      });
      if (user?.id) {
        deleteServerEntry(user.id, entry).catch(() => {});
      }
    },
    [user?.id],
  );

  // ── Clear all ──────────────────────────────────────────────────────────────
  const clearRecents = useCallback(() => {
    setRecents([]);
    writeLocal([]);
    if (user?.id) {
      clearServerHistory(user.id).catch(() => {});
    }
  }, [user?.id]);

  return { recents, addRecent, removeRecent, clearRecents };
}
