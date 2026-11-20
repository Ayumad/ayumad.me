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
| Hero right | San Jose weather, current conditions, tomorrow only |
| Workspace left | `TODAY`/`NEXT UP` schedule (up to 3 dated events; no separate week list), `PROJECT PULSE` |
| Workspace center | Hermes particle weave with a single status readout |
| Workspace right | up to 3 near-term tasks, school deadlines on weekdays or `PROJECTS` on Fri–Sun, `NOW LISTENING` |
| Footer | Mac mini/Hermes and P520 resource status + freshness |

The hero is a three-column band above the schedule, particle field, and actions. The footer takes one row. On phones, focus and the particle field go full-width, the schedule and actions use two columns, and the footer compresses to host stats. The page fits 1920×1080 and 390×844 without scrolling.

## Visual hierarchy

- The clock is the largest element; `CURRENT FOCUS` is the largest *meaningful* element after it.
- The central canvas fills its panel with particles.
- Rails are capped: 3 agenda rows, 3 near-term task rows, 2 school rows, 1 forecast day. `+N more` carries the rest; tasks due more than 7 days out are not rendered.
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
- The edge readout shows Hermes status and known run counts. It adds a flagged job and the latest confirmed result when the signed-in feed provides them.

## Active layer

- **Focus engine:** recalculates every 15 seconds. Priority: current calendar event (`NOW`, real `end_time`) → a task due today/tonight or overdue (semantic deadline, not just the upstream flag) → active Codex Cloud task or a recent Codex session (local or ChatGPT-account) → recent project/area note (6h) or imminent next event → school deadline → time-of-day fallback. School tasks and deadlines are ignored on Fri–Sun.
- **Day-aware schedule:** if no timed calendar event remains today, the left panel becomes `NEXT UP` (next dated events, starting tomorrow) and hides the 24h timeline; there is no separate week list.
- Fri–Sun replaces school deadlines with projects and removes school calendar and deadline items from the agenda. Classes and deadlines resume Monday.
- **Project pulse:** one active project, chosen oldest-first with an open checkbox action and excluding the current focus project; shows last-touched age, next open action, and open-action count. If no project qualifies, the panel is removed.
- **Now listening:** public `/api/spotify` data reused in the payload; album art, track/artist, playing/recent state, and progress. Degrades to an offline signal without breaking the layout.
- **Codex focus:** active `codex cloud list` tasks win; otherwise the most recent local Codex thread (`~/.codex/state_5.sqlite`) or ChatGPT-account thread (`~/.codex/sqlite/codex.db` `local_thread_catalog`, host kind `chatgpt`) within 12h. Account threads are labeled `Codex account`; public payload sets `codex: null` so no titles leave the wall.
- **Host footer:** Mac mini CPU/RAM, P520 load/RAM/GPU owner, and the live Hermes running-run count; links to `/status` for detail. No vague warning summary.
- **Clock/day rail:** seconds tick every second; seconds bar and 24h now marker advance continuously.

- The footer shows Mac mini and P520 resource readings and links to /status for the full breakdown.
- **Motion budget:** canvas paints capped at ~21 fps; focus/header at 15s; reduced motion draws a single static frame and stops the loop; hidden tabs pause.
- **Staleness:** wall data stale after 15m, web snapshots after 8h; failed refresh keeps the last good values and flags stale.

## Refresh

- Clock: every second.
- Focus recompute: every 15 seconds.
- Weather: every 15 minutes (Open-Meteo, San Jose, no key).
- Page data: every 5 minutes (`/dashboard.json` on wall, `/dashboard/data` on web).
- Service trend: samples from the existing 5-minute poll.

## Data contract

`/dashboard/data` returns the v1 dashboard snapshot.

`recent` is populated only in the full/signed-in snapshot (recently edited project/area notes, max 6h); the public projection returns `recent: []`. `calendar.events[].end_time` is used by the focus engine and is stripped from public events along with titles.

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

- **Public projection:** `calendar.events` keeps `time` only; `tasks.items` and `school.next` are empty; `week_count` is a number. The page renders a count + `SIGN IN FOR DETAILS` instead of titles.
- **Full snapshot (signed in):** all titles present.
- Confluence uses the Hermes active-run and failing-job counts and the dashboard's snapshot freshness rules.
- Signed-in snapshots can give active runs stable identifiers to keep them on consistent currents. A new explicit success or delivery receipt releases particles.
- **Wall:** `http://10.0.0.54:8795/dashboard.json` is the live v1 payload, served beside `dashboard.html`; the page detects `.html` and fetches `./dashboard.json` first. It shows the full view.
- Calendar labels: map `Canvas` → `CANVAS`, raw emails → `PERSONAL` / `SCHOOL`, `Class` → `CLASS`.
- Weather: Open-Meteo, San Jose (`37.3382, -121.8863`), °F, `America/Los_Angeles`, client-side. No key.

## Build and routes

- Source files live in dashboard/life/.
- Build: `node scripts/build-dashboard.mjs` → `server/dashboard/overview.html` (life) and `server/dashboard/status.html` (ops).
- Route: `/dashboard` → `api/dashboard.ts` → `overview.html`; `/status` → `status.html`.
- Data: `/dashboard/data` and `/status/data`, full when the session cookie is valid, sanitized otherwise.
- Login: `/dashboard/login?next=/dashboard` or `?next=/status`.

## Acceptance

- 1920×1080 and 390×844: `document.documentElement.scrollHeight === innerHeight`, 0 console errors.
- Public: count + `SIGN IN` visible; no event/task/school titles or calendar emails in the HTML or JSON.
- Signed in / wall: titles visible, `THIS WEEK` grouped by day, no clipping; after the last event the left panel reads `NEXT UP` instead of `TODAY`.
- Fri–Sun: no `SCHOOL DEADLINES` panel, no school deadline rows in `NEXT UP` / `THIS WEEK`; `PROJECTS` occupies the school slot.
- Footer pulse links to `/status` and reads `ALL CLEAR` / `N WARNINGS` / `N ISSUES`.
