// Local integration check for the status page.
// Serves server/dashboard/status.html with a fake /status/data endpoint,
// then renders it in Chromium at desktop, mobile, and wall sizes.
// Usage: node dashboard/verify.mjs
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const PAGE = fs.readFileSync(path.join(ROOT, "server/dashboard/status.html"), "utf8");
const PAYLOAD = fs.readFileSync(path.join(os.homedir(), ".hermes/state/dashboard_live.json"), "utf8");
const PORT = 4174;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname === "/status" || url.pathname === "/status/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    return res.end(PAGE);
  }
  if (url.pathname === "/status/data" || url.pathname === "/dashboard.json") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    return res.end(PAYLOAD);
  }
  if (url.pathname === "/dashboard/login") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end("<!doctype html><title>login</title><h1>login</h1>");
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
});

const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  ·  ${extra}` : ""}`);
};

await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
const browser = await chromium.launch();

async function open(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const jsErrors = [];
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) jsErrors.push(m.text()); });
  page.on("pageerror", (e) => jsErrors.push(String(e)));
  return { context, page, jsErrors };
}

// Desktop: authenticated snapshot path
{
  const { context, page, jsErrors } = await open({ width: 1920, height: 1080 });
  await page.goto(`http://127.0.0.1:${PORT}/status`, { waitUntil: "networkidle" });
  const pill = (await page.textContent("[data-pill]")).trim();
  check("desktop: pill says SNAPSHOT", /SNAPSHOT/.test(pill), pill);
  for (const id of ["sec-automations", "sec-homelab", "sec-services", "sec-media", "sec-personal", "sec-external", "sec-timeline"]) {
    check(`desktop: section ${id} present`, await page.locator(`#${id}`).count() === 1);
  }
  check("desktop: zero JS console errors", jsErrors.length === 0, jsErrors.join(" | "));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  check("desktop 1920×1080: no horizontal scroll", overflow);
  await page.screenshot({ path: path.join(ROOT, "dashboard/reference/auth-desktop.png"), fullPage: true });
  await context.close();
}

// Mobile
{
  const { context, page, jsErrors } = await open({ width: 390, height: 844 });
  await page.goto(`http://127.0.0.1:${PORT}/status`, { waitUntil: "networkidle" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  check("mobile 390×844: no horizontal scroll", overflow);
  check("mobile: zero JS console errors", jsErrors.length === 0, jsErrors.join(" | "));
  await page.screenshot({ path: path.join(ROOT, "dashboard/reference/auth-mobile.png"), fullPage: true });
  await context.close();
}

// Seed / fixture mode
{
  const { context, page } = await open({ width: 1440, height: 900 });
  await page.goto(`http://127.0.0.1:${PORT}/status?fixture=1`, { waitUntil: "networkidle" });
  const pill = (await page.textContent("[data-pill]")).trim();
  check("fixture=1: pill says SEED", /SEED/.test(pill), pill);
  await context.close();
}

// Wall page 1
{
  const { context, page, jsErrors } = await open({ width: 1920, height: 1080 });
  await page.goto(`http://127.0.0.1:${PORT}/status?mode=wall&page=1&fixture=1`, { waitUntil: "networkidle" });
  await page.waitForSelector("#wall");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  check("wall: no horizontal scroll", overflow);
  check("wall: zero JS console errors", jsErrors.length === 0, jsErrors.join(" | "));
  await page.screenshot({ path: path.join(ROOT, "dashboard/reference/auth-wall.png") });
  await context.close();
}

// Filesystem invariant: no public dashboard bypass
check("no public/dashboard.html", !fs.existsSync(path.join(ROOT, "public/dashboard.html")));
check("server/dashboard/overview.html exists", fs.existsSync(path.join(ROOT, "server/dashboard/overview.html")));
check("server/dashboard/status.html exists", fs.existsSync(path.join(ROOT, "server/dashboard/status.html")));

await browser.close();
server.close();
const failed = results.filter((x) => !x).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
