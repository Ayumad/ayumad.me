# Life Dashboard Spec — `/dashboard`

> **Status:** shipped 2026-11-18; redesigned around a local focus constellation 2026-11-20.
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
| Hero right | San Jose weather, current conditions, compact 3-day forecast |
| Workspace left | `TODAY` timeline + up to 3 events; after the last timed event, `TODAY` is replaced by `NEXT UP` (next 3 dated events, no timeline) |
| Workspace center | `FOCUS CONSTELLATION`: center `NOW` + 7 always-labeled domain hubs |
| Workspace right | up to 3 tasks, then school deadlines on weekdays or `PROJECTS` on Fri–Sun, one recent-activity line |
| Footer | Hermes / homelab / services / devices, freshness |

The hero is a 3-column band; the workspace is `schedule / constellation / actions`; the footer is one row. On phone the hero stacks time + weather, focus goes full-width, the constellation sits full-width, schedule becomes two columns, and actions stack below. No scrolling at 1920×1080 or 390×844.

The old global vault graph is retired from this surface. The useful model is a **local constellation** (Obsidian local-graph logic): 8 labeled nodes total, not 90 notes. The full vault graph belongs in a detail/status view, never on the wall.

## Visual hierarchy

- The clock is the largest element; `CURRENT FOCUS` is the largest *meaningful* element after it.
- The constellation is the central visual anchor, but labels must be readable before it is decorative.
- Rails are capped: 3 agenda rows, 3 task rows, 2 school rows, 3 week days, 3 forecast days. `+N more` carries the rest.
- Long titles are reduced to course/project + action; no two-line paragraphs in the action rails.
- Use one accent per state: cyan live/info, violet secondary, amber warning/due-soon, red overdue/bad. Color is never the only encoding.

## Type

- Clock: mono, `clamp(...)`, tabular, tight tracking.
- Focus title: `clamp(27px, 3.2vw, 62px)`; hero kicker/detail `clamp(14px…22px)`.
- Rail titles: `clamp(15px, 1.1vw, 21px)` at 1920; metadata 11–15px.
- Labels: mono uppercase, cyan; secondary text uses `--soft` and sufficient contrast for wall distance.
- No shadows, gradients, blur, glow, or new dependencies. Hairlines and 2px max radius.

## Focus constellation

- **NOW** center label; elapsed/remaining ring when the focus has a known window.
- Seven outer hubs: `CALENDAR`, `SCHOOL`, `TASKS`, `PROJECTS`, `VAULT`, `HOMELAB`, `HERMES`.
- Each hub always shows its name and a live aggregate: events, deadlines, due/overdue, active projects, notes, homelab warning, jobs.
- The active focus hub gets one colored spoke and a restrained ring; normal spokes use the domain color, not red.
- Marker arcs encode state, not arbitrary size. Do not add more nodes. Do not render labels on top of the center.
- Pointer/tap/keyboard reveals the underlying item on web; the wall has no pointer.

## Active layer

- **Focus engine:** recalculates every 15 seconds. Priority: current calendar event (`NOW`, real `end_time`) → a task due today/tonight or overdue (semantic deadline, not just the upstream flag) → recent project/area note (6h) or imminent next event → school deadline → time-of-day fallback. School tasks and deadlines are ignored on Fri–Sun.
- **Day-aware schedule:** if no timed calendar event remains today, the left panel becomes `NEXT UP` (next dated events, starting tomorrow) and hides the 24h timeline; `THIS WEEK` also starts at the next day. All-day items alone do not keep `TODAY` alive.
- **Weekend mode:** Fri–Sun replaces `SCHOOL DEADLINES` with `PROJECTS` (recent project notes first), changes the school hub to `OFF`, and removes school calendar/deadline items from `NEXT UP` and `THIS WEEK`. Classes and deadlines resume Monday.
- **Clock/day rail:** seconds tick every second; seconds bar and 24h now marker advance continuously.
- **Constellation:** slow deterministic drift (max ~3.5 px on wall, ~1.4 px phone over ~53s); marker pulses on a changed count/status; active hub spoke/ring.
- **Live health:** footer keeps short service history and updates on the 5-minute payload poll.
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
- **Wall:** `http://10.0.0.54:8795/dashboard.json` is the live v1 payload, served beside `dashboard.html`; the page detects `.html` and fetches `./dashboard.json` first. It shows the full view.
- Calendar labels: map `Canvas` → `CANVAS`, raw emails → `PERSONAL` / `SCHOOL`, `Class` → `CLASS`.
- Weather: Open-Meteo, San Jose (`37.3382, -121.8863`), °F, `America/Los_Angeles`, client-side. No key.

## Build and routes

- Source: `dashboard/life/{index.html,life.css,life.js}`.
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
