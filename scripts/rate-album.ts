#!/usr/bin/env node
/**
 * rate-album.mjs — record a user rating for an album and update data/elo.json.
 *
 * Usage:
 *   npm run spotify:rate -- "Superclean, Vol. II" 8
 *   npm run spotify:rate -- <albumId> 8        (by Spotify album id)
 *
 * Reads credentials from .env.spotify.local (or process env). Writes
 * data/elo.json with the Elo math from server/elo.ts. Commit + push after.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { recordRating, type EloEntry } from "../server/elo.ts";
import { getRecentlyPlayedDetailed, readSpotifyConfig } from "../server/spotify.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const eloPath = join(root, "data", "elo.json");

// Load .env.spotify.local if present and vars are missing.
const envFile = join(root, ".env.spotify.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"|"$/g, "");
    }
  }
}

const query = process.argv[2]?.trim();
const score = Number(process.argv[3]);
if (!query || !Number.isFinite(score) || score < 0 || score > 10) {
  console.error('Usage: npm run spotify:rate -- "<album name or id>" <score 0-10>');
  process.exit(1);
}

const config = readSpotifyConfig(process.env);
if (!config) {
  console.error("No Spotify credentials — is .env.spotify.local present?");
  process.exit(1);
}

// Find the album in recent history so we get the real name/artist/artwork.
const tracks = await getRecentlyPlayedDetailed(config, 50);
const match =
  tracks.find((track) => track.album.id === query) ??
  tracks.find((track) => track.album.name.toLowerCase().includes(query.toLowerCase()));

if (!match) {
  console.error(`Album "${query}" not found in recent history (last 50 plays).`);
  process.exit(1);
}

const entries = existsSync(eloPath)
  ? (JSON.parse(readFileSync(eloPath, "utf8")) as EloEntry[])
  : [];

const { entries: updated, delta } = recordRating(entries, {
  albumId: match.album.id,
  albumName: match.album.name,
  artist: match.artists.map((artist) => artist.name).join(", "),
  userScore: score,
  artworkUrl: match.album.images?.find((image) => image.url)?.url ?? null,
  url: match.url,
});

writeFileSync(eloPath, JSON.stringify(updated, null, 2) + "\n");

const entry = updated.find((e) => e.albumId === match.album.id)!;
console.log(
  `Rated "${match.album.name}" — ${match.artists.map((a) => a.name).join(", ")} at ${score}/10: ` +
    `${Math.round(entry.rating - delta)} → ${Math.round(entry.rating)} (Δ${delta > 0 ? "+" : ""}${delta})`,
);
