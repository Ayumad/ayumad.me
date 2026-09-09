import { useEffect, useState } from "react";
import AsciiScene from "./AsciiScene";

interface TasteData {
  configured: boolean;
  generatedAt?: string;
  message?: string;
  genres?: Array<{ genre: string; weight: number; share: number }>;
  topArtists?: Array<{
    id: string;
    name: string;
    genres: string[];
    popularity: number;
    artwork: string | null;
  }>;
  recentAlbums?: Array<{
    id: string;
    name: string;
    artist: string;
    totalTracks: number;
    playedAt: string;
    artwork: string | null;
    url: string | null;
  }>;
  error?: string;
}

interface EloData {
  count: number;
  median: number | null;
  leaderboard: Array<{
    albumId: string;
    albumName: string;
    artist: string;
    rating: number;
    games: number;
    artworkUrl: string | null;
    url: string | null;
  }>;
}

function formatWhen(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return (await response.json()) as T;
}

export function TasteSection() {
  const [taste, setTaste] = useState<TasteData | null>(null);
  const [elo, setElo] = useState<EloData | null>(null);
  const [tasteError, setTasteError] = useState(false);
  const [eloError, setEloError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchJson<TasteData>("/api/taste")
      .then((data) => {
        if (!cancelled) setTaste(data);
      })
      .catch(() => {
        if (!cancelled) setTasteError(true);
      });
    fetchJson<EloData>("/api/elo")
      .then((data) => {
        if (!cancelled) setElo(data);
      })
      .catch(() => {
        if (!cancelled) setEloError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const maxWeight =
    taste?.genres && taste.genres.length > 0
      ? Math.max(...taste.genres.map((genre) => genre.weight))
      : 1;

  return (
    <section className="about-taste" id="taste" aria-labelledby="taste-title">
      <header className="about-taste-heading">
        <div className="about-taste-copy">
          <p className="label">
            <span>04</span>
            Taste
          </p>
          <h2 id="taste-title">Listening, ranked.</h2>
          <p className="page-intro">
            Genre breakdown, top artists, and the album Elo board — updated
            from my actual Spotify history.
          </p>
        </div>
        <AsciiScene className="heading-field art-now about-taste-art" scene="now" />
      </header>

      <div className="taste-panels">
      <section className="taste-panel" aria-labelledby="taste-genres">
        <h2 id="taste-genres">Genre mix</h2>
        {tasteError ? (
          <p className="taste-note">Couldn&apos;t reach the taste endpoint.</p>
        ) : !taste ? (
          <p className="taste-note">Sampling listening history…</p>
        ) : taste.error ? (
          <p className="taste-note">{taste.error}</p>
        ) : !taste.configured ? (
          <p className="taste-note">
            {taste.message ?? "Spotify listening is not connected yet."}
          </p>
        ) : (
          <>
            {taste.genres && taste.genres.length > 0 ? (
              <div className="taste-genre-bars">
                {taste.genres.map((genre) => (
                  <div className="taste-genre-row" key={genre.genre}>
                    <span className="taste-genre-name">{genre.genre}</span>
                    <div className="taste-genre-track" aria-hidden="true">
                      <div
                        className="taste-genre-fill"
                        style={{
                          width: `${Math.max(4, (genre.weight / maxWeight) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="taste-genre-share">{genre.share}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="taste-note">Genre metadata is unavailable for this sample.</p>
            )}
            <p className="taste-note taste-meta">
              {taste.generatedAt
                ? `Sampled ${formatWhen(taste.generatedAt)} · weighted by plays in the latest 50 tracks`
                : ""}
            </p>
          </>
        )}
      </section>

      <section className="taste-panel" aria-labelledby="taste-artists">
        <h2 id="taste-artists">Top artists</h2>
        {tasteError ? (
          <p className="taste-note">Couldn&apos;t reach the taste endpoint.</p>
        ) : !taste ? (
          <p className="taste-note">Loading…</p>
        ) : taste.error ? (
          <p className="taste-note">{taste.error}</p>
        ) : !taste.configured ? (
          <p className="taste-note">
            {taste.message ?? "Spotify listening is not connected yet."}
          </p>
        ) : !taste.topArtists || taste.topArtists.length === 0 ? (
          <p className="taste-note">No listening data is available yet.</p>
        ) : (
          <ul className="taste-artist-grid">
            {taste.topArtists?.map((artist, index) => (
              <li className="taste-artist" key={artist.id}>
                <span className="taste-artist-rank">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="taste-artist-name">{artist.name}</span>
                <span className="taste-artist-genres">
                  {artist.genres.length > 0
                    ? artist.genres.slice(0, 2).join(" · ")
                    : "Genre metadata unavailable"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="taste-panel taste-panel-wide" aria-labelledby="taste-elo">
        <h2 id="taste-elo">Album Elo board</h2>
        {eloError ? (
          <p className="taste-note">Couldn&apos;t reach the Elo endpoint.</p>
        ) : !elo ? (
          <p className="taste-note">Loading…</p>
        ) : elo.count === 0 ? (
          <p className="taste-note">
            No albums have been rated yet.
          </p>
        ) : (
          <>
            <ol className="taste-elo-list">
              {elo.leaderboard.map((entry, index) => (
                <li className="taste-elo-row" key={entry.albumId}>
                  <span className="taste-elo-rank">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="taste-elo-copy">
                    <a
                      className="taste-elo-title"
                      href={entry.url ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {entry.albumName}
                    </a>
                    <span className="taste-elo-artist">{entry.artist}</span>
                  </span>
                  <span className="taste-elo-rating">
                    {Math.round(entry.rating)}
                    <small>· {entry.games}g</small>
                  </span>
                </li>
              ))}
            </ol>
            <p className="taste-note taste-meta">
              {elo.median ? `Board median: ${Math.round(elo.median)}` : ""}
            </p>
          </>
        )}
      </section>
      </div>
    </section>
  );
}

export default TasteSection;
