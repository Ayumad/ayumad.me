import {
  getSpotifyPlayback,
  readSpotifyConfig,
} from "../server/spotify.js";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export function GET() {
  const config = readSpotifyConfig();
  if (!config) {
    return Response.json(
      {
        configured: false,
        state: "unavailable",
        message: "Spotify is not connected yet.",
      },
      {
        headers: {
          ...jsonHeaders,
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  }

  return getSpotifyPlayback(config).then((playback) =>
    Response.json(playback, {
      headers: {
        ...jsonHeaders,
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
      },
    }),
  );
}
