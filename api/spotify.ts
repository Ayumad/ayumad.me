import {
  getSpotifyPlayback,
  readSpotifyConfig,
} from "../server/spotify.js";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
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
          "Vercel-CDN-Cache-Control": "public, s-maxage=60",
        },
      },
    );
  }

  return getSpotifyPlayback(config).then((playback) =>
    Response.json({ ...playback, playedAt: playback.playedAt?.slice(0, 10) ?? null }, {
      headers: {
        ...jsonHeaders,
        "Vercel-CDN-Cache-Control": playback.state === "unavailable"
          ? "public, s-maxage=15"
          : "public, s-maxage=3",
      },
    }),
  );
}
