import { describe, expect, it, vi } from "vitest";
import {
  getSpotifyPlayback,
  normalizeSpotifyItem,
  readSpotifyConfig,
} from "./spotify";

const config = {
  clientId: "client",
  clientSecret: "secret",
  refreshToken: "refresh",
};

describe("Spotify server integration", () => {
  it("requires every server-only credential", () => {
    expect(readSpotifyConfig({})).toBeNull();
    expect(
      readSpotifyConfig({
        SPOTIFY_CLIENT_ID: " client ",
        SPOTIFY_CLIENT_SECRET: " secret ",
        SPOTIFY_REFRESH_TOKEN: " refresh ",
      }),
    ).toEqual(config);
  });

  it("normalizes a track without leaking raw Spotify data", () => {
    const playback = normalizeSpotifyItem(
      {
        type: "track",
        name: "Signal",
        duration_ms: 200_000,
        artists: [{ name: "Artist" }],
        album: {
          name: "Album",
          images: [{ url: "https://image.example/cover.jpg" }],
        },
        external_urls: { spotify: "https://open.spotify.com/track/example" },
      },
      { isPlaying: true, progressMs: 50_000 },
    );

    expect(playback).toMatchObject({
      state: "playing",
      title: "Signal",
      artists: ["Artist"],
      album: "Album",
      artwork: "https://image.example/cover.jpg",
      progressMs: 50_000,
      durationMs: 200_000,
    });
  });

  it("returns current playback after refreshing the access token", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ access_token: "access" }))
      .mockResolvedValueOnce(Response.json({
        is_playing: true,
        progress_ms: 1000,
        item: {
          type: "track",
          name: "Live track",
          artists: [{ name: "Live artist" }],
          album: { name: "Live album", images: [] },
          duration_ms: 3000,
        },
      }));

    const playback = await getSpotifyPlayback(config, fetchMock);

    expect(playback).toMatchObject({
      state: "playing",
      isPlaying: true,
      title: "Live track",
      artists: ["Live artist"],
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to the most recently played track", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ access_token: "access" }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({
        items: [{
          played_at: "2026-07-30T12:00:00.000Z",
          track: {
            type: "track",
            name: "Recent track",
            artists: [{ name: "Recent artist" }],
            album: { name: "Recent album", images: [] },
          },
        }],
      }));

    await expect(getSpotifyPlayback(config, fetchMock)).resolves.toMatchObject({
      state: "recent",
      isPlaying: false,
      title: "Recent track",
      playedAt: "2026-07-30T12:00:00.000Z",
    });
  });
});
