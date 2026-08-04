import { type PropsWithChildren, useEffect, useState } from "react";
import { isSpotifyPlayback, type SpotifyPlayback } from "./spotify";
import { SpotifyPlaybackContext } from "./useSpotifyPlayback";

export function SpotifyPlaybackProvider({ children }: PropsWithChildren) {
  const [playback, setPlayback] = useState<SpotifyPlayback | null>(null);
  const [requestFailed, setRequestFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const loadPlayback = async () => {
      try {
        const response = await fetch("/api/spotify", {
          headers: { Accept: "application/json" },
        });
        const payload: unknown = await response.json();
        if (!response.ok || !isSpotifyPlayback(payload)) {
          throw new Error("Spotify activity is unavailable");
        }
        if (active) {
          setPlayback(payload);
          setRequestFailed(false);
        }
      } catch {
        if (active) setRequestFailed(true);
      }
    };

    void loadPlayback();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadPlayback();
    }, 30_000);

    return () => {
      active = false;
      window.clearInterval(poll);
    };
  }, []);

  return (
    <SpotifyPlaybackContext.Provider value={{ playback, requestFailed }}>
      {children}
    </SpotifyPlaybackContext.Provider>
  );
}
