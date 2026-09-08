import { describe, expect, it } from "vitest";
import {
  deliverPromptBatch,
  enqueueCompletions,
  selectPromptBatch,
  type PendingAlbums,
} from "./albumPrompts.js";
import type { AlbumCompletion } from "./albums.js";

const album = (id: string, playedAt: string): AlbumCompletion => ({
  albumId: id,
  albumName: `Album ${id}`,
  artistNames: ["Artist"],
  totalTracks: 10,
  playedTracks: 10,
  lastPlayedAt: playedAt,
  artworkUrl: null,
  url: null,
});

describe("album prompt queue", () => {
  it("queues only undelivered completions and preserves them across a failed send", () => {
    const pending = enqueueCompletions(
      [album("old", "2026-08-01T00:00:00Z")],
      {},
      {},
      "2026-09-01T00:00:00Z",
    );
    expect(Object.keys(pending)).toEqual(["old"]);
    expect(selectPromptBatch(pending, {}, 3)).toHaveLength(1);
  });

  it("retains pending albums when Telegram delivery fails", async () => {
    const pending = enqueueCompletions(
      [album("failed", "2026-08-01T00:00:00Z")],
      {},
      {},
      "2026-09-01T00:00:00Z",
    );
    const batch = selectPromptBatch(pending, {});
    const result = await deliverPromptBatch(
      pending,
      {},
      batch,
      async () => false,
      "2026-09-02T00:00:00Z",
    );
    expect(result.sent).toBe(false);
    expect(result.pending).toEqual(pending);
    expect(result.prompted).toEqual({});
  });

  it("acknowledges exactly one successful batch and leaves later items FIFO", async () => {
    let pending: PendingAlbums = {};
    pending = enqueueCompletions(
      [
        album("first", "2026-08-01T00:00:00Z"),
        album("second", "2026-08-02T00:00:00Z"),
        album("third", "2026-08-03T00:00:00Z"),
        album("fourth", "2026-08-04T00:00:00Z"),
      ],
      pending,
      {},
      "2026-09-01T00:00:00Z",
    );
    const batch = selectPromptBatch(pending, {}, 3);
    const state = await deliverPromptBatch(
      pending,
      {},
      batch,
      async () => true,
      "2026-09-02T00:00:00Z",
    );
    expect(state.sent).toBe(true);
    expect(batch.map(({ albumId }) => albumId)).toEqual([
      "first",
      "second",
      "third",
    ]);
    expect(Object.keys(state.pending)).toEqual(["fourth"]);
    expect(Object.keys(state.prompted)).toEqual(["first", "second", "third"]);
    expect(selectPromptBatch(state.pending, state.prompted).map(({ albumId }) => albumId)).toEqual([
      "fourth",
    ]);
  });

  it("does not requeue a legacy prompted album", () => {
    const pending = enqueueCompletions(
      [album("old", "2026-08-01T00:00:00Z")],
      {},
      { old: { promptedAt: "2026-08-02T00:00:00Z", albumName: "Album old" } },
      "2026-09-01T00:00:00Z",
    );
    expect(pending).toEqual({});
  });
});
