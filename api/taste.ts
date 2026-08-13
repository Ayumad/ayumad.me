import {
  getArtistsByIds,
  getRecentlyPlayedDetailed,
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
    const recent = await getRecentlyPlayedDetailed(config, 50);

    // Count plays per artist across the window.
    const playCounts = new Map<string, number>();
    for (const track of recent) {
      for (const artist of track.artists) {
        playCounts.set(artist.id, (playCounts.get(artist.id) ?? 0) + 1);
      }
    }

    // Fetch genre metadata for those artists from the public catalog.
    const artists = await getArtistsByIds(config, Array.from(playCounts.keys()));
    const byId = new Map(artists.map((artist) => [artist.id, artist]));

    // Aggregate genres weighted by actual plays.
    const genreCounts = new Map<string, number>();
    for (const [artistId, plays] of Array.from(playCounts)) {
      const artist = byId.get(artistId);
      if (!artist) continue;
      for (const genre of artist.genres) {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + plays);
      }
    }
    const totalWeight = Array.from(genreCounts.values()).reduce((a, b) => a + b, 0);
    const genres = Array.from(genreCounts.entries())
      .map(([genre, weight]) => ({
        genre,
        weight,
        share: totalWeight > 0 ? Math.round((weight / totalWeight) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 15);

    const topArtists = Array.from(playCounts.entries())
      .map(([artistId, plays]) => {
        const artist = byId.get(artistId);
        return {
          id: artistId,
          name: artist?.name ?? artistId,
          plays,
          genres: artist?.genres ?? [],
          popularity: artist?.popularity ?? 0,
          artwork: artist?.images?.find((image) => image.url)?.url ?? null,
        };
      })
      .filter((artist) => artist.name !== artist.id)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 20);

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
        topArtists,
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
