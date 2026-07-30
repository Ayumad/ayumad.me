import { createContext, useContext } from "react";
import type { SpotifyPlayback } from "./spotify";

export interface SpotifyPlaybackState {
  playback: SpotifyPlayback | null;
  requestFailed: boolean;
}

export const SpotifyPlaybackContext =
  createContext<SpotifyPlaybackState | null>(null);

export function useSpotifyPlayback(): SpotifyPlaybackState {
  const playback = useContext(SpotifyPlaybackContext);
  if (!playback) {
    throw new Error(
      "useSpotifyPlayback must be used within SpotifyPlaybackProvider",
    );
  }
  return playback;
}
