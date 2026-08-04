import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const requiredNames = [
  "SPOTIFY_CLIENT_ID",
  "SPOTIFY_CLIENT_SECRET",
  "SPOTIFY_REFRESH_TOKEN",
];
const contents = await readFile(".env.spotify.local", "utf8");
const values = new Map(
  contents
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);

for (const name of requiredNames) {
  const value = values.get(name);
  if (!value) throw new Error(`${name} is missing from .env.spotify.local.`);

  const result = spawnSync(
    "vercel",
    ["env", "add", name, "production", "--force", "--sensitive", "--yes"],
    {
      input: `${value}\n`,
      encoding: "utf8",
      stdio: ["pipe", "inherit", "inherit"],
    },
  );
  if (result.status !== 0) {
    throw new Error(`Vercel rejected ${name}.`);
  }
}

console.log("Spotify credentials are configured for the next production deployment.");
