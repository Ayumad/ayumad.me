import {
  getRecentlyPlayedDetailed,
  getTopArtists,
  readSpotifyConfig,
} from "../server/spotify.js";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

export async function GET() {
  const config = readSpotifyConfig();
  if (!config) {
    return Response.json(
      { configured: false, message: "Spotify is not connected yet." },
      { headers: { ...jsonHeaders, "Cache-Control": "public, s-maxage=60" } },
    );
  }

  try {
    const [recent, topArtists] = await Promise.all([
      getRecentlyPlayedDetailed(config, 50),
      getTopArtists(config, "medium_term", 20),
    ]);

    // Aggregate genres from top artists, weighted by list position.
    const genreCounts = new Map<string, number>();
    topArtists.forEach((artist, index) => {
      const weight = Math.max(1, topArtists.length - index);
      for (const genre of artist.genres) {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + weight);
      }
    });
    const totalWeight = Array.from(genreCounts.values()).reduce((a, b) => a + b, 0);
    const genres = Array.from(genreCounts.entries())
      .map(([genre, count]) => ({
        genre,
        weight: count,
        share: Math.round((count / totalWeight) * 1000) / 10,
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 15);

    const artists = topArtists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity,
      artwork: artist.images?.find((image) => image.url)?.url ?? null,
    }));

    const recentAlbums = recent.map((track) => ({
      id: track.album.id,
      name: track.album.name,
      artist: track.artists.map((a) => a.name).join(", "),
      totalTracks: track.album.totalTracks,
      playedAt: track.playedAt,
      artwork: track.album.images?.find((image) => image.url)?.url ?? null,
      url: track.url,
    }));

    return Response.json(
      {
        configured: true,
        generatedAt: new Date().toISOString(),
        genres,
        topArtists: artists,
        recentAlbums,
      },
      {
        headers: {
          ...jsonHeaders,
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        configured: true,
        error: error instanceof Error ? error.message : "Taste request failed",
      },
      {
        status: 502,
        headers: { ...jsonHeaders, "Cache-Control": "no-store" },
      },
    );
  }
}
