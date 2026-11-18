// Inline dashboard sources into one deployable HTML file.
// Usage: node scripts/build-dashboard.mjs
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "..");
const srcDir = path.join(root, "dashboard", "src");
const entry = path.join(srcDir, "index.html");
const out = path.join(root, "public", "dashboard-next.html");

if (!fs.existsSync(entry)) {
  console.error(`missing entry: ${entry}`);
  process.exit(1);
}

const missing = [];
let html = fs.readFileSync(entry, "utf8");

html = html.replace(/<!--INLINE:([^>]+?)-->/g, (_, name) => {
  const file = path.join(srcDir, name.trim());
  if (!fs.existsSync(file)) {
    missing.push(name.trim());
    return `/* missing: ${name.trim()} */`;
  }
  return fs.readFileSync(file, "utf8");
});

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
