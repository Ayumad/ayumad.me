import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const destination = process.argv[2];
if (!destination || !/^[\w.][\w.-]*@[\w.][\w.-]*$/.test(destination)) {
  throw new Error("Usage: node export-codex.mjs user@hermes-host");
}

const codex = join(homedir(), ".codex");
const catalogPath = join(codex, "sqlite", "codex.db");
const state = new DatabaseSync(join(codex, "state_5.sqlite"), { readOnly: true });
const catalog = existsSync(catalogPath) ? new DatabaseSync(catalogPath, { readOnly: true }) : null;
const namedThread = catalog?.prepare(`
  SELECT display_title FROM local_thread_catalog
  WHERE host_id = 'local' AND thread_id = ?
`);
let latest = null;

try {
  const cutoff = Date.now() - 12 * 3600000;
  const rows = state.prepare(`
    SELECT id, name, COALESCE(updated_at_ms, updated_at * 1000) AS updated
    FROM threads
    WHERE archived = 0
      AND (thread_source = 'user' OR thread_source IS NULL OR thread_source = '')
      AND source NOT LIKE '%guardian%'
      AND source NOT LIKE '%subagent%'
      AND COALESCE(updated_at_ms, updated_at * 1000) >= ?
    ORDER BY updated DESC LIMIT 8
  `).all(cutoff);
  for (const row of rows) {
    const title = row.name?.trim() || namedThread?.get(row.id)?.display_title?.trim();
    if (!title) continue;
    latest = {
      title: title.replace(/\s+/g, " ").slice(0, 180),
      updated_at: new Date(row.updated).toISOString(),
    };
    break;
  }
} finally {
  catalog?.close();
  state.close();
}

const sent = spawnSync("ssh", [
  "-T", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8", "-o", "StrictHostKeyChecking=yes",
  destination, 'python3 "$HOME/.hermes/scripts/dashboard_codex_feed.py"',
], {
  input: JSON.stringify(latest),
  encoding: "utf8",
  timeout: 20000,
  windowsHide: true,
});
if (sent.status !== 0) {
  throw new Error(sent.error?.message || sent.stderr.trim() || "Hermes rejected the desktop Codex update.");
}
