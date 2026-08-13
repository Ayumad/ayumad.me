import { describe, expect, it } from "vitest";
import {
  applyUserRating,
  DEFAULT_RATING,
  expectedScore,
  ratingDelta,
  recordRating,
  type EloEntry,
} from "./elo.js";

describe("expectedScore", () => {
  it("is 0.5 for equal ratings", () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5);
  });

  it("favors the higher-rated player", () => {
    expect(expectedScore(1600, 1500)).toBeGreaterThan(0.5);
    expect(expectedScore(1500, 1600)).toBeLessThan(0.5);
  });
});

describe("ratingDelta", () => {
  it("moves the winner up and scales with upset", () => {
    expect(ratingDelta(1500, 1500, 1)).toBe(16);
    // beating a much stronger player gains more
    expect(ratingDelta(1500, 1800, 1)).toBeGreaterThan(16);
  });
});

describe("applyUserRating", () => {
  it("treats 10/10 as a win and 5/10 as a draw", () => {
    const win = applyUserRating(1500, 1500, 10);
    expect(win.newRating).toBe(1516);

    const draw = applyUserRating(1500, 1500, 5);
    expect(draw.newRating).toBe(1500);
  });

  it("clamps scores outside 0..10", () => {
    const over = applyUserRating(1500, 1500, 99);
    const under = applyUserRating(1500, 1500, -5);
    expect(over.newRating).toBe(1516);
    expect(under.newRating).toBe(1484);
  });
});

describe("recordRating", () => {
  it("seeds a new album at 1500 and rates it against the baseline", () => {
    const { entries, delta } = recordRating([], {
      albumId: "alb1",
      albumName: "CINEMA",
      artist: "The Marías",
      userScore: 8,
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].rating).toBe(DEFAULT_RATING + delta);
    expect(entries[0].games).toBe(1);
    expect(delta).toBe(applyUserRating(1500, 1500, 8).delta);
  });

  it("updates an existing album and counts games", () => {
    const seed = recordRating([], {
      albumId: "alb1",
      albumName: "CINEMA",
      artist: "The Marías",
      userScore: 9,
    }).entries as EloEntry[];
    const beforeRating = seed[0].rating; // recordRating mutates in place

    const { entries, delta } = recordRating(seed, {
      albumId: "alb1",
      albumName: "CINEMA",
      artist: "The Marías",
      userScore: 4,
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].games).toBe(2);
    // 4/10 against own rating is below the 0.5 draw line → drop
    expect(entries[0].rating).toBeLessThan(beforeRating);
    expect(delta).toBeLessThan(0);
  });

  it("rates new albums against the current leader", () => {
    const seed: EloEntry[] = [
      {
        albumId: "top",
        albumName: "Submarine",
        artist: "The Marías",
        rating: 1700,
        games: 10,
        firstRatedAt: "2026-01-01T00:00:00Z",
        lastRatedAt: "2026-01-02T00:00:00Z",
        artworkUrl: null,
        url: null,
      },
    ];

    const { entries } = recordRating(seed, {
      albumId: "new",
      albumName: "Imaginal Disk",
      artist: "Magdalena Bay",
      userScore: 8,
    });

    // 8/10 against a 1700 leader moves the new album above 1500 baseline
    expect(entries.find((e) => e.albumId === "new")?.rating).toBeGreaterThan(1500);
  });
});
