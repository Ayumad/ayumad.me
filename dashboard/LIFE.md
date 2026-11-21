# Life Dashboard Spec — `/dashboard`

> **Status:** shipped 2026-11-18. The workspace centers on the Hermes particle visualizer.
> Source of truth for design iterations.
> Ops spec moved to `BRIEF.md` and `/status`. Do not reintroduce dense ops tables here.

## Goal

One screen that answers: **what time is it, what is the weather, what is on today, and what is next** — for a 1920×1080 display and a phone. No scroll, no controls, no ops density.

The ops dashboard (jobs, containers, services, media, timeline) lives at **`/status`**. This page only keeps a single footer pulse that links there.

## Layout

The page is one ambient composition, not a grid of monitoring tables:

| Zone | Contents |
|---|---|
| Hero left | date, oversized clock, seconds, seconds bar |
| Hero center | `CURRENT FOCUS`: kicker (`NOW` / `DUE TONIGHT` / `OVERDUE` / etc.), one-line focus title, deadline/detail |
| Hero right | Fremont weather, current conditions, and the next three days |
| Workspace left | `TODAY`/`NEXT UP` schedule (up to 3 dated events; no separate week list), `PROJECT PULSE` |
| Workspace center | Hermes particle weave with a single status readout |
| Workspace right | up to 3 near-term tasks, school deadlines on weekdays or `PROJECTS` on Fri–Sun, `NOW LISTENING` |
| Footer | Mac mini/Hermes and P520 resource status, VM activity, and freshness |

The hero is a three-column band above the schedule, particle field, and actions. The footer takes one row. On phones, focus and the particle field go full-width, the schedule and actions use two columns, and the footer compresses to host stats. The page fits 1920×1080 and 390×844 without scrolling.

## Visual hierarchy

- The clock is the largest element; `CURRENT FOCUS` is the largest *meaningful* element after it.
- The central canvas fills its panel with particles.
- Rails are capped: 3 agenda rows, 3 near-term task rows, 2 school rows, 3 forecast days. `+N more` carries the rest; tasks due more than 7 days out are not rendered.
- Long titles are reduced to course/project + action; no two-line paragraphs in the action rails.
- Use one accent per state: cyan live/info, violet secondary, amber warning/due-soon, red overdue/bad. Color is never the only encoding.

## Type

- Clock: mono, `clamp(...)`, tabular, tight tracking.
- Focus title: `clamp(27px, 3.2vw, 62px)`; hero kicker/detail `clamp(14px…22px)`.
- Rail titles: `clamp(15px, 1.1vw, 21px)` at 1920; metadata 11–15px.
- Labels: mono uppercase, cyan; secondary text uses `--soft` and sufficient contrast for wall distance.
- Page chrome uses hairlines and a 2px maximum radius. The particle field uses native Canvas rendering.

## Hermes particle visualizer

- The original Confluence weave drifts at idle. Active Hermes runs pull strands into separate currents, and a flagged job gathers a sustained amber pocket.
- The web dashboard follows the saved homepage renderer. ASCII uses glyphs, Dither uses ordered stippling, Glitch offsets narrow bands, Particles uses fading trails, and CRT+ adds scan lines. The field defaults to Particles on a fresh browser or wall display.
- The edge readout groups Hermes status, known run counts, and the age of the last accepted sample. Web snapshots label idle and working states as last seen. The readout adds a flagged job and the latest confirmed result when the signed-in feed provides them.

## Active layer

- **Focus engine:** recalculates every 15 seconds. Priority: current calendar event (`NOW`, real `end_time`) → a task due today/tonight or overdue (semantic deadline, not just the upstream flag) → active Codex Cloud task or a recent Codex session (local or ChatGPT-account) → recent project/area note (6h) or imminent next event → school deadline → time-of-day fallback. School tasks and deadlines are ignored on Fri–Sun.
- **Day-aware schedule:** if no timed calendar event remains today, the left panel becomes `NEXT UP` (next dated events, starting tomorrow) and hides the 24h timeline; there is no separate week list.
- Fri–Sun replaces school deadlines with projects and removes school calendar and deadline items from the agenda. Classes and deadlines resume Monday.
- **Project pulse:** signed-in views show the most recently updated active project, with last-touched age, next action and open-action count. Public views show a single Projects count throughout the week.
- **Now listening:** album art, track, artist, playing/recent state, and progress from `/api/spotify`. During an outage the last known track is marked stale.
- **Codex focus:** active `codex cloud list` tasks win. Otherwise the page picks the most recent collected local Codex thread or ChatGPT account thread within 12h by its update time. If the collector provides only `age_min`, the page adds the time since the snapshot. The local collector reads `~/.codex/state_5.sqlite`; activity from another computer must reach the collector to appear. Public payloads set `codex: null` so no chat titles are exposed.
- **Windows Codex sync:** the Windows scheduled task `Ayumad Dashboard - Codex Desktop Sync` runs `dashboard/telemetry/export-codex.mjs` every minute under the desktop user. It reads Codex databases in read-only mode and sends the latest named thread's title and update time over SSH to `~/.hermes/scripts/dashboard_codex_feed.py` on the Mac mini. The receiver writes `~/.hermes/state/dashboard_codex_desktop.json` with owner-only permissions. Hermes merges that title into the existing private `codex.recent` list during its usual refresh.
- A successful Hermes live refresh calls `dashboard_codex_feed.py --publish-if-changed`. A change in the desktop focus title triggers the existing encrypted snapshot publisher. Timestamps within the same thread update through the regular feed, with up to 24 additional snapshot publishes in a rolling day.
- **Host footer:** Mac mini CPU/RAM, P520 load/RAM/GPU owner, and the live Hermes running-run count; links to `/status` for detail. No vague warning summary.
- **VM activity:** shows the busiest P520 VM with a confirmed running job and a fresh reading of at least 70% CPU or GPU, or 85% RAM. The footer shows the VM, its highest qualifying reading, and the job. Samples expire after two minutes.
- **Clock/day rail:** seconds tick every second; seconds bar and 24h now marker advance continuously.

- The footer shows Mac mini and P520 resource readings and links to /status for the full breakdown.
- **Motion budget:** canvas paints capped at ~21 fps; focus/header at 15s; reduced motion draws a single static frame and stops the loop; hidden tabs pause.
- **Staleness:** wall data stale after 15m, web snapshots after 8h; failed refresh keeps the last good values and flags stale.

## Refresh

- Clock: every second.
- Focus recompute: every 15 seconds.
- Weather: every 15 minutes (Open-Meteo, Fremont, no key).
- Spotify: every 5 seconds while visible, with an immediate refresh when the tab becomes visible. The wall kiosk uses the public endpoint at `ayumad.me`.
- Page data: every 10 seconds on the wall (`/dashboard.json`) and every 30 seconds on the web (`/dashboard/data`), with a refresh when the tab becomes visible. Readings and their age reflect the latest sample from the feed.
- Service trend: samples from the page data poll.

## Data contract

`/dashboard/data` returns the v1 dashboard snapshot.

`recent` is populated only in the full/signed-in snapshot (recently edited project/area notes, max 6h); the public projection returns `recent: []`. `calendar.events[].end_time` is used by the focus engine and is stripped from public events along with titles.

For VM activity, the collector can attach `activity` to a running QEMU guest in `homelab.guests`. It carries `checked_at` (ISO timestamp), measured `cpu_pct`, `gpu_pct` or `mem_pct` (0–100), and `job: { status: "running", label: "…" }` when the collector confirms a job. Use `job: null` when the VM has been checked and no job is running. Keep the telemetry and job labels in the signed-in and wall feeds.

```jsonc
{
  "generated_at": "2026-11-18T11:44:14-08:00",
  "public": true,                       // only on the sanitized projection
  "calendar": {
    "count": 2,
    "events": [{ "time": "10:30 AM", "summary": "POLS 15", "cal": "Class", "sort": "..." }],
    "week_count": 17,
    "week":   [{ "time": "all-day", "summary": "Project 4", "cal": "Canvas", "sort": "..." }]
  },
  "tasks":  { "open": 50, "overdue": 0, "items": [{ "title": "...", "due": "2026-11-30", "overdue": false }] },
  "school": { "upcoming": 6, "next": [{ "title": "...", "course": "CMPE-131", "due": "2026-11-19" }] },
  "now":    { "jobs_failing": 0, "jobs_total": 30, "containers_running": 49,
              "devices_online": 9, "devices_total": 21,
              "homelab_issues_bad": 0, "homelab_issues_warn": 1 }
}
```

- **Public projection:** `calendar.events` keeps `time` and `all_day`; `tasks.items` and `school.next` are empty; `week_count` is a number. The page shows aggregate schedule, task, school, and project counts with one sign-in link in the header.
- **Full snapshot (signed in):** all titles present.
- Confluence uses the Hermes active-run and failing-job counts and the dashboard's snapshot freshness rules.
- Signed-in snapshots can give active runs stable identifiers to keep them on consistent currents. A new explicit success or delivery receipt releases particles.
- **Wall:** `http://10.0.0.54:8795/dashboard.json` is the live v1 payload, served beside `dashboard.html`; the page detects `.html` and fetches `./dashboard.json` first. It shows the full view.
- Calendar labels: map `Canvas` → `CANVAS`, raw emails → `PERSONAL` / `SCHOOL`, `Class` → `CLASS`.
- Weather: Open-Meteo, Fremont (`37.5483, -121.9886`), °F, `America/Los_Angeles`, client-side. No key.

## Build and routes

- Source files live in dashboard/life/.
- Build: `node scripts/build-dashboard.mjs` → `server/dashboard/overview.html` (life) and `server/dashboard/status.html` (ops).
- Route: `/dashboard` → `api/dashboard.ts` → `overview.html`; `/status` → `status.html`.
- Data: `/dashboard/data` and `/status/data`, full when the session cookie is valid, sanitized otherwise.
- Login: `/dashboard/login?next=/dashboard` or `?next=/status`.

## Acceptance

- 1920×1080 and 390×844: `document.documentElement.scrollHeight === innerHeight`, 0 console errors.
- Public: one project summary and one `SIGN IN` link visible; no event/task/school titles or calendar emails in the HTML or JSON.
- Signed in / wall: titles visible, `THIS WEEK` grouped by day, no clipping; after the last event the left panel reads `NEXT UP` instead of `TODAY`.
- Fri–Sun: school deadlines and their rows are omitted. Signed-in and wall views use the school slot for recent projects.
- Footer pulse links to `/status` and reads `ALL CLEAR` / `N WARNINGS` / `N ISSUES`.
