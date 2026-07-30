export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface SpotifyPlayback {
  configured: true;
  state: "playing" | "recent" | "idle" | "unavailable";
  isPlaying: boolean;
  title: string | null;
  artists: string[];
  album: string | null;
  artwork: string | null;
  url: string | null;
  progressMs: number | null;
  durationMs: number | null;
  playedAt: string | null;
  updatedAt: string;
}

interface SpotifyImage {
  url?: string;
}

interface SpotifyArtist {
  name?: string;
}

interface SpotifyItem {
  type?: string;
  name?: string;
  duration_ms?: number;
  external_urls?: { spotify?: string };
  artists?: SpotifyArtist[];
  album?: {
    name?: string;
    images?: SpotifyImage[];
  };
  show?: {
    name?: string;
    images?: SpotifyImage[];
  };
  images?: SpotifyImage[];
}

interface SpotifyCurrentlyPlayingResponse {
  is_playing?: boolean;
  progress_ms?: number | null;
  item?: SpotifyItem | null;
}

interface SpotifyRecentlyPlayedResponse {
  items?: Array<{
    played_at?: string;
    track?: SpotifyItem;
  }>;
}

interface SpotifyTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

export function readSpotifyConfig(
  env: NodeJS.ProcessEnv = process.env,
): SpotifyConfig | null {
  const clientId = env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = env.SPOTIFY_CLIENT_SECRET?.trim();
  const refreshToken = env.SPOTIFY_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

function unavailablePlayback(): SpotifyPlayback {
  return {
    configured: true,
    state: "unavailable",
    isPlaying: false,
    title: null,
    artists: [],
    album: null,
    artwork: null,
    url: null,
    progressMs: null,
    durationMs: null,
    playedAt: null,
    updatedAt: new Date().toISOString(),
  };
}

function firstImage(item: SpotifyItem) {
  return (
    item.album?.images?.find((image) => image.url)?.url ??
    item.show?.images?.find((image) => image.url)?.url ??
    item.images?.find((image) => image.url)?.url ??
    null
  );
}

function itemArtists(item: SpotifyItem) {
  if (item.type === "episode") {
    return item.show?.name ? [item.show.name] : [];
  }
  return item.artists
    ?.map((artist) => artist.name?.trim())
    .filter((artist): artist is string => Boolean(artist)) ?? [];
}

export function normalizeSpotifyItem(
  item: SpotifyItem,
  options: {
    isPlaying: boolean;
    progressMs?: number | null;
    playedAt?: string | null;
  },
): SpotifyPlayback {
  return {
    configured: true,
    state: options.isPlaying ? "playing" : "recent",
    isPlaying: options.isPlaying,
    title: item.name?.trim() || null,
    artists: itemArtists(item),
    album:
      item.type === "episode"
        ? item.show?.name?.trim() || null
        : item.album?.name?.trim() || null,
    artwork: firstImage(item),
    url: item.external_urls?.spotify ?? null,
    progressMs: options.progressMs ?? null,
    durationMs:
      typeof item.duration_ms === "number" ? item.duration_ms : null,
    playedAt: options.playedAt ?? null,
    updatedAt: new Date().toISOString(),
  };
}

async function spotifyFetch(
  url: string,
  accessToken: string,
  fetchImpl: typeof fetch,
) {
  return fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function getAccessToken(
  config: SpotifyConfig,
  fetchImpl: typeof fetch,
) {
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`,
  ).toString("base64");
  const response = await fetchImpl("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: config.refreshToken,
    }),
  });
  const payload = (await response.json()) as SpotifyTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ?? payload.error ?? "Spotify token refresh failed",
    );
  }
  return payload.access_token;
}

export async function getSpotifyPlayback(
  config: SpotifyConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<SpotifyPlayback> {
  try {
    const accessToken = await getAccessToken(config, fetchImpl);
    const current = await spotifyFetch(
      "https://api.spotify.com/v1/me/player/currently-playing?additional_types=track%2Cepisode",
      accessToken,
      fetchImpl,
    );

    if (current.status === 200) {
      const payload = (await current.json()) as SpotifyCurrentlyPlayingResponse;
      if (payload.item) {
        return normalizeSpotifyItem(payload.item, {
          isPlaying: Boolean(payload.is_playing),
          progressMs: payload.progress_ms,
        });
      }
    } else if (current.status !== 204) {
      throw new Error(`Spotify currently-playing request failed (${current.status})`);
    }

    const recent = await spotifyFetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=1",
      accessToken,
      fetchImpl,
    );
    if (!recent.ok) {
      throw new Error(`Spotify recently-played request failed (${recent.status})`);
    }
    const payload = (await recent.json()) as SpotifyRecentlyPlayedResponse;
    const latest = payload.items?.[0];
    if (latest?.track) {
      return normalizeSpotifyItem(latest.track, {
        isPlaying: false,
        playedAt: latest.played_at ?? null,
      });
    }

    return {
      ...unavailablePlayback(),
      state: "idle",
    };
  } catch (error) {
    console.error(
      "Spotify playback request failed",
      error instanceof Error ? error.message : error,
    );
    return unavailablePlayback();
  }
}
