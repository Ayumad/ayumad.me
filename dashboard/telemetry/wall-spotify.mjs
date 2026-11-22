import { spawnSync } from "node:child_process";
import { access, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { getSpotifyPlayback, readSpotifyConfig } from "../../server/spotify.ts";

const POLL_MS = 60000;
const RECENT_CACHE_MS = 180000;
const cacheFile = join(homedir(), ".hermes", "state", "spotify-playback.json");
const config = readSpotifyConfig();
if (!config) throw new Error("Spotify credentials are missing.");

let token = null;
let recent = null;
let retryAt = 0;
let hasPlayback = await access(cacheFile).then(() => true, () => false);
const mirrorCommand = `
set -eu
directory="$HOME/dashboard-wall"
temporary="$(mktemp "$directory/.spotify-playback.XXXXXX")"
trap 'rm -f "$temporary"' EXIT
cat > "$temporary"
python3 -m json.tool "$temporary" >/dev/null
chmod 644 "$temporary"
mv -f "$temporary" "$directory/spotify-playback.json"
`;

async function fetchSpotify(url, options) {
  const now = Date.now();
  const refreshing = url === "https://accounts.spotify.com/api/token";
  const loadingRecent = url.startsWith("https://api.spotify.com/v1/me/player/recently-played?");
  if (refreshing && token?.until > now) return Response.json(token.data);
  if (loadingRecent && recent?.until > now) return Response.json(recent.data);
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
  if (response.status === 429) {
    const seconds = Number(response.headers.get("retry-after"));
    const wait = Math.max(POLL_MS, Number.isFinite(seconds) ? seconds * 1000 : POLL_MS);
    retryAt = Date.now() + wait;
    console.warn(`Spotify rate limit. Retrying in ${Math.ceil(wait / 1000)} seconds.`);
  }
  if (response.status === 401) token = null;
  if (response.ok && (refreshing || loadingRecent)) {
    const data = await response.clone().json();
    if (refreshing && data.access_token && Number.isFinite(data.expires_in)) {
      token = { data, until: now + Math.max(0, data.expires_in - 60) * 1000 };
    }
    if (loadingRecent) recent = { data, until: now + RECENT_CACHE_MS };
  }
  return response;
}

async function refresh() {
  const playback = await getSpotifyPlayback(config, fetchSpotify);
  if (playback.state === "unavailable" && hasPlayback) return;
  if (playback.isPlaying) recent = null;
  const data = JSON.stringify({ ...playback, playedAt: playback.playedAt?.slice(0, 10) ?? null });
  const temporary = cacheFile + ".tmp";
  await writeFile(temporary, data, { mode: 0o600 });
  await rename(temporary, cacheFile);
  const transfer = spawnSync("/usr/bin/ssh", [
    "-T", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes", "-o", "ConnectTimeout=6",
    "ayumad@10.0.0.54", mirrorCommand,
  ], { input: data, encoding: "utf8", timeout: 12000 });
  if (transfer.status !== 0) throw new Error(transfer.error?.message || "Wall playback sync failed.");
  hasPlayback = playback.state !== "unavailable";
}

do {
  const started = Date.now();
  if (started >= retryAt) {
    try {
      await refresh();
    } catch (error) {
      console.error(error.message);
    }
  }
  if (process.argv.includes("--once")) break;
  await setTimeout(Math.max(1000, started + POLL_MS - Date.now(), retryAt - Date.now()));
} while (true);
