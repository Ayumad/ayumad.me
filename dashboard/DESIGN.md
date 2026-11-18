# DESIGN — Ops Dashboard v2

One page, two modes: the interactive web dashboard (`/dashboard.html`) and the
non-interactive wall display (`?mode=wall`). Everything renders from one JSON
contract (`ayumad.dashboard/2`); the build inlines CSS, JS, and the seed fixture
into a single self-contained HTML file.

## Visual language

Copied from the live site, not approximated:

- Dark `--bg #040707`, cyan `--cyan #48efd0` as the only accent. Violet is a
  second data series only. Amber/red are warn/bad only. Color is state, never
  decoration.
- Background: the 104px line grid (`--fine` hairlines) plus the 5px dot matrix
  (`--cyan` at 22% opacity), masked to two radial areas. `body` / `body::before`
  rules are copied verbatim from `src/styles.css`.
- 1px hairline borders everywhere, 2px radius max, no shadows, no gradients
  (except the background motif masks), no glows, no icons in colored circles.
- Mono for all labels, numbers, and telemetry; sans for row titles and body.
  Numbers are tabular, right-aligned in tables.

## Grid and type scale

| Role | Spec |
|---|---|
| Page title / brand | mono 13–26 / 600 / -0.4px |
| Section head | mono 11.5 / 600 / 0.13em uppercase, cyan, 1px rule below |
| KPI value | mono 26 / 600 tabular (wall: 30–44, status word 56) |
| KPI label | mono 10.5 / 500 / 0.06em uppercase, muted |
| Row title | sans 15 / 500 |
| Row meta | sans 13 / 400, soft |
| Table right column | mono 12.5 / 400, muted, right-aligned |
| Wall secondary | mono ≥ 13 |

Shell: max-width 1460px, side padding `clamp(16px, 3vw, 40px)`, sticky 72px
header with 1px bottom border. Hero: 6 cells, `repeat(auto-fit, minmax(150px, 1fr))`,
8px gap, 1px border, 15/16px padding, min-height 86px (reserved — no layout
shift when data lands). Sections: 44px top margin, accent label left, source
badge right. Tables: `1fr auto` grid rows, 11px vertical padding, 1px bottom
hairline, no zebra.

## Components (BRIEF §6)

Cell (KPI value + label + sub; state colors the value only) · Row (title, meta,
right slot, 2px severity left border when failing, whole row is a button that
opens the drawer) · Bar (6px, 1px border, cyan / amber >80 / red >90) · Spark
(7-slot 6×2 strip encoding the aggregate `success_7d` rate; null → muted
"no runs in 7d"; per-day breakdown awaits the v2 collector) · Matrix (chips
grouped by stack, 6px state dot; stopped-and-expected gets an amber outline
and text, not a fill) · Pill (source of truth: `LIVE · partial`, `SEED`,
`STALE`, `SYNC`) · Timeline (2px left rule, 8px level-colored node, mono
time, source tag, sans text, 50 rows max) · Drawer (420px right panel, raw
key/value dump, 120ms slide, Esc/backdrop close, focus trap) · Banner (1px top
border + 6px square, level color never a background fill).

## Data sources — live first, seed fallback, honest labels

1. `LIVE` = `https://ayumacmini.taila4a4a9.ts.net/dashboard.json` (the v1
   payload, real data), fetched with `cache: "no-store"` and a 5s timeout,
   retried every 60s.
2. On success the v1 payload is adapted to the v2 shape (mapping table in
   `app.js::adaptV1`): `hermes` → `surfaces.mac_mini.hermes`, `homelab` →
   `surfaces.p520`, `tasks`/`school`/`journal` → `surfaces.personal`,
   `fleet` → `surfaces.network.tailscale`, `now` → `surfaces.personal.listening`.
   The live timeline is rebuilt only from real v1 fields (failing cron names,
   homelab check, backup age, journal entries, collector errors).
3. `surfaces.docker_vm`, `surfaces.media`, `surfaces.external`, and per-job
   cron rows do not exist in v1. They render a muted
   `collector pending · v2 not wired` panel. Seed numbers are never
   substituted for live data.
4. On failure the page renders from `window.__DASHBOARD_SEED__` (the fixture,
   inlined at build time) and the pill says `SEED`. If live data was already
   on screen and a refresh fails, the pill says `STALE` and the last good
   data stays.
5. The header pill always states the source. `?fixture=1` forces the seed
   for design review. The page works from `file://` with no network.

Missing keys always render `—`; counts come from `counts` fields, never
`array.length` (guests/containers/peers use explicit payload arrays only where
the contract defines the list itself).

## States (every panel)

- **pending** — dashed muted panel, `collector pending · v2 not wired`
  (docker_vm / media / external / per-job rows in live mode).
- **empty** — muted panel, "nothing in the current window" (zero queues, no
  events matching a filter, no failing jobs).
- **error** — solid bad-tinted panel (a source with `ok:false`; the fixture
  ships `external` errored with `timeout` so the state is visible in review).
- **stale** — amber `stale Xm` badge in the section hint (fixture ships
  `network` stale at 420s), amber wall banner at >90s data age, red
  `FEED DOWN · showing last good` at >5min. The page never clears.
- **no data** — a present surface with an absent key renders `—` with a muted
  note (`not in v1 payload · pending v2`), e.g. SMART or launchd in live mode.

## Web layout

Header (brand, section tabs with scrollspy, pill, updated age, theme toggle)
→ hero (6 cells: status, alerts, jobs enabled, containers running, devices
online, open tasks — all six exist in both live and seed) → Automations
(cron summary cells, job table with filters + drawer, launchd strip, ports)
→ Homelab (host gauges, ZFS pool bars, guest matrix, protection strip + SMART,
tailnet fleet + routes) → Services (count cells + stack matrix) → Media
(queues, downloads, jellyfin, remux, letterboxd) → Personal (tasks, school,
applications, journal, listening aggregates) → External (vercel, github,
backups) → Timeline (level + source filters, drawer) → footer.

URL state: `?section=`, `?filter=` (automations), `?level=` + `?src=`
(timeline), `?theme=light`, all restored on load and updated with
`history.replaceState`. Keyboard: `j`/`k` walk rows, `Enter` opens the drawer,
`Esc` closes it; filter chips are real buttons.

## Wall (`?mode=wall`)

1920×1080 target, 64px header, 2px progress line, 32px margins, 48px alert
rail. Five pages rotating every 20s (`?dwell=ms` ops override):

1. **STATUS** — 56px status word (OK / ATTENTION / FAULT), live clock,
   both host uptimes, 8 KPI cells in 4×2.
2. **AUTOMATIONS** — two columns of job rows (name, schedule, 7-slot success
   strip, next run right-aligned); failures pinned to the top of the left
   column with a 2px red left border.
3. **HOMELAB** — host gauge trio, two pool bars, 11 guest chips, protection
   strip (backups, snapshots, scrub, SMART).
4. **SERVICES** — count cells + stack matrix.
5. **MEDIA + PERSONAL** — queue cells, remux bar, jellyfin now playing,
   school due list, task counts.

Alert rail: highest severity wins (bad > warn > info); live-derived faults
(failing cron jobs, homelab faults, unhealthy containers) outrank timeline
events; if none, muted `all clear` + the last event. Burn-in: the stage
translates 1px through 4 positions on a 60s cycle. Content dims to 70%
22:00–07:00. Rotation pauses on `prefers-reduced-motion`, on `?page=N`
(pinned), and on any keypress (resumes 60s after the last key). Cold boot:
fully inline, no localStorage, no dialogs, no crash-restore dependence; the
shell paints immediately and data lands within the 5s live timeout (sub-second
on the tailnet).

## Accessibility

Focus: 2px cyan outline, 4px offset. Source pill and wall banner are
`aria-live="polite"`. Section headings are semantic `h2`. Body text is
`--text` on `--bg` (≥ 12:1); meta text uses `--soft` on surfaces (≥ 7:1);
`--muted` is reserved for labels on `--bg` (≈ 4.6:1). Buttons everywhere,
no div-click handlers. Filter chips expose `aria-pressed`.

## QA

- Fixture exercises every state without params: `external` source error,
  `network` source stale, null SMART temps, `success_7d: null` jobs,
  empty media queues, one stopped-and-expected container (`kamiyomu`).
- `?fixture=1` freezes the seed for design review; `?filter=failing` shows
  the empty-filter state (fixture has zero failing jobs); timeline filters
  render their own empty state.
- Wall verified with `?dwell=1500` for fast rotation, `?page=3` for pinning.
- No console errors at 1920×1080 or 390×844; no horizontal scroll at either.
