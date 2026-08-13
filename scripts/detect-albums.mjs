#!/usr/bin/env node
/**
 * detect-albums.mjs — find albums Ayush listened to in full from recent
 * Spotify history, dedupe against data/prompted.json, and print the new
 * completions as JSON for the nightly Hermes cron to act on.
 *
 * Usage: node scripts/detect-albums.mjs [--reset-prompted]
 * Reads credentials from .env.spotify.local (or process env).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { detectCompletedAlbums } from "../server/albums.ts";
import { getRecentlyPlayedDetailed, readSpotifyConfig } from "../server/spotify.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const promptedPath = join(root, "data", "prompted.json");

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

function loadPrompted() {
  if (!existsSync(promptedPath)) return {};
  try {
    return JSON.parse(readFileSync(promptedPath, "utf8"));
  } catch {
    return {};
  }
}

function savePrompted(prompted) {
  writeFileSync(promptedPath, JSON.stringify(prompted, null, 2) + "\n");
}

const config = readSpotifyConfig(process.env);
if (!config) {
  console.error("No Spotify credentials — is .env.spotify.local present?");
  process.exit(1);
}

const reset = process.argv.includes("--reset-prompted");
const prompted = reset ? {} : loadPrompted();

const tracks = await getRecentlyPlayedDetailed(config, 50);
const completions = detectCompletedAlbums(tracks, 0.75);

const fresh = completions.filter((album) => !prompted[album.albumId]);
for (const album of fresh) {
  prompted[album.albumId] = {
    promptedAt: new Date().toISOString(),
    albumName: album.albumName,
  };
}
if (fresh.length > 0 || reset) savePrompted(prompted);

console.log(
  JSON.stringify(
    {
      fresh: fresh.map((album) => ({
        albumId: album.albumId,
        albumName: album.albumName,
        artist: album.artistNames.join(", "),
        playedTracks: album.playedTracks,
        totalTracks: album.totalTracks,
        lastPlayedAt: album.lastPlayedAt,
      })),
      alreadyPrompted: completions.filter((album) => prompted[album.albumId]).length,
      promptedTotal: Object.keys(prompted).length,
    },
    null,
    2,
  ),
);
