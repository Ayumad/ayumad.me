import { describe, expect, it } from "vitest";
import { detectCompletedAlbums, groupByAlbum } from "./albums.js";
import { type SpotifyTrackFull } from "./spotify.js";

function track(
  id: string,
  albumId: string,
  albumName: string,
  totalTracks: number,
  playedAt: string,
): SpotifyTrackFull {
  return {
    id,
    name: `Track ${id}`,
    artists: [{ id: "a1", name: "The Marías" }],
    album: { id: albumId, name: albumName, totalTracks, releaseDate: "2024-01-01" },
    durationMs: 200000,
    playedAt,
    url: `https://open.spotify.com/track/${id}`,
  };
}

describe("groupByAlbum", () => {
  it("groups tracks by album and counts distinct plays", () => {
    const groups = groupByAlbum([
      track("t1", "alb1", "CINEMA", 10, "2026-08-12T20:00:00Z"),
      track("t2", "alb1", "CINEMA", 10, "2026-08-12T20:04:00Z"),
      track("t3", "alb1", "CINEMA", 10, "2026-08-12T20:08:00Z"),
      track("s1", "singles1", "Single", 1, "2026-08-12T21:00:00Z"),
    ]);

    expect(groups.has("alb1")).toBe(true);
    expect(groups.get("alb1")?.playedTracks).toBe(3);
    expect(groups.get("alb1")?.lastPlayedAt).toBe("2026-08-12T20:08:00Z");
    // singles (totalTracks < 2) are excluded
    expect(groups.has("singles1")).toBe(false);
  });
});

describe("detectCompletedAlbums", () => {
  it("flags albums played past the 75% threshold", () => {
    const completions = detectCompletedAlbums([
      // 8 of 10 CINEMA tracks played → complete
      ...Array.from({ length: 8 }, (_, i) =>
        track(`c${i}`, "alb1", "CINEMA", 10, `2026-08-12T20:0${i}:00Z`),
      ),
      // 1 of 10 Submarine tracks played → not complete
      track("s1", "alb2", "Submarine", 10, "2026-08-12T21:00:00Z"),
    ]);

    expect(completions).toHaveLength(1);
    expect(completions[0].albumName).toBe("CINEMA");
    expect(completions[0].playedTracks).toBe(8);
    expect(completions[0].totalTracks).toBe(10);
  });

  it("sorts completions by most recent first", () => {
    const completions = detectCompletedAlbums([
      ...Array.from({ length: 8 }, (_, i) =>
        track(`a${i}`, "albA", "Older", 8, "2026-08-10T10:00:00Z"),
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        track(`b${i}`, "albB", "Newer", 8, "2026-08-12T22:00:00Z"),
      ),
    ]);

    expect(completions[0].albumName).toBe("Newer");
    expect(completions[1].albumName).toBe("Older");
  });

  it("returns nothing when no album crosses the threshold", () => {
    const completions = detectCompletedAlbums([
      track("x1", "alb1", "CINEMA", 10, "2026-08-12T20:00:00Z"),
      track("y1", "alb2", "Submarine", 10, "2026-08-12T21:00:00Z"),
    ]);
    expect(completions).toEqual([]);
  });
});
