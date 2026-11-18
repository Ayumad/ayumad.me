import { createDecipheriv } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

export const dashboardDirectory = join(process.cwd(), "server/dashboard");

export async function readSnapshot(env: NodeJS.ProcessEnv = process.env) {
  const key = env.DASHBOARD_SNAPSHOT_KEY;
  if (!key || !/^[0-9a-f]{64}$/i.test(key)) return null;

  try {
    const { nonce, tag, ciphertext } = JSON.parse(await readFile(join(dashboardDirectory, "snapshot.enc.json"), "utf8"));
    const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), Buffer.from(nonce, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    const compressed = Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]);
    return gunzipSync(compressed, { maxOutputLength: 2 * 1024 * 1024 }).toString("utf8");
  } catch {
    return null;
  }
}
