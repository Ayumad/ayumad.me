// Local visual check for the life dashboard: full (signed-in/wall) and public.
// Usage: node dashboard/life/verify.mjs
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "../..");
const html = fs.readFileSync(path.join(ROOT, "server/dashboard/overview.html"));
const full = JSON.parse(fs.readFileSync(path.join(ROOT, ".life-payload.json"), "utf8"));

const counts = new Map();
for (const event of full.calendar?.week ?? []) {
  const date = String(event.sort || "").slice(0, 10);
  if (date) counts.set(date, (counts.get(date) ?? 0) + 1);
}
const publicPayload = {
  ...full,
  public: true,
  tasks: { open: full.tasks?.open ?? 0, overdue: full.tasks?.overdue ?? 0, items: [] },
  school: { upcoming: full.school?.upcoming ?? 0, next: [] },
  calendar: {
    count: full.calendar?.count ?? 0,
    week_count: full.calendar?.week_count ?? 0,
    week_days: [...counts.entries()].map(([date, count]) => ({ date, count })),
    events: (full.calendar?.events || []).map((e) => ({ time: e.time, all_day: e.time === "all-day" })),
  },
  fleet: [],
  journal: [],
};

function serve(payload, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url.startsWith("/dashboard/data")) {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(payload));
        return;
      }
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
    });
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

const fullServer = await serve(full, 4181);
const publicServer = await serve(publicPayload, 4182);
const browser = await chromium.launch();

async function shot(url, width, height, file) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: path.join(ROOT, "dashboard/reference", file) });
  const before = await page.evaluate(() => document.querySelector("#brain")?.toDataURL() || "");
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => document.querySelector("#brain")?.toDataURL() || "");
  const metrics = await page.evaluate(() => ({
    scroll: document.documentElement.scrollHeight,
    inner: window.innerHeight,
    source: document.querySelector("#source")?.textContent,
    secs: document.querySelector("#secs")?.textContent,
    meta: document.querySelector("#brainmeta")?.textContent,
    canvas: (() => {
      const c = document.querySelector("#brain");
      return c ? `${c.width}x${c.height}` : "none";
    })(),
    pulse: document.querySelector("#pulse")?.textContent,
    events: document.querySelector("#events")?.innerText.slice(0, 220),
    week: document.querySelector("#weekmeta")?.textContent,
    tasks: document.querySelector("#tasks")?.innerText.slice(0, 160),
    bars: [...document.querySelectorAll(".pstat")].map((node) => node.innerText.replace(/\n/g, " ")),
  }));
  metrics.animated = before !== "" && before !== after;
  console.log(file, JSON.stringify(metrics), "errors", errors.length, errors.slice(0, 2));
  await page.close();
}

await shot("http://127.0.0.1:4181/dashboard", 1920, 1080, "visual-full-1920.png");
await shot("http://127.0.0.1:4181/dashboard", 390, 844, "visual-full-390.png");
await shot("http://127.0.0.1:4182/dashboard", 1920, 1080, "visual-public-1920.png");

await browser.close();
fullServer.close();
publicServer.close();
