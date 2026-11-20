# Life Dashboard Spec — `/dashboard`

> **Status:** shipped 2026-11-18. Source of truth for design iterations.
> Ops spec moved to `BRIEF.md` and `/status`. Do not reintroduce dense ops tables here.

## Goal

One screen that answers: **what time is it, what is the weather, what is on today, and what is next** — for a 1920×1080 display and a phone. No scroll, no controls, no ops density.

The ops dashboard (jobs, containers, services, media, timeline) lives at **`/status`**. This page only keeps a single footer pulse that links there.

## Layout

Three columns under a 68 px header, above a 56 px footer:

| Column | Contents |
|---|---|
| Left (1.12fr) | Large clock + AM/PM, full date, current weather, high/low, `SAN JOSE · CA`, 3-day forecast at the bottom |
| Center (1.38fr) | `TODAY` agenda (up to 6 events, time + title + calendar label), `THIS WEEK` grouped by day at the bottom |
| Right (0.9fr) | `TASKS` (4), `SCHOOL` (2), `QUICK` links at the bottom |

- Grid: `grid-template-rows: 68px minmax(0,1fr) 56px`; `height: 100dvh; overflow: hidden`.
- At ≤1180 px the right column is hidden and the layout becomes two columns.
- At ≤760 px it is one column: clock, weather, up to 4 agenda rows, footer. Forecast and week blocks are hidden. The page must still fit 390×844 without scroll.
- No shadows, gradients, or new dependencies. Tokens live in `dashboard/tokens.css`; the motif is in `dashboard/src/base.css`.

## Type

- Clock: mono, `clamp(96px, 10.4vw, 196px)`, tabular, tight tracking.
- Event title: `clamp(16px, 1.25vw, 22px)`, two-line clamp.
- Task title: 15 px, two-line clamp. Week title: 14 px, two-line clamp.
- Labels: 10–11 px mono, uppercase, cyan; metadata uses `--soft` for legibility at wall distance.

## Visual system

Patterns taken from how real status pages work (Vercel, GitHub, Cloudflare) and Carbon's status-indicator guidance:

- **One large state marker per zone.** The clock, the day rail, the event ring, and the footer pulse each answer one question. Do not turn every line into a badge.
- **Bars encode quantities** (temperature range, week item counts, due proximity, footer ratios). **Rings encode totals** (today's timed vs all-day split). **Icons encode categories** (weather, vault/canvas/mail/github).
- **Redundant encoding:** state is always color + shape + label. Never color alone.
- **Rollup status is the worst child.** The footer warning is the max of job failures and homelab issues.
- **Keep the indicator count low.** Six hero indicators on `/status`; four footer meters on `/dashboard`. More becomes noise.
- **Text carries names and times, not status.** Avoid raw emails and implementation words in labels.

## Active layer

Motion is part of the design, but it must not fight legibility:

- **Clock:** hours + minutes in the large face, seconds in a smaller adjacent face (`:42`), plus a 1px seconds bar that fills every minute.
- **Sun arc:** the sun dot is repositioned every second from the sunrise/sunset wall-clock minutes, not from a timezone-sensitive `Date`.
- **Second brain:** a real vault graph, not a decorative topology. `brain_build.py` parses 662 notes and 2,652 wikilinks, keeps the 90 notes with the highest unique in+out degree (542 links), and exposes `{id,label,folder,group,activity,degree,size}`. The page lays it out with a seeded 3D force simulation, adds a degree-based depth bias so hubs sit nearer the camera, and renders a perspective cube, floor grid, depth-sorted nodes, six leader-line labels, and a 72-node ambient field outside the center panel. The camera orbits slowly and responds to pointer parallax; hovering or tapping a node reveals its real note, folder, and link count. Public projection strips labels, folders, paths and the top hub, leaving structure and counts only.
- **Live activity:** note activity groups (`hermes`, `homelab`, `calendar`, `tasks`, `school`, `journal`, `projects`, `gear`) drive pulsing node rings and amber edges. `HERMES` reacts to failing jobs, `HOMELAB` to warnings, `CALENDAR` to an event within the next hour, `TASKS` to overdue/open, `SCHOOL` to upcoming work.
- **Focus engine:** the header recalculates every 15 seconds. It prefers the current calendar event (`NOW`, with the real end time), then overdue/due-today tasks, then the most recently edited project/area note (6h window, system folders excluded), then the next school deadline, then a time-of-day fallback. Matching calendar, task, and school rows get a colored marker; matching vault nodes get a white focus ring. The public view shows only the time-of-day label.
- **Rail and pulse:** the 24-hour rail's now-line moves every second; the footer status dot breathes.
- **Reduced motion:** all canvas drift, orbit and pulses stop and a static graph is drawn once when `prefers-reduced-motion` is set.
- **Budget:** 90 nodes / 542 links at 24 fps with four batched edge buckets; hide the graph and ambient layer below 760 px. The center graph flexes into the leftover column height; today shows 3 events + `+N MORE`, and the week rail shows the next 3 days.

## Data contract

`/dashboard/data` returns the v1 dashboard snapshot.

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
- **Wall:** `http://10.0.0.54:8795/dashboard.json` is the live v1 payload, served beside `dashboard.html`; the page detects `.html` and fetches `./dashboard.json` first. It shows the full view.
- Calendar labels: map `Canvas` → `CANVAS`, raw emails → `PERSONAL` / `SCHOOL`, `Class` → `CLASS`.
- Weather: Open-Meteo, San Jose (`37.3382, -121.8863`), °F, `America/Los_Angeles`, client-side. No key.

## Refresh

- Clock: every second. Weather: every 15 minutes. Snapshot: every 5 minutes.
- Footer shows `DATA 4M AGO` from `generated_at`, not a wall-clock time, so a stale snapshot is honest.
- Wall payload refreshes every 5 minutes via `~/.hermes/scripts/dashboard_live_refresh.sh`; the web snapshot is published by `Dashboard Refresh` every 6 hours.

## Build and routes

- Source: `dashboard/life/{index.html,life.css,life.js}`.
- Build: `node scripts/build-dashboard.mjs` → `server/dashboard/overview.html` (life) and `server/dashboard/status.html` (ops).
- Route: `/dashboard` → `api/dashboard.ts` → `overview.html`; `/status` → `status.html`.
- Data: `/dashboard/data` and `/status/data`, full when the session cookie is valid, sanitized otherwise.
- Login: `/dashboard/login?next=/dashboard` or `?next=/status`.

## Acceptance

- 1920×1080 and 390×844: `document.documentElement.scrollHeight === innerHeight`, 0 console errors.
- Public: count + `SIGN IN` visible; no event/task/school titles or calendar emails in the HTML or JSON.
- Signed in / wall: titles visible, `THIS WEEK` grouped by day, no clipping.
- Footer pulse links to `/status` and reads `ALL CLEAR` / `N WARNINGS` / `N ISSUES`.
