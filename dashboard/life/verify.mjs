// Build first, then run with node dashboard/life/verify.mjs.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import ts from "typescript";

const root = fileURLToPath(new URL("../..", import.meta.url));
const html = await fs.readFile(path.join(root, "server/dashboard/overview.html"));
const fixture = path.join(root, ".life-payload.json");
const full = JSON.parse(await fs.readFile(fixture, "utf8"));
const output = await fs.mkdtemp(path.join(os.tmpdir(), "life-verify-"));
const fixtureTime = new Date(Date.parse(full.generated_at) + 120000);
const weather = {
  current: { temperature_2m: 51, is_day: 0, weather_code: 3 },
  daily: {
    time: ["2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"],
    temperature_2m_max: [55, 55, 58, 55],
    temperature_2m_min: [50, 43, 41, 48],
  },
};

async function publicProjection() {
  const scratch = await fs.mkdtemp(path.join(output, "projection-"));
  try {
    // Exercise the production projector, injecting only its snapshot reader.
    const source = await fs.readFile(path.join(root, "server/dashboard/public.ts"), "utf8");
    const { outputText } = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
    } });
    await fs.writeFile(path.join(scratch, "package.json"), '{"type":"module"}');
    await fs.writeFile(path.join(scratch, "snapshot.js"),
      `import { readFile } from "node:fs/promises"; export const readSnapshot = () => readFile(${JSON.stringify(fixture)}, "utf8");`);
    await fs.writeFile(path.join(scratch, "public.js"), outputText);
    const { readPublicSnapshot } = await import(pathToFileURL(path.join(scratch, "public.js")));
    return JSON.parse(await readPublicSnapshot({}));
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}

const publicData = await publicProjection();
const privateStrings = [
  ...full.tasks.items.map(({ title }) => title),
  ...full.school.next.map(({ title }) => title),
  ...[...full.calendar.events, ...full.calendar.week].map(({ summary }) => summary),
  ...full.recent.map(({ label }) => label),
  full.brain.top_hub.label,
  ...full.brain.nodes.map(({ id }) => id),
].filter((value) => value && value.length > 8);

function verifyPrivacy(content) {
  for (const value of privateStrings) {
    assert(!content.toLowerCase().includes(value.toLowerCase()), "Public response or rendered view contains a private title or note");
  }
  assert(!/CMPE[- ]148 Project 4 paper|Add the 3 teammates|Beta release test report/i.test(content));
}

verifyPrivacy(JSON.stringify(publicData));
assert(publicData.public);
assert(publicData.calendar.events.every((event) => Object.keys(event).every((key) => ["time", "all_day"].includes(key))));
for (const name of ["recent", "projects", "journal"]) assert.equal(publicData[name]?.length ?? 0, 0);
assert.equal(publicData.brain.top_hub, undefined);
assert(publicData.brain.nodes.every((node) => !node.label && !node.folder));

const origin = "http://dashboard.test";
let browser;
let launchOptions = {};

async function launch() {
  return chromium.launch(launchOptions).catch((error) => {
    if (process.platform !== "darwin" || !String(error).includes("bootstrap_check_in")) throw error;
    launchOptions = { args: ["--single-process", "--in-process-gpu", "--disable-gpu"] };
    return chromium.launch(launchOptions);
  });
}

async function close() {
  await browser?.close();
  browser = undefined;
}

async function open(width, height, options = {}) {
  const { payload = full, forecast = weather, wall = false, reducedMotion = "no-preference", now = fixtureTime } = options;
  browser = await launch();
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const answer = (route, body) => body === null
    ? route.fulfill({ contentType: "text/plain", body: "unavailable" })
    : route.fulfill({ json: body });
  await page.route(`${origin}/**`, (route) => route.fulfill({
    contentType: "text/html; charset=utf-8", body: html,
  }));
  await page.route("**/dashboard/data", (route) => answer(route, typeof payload === "function" ? payload() : payload));
  await page.route("**/dashboard.json", (route) => answer(route, typeof payload === "function" ? payload() : payload));
  await page.route("https://api.open-meteo.com/**", (route) => answer(route, forecast));
  await page.clock.install({ time: now });
  await page.goto(`${origin}/${wall ? "wall/dashboard.html" : "dashboard"}`, { waitUntil: "networkidle" });
  return { page, errors };
}

async function inspect(page) {
  return page.evaluate(() => {
    const find = (id) => document.getElementById(id);
    const entries = (id) => find(id).querySelectorAll(".rail-row").length;
    const box = (node) => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      inner: [innerWidth, innerHeight],
      scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      source: find("source").innerText,
      focus: ["focuskicker", "focustitle", "focusdetail"].map((id) => find(id).innerText),
      activeHub: document.querySelector(".hub[data-active=true]")?.dataset.hub ?? null,
      health: ["pulse", "hermes-state", "homelab-state", "services"].map((id) => find(id).innerText),
      area: box(find("sky")),
      hubs: [...document.querySelectorAll(".hub")].map((node) => ({ ...box(node), text: node.innerText })),
      rows: [entries("events"), entries("tasks"), entries("school"), entries("weekrows"), document.querySelectorAll(".forecast-day").length],
      panels: ["today", "week", "task-panel", "school-panel", "constellation", "health", "weather"]
        .map((id) => ({ ...box(find(id)), state: find(id).dataset.state })),
    };
  });
}

function verifyBounds(metrics) {
  assert.deepEqual(metrics.scroll, metrics.inner);
  const footer = metrics.panels.at(-2);
  for (const panel of metrics.panels) {
    const limit = panel === footer ? metrics.inner[1] : footer.y;
    assert(panel.y >= 0 && panel.y + panel.height <= limit + 0.25, "Panel outside its allotted viewport space");
  }
  assert.equal(metrics.hubs.length, 8);
  const { x, y, width, height } = metrics.area;
  for (const [index, hub] of metrics.hubs.entries()) {
    assert(hub.text && hub.width > 0 && hub.height > 0);
    assert(hub.x >= x && hub.x + hub.width <= x + width && hub.y >= y && hub.y + hub.height <= y + height,
      `Hub outside constellation ${hub.text}`);
    for (const other of metrics.hubs.slice(index + 1)) {
      assert(hub.x + hub.width <= other.x || other.x + other.width <= hub.x ||
        hub.y + hub.height <= other.y || other.y + other.height <= hub.y,
      `Hub labels overlap ${hub.text} and ${other.text}`);
    }
  }
  assert(metrics.rows.every((rows, idx) => rows <= [3, 3, 2, 3, 3][idx]));
}

const image = (page) => page.locator("#radar").evaluate((canvas) => canvas.toDataURL());

try {
  for (const [name, width, height, options] of [
    ["wall-1920", 1920, 1080, { wall: true }],
    ["signed-in-390", 390, 844, {}],
    ["public-1920", 1920, 1080, { payload: publicData }],
    ["public-390", 390, 844, { payload: publicData }],
  ]) {
    const { page, errors } = await open(width, height, options);
    const screenshot = path.join(output, `${name}.png`);
    await page.screenshot({ path: screenshot });
    const result = await inspect(page);
    verifyBounds(result);
    const isPublic = options.payload?.public;
    assert.equal(result.source, isPublic ? "PUBLIC" : options.wall ? "LIVE" : "SNAPSHOT");
    assert.deepEqual(result.focus, isPublic ? ["LIKELY", "Wrap up", "Public view · sign in for details"]
      : ["OVERDUE", "CMPE-148 Project 4 paper", "Due 11:59 PM · School"]);
    assert.deepEqual(result.health, ["WARNING", "Clear", "1 warning", "33/33"]);
    assert.equal(result.activeHub, isPublic ? null : "tasks");
    assert.deepEqual(result.rows, isPublic ? [0, 0, 0, 3, 3] : [3, 3, 2, 3, 3]);

    const frame = await image(page);
    const seconds = await page.locator("#secs").innerText();
    await page.clock.runFor(1100);
    assert.notEqual(await image(page), frame, "Constellation should drift");
    assert.notEqual(await page.locator("#secs").innerText(), seconds, "Clock seconds should tick");

    const hub = page.getByRole("button", { name: /vault/i });
    await hub.hover();
    assert.equal(await page.locator("#hubdetail-text").innerText(), isPublic ? "662 vault notes" : full.brain.top_hub.label);
    await hub.click();
    assert.equal(await hub.getAttribute("aria-pressed"), "true");
    await page.mouse.move(0, 0);
    assert.equal(await page.locator("#hubdetail-label").innerText(), "VAULT");
    if (isPublic) {
      for (const button of await page.locator("button.hub").all()) await button.click();
      verifyPrivacy(await page.locator("body").innerText());
      verifyPrivacy(await page.content());
    }

    assert.deepEqual(errors, []);
    console.log(name, JSON.stringify({
      viewport: result.inner, scroll: result.scroll, focus: result.focus, hubs: result.hubs.length, rows: result.rows,
      health: result.health, animated: true, errors: errors.length, screenshot,
    }));
    await close();
  }

  const mixed = await open(390, 844, { payload: { ...full, public: true } });
  for (const button of await mixed.page.locator("button.hub").all()) {
    await button.click();
    verifyPrivacy(await mixed.page.content());
  }
  assert.deepEqual(mixed.errors, []);
  await close();

  const reduced = await open(390, 844, { reducedMotion: "reduce" });
  const frame = await image(reduced.page);
  await reduced.page.clock.runFor(1100);
  assert.equal(await image(reduced.page), frame);
  assert.deepEqual(reduced.errors, []);
  await close();

  const longFocus = await open(390, 844, {
    payload: {
      ...full,
      calendar: {
        ...full.calendar,
        events: [
          ...full.calendar.events.slice(0, 1),
          { ...full.calendar.events[1], summary: "Software Engineering Capstone Design Review and Live Demonstration" },
          ...full.calendar.events.slice(2),
        ],
      },
    },
    now: new Date("2026-11-19T09:20:00-08:00"),
  });
  const longMetrics = await inspect(longFocus.page);
  assert.equal(longMetrics.activeHub, "calendar");
  verifyBounds(longMetrics);
  assert.deepEqual(longFocus.errors, []);
  await close();

  let payload = { ...full, generated_at: "2026-11-19T09:19:00-08:00" };
  const live = await open(1920, 1080, {
    payload: () => payload,
    now: new Date("2026-11-19T09:20:00-08:00"),
  });
  assert.deepEqual((await inspect(live.page)).focus, ["NOW", "CMPE 131 — Software Engr I", "Until 10:15 AM · Class"]);
  assert.equal((await inspect(live.page)).activeHub, "calendar");
  const originalPoint = await live.page.locator("#service-trend circle").getAttribute("cy");
  payload = {
    ...full, generated_at: "2026-11-19T09:24:00-08:00", now: { ...full.now, services_up: full.now.services_up - 1 },
  };
  await live.page.clock.fastForward(300000);
  await live.page.waitForFunction(() => document.getElementById("services").innerText === "32/33");
  assert.notEqual(await live.page.locator("#service-trend circle").getAttribute("cy"), originalPoint);
  payload = null;
  await live.page.clock.fastForward(300000);
  await live.page.waitForFunction(() => document.getElementById("source").innerText === "STALE");
  assert.equal((await inspect(live.page)).health[0], "STATUS STALE");
  assert.deepEqual(live.errors, []);
  await close();

  for (const [payload, expected] of [[{}, "empty"], [null, "error"]]) {
    const scenario = await open(390, 844, { payload, forecast: payload });
    const metrics = await inspect(scenario.page);
    verifyBounds(metrics);
    assert(metrics.panels.every((panel) => panel.state === expected));
    assert.deepEqual(scenario.errors, []);
    await close();
  }
  console.log("Privacy, event focus, reduced motion, health updates, stale, empty, and offline views passed.");
} finally {
  await browser?.close();
}
