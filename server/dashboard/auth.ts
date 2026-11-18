import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const cookieName = "__Host-ayumad-dashboard";
const sessionSeconds = 8 * 60 * 60;
const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

export function dashboardAccount(env: NodeJS.ProcessEnv = process.env) {
  const username = env.DASHBOARD_USERNAME?.trim();
  const passwordHash = env.DASHBOARD_PASSWORD_HASH;
  const sessionSecret = env.DASHBOARD_SESSION_SECRET;
  if (!username || !passwordHash || !sessionSecret || !/^[0-9a-f]{64}$/i.test(sessionSecret)) return null;

  const [salt, hash, extra] = passwordHash.split(":");
  if (extra || !/^[0-9a-f]{32}$/i.test(salt) || !/^[0-9a-f]{64}$/i.test(hash ?? "")) return null;
  return { username, salt, hash, sessionSecret };
}

type Account = NonNullable<ReturnType<typeof dashboardAccount>>;

export async function verifyPassword(account: Account, username: string, password: string) {
  if (username.length > 100 || password.length > 256) return false;
  const candidate = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, Buffer.from(account.salt, "hex"), 32, scryptOptions, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
  return timingSafeEqual(candidate, Buffer.from(account.hash, "hex")) && username.trim() === account.username;
}

function sign(account: Account, payload: string) {
  return createHmac("sha256", Buffer.from(account.sessionSecret, "hex"))
    .update(JSON.stringify([account.username, account.hash, payload]))
    .digest("base64url");
}

export function createSession(account: Account, now = Date.now()) {
  const payload = [Math.floor(now / 1000) + sessionSeconds, randomBytes(16).toString("hex")].join(".");
  return cookie(payload + "." + sign(account, payload), sessionSeconds);
}

export function readSession(request: Request, account: Account, now = Date.now()) {
  const token = request.headers.get("cookie")?.match(/(?:^|;\s*)__Host-ayumad-dashboard=([^;]+)/)?.[1];
  const parts = token?.match(/^(\d{10,12})\.([0-9a-f]{32})\.([A-Za-z0-9_-]{43})$/);
  if (!parts || Number(parts[1]) <= Math.floor(now / 1000)) return false;

  const expected = sign(account, parts[1] + "." + parts[2]);
  return timingSafeEqual(Buffer.from(parts[3]), Buffer.from(expected));
}

function cookie(value: string, maxAge: number) {
  return cookieName + "=" + value + "; Path=/; Max-Age=" + maxAge + "; Secure; HttpOnly; SameSite=Lax";
}

export const expiredSession = cookie("", 0);
