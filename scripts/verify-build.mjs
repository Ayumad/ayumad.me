import { access, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import assert from "node:assert/strict";

const dist = new URL("../dist/", import.meta.url);
const read = (path) => readFile(new URL(path, dist), "utf8");
const exists = (path) => access(new URL(path, dist)).then(() => true, () => false);
const siteOrigin = "https://ayumad.me";
const sitemap = await read("sitemap.xml");
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, address]) => address);

assert.ok(urls.includes(siteOrigin + "/journal/my-headphone-collection"));
assert.ok(urls.includes(siteOrigin + "/ai"));
assert.ok(!urls.some((url) => new URL(url).pathname.startsWith("/dashboard")));
assert.equal(urls.length, new Set(urls).size);

for (const address of urls) {
  const path = new URL(address).pathname;
  const file = path === "/" ? "index.html" : path === "/ai" ? "ai/index.html" : path.slice(1) + ".html";
  const html = await read(file);
  assert.ok(html.includes('rel="canonical" href="' + address + '"'), "Missing canonical for " + address);
  assert.match(html, /<h1(?:\s|>)/, "No heading in the initial HTML for " + address);
}

for (const file of ["dashboard.json", "dashboard.html", "dashboard/hermes.html", "dashboard/homelab.html"]) {
  assert.ok(!await exists(file), "Private dashboard file is in the public output: " + file);
}
const summary = JSON.parse(await read("dashboard-summary.json"));
assert.deepEqual(Object.keys(summary).sort(), ["activeProjects", "generatedAt", "servicesTotal", "servicesUp"].sort());

const errorPage = await read("404.html");
assert.ok(errorPage.includes('name="robots" content="noindex"'));
const home = await read("index.html");
const entry = /<script type="module"[^>]* src="\/(assets\/[^"]+\.js)"/.exec(home)?.[1];
assert.ok(entry, "Missing entry script");
const entryBytes = gzipSync(await read(entry)).byteLength;
assert.ok(entryBytes <= 160 * 1024, "Entry script exceeded the 160 KiB gzip budget");
console.log("Verified " + urls.length + " canonical pages, dashboard privacy and a " + Math.round(entryBytes / 1024) + " KiB gzip entry.");
