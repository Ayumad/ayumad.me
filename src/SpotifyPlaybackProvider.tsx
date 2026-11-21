import { type PropsWithChildren, useEffect, useState } from "react";
import { isSpotifyPlayback, type SpotifyPlayback } from "./spotify";
import { SpotifyPlaybackContext } from "./useSpotifyPlayback";

const POLL_INTERVAL_MS = 5_000;
const REQUEST_TIMEOUT_MS = 7_000;

export function SpotifyPlaybackProvider({ children }: PropsWithChildren) {
  const [playback, setPlayback] = useState<SpotifyPlayback | null>(null);
  const [requestFailed, setRequestFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let pending: AbortController | null = null;

    const loadPlayback = async () => {
      if (document.visibilityState !== "visible" || pending) return;
      const controller = new AbortController();
      pending = controller;
      const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch("/api/spotify", {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (
          !response.ok || !isSpotifyPlayback(payload) ||
          (payload.configured && payload.state === "unavailable")
        ) {
          throw new Error("Spotify activity is unavailable");
        }
        if (active) {
          setPlayback(payload);
          setRequestFailed(false);
        }
      } catch {
        if (active) setRequestFailed(true);
      } finally {
        window.clearTimeout(timeout);
        pending = null;
      }
    };

    void loadPlayback();
    const poll = window.setInterval(loadPlayback, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", loadPlayback);

    return () => {
      active = false;
      pending?.abort();
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", loadPlayback);
    };
  }, []);

  return (
    <SpotifyPlaybackContext.Provider value={{ playback, requestFailed }}>
      {children}
    </SpotifyPlaybackContext.Provider>
  );
}
