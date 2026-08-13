import { describe, expect, it } from "vitest";
import {
  formatPlaybackTime,
  isSpotifyPlayback,
  playbackProgress,
} from "./spotify";

describe("Spotify client helpers", () => {
  it("validates normalized API responses", () => {
    expect(isSpotifyPlayback({ configured: true, state: "playing" })).toBe(true);
    expect(isSpotifyPlayback({ configured: "yes", state: "playing" })).toBe(false);
    expect(isSpotifyPlayback({ configured: true, state: "unknown" })).toBe(false);
  });

  it("bounds playback progress", () => {
    expect(
      playbackProgress({
        configured: true,
        state: "playing",
        progressMs: 45_000,
        durationMs: 180_000,
      }),
    ).toBe(25);
    expect(
      playbackProgress({
        configured: true,
        state: "playing",
        progressMs: 200,
        durationMs: 100,
      }),
    ).toBe(100);
    expect(playbackProgress({ configured: true, state: "idle" })).toBeNull();
  });

  it("uses a safe label for missing or invalid timestamps", () => {
    expect(formatPlaybackTime(null)).toBe("Recently played");
    expect(formatPlaybackTime("not-a-date")).toBe("Recently played");
  });
});
