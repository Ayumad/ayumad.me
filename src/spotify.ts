export interface SpotifyPlayback {
  configured: boolean;
  state: "playing" | "recent" | "idle" | "unavailable";
  isPlaying?: boolean;
  title?: string | null;
  artists?: string[];
  album?: string | null;
  artwork?: string | null;
  url?: string | null;
  progressMs?: number | null;
  durationMs?: number | null;
  playedAt?: string | null;
  updatedAt?: string;
}

export function isSpotifyPlayback(value: unknown): value is SpotifyPlayback {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SpotifyPlayback>;
  return (
    typeof candidate.configured === "boolean" &&
    ["playing", "recent", "idle", "unavailable"].includes(
      candidate.state ?? "",
    )
  );
}

export function formatPlaybackTime(playedAt?: string | null) {
  if (!playedAt) return "Recently played";
  const timestamp = new Date(playedAt);
  if (Number.isNaN(timestamp.getTime())) return "Recently played";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export function playbackProgress(playback: SpotifyPlayback) {
  if (
    typeof playback.progressMs !== "number" ||
    typeof playback.durationMs !== "number" ||
    playback.durationMs <= 0
  ) {
    return null;
  }
  return Math.min(
    100,
    Math.max(0, (playback.progressMs / playback.durationMs) * 100),
  );
}
