import { type SpotifyTrackFull } from "./spotify.js";

export interface AlbumCompletion {
  albumId: string;
  albumName: string;
  artistNames: string[];
  totalTracks: number;
  playedTracks: number;
  lastPlayedAt: string;
  artworkUrl: string | null;
  url: string | null;
}

/**
 * Group recent tracks by album id, counting distinct tracks played.
 * Albums with totalTracks < 2 (singles) are excluded — only records get ranked.
 */
export function groupByAlbum(tracks: SpotifyTrackFull[]): Map<string, AlbumCompletion> {
  const albums = new Map<string, AlbumCompletion>();
  for (const track of tracks) {
    if (!track.album || track.album.totalTracks < 2) continue;
    const existing = albums.get(track.album.id);
    if (existing) {
      existing.playedTracks += 1;
      if (track.playedAt > existing.lastPlayedAt) {
        existing.lastPlayedAt = track.playedAt;
      }
    } else {
      albums.set(track.album.id, {
        albumId: track.album.id,
        albumName: track.album.name,
        artistNames: track.artists.map((artist) => artist.name),
        totalTracks: track.album.totalTracks,
        playedTracks: 1,
        lastPlayedAt: track.playedAt,
        artworkUrl: track.album.images?.find((image) => image.url)?.url ?? null,
        url: track.url,
      });
    }
  }
  return albums;
}

/**
 * Detect albums that were listened to (nearly) in full from a recently-played
 * window. An album counts as completed when >= threshold fraction of its
 * tracks appear as distinct plays. Sort by most recent first.
 */
export function detectCompletedAlbums(
  tracks: SpotifyTrackFull[],
  threshold = 0.75,
): AlbumCompletion[] {
  const completions: AlbumCompletion[] = [];
  for (const album of Array.from(groupByAlbum(tracks).values())) {
    const fraction = album.playedTracks / album.totalTracks;
    if (fraction >= threshold) {
      completions.push(album);
    }
  }
  return completions.sort((a, b) =>
    b.lastPlayedAt.localeCompare(a.lastPlayedAt),
  );
}
