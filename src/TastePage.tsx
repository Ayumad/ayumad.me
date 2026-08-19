import { useEffect, useState } from "react";
import AsciiScene from "./AsciiScene";

interface TasteData {
  configured: boolean;
  generatedAt?: string;
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

export function TastePage() {
  const [taste, setTaste] = useState<TasteData | null>(null);
  const [elo, setElo] = useState<EloData | null>(null);
  const [tasteError, setTasteError] = useState(false);
  const [eloError, setEloError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/taste")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setTaste(data);
      })
      .catch(() => {
        if (!cancelled) setTasteError(true);
      });
    fetch("/api/elo")
      .then((response) => (response.ok ? response.json() : null))
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
    <>
      <header className="page-heading">
        <div className="heading-copy">
          <p className="label">
            <span>04</span>
            Taste
          </p>
          <h1>Listening, ranked.</h1>
          <p className="page-intro">
            Genre breakdown, top artists, and the album Elo board — updated
            from my actual Spotify history.
          </p>
        </div>
        <AsciiScene className="heading-field art-now" scene="now" />
      </header>

      <section className="section-shell page-section" aria-labelledby="taste-genres">
        <h2 id="taste-genres">Genre mix</h2>
        {tasteError ? (
          <p className="taste-note">Couldn&apos;t reach the taste endpoint.</p>
        ) : !taste ? (
          <p className="taste-note">Sampling listening history…</p>
        ) : taste.error ? (
          <p className="taste-note">{taste.error}</p>
        ) : (
          <>
            <div className="taste-genre-bars">
              {taste.genres?.map((genre) => (
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
            <p className="taste-note taste-meta">
              {taste.generatedAt
                ? `Sampled ${formatWhen(taste.generatedAt)} · weighted by top-artist position`
                : ""}
            </p>
          </>
        )}
      </section>

      <section className="section-shell page-section" aria-labelledby="taste-artists">
        <h2 id="taste-artists">Top artists</h2>
        {tasteError ? (
          <p className="taste-note">Couldn&apos;t reach the taste endpoint.</p>
        ) : !taste ? (
          <p className="taste-note">Loading…</p>
        ) : taste.error ? null : (
          <ul className="taste-artist-grid">
            {taste.topArtists?.map((artist, index) => (
              <li className="taste-artist" key={artist.id}>
                <span className="taste-artist-rank">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="taste-artist-name">{artist.name}</span>
                <span className="taste-artist-genres">
                  {artist.genres.slice(0, 2).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-shell page-section" aria-labelledby="taste-elo">
        <h2 id="taste-elo">Album Elo board</h2>
        {eloError ? (
          <p className="taste-note">Couldn&apos;t reach the Elo endpoint.</p>
        ) : !elo ? (
          <p className="taste-note">Loading…</p>
        ) : elo.count === 0 ? (
          <p className="taste-note">
            No albums rated yet — finish an album and rate it in Telegram to
            seed the board.
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
    </>
  );
}

export default TastePage;
