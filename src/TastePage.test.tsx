import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TasteSection from "./TastePage";

const tasteWith = (overrides: Record<string, unknown> = {}) => ({
  configured: true,
  generatedAt: "2026-09-08T00:00:00Z",
  genres: [],
  topArtists: [],
  recentAlbums: [],
  ...overrides,
});

const eloEmpty = { count: 0, median: null, leaderboard: [] };

function stubFetch(
  taste: { ok: boolean; status?: number; body?: unknown },
  elo: { ok: boolean; status?: number; body?: unknown } = {
    ok: true,
    body: eloEmpty,
  },
) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const result = url === "/api/taste" ? taste : elo;
      return Promise.resolve({
        ok: result.ok,
        status: result.status ?? 200,
        json: async () => result.body,
      });
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TasteSection", () => {
  it("shows loading states while both endpoints are pending", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    render(<TasteSection />);

    expect(screen.getByText("Sampling listening history…")).toBeInTheDocument();
    expect(screen.getAllByText("Loading…")).toHaveLength(2);
  });

  it("renders an honest empty state when genre metadata is unavailable", async () => {
    stubFetch({ ok: true, body: tasteWith({ topArtists: [{ id: "1", name: "Unknown", genres: [], popularity: 0, artwork: null }] }) });
    render(<TasteSection />);

    await waitFor(() => {
      expect(screen.getByText("Genre metadata is unavailable for this sample.")).toBeInTheDocument();
    });
    expect(screen.getByText("Genre metadata unavailable")).toBeInTheDocument();
  });

  it("renders populated genres with the actual weighting explanation", async () => {
    stubFetch({
      ok: true,
      body: tasteWith({
        genres: [{ genre: "dream pop", weight: 12, share: 100 }],
        topArtists: [{ id: "1", name: "Artist", genres: ["dream pop"], popularity: 0, artwork: null }],
      }),
    });
    render(<TasteSection />);

    await waitFor(() => {
      expect(screen.getAllByText("dream pop")).toHaveLength(2);
    });
    expect(screen.getByText(/weighted by plays in the latest 50 tracks/)).toBeInTheDocument();
  });

  it("shows a no-listening state when Spotify returns no artists", async () => {
    stubFetch({ ok: true, body: tasteWith() });
    render(<TasteSection />);

    await waitFor(() => {
      expect(screen.getByText("No listening data is available yet.")).toBeInTheDocument();
    });
  });

  it("shows the configured-off and no-listening states", async () => {
    stubFetch({ ok: true, body: { configured: false, message: "Spotify is not connected yet." } });
    render(<TasteSection />);

    await waitFor(() => {
      expect(screen.getAllByText("Spotify is not connected yet.")).toHaveLength(2);
    });
  });

  it("shows endpoint failures instead of leaving panels stuck loading", async () => {
    stubFetch(
      { ok: false, status: 502 },
      { ok: false, status: 503 },
    );
    render(<TasteSection />);

    await waitFor(() => {
      expect(screen.getAllByText("Couldn't reach the taste endpoint.")).toHaveLength(2);
      expect(screen.getAllByText("Couldn't reach the Elo endpoint.")).toHaveLength(1);
    });
    expect(screen.queryByText("Sampling listening history…")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });
});
