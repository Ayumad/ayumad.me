// Inline dashboard sources into one deployable HTML file.
// Usage: node scripts/build-dashboard.mjs
//
// - Entry: dashboard/src/index.html
// - Markers <!--INLINE:name--> resolve relative to dashboard/src/
//   (e.g. ../tokens.css, base.css, components.js).
// - Marker <!--INLINE:SEED--> embeds dashboard/fixtures/state.v2.json
//   as window.__DASHBOARD_SEED__ so the page works from file:// with no network.
// - Output: server/dashboard/overview.html (served by api/dashboard.ts behind auth).
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "..");
const srcDir = path.join(root, "dashboard", "src");
const entry = path.join(srcDir, "index.html");
const fixture = path.join(root, "dashboard", "fixtures", "state.v2.json");
const out = path.join(root, "server", "dashboard", "overview.html");

if (!fs.existsSync(entry)) {
  console.error(`missing entry: ${entry}`);
  process.exit(1);
}

const missing = [];
let html = fs.readFileSync(entry, "utf8");

// Seed payload: parsed here so a broken fixture fails the build loudly.
const seedJson = fs.readFileSync(fixture, "utf8");
try {
  JSON.parse(seedJson);
} catch (err) {
  console.error(`fixture is not valid JSON: ${fixture} (${err.message})`);
  process.exit(1);
}

html = html.replace(/<!--INLINE:([^>]+?)-->/g, (_, name) => {
  if (name.trim() === "SEED") {
    return `window.__DASHBOARD_SEED__=${seedJson};`;
  }
  const file = path.join(srcDir, name.trim());
  if (!fs.existsSync(file)) {
    missing.push(name.trim());
    return `/* missing: ${name.trim()} */`;
  }
  return fs.readFileSync(file, "utf8");
});

// A literal </script inside inlined content would break the single
// self-contained page; fail the build instead of shipping a broken file.
if (/<\/script/i.test(html.replace(/<\/script>\s*<\/body>/i, ""))) {
  console.error("inlined content contains a literal </script sequence");
  process.exit(1);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);

const raw = Buffer.byteLength(html);
const gz = zlib.gzipSync(Buffer.from(html)).length;
console.log(`built ${path.relative(root, out)}`);
console.log(`  raw ${(raw / 1024).toFixed(1)} KB · gzip ${(gz / 1024).toFixed(1)} KB`);
if (missing.length) console.warn(`  skipped: ${missing.join(", ")}`);
if (gz > 150 * 1024) {
  console.error("  over the 150 KB gzip budget");
  process.exitCode = 1;
}
