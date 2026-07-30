import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { chmod, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import process from "node:process";

const redirectUri = "http://127.0.0.1:8888/callback";
const scopes = [
  "user-read-currently-playing",
  "user-read-recently-played",
];

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const clientId = (await readline.question("Spotify Client ID: ")).trim();
readline.close();

function readSecret(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    const fallback = createInterface({ input: process.stdin, output: process.stdout });
    return fallback.question(prompt).finally(() => fallback.close());
  }

  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolve, reject) => {
    let secret = "";
    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off("data", onData);
      process.stdout.write("\n");
    };
    const onData = (chunk) => {
      const input = chunk.toString("utf8");
      if (input === "\u0003") {
        finish();
        reject(new Error("Spotify authorization cancelled."));
      } else if (input === "\r" || input === "\n") {
        finish();
        resolve(secret);
      } else if (input === "\u007f" || input === "\b") {
        secret = secret.slice(0, -1);
      } else if (!input.startsWith("\u001b")) {
        secret += input;
      }
    };
    process.stdin.on("data", onData);
  });
}

const clientSecret = (await readSecret("Spotify Client Secret (hidden): ")).trim();

if (!clientId || !clientSecret) {
  throw new Error("Both the Spotify Client ID and Client Secret are required.");
}

const state = randomBytes(24).toString("hex");
const authorizationUrl = new URL("https://accounts.spotify.com/authorize");
authorizationUrl.search = new URLSearchParams({
  response_type: "code",
  client_id: clientId,
  scope: scopes.join(" "),
  redirect_uri: redirectUri,
  state,
  show_dialog: "true",
}).toString();

console.log("\nAdd this exact redirect URI to your Spotify app:");
console.log(redirectUri);
console.log("\nThen open this authorization URL:");
console.log(authorizationUrl.toString());
console.log("\nWaiting for Spotify authorization…");

const authorizationCode = await new Promise((resolve, reject) => {
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", redirectUri);
    if (requestUrl.pathname !== "/callback") {
      response.writeHead(404).end("Not found");
      return;
    }

    if (requestUrl.searchParams.get("state") !== state) {
      response.writeHead(400).end("State mismatch. Return to the terminal and try again.");
      server.close();
      reject(new Error("Spotify returned an invalid OAuth state."));
      return;
    }

    const error = requestUrl.searchParams.get("error");
    const code = requestUrl.searchParams.get("code");
    if (error || !code) {
      response.writeHead(400).end("Spotify authorization was not completed.");
      server.close();
      reject(new Error(error ?? "Spotify did not return an authorization code."));
      return;
    }

    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Spotify is connected. You can close this tab and return to Codex.");
    server.close();
    resolve(code);
  });

  server.on("error", reject);
  server.listen(8888, "127.0.0.1");
});

const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: {
    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code: authorizationCode,
    redirect_uri: redirectUri,
  }),
});
const tokenPayload = await tokenResponse.json();

if (!tokenResponse.ok || typeof tokenPayload.refresh_token !== "string") {
  throw new Error(
    tokenPayload.error_description ??
      tokenPayload.error ??
      "Spotify did not return a refresh token.",
  );
}

const envFile = [
  `SPOTIFY_CLIENT_ID=${clientId}`,
  `SPOTIFY_CLIENT_SECRET=${clientSecret}`,
  `SPOTIFY_REFRESH_TOKEN=${tokenPayload.refresh_token}`,
  "",
].join("\n");

await writeFile(".env.spotify.local", envFile, { encoding: "utf8", mode: 0o600 });
await chmod(".env.spotify.local", 0o600);

console.log("\nSaved the private credentials to .env.spotify.local.");
console.log("Run `npm run spotify:push-env` to send them securely to Vercel.");
