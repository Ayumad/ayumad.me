export interface EloEntry {
  albumId: string;
  albumName: string;
  artist: string;
  rating: number;
  games: number;
  firstRatedAt: string;
  lastRatedAt: string;
  artworkUrl: string | null;
  url: string | null;
}

export const DEFAULT_RATING = 1500;
export const K = 32;

/** Expected score of rating A against rating B (0..1). */
export function expectedScore(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

/** Rating delta for a match result; score is 1 = win, 0 = loss, 0.5 = draw. */
export function ratingDelta(
  rating: number,
  opponentRating: number,
  score: number,
  k = K,
): number {
  return Math.round(k * (score - expectedScore(rating, opponentRating)));
}

/**
 * Rate an album on a 0..10 scale against a reference rating (defaults to the
 * board's top album, or 1500 when the board is empty). The user's score is
 * treated as the expected win share: 10/10 ≈ win, 5/10 ≈ draw, 0/10 ≈ loss.
 * Returns the new rating and the delta applied.
 */
export function applyUserRating(
  currentRating: number,
  referenceRating: number,
  userScore: number,
  k = K,
): { newRating: number; delta: number } {
  const clamped = Math.max(0, Math.min(10, userScore));
  const score = clamped / 10;
  const delta = ratingDelta(currentRating, referenceRating, score, k);
  return { newRating: Math.max(100, currentRating + delta), delta };
}

/** Upsert an album entry after a user rating. Returns the updated entries. */
export function recordRating(
  entries: EloEntry[],
  input: {
    albumId: string;
    albumName: string;
    artist: string;
    userScore: number;
    artworkUrl?: string | null;
    url?: string | null;
  },
): { entries: EloEntry[]; delta: number } {
  const now = new Date().toISOString();
  const reference =
    entries.length > 0
      ? [...entries].sort((a, b) => b.rating - a.rating)[0].rating
      : DEFAULT_RATING;

  const existing = entries.find((entry) => entry.albumId === input.albumId);
  const currentRating = existing?.rating ?? DEFAULT_RATING;

  const { newRating, delta } = applyUserRating(currentRating, reference, input.userScore);

  if (existing) {
    existing.rating = newRating;
    existing.games += 1;
    existing.lastRatedAt = now;
  } else {
    entries.push({
      albumId: input.albumId,
      albumName: input.albumName,
      artist: input.artist,
      rating: newRating,
      games: 1,
      firstRatedAt: now,
      lastRatedAt: now,
      artworkUrl: input.artworkUrl ?? null,
      url: input.url ?? null,
    });
  }

  return { entries, delta };
}
