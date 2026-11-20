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
const fixtureDay = full.generated_at.slice(0, 10);
const fixtureTime = new Date(Date.parse(`${fixtureDay}T22:30:00-08:00`) - 86400000);
const weekendTime = new Date(Date.parse(`${fixtureDay}T18:00:00-08:00`) + 86400000);
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
      todayLabel: find("todaylabel").innerText,
      trackHidden: document.querySelector(".daytrack")?.hidden ?? null,
      schoolLabel: find("schoollabel").innerText,
      schoolMode: find("school-panel").dataset.mode ?? null,
      focus: ["focuskicker", "focustitle", "focusdetail"].map((id) => find(id).innerText),
      health: ["mac-cpu", "mac-mem", "p520-load", "p520-mem", "p520-gpu"].map((id) => find(id).innerText),
      healthState: find("health").dataset.state ?? null,
      spotifyState: find("spotify").dataset.state ?? null,
      projectPulseHidden: find("project-pulse").hidden,
      field: box(document.querySelector("#hermes-field canvas")),
      readout: box(document.querySelector(".hermes-context")),
      rows: [entries("events"), entries("tasks"), entries("school"), document.querySelectorAll(".forecast-day").length],
      panels: ["today", "project-pulse", "task-panel", "school-panel", "spotify", "hermes-field", "health", "weather"]
        .map((id) => ({ ...box(find(id)), state: find(id).dataset.state, id })),
    };
  });
}

function verifyBounds(metrics) {
  assert.deepEqual(metrics.scroll, metrics.inner);
  const footer = metrics.panels.find(({ id }) => id === "health");
  for (const panel of metrics.panels) {
    const limit = panel === footer ? metrics.inner[1] : footer.y;
    assert(panel.y >= 0 && panel.y + panel.height <= limit + 0.25, `${panel.id} ends at ${panel.y + panel.height}, limit ${limit}`);
  }
  const panel = metrics.panels.find(({ id }) => id === "hermes-field");
  assert(Math.abs(metrics.field.width - (panel.width - 2)) < 1);
  assert(Math.abs(metrics.field.height - (panel.height - 2)) < 1);
  assert(metrics.readout.y >= panel.y && metrics.readout.y + metrics.readout.height <= panel.y + panel.height);
  assert(metrics.rows.every((rows, idx) => rows <= [3, 3, 2, 1][idx]));
}

const image = (page) => page.locator("#hermes-field canvas").evaluate((canvas) => canvas.toDataURL());

try {
  for (const [name, width, height, options] of [
    ["wall-1920", 1920, 1080, { wall: true }],
    ["signed-in-390", 390, 844, {}],
    ["public-1920", 1920, 1080, { payload: publicData }],
    ["public-390", 390, 844, { payload: publicData }],
    ["weekend-1920", 1920, 1080, { wall: true, now: weekendTime,
      payload: { ...full, generated_at: weekendTime.toISOString() } }],
  ]) {
    const { page, errors } = await open(width, height, options);
    const screenshot = path.join(output, `${name}.png`);
    await page.screenshot({ path: screenshot });
    const result = await inspect(page);
    verifyBounds(result);
    const isPublic = options.payload?.public;
    const weekend = name.startsWith("weekend");
    assert.equal(result.source, isPublic ? "PUBLIC" : options.wall ? "LIVE" : "SNAPSHOT");
    assert(result.focus.every(Boolean));
    assert(["WORKING ON", "DUE SOON", "LIKELY", "NOW", "NEXT"].includes(result.focus[0]));
    assert.equal(result.todayLabel, "NEXT UP");
    assert.equal(result.trackHidden, true);
    assert.equal(result.schoolLabel, weekend ? "PROJECTS" : "SCHOOL DEADLINES");
    assert.equal(result.schoolMode, weekend ? "projects" : "school");
    assert(result.health.every(Boolean));
    assert.match(result.health[0], /^(—|\d+%)$/);
    assert.match(result.health[2], /^(—|\d+\.\d)$/);
    assert.equal(result.healthState, "ready");
    assert.deepEqual(result.rows, isPublic ? [0, 0, 0, 1] : [3, 3, 2, 1]);
    assert.equal(await page.locator("#spotify").isVisible(), true);
    assert.notEqual(result.spotifyState, null);
    assert((await page.locator("#hermes-status").innerText()).length > 0);
    assert.equal(await page.locator("#project-pulse").isVisible(), !isPublic && !result.projectPulseHidden);
    if (!isPublic) {
      assert((await page.locator("#projectname").innerText()).length > 0);
      assert((await page.locator("#projectnext").innerText()).length > 0);
      const eventTimes = await page.locator("#events .row-time").allTextContents();
      assert.equal(eventTimes.length, 6);
      assert.match(eventTimes[0], /^(Fri|Sat|Sun|Mon|Tue|Wed|Thu)/);
      assert.match(eventTimes[1], /^(All day|\d{1,2}:\d{2} (AM|PM))$/);
      assert.notEqual(await page.locator("#focus").getAttribute("data-tone"), null);
      assert.equal(await page.locator("#tasks .rail-row").first().getAttribute("data-tone"), "soft");
      if (await page.locator("#event-more-label").isVisible()) {
        await page.locator("#event-more-label").click();
        assert(await page.locator("#event-overflow").isVisible());
        await page.locator("#event-more-label").click();
      }
    }

    const frame = await image(page);
    const seconds = await page.locator("#secs").innerText();
    await page.clock.runFor(1100);
    assert.notEqual(await image(page), frame, "The particle field should drift");
    assert.notEqual(await page.locator("#secs").innerText(), seconds, "Clock seconds should tick");

    if (isPublic) {
      assert.equal(await page.locator("#hermes-receipt").isVisible(), false);
      verifyPrivacy(await page.locator("body").innerText());
      verifyPrivacy(await page.content());
    }

    assert.deepEqual(errors, []);
    console.log(name, JSON.stringify({
      viewport: result.inner, scroll: result.scroll, focus: result.focus, field: result.field, rows: result.rows,
      health: result.health, animated: true, errors: errors.length, screenshot,
    }));
    await close();
  }

  const mixed = await open(390, 844, { payload: { ...full, public: true } });
  verifyPrivacy(await mixed.page.content());
  assert.deepEqual(mixed.errors, []);
  await close();

  const reversed = [...full.calendar.events].reverse();
  const paper = {
    title: "CMPE-148 Project 4 paper: add the 3 teammates' full names to the title page, then submit (due Fri Nov 20, 11:59 PM)",
    due: fixtureDay, overdue: false,
  };
  const syntheticEvents = [
    { sort: `${fixtureDay}T09:00:00-08:00`, time: "9:00 AM", summary: "CMPE 131 — Software Engr I", cal: "Class" },
    { sort: `${fixtureDay}T10:30:00-08:00`, time: "10:30 AM", summary: "CMPE 142 — Operating Systems", cal: "Class" },
    { sort: `${fixtureDay}T18:00:00-08:00`, time: "6:00 PM", summary: "CMPE 148 — Computer Networks I", cal: "Class" },
    { sort: `${fixtureDay}T18:30:00-08:00`, time: "6:30 PM", summary: "Weekly Sprint Meeting", cal: "Class" },
  ];
  const deadline = await open(390, 844, {
    payload: { ...full, tasks: { open: 1, overdue: 0, items: [paper] },
      calendar: { ...full.calendar, events: syntheticEvents, week: [] } },
    now: new Date(`${fixtureDay}T08:00:00-08:00`),
  });
  assert.deepEqual(await deadline.page.locator("#events .row-time").allTextContents(), ["9:00 AM", "10:30 AM", "6:00 PM"]);
  const tickPositions = await deadline.page.locator("#dayticks i").evaluateAll((ticks) => ticks.map((tick) => parseFloat(tick.style.left)));
  assert.deepEqual(tickPositions.map((position) => Math.round(position * 14.4)), [540, 630, 1080, 1110]);
  const nowPosition = await deadline.page.locator("#daynow").evaluate((marker) => parseFloat(marker.style.left));
  assert(nowPosition < tickPositions[0]);
  assert.equal(await deadline.page.locator("#focuskicker").innerText(), "DUE TONIGHT");
  await deadline.page.clock.fastForward(16 * 60 * 60 * 1000);
  assert.equal(await deadline.page.locator("#focuskicker").innerText(), "OVERDUE");
  assert.equal(await deadline.page.locator("#focus").getAttribute("data-tone"), "bad");
  assert.equal(await deadline.page.locator("#tasks .rail-row").first().locator(".row-time").textContent(), "Overdue");
  assert.deepEqual(deadline.errors, []);
  await close();

  const dates = await open(390, 844, {
    payload: { ...full, tasks: { open: 8, overdue: 2, items: [
      { title: "Future due date: Review draft", due: "2026-11-20", overdue: true },
      { title: "Passed due date: Submit draft", due: "2026-11-18", overdue: false },
    ] } },
  });
  assert.deepEqual((await inspect(dates.page)).focus, ["OVERDUE", "Passed due date", "Due Nov 18 · Task"]);
  assert.deepEqual(await dates.page.locator("#tasks .row-time").allTextContents(), ["Overdue", "Nov 20"]);
  assert.deepEqual(dates.errors, []);
  await close();

  const reduced = await open(390, 844, { reducedMotion: "reduce" });
  const frame = await image(reduced.page);
  await reduced.page.clock.runFor(1100);
  assert.equal(await image(reduced.page), frame);
  const preferenceTab = await reduced.page.context().newPage();
  await preferenceTab.route(`${origin}/preferences-test`, (route) => route.fulfill({ contentType: "text/html", body: "" }));
  await preferenceTab.goto(`${origin}/preferences-test`);
  const canvas = reduced.page.locator("#hermes-field canvas");
  assert.equal(await canvas.getAttribute("data-renderer"), "particles");
  await preferenceTab.evaluate(() => localStorage.setItem("ayumad-renderer", "dither"));
  await reduced.page.waitForFunction(() => document.querySelector("#hermes-field canvas").dataset.renderer === "dither");
  assert.notEqual(await image(reduced.page), frame);
  await preferenceTab.close();
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
    now: new Date(`${fixtureDay}T15:10:00-08:00`),
  });
  const longMetrics = await inspect(longFocus.page);
  assert.equal(longMetrics.focus[0], "NOW");
  verifyBounds(longMetrics);
  assert.deepEqual(longFocus.errors, []);
  await close();

  let payload = { ...full, generated_at: `${fixtureDay}T15:09:00-08:00` };
  const live = await open(1920, 1080, {
    payload: () => payload,
    now: new Date(`${fixtureDay}T15:10:00-08:00`),
  });
  assert.deepEqual((await inspect(live.page)).focus, ["NOW", "Progress Check-in for Echosphere (IPMD)", "Until 4:00 PM · EchoSphere Robot"]);
  const originalMac = await live.page.locator("#mac-cpu").innerText();
  payload = {
    ...full,
    generated_at: `${fixtureDay}T15:14:00-08:00`,
    hermes: { ...full.hermes, host: { ...(full.hermes?.host ?? {}), cpu_pct: 42 } },
  };
  await live.page.clock.fastForward(300000);
  await live.page.waitForFunction(() => document.getElementById("mac-cpu").innerText === "42%");
  assert.notEqual(await live.page.locator("#mac-cpu").innerText(), originalMac);
  payload = null;
  await live.page.clock.fastForward(300000);
  await live.page.waitForFunction(() => document.getElementById("source").innerText === "STALE");
  assert.equal((await inspect(live.page)).healthState, "stale");
  assert.deepEqual(live.errors, []);
  await close();

  for (const [payload, expected] of [[{}, "empty"], [null, "error"]]) {
    const scenario = await open(390, 844, { payload, forecast: payload });
    const metrics = await inspect(scenario.page);
    verifyBounds(metrics);
    const states = Object.fromEntries(metrics.panels.map((panel) => [panel.id, panel.state]));
    for (const id of ["today", "task-panel", "school-panel", "health", "weather"]) {
      assert.equal(states[id], expected, `${id} should be ${expected}`);
    }
    assert.deepEqual(scenario.errors, []);
    await close();
  }
  console.log("Privacy, agenda order and timeline, deadline rollover, event focus, reduced motion, health updates, stale, empty, and offline views passed.");
} finally {
  await browser?.close();
}
