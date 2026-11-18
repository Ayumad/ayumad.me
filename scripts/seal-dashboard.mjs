import { createCipheriv, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const [input, keyPath, root = process.cwd()] = process.argv.slice(2);
if (!input || !keyPath) {
  console.error("Usage: node scripts/seal-dashboard.mjs <private JSON file> <key file> [repo root]");
  process.exit(1);
}

const key = (await readFile(keyPath, "utf8")).trim();
if (!/^[0-9a-f]{64}$/i.test(key)) throw new Error("Expected a 32-byte key in hexadecimal.");

const snapshot = JSON.parse(await readFile(input, "utf8"));
if (typeof snapshot.generated_at !== "string" || !Number.isFinite(Date.parse(snapshot.generated_at))) {
  throw new Error("Dashboard snapshot is missing a valid timestamp.");
}
const count = (value) => Number.isSafeInteger(value) && value >= 0 ? value : null;
const summary = {
  generatedAt: new Date(snapshot.generated_at).toISOString(),
  activeProjects: count(snapshot.now?.active_projects),
  servicesUp: count(snapshot.now?.services_up),
  servicesTotal: count(snapshot.now?.services_total),
};

const nonce = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), nonce);
const ciphertext = Buffer.concat([cipher.update(gzipSync(JSON.stringify(snapshot))), cipher.final()]);
const envelope = {
  nonce: nonce.toString("base64"),
  tag: cipher.getAuthTag().toString("base64"),
  ciphertext: ciphertext.toString("base64"),
};

async function writeJson(path, value) {
  const destination = resolve(root, path);
  const temporary = destination + ".tmp";
  await writeFile(temporary, JSON.stringify(value) + "\n");
  await rename(temporary, destination);
}

await mkdir(resolve(root, "server/dashboard"), { recursive: true });
await writeJson("server/dashboard/snapshot.enc.json", envelope);
await writeJson("public/dashboard-summary.json", summary);
