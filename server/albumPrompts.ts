import type { AlbumCompletion } from "./albums.js";

export interface PromptedAlbum {
  promptedAt: string;
  albumName: string;
}

export type PromptedAlbums = Record<string, PromptedAlbum>;

export interface PendingAlbum extends AlbumCompletion {
  queuedAt: string;
}

export type PendingAlbums = Record<string, PendingAlbum>;

export interface PromptDeliveryResult {
  sent: boolean;
  pending: PendingAlbums;
  prompted: PromptedAlbums;
}

/** Queue newly detected albums without treating detection as delivery. */
export function enqueueCompletions(
  completions: AlbumCompletion[],
  pending: PendingAlbums,
  prompted: PromptedAlbums,
  queuedAt: string,
): PendingAlbums {
  const next = { ...pending };
  for (const album of completions) {
    if (prompted[album.albumId] || next[album.albumId]) continue;
    next[album.albumId] = { ...album, queuedAt };
  }
  return next;
}

/** Deliver the oldest queued albums first, with a small bounded batch. */
export function selectPromptBatch(
  pending: PendingAlbums,
  prompted: PromptedAlbums,
  limit = 3,
): PendingAlbum[] {
  return Object.values(pending)
    .filter((album) => !prompted[album.albumId])
    .sort((a, b) => a.queuedAt.localeCompare(b.queuedAt))
    .slice(0, limit);
}

/** Mark exactly the delivered batch and remove it from the retry queue. */
export function acknowledgePrompt(
  pending: PendingAlbums,
  prompted: PromptedAlbums,
  batch: PendingAlbum[],
  promptedAt: string,
): { pending: PendingAlbums; prompted: PromptedAlbums } {
  const nextPending = { ...pending };
  const nextPrompted = { ...prompted };
  for (const album of batch) {
    nextPrompted[album.albumId] = {
      promptedAt,
      albumName: album.albumName,
    };
    delete nextPending[album.albumId];
  }
  return { pending: nextPending, prompted: nextPrompted };
}

/** Apply delivery state only after the sender confirms success. */
export async function deliverPromptBatch(
  pending: PendingAlbums,
  prompted: PromptedAlbums,
  batch: PendingAlbum[],
  send: () => Promise<boolean>,
  promptedAt: string,
): Promise<PromptDeliveryResult> {
  try {
    const sent = await send();
    if (!sent) return { sent: false, pending, prompted };
  } catch {
    return { sent: false, pending, prompted };
  }
  return {
    sent: true,
    ...acknowledgePrompt(pending, prompted, batch, promptedAt),
  };
}
