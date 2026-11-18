// Inline the dashboard sources into self-contained deployable HTML files.
// Usage: node scripts/build-dashboard.mjs
//
//   dashboard/life/index.html  -> server/dashboard/overview.html  (life view)
//   dashboard/src/index.html   -> server/dashboard/status.html    (ops view)
//
// Markers <!--INLINE:name--> resolve relative to the entry's directory.
// <!--INLINE:SEED--> embeds dashboard/fixtures/state.v2.json as
// window.__DASHBOARD_SEED__ so a page still renders from file:// with no network.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "..");
const fixture = path.join(root, "dashboard", "fixtures", "state.v2.json");

const builds = [
  {
    name: "life",
    srcDir: path.join(root, "dashboard", "life"),
    out: path.join(root, "server", "dashboard", "overview.html"),
  },
  {
    name: "status",
    srcDir: path.join(root, "dashboard", "src"),
    out: path.join(root, "server", "dashboard", "status.html"),
  },
];

const seedJson = fs.readFileSync(fixture, "utf8");
try {
  JSON.parse(seedJson);
} catch (err) {
  console.error(`fixture is not valid JSON: ${fixture} (${err.message})`);
  process.exit(1);
}

let failed = false;

for (const build of builds) {
  const entry = path.join(build.srcDir, "index.html");
  if (!fs.existsSync(entry)) {
    console.error(`missing entry: ${entry}`);
    failed = true;
    continue;
  }

  const missing = [];
  let html = fs.readFileSync(entry, "utf8");
  html = html.replace(/<!--INLINE:([^>]+?)-->/g, (_, name) => {
    const marker = name.trim();
    if (marker === "SEED") return `window.__DASHBOARD_SEED__=${seedJson};`;
    const file = path.join(build.srcDir, marker);
    if (!fs.existsSync(file)) {
      missing.push(marker);
      return `/* missing: ${marker} */`;
    }
    return fs.readFileSync(file, "utf8");
  });

  // A literal </script inside inlined content would break the page.
  if (/<\/script/i.test(html.replace(/<\/script>\s*<\/body>/i, ""))) {
    console.error(`${build.name}: inlined content contains a literal </script sequence`);
    failed = true;
    continue;
  }

  fs.mkdirSync(path.dirname(build.out), { recursive: true });
  fs.writeFileSync(build.out, html);

  const raw = Buffer.byteLength(html);
  const gz = zlib.gzipSync(Buffer.from(html)).length;
  console.log(`built ${path.relative(root, build.out)} (${build.name})`);
  console.log(`  raw ${(raw / 1024).toFixed(1)} KB · gzip ${(gz / 1024).toFixed(1)} KB`);
  if (missing.length) console.warn(`  skipped: ${missing.join(", ")}`);
  if (gz > 150 * 1024) {
    console.error("  over the 150 KB gzip budget");
    failed = true;
  }
}

if (failed) process.exitCode = 1;
