import {
  getArtistsByIds,
  getRecentlyPlayedDetailed,
  readSpotifyConfig,
  spotifyThumbnail,
  type SpotifyArtistFull,
} from "../server/spotify.js";
import { genresForArtist } from "../server/genres.js";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

const artistCache = new Map<string, { artist: SpotifyArtistFull; expires: number }>();
const artistTtl = 60 * 60 * 1000;

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

    // Fetch genre metadata for the top artists from the public catalog
    // (single lookups — the batch endpoint 403s for this app).
    const topIds = Array.from(playCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([id]) => id);
    const now = Date.now();
    for (const [id, entry] of artistCache) {
      if (entry.expires <= now) artistCache.delete(id);
    }
    const missing = topIds.filter((id) => !artistCache.has(id));
    if (missing.length) {
      for (const artist of await getArtistsByIds(config, missing)) {
        artistCache.set(artist.id, { artist, expires: now + artistTtl });
      }
    }
    const byId = new Map(topIds.flatMap((id) => {
      const entry = artistCache.get(id);
      return entry ? [[id, entry.artist] as const] : [];
    }));

    // Aggregate genres weighted by actual plays. Spotify's dev tier strips
    // genres from catalog responses, so merge curated genres by name.
    const genreCounts = new Map<string, number>();
    for (const [artistId, plays] of Array.from(playCounts)) {
      const artist = byId.get(artistId);
      const genres =
        artist && artist.genres.length > 0
          ? artist.genres
          : genresForArtist(artist?.name ?? artistId);
      for (const genre of genres) {
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
        const apiGenres = artist?.genres ?? [];
        const curated = genresForArtist(artist?.name ?? artistId);
        return {
          id: artistId,
          name: artist?.name ?? artistId,
          plays,
          genres: apiGenres.length > 0 ? apiGenres : curated,
          popularity: artist?.popularity ?? 0,
          artwork: spotifyThumbnail(artist?.images),
        };
      })
      .filter((artist) => artist.name !== artist.id)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 20);

    const albums = new Map<string, (typeof recent)[number]>();
    for (const track of recent) {
      if (track.album.id !== "unknown" && !albums.has(track.album.id)) {
        albums.set(track.album.id, track);
      }
    }
    const recentAlbums = [...albums.values()].slice(0, 8).map((track) => ({
      id: track.album.id,
      name: track.album.name,
      artist: track.artists.map((a) => a.name).join(", "),
      totalTracks: track.album.totalTracks,
      playedAt: track.playedAt.slice(0, 10),
      artwork: spotifyThumbnail(track.album.images),
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
    console.error("Unable to refresh Spotify Taste data", error);
    return Response.json(
      {
        configured: true,
        error: "Listening history is temporarily unavailable.",
      },
      {
        status: 502,
        headers: { ...jsonHeaders, "Cache-Control": "no-store" },
      },
    );
  }
}
