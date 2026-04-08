/**
 * useNetworkStatus
 *
 * Detects online/offline state in React Native by doing a lightweight
 * HEAD ping. No native packages required.
 *
 * - Runs once on mount
 * - Re-runs whenever retry() is called (e.g. from the retry button)
 * - Starts optimistically online to avoid a false offline flash on cold start
 */

import { useCallback, useRef, useState } from "react";

const PING_URL = "https://www.google.com/generate_204";
const PING_TIMEOUT_MS = 4000;

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    const res = await fetch(PING_URL, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

export function useNetworkStatus(): {
  isOnline: boolean;
  retry: () => void;
} {
  const [isOnline, setIsOnline] = useState(true);
  const checkingRef = useRef(false);

  const check = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    const online = await checkConnectivity();
    setIsOnline(online);
    checkingRef.current = false;
  }, []);

  // No useEffect here — we only ping on explicit retry() calls.
  // The hook starts optimistically online; isNetworkError from useSearch
  // is the primary signal that something went wrong.

  return { isOnline, retry: check };
}
