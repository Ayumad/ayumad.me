# Codex Design Brief — Ayumad Automation Dashboard

**Read this before writing any code.** It is the complete handoff: visual language, information architecture, component specs, data contract, file layout, and the exact per-session prompts with model routing.

Companion document: `2026-11-18_085419-automation-dashboard.md` (architecture, collectors, phases, acceptance criteria).

---

## 1. Context

Ayush runs an automation stack across a Mac mini and a Proxmox host (P520). The dashboard is the single pane that says what is running, what is broken, and what is due — on a wall display attached to the P520 and at `ayumad.me/dashboard`.

You are building **only the frontend**: one static HTML artifact (inline CSS/JS), two modes (interactive web + non-interactive wall), fed by a JSON contract. Hermes builds the collector. Do not invent data, do not add a backend, do not add dependencies.

**Live references**
- Design language: <https://ayumad.me> (dark terminal/CAD aesthetic; read the CSS at `~/Documents/GitHub/ayumad.me/src/styles.css`)
- Current dashboard: <https://ayumad.me/dashboard> and `~/workspace/ayumad.me/public/dashboard.html`
- Work repo: `~/workspace/ayumad.me` (branch `dashboard-v2`). **Never** use `~/Documents/GitHub/ayumad.me` — stale.
- Data fixture you build against: `dashboard/fixtures/state.v2.json` (produced in Phase 0).
- Tokens: `dashboard/tokens.css` (copy of the live site's variables, below).

---

## 2. Non-negotiables

1. **No frameworks, no npm packages, no webfonts, no images.** Inline CSS + vanilla ES2022 JS. SVG only for charts and icons, inline.
2. **One output file:** `public/dashboard-next.html`, built by `node scripts/build-dashboard.mjs` inlining `dashboard/src/**`. No runtime fetches of CSS/JS.
3. **Do not touch** `src/`, `api/`, `vercel.json`, `package.json` dependencies, or any other page. Only `dashboard/` and the built file.
4. **No dark-pattern chrome:** no shadows, no gradients, no rounded cards beyond 2 px, no glows, no icons in colored circles.
5. **Color is state, not decoration.** Cyan means live/healthy/focus. Violet is a second data series only. Amber/red are only warn/bad.
6. **Numbers are tabular**, right-aligned in tables, mono.
7. **Every panel must have a defined stale, empty, and error state.** A blank screen is a failure.
8. **No secrets, no IPs, no hostnames in the public fallback.** The fixture is already sanitized; keep it that way.
9. **Accessibility:** contrast ≥ 4.5:1 for body text, visible focus (2 px cyan offset 4 px), semantic headings, `aria-live="polite"` on the status banner, keyboard-operable filters.
10. **Performance budget:** ≤ 150 KB gzipped total, first paint < 1 s on the kiosk, no layout shift after data arrives.

---

## 3. Tokens (use exactly these)

```css
:root {
  color-scheme: dark;
  --bg: #040707;
  --surface: #091011;
  --surface-2: #0e191a;
  --text: #e5f4f2;
  --soft: #9bb7b3;
  --muted: #627d79;
  --line: #294441;
  --fine: #142624;
  --cyan: #48efd0;
  --violet: #777fc4;
  --ink: #020606;
  --warn: #e0b070;
  --bad: #e08a8a;
  --mono: "SFMono-Regular", "Cascadia Code", "Roboto Mono", Consolas, monospace;
  --sans: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
  --max: 1460px;
  --header: 72px;
}
:root[data-theme="light"] {
  --bg: #e6efed; --surface: #f3f8f7; --surface-2: #d4e2df;
  --text: #071311; --soft: #314b47; --muted: #5d7470;
  --line: #758e89; --fine: #c0d1ce; --cyan: #006f68;
  --violet: #50568d; --ink: #f4fffd;
}
```

Background: the site's 104 px line grid plus the 5 px dot matrix at 22% opacity, masked to two soft radial areas — copy the `body` / `body::before` rules from `src/styles.css`, do not approximate.

Typography scale:

| Role | Family | Size / weight / tracking |
|---|---|---|
| Page title | mono | 26 / 600 / -0.4 px |
| Section head | mono | 11.5 / 600 / 0.13 em, uppercase, cyan, 1 px bottom border |
| KPI value | mono | 25–28 / 600, tabular |
| KPI label | mono | 10.5 / 500 / 0.06 em, uppercase, muted |
| Body / row title | sans | 15 / 500 |
| Row meta | sans | 13 / 400, muted |
| Table right column | mono | 12.5 / 400, muted |
| Wall KPI | mono | 44–56 / 600 |
| Wall secondary | mono | 14 minimum |

---

## 4. Web layout

- Shell max-width `1460px`, side padding `clamp(16px, 3vw, 40px)`, header 72 px sticky with a 1 px bottom border and vertical separators before each nav group.
- Header: left `AYUMAD / OPS` (mono, 13 px, cyan slash), center tabs (mono 12 px uppercase, active = cyan underline 2 px), right: live pill, `updated 12s ago`, theme toggle.
- Hero: 6 cells, `repeat(auto-fit, minmax(150px, 1fr))`, 8 px gap, 1 px border, 15/16 px padding.
- Sections: `h2` pattern from the site — accent label left, muted `hint` right, 1 px rule below, 44 px top margin.
- Tables: CSS grid rows `1fr auto`, 11 px vertical padding, 1 px bottom hairline, no zebra.
- Detail drawer: right side, 420 px, `--surface`, 1 px left border, slides in 120 ms, closes on `Esc`/backdrop; focus trap.
- Filter chips: mono 11 px, 1 px border, active = cyan border + cyan text, no fill.
- Timeline: left 2 px rule, 8 px node, mono timestamp, sans text, level color on the node only.

URL state: `?section=automations&filter=failing`, `?mode=wall`, `?theme=light`. Restore on load; update with `history.replaceState`.

---

## 5. Wall layout (`?mode=wall`)

Target **1920×1080** (the panel is 1080p). It must not break at 2560×1440, but 1080p is the design target; 1366×768 is optional.

```
┌──────────────────────────────────────────────────────────────┐
│ AYUMAD / OPS        WED 18 NOV 09:04        ● LIVE   22°     │ 64px
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   page content (5 rotating pages, 20s, 2px progress line)    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ ! 14 containers stopped — media stack            last 21h   │ 48px
└──────────────────────────────────────────────────────────────┘
```

- 32 px outer margin, 12-column grid, 8 px gutter, 16 px cell padding.
- Page 1 **STATUS:** status word (OK / ATTENTION / FAULT) at 56 px, clock, host uptime; 8 KPI cells in 4×2.
- Page 2 **AUTOMATIONS:** two columns of 13 jobs; each row: name 15 px, schedule 13 px muted, 7-day success as 7 tiny 6×2 bars, next run mono right-aligned. Failures pinned to the top of the left column with a red 2 px left border.
- Page 3 **HOMELAB:** host gauge trio, two pool bars (6 px, cyan fill, amber > 80%, red > 90%), 11 guest chips (id, name, state dot, vCPU/RAM), bottom strip: backups, snapshots, scrub, SMART.
- Page 4 **SERVICES:** grouped matrix by stack; each chip: name + health dot; stopped-and-expected gets an amber outline and text, not a fill.
- Page 5 **MEDIA + PERSONAL:** queue counts, remux progress bar, Jellyfin now playing (title + progress), school due list, tasks count.
- Alert rail is fixed across pages, highest severity wins: bad > warn > info; if none, show `all clear` in muted with the last event.
- Burn-in: shift the whole content by 1 px on a 60 s cycle (`translate` with 4 positions); dim to 70% opacity 22:00–07:00; no static bright blocks wider than 400 px.
- Rotation pauses on `prefers-reduced-motion`, on `?page=N`, and on any keypress (resume after 60 s).
- Stale: > 90 s amber banner `data stale · last update HH:MM`; > 5 min red `FEED DOWN · showing last good`. Never clear the page.
- Cold boot every time: the VM is stopped during compute and started fresh afterwards. Chromium must paint data within 2 s with no first-run dialog, no crash-restore bubble, and no dependency on localStorage for the default view.

---

## 6. Components

| Component | Contract |
|---|---|
| `Cell` | KPI value + label + optional delta; state `good/warn/bad` changes value color only. |
| `Row` | Title, meta, right slot, optional left severity border; whole row is a button when it opens a drawer. |
| `Bar` | 6 px tall, 1 px border, fill = cyan/amber/red by threshold, label left, value right. |
| `Spark` | 7-point SVG polyline, 2 px, no fill, `--cyan`; last point a 3 px square. |
| `Matrix` | Grouped chips, 1 px border, dot 6 px; dot color = state; text never colored except stopped-expected. |
| `Pill` | Mono 10.5 px uppercase, 1 px border, 2 px radius; live = cyan, snapshot = muted, stale = amber. |
| `Timeline` | 50 rows max, level dot, mono time `HH:MM`, source tag, text; filters. |
| `Drawer` | Title, raw key/value table, source freshness, link-out list; no actions in v1. |
| `Banner` | Full-width, 1 px top border, mono 12 px, level color on the border and a 6 px square, not the background. |

---

## 7. Data contract

Full fixture: `dashboard/fixtures/state.v2.json`. Top level:

```json
{ "schema": "ayumad.dashboard/2", "generated_at": "...", "generated_on": "Mac mini",
  "overall": { "status": "ok", "score": 0, "alerts": 0 },
  "surfaces": { "mac_mini": {}, "p520": {}, "docker_vm": {}, "network": {},
                "media": {}, "personal": {}, "external": {} },
  "timeline": [], "meta": { "build_ms": 0, "sources": [], "kiosk": {} } }
```

Rules for the frontend:

- Render **only** from the payload. Missing key → `—`, never invent.
- `meta.sources[].ok/stale/age_s` drives per-section freshness badges.
- `surface.counts` drives KPI values; never `array.length` unless the field is explicitly a count.
- The public/snapshot payload may omit `hostnames`, `containers[].name`, and `network` details — the same components must render with those absent.
- Live fetch order: `/api/v2/state` → `https://ayumacmini.taila4a4a9.ts.net/api/v2/state` (when on the wall) → `/dashboard.json` snapshot. Header pill always says which one answered.

---

## 8. File layout

```
~/workspace/ayumad.me/
  AGENTS.md                      # repo rules for Codex
  dashboard/
    BRIEF.md                     # this file
    DESIGN.md                    # produced in session 1
    tokens.css
    fixtures/state.v2.json
    src/
      index.html
      base.css
      layout.css
      components.css
      app.js
      wall.js
      components/{cell,row,bar,spark,matrix,pill,timeline,drawer,banner}.js
    reference/                   # screenshots, if any
  scripts/build-dashboard.mjs    # inline src -> public/dashboard-next.html
  public/dashboard-next.html     # built artifact (committed)
```

Build rules: read `src/index.html`, replace `<!--INLINE:base.css-->` style markers and `<!--INLINE:app.js-->` script markers, write one file, print bytes and warning if > 150 KB gzipped.

---

## 9. Session prompts

### 01 — Design system (Astra, xhigh)

> Read `AGENTS.md`, `dashboard/BRIEF.md`, and the tokens. Study <https://ayumad.me> and `public/dashboard.html` for the existing visual vocabulary. Write `dashboard/DESIGN.md` (a one-page spec: grid, type scale, spacing, states, wall rules) and `dashboard/tokens.css` + `dashboard/src/base.css` + `layout.css`. Include a specimen route `?specimen=1` that renders every component state at 100% and in wall scale. Do not write the app logic yet. Commit as `dashboard: design system`.

### 02 — Shell + Overview (Sol, high)

> Implement the header, live/snapshot pill, theme toggle, section nav, hero cells, and the Overview page against `dashboard/fixtures/state.v2.json`. Use the existing components only; if a component is missing, add it to `components/` with the contract in BRIEF §6. No inline styles. Commit as `dashboard: shell + overview`.

### 03 — Automations (Sol, high)

> Implement the automations section: every enabled cron row from the fixture (28 today), failures pinned, 7-day success sparkline, next-run right column, launchd strip. Add the `failing` filter and the row drawer with raw fields. Keyboard: `j/k`, `Enter`, `Esc`. Commit as `dashboard: automations`.

### 04 — Homelab (Sol, high)

> Implement the homelab section: host gauge trio, 11 guest cards, two pool bars with threshold colors, top-5 datasets, snapshot/scrub/backup/SMART strip. Every value must come from the payload; missing values render `—` with a muted `no data` tag. Commit as `dashboard: homelab`.

### 05 — Services + Media (Sol, high)

> Implement the container matrix grouped by `stacks`, including `expected_running=false` chips with an amber outline and a `stopped` label; plus the media section (queues, remux progress, Jellyfin). Counts must use `counts`, not array length. Commit as `dashboard: services + media`.

### 06 — Personal + Timeline (Sol, high)

> Implement the personal section and the 50-event timeline with level/source filters, URL state, and the detail drawer. Commit as `dashboard: personal + timeline`.

### 07 — Wall mode (Sol, high)

> Implement `?mode=wall`: five pages, 20 s rotation, 2 px progress line, fixed alert rail, 1 px burn-in shift, 22:00–07:00 dim, stale banners at 90 s/5 min, pause on reduced-motion/keypress. Design for 1920×1080; verify it does not break at 2560×1440. It must paint from a cold boot in under 2 s with no first-run or crash-restore dialogs. Commit as `dashboard: wall mode`.

### 08 — Review sweep (Sol, high)

> Review only `dashboard/` and `public/dashboard-next.html`: data-contract misuse, a11y (focus, contrast, aria-live), token drift, wall failure states, dead code, and payload assumptions. Produce a findings list with file:line and fix the P0/P1 items. Commit as `dashboard: review fixes`.

### 09 — Final visual QA (Astra, high)

> Compare the built page against the live site's design language and `DESIGN.md`. Fix spacing, type, and state-color inconsistencies only — no structural changes. Produce a 10-line QA note in `dashboard/DESIGN.md` under `## QA`. Commit as `dashboard: visual QA`.

---

## 10. Model routing

| Work | Model | Effort | Rationale |
|---|---|---|---|
| Design system, IA, wall composition, final visual QA | `gpt-6.2-astra` | `xhigh` / `high` | Frontier professional-work and template fidelity: GDPval v2 50.4 vs 46.9, BenchCAD 82.5 vs 73.1, Agents' Last Exam 78.3 vs 73.0. |
| Section implementation, scripts, wall mechanics | `gpt-6.2-sol` | `high` | FrontierCode 2.0 43.8 vs 44.2 at ~1/5 cost per task; the right default. |
| Review | `gpt-6.2-sol` | `high` | ~2× real issues caught vs 6.1 Sol in GitHub's early testing. |

**Caps:** 3 Astra sessions maximum. No Astra for boilerplate, CSS tweaks, or retries. If a model errors twice, drop one tier and note it in the commit body.

Commands:

```bash
codex exec -C ~/workspace/ayumad.me -m gpt-6.2-astra \
  -c model_reasoning_effort=xhigh --sandbox workspace-write \
  "$(cat .codex/prompts/01-design.md)"

codex exec -C ~/workspace/ayumad.me -m gpt-6.2-sol \
  -c model_reasoning_effort=high --sandbox workspace-write \
  "$(cat .codex/prompts/02-overview.md)"

codex review -c model="gpt-6.2-sol" \
  "Review only dashboard/. Contract use, a11y, token drift, wall failure states."
```

---

## 11. Definition of done (per session)

- `node scripts/build-dashboard.mjs` succeeds; byte count printed.
- Page renders from the fixture with zero console errors at 1920×1080 and 390×844.
- No new dependencies; `npm run validate` passes.
- Every new component has a stale/empty/error rendering shown in `?specimen=1`.
- Commit message matches the prompt's requested message.
- No file outside `dashboard/`, `scripts/build-dashboard.mjs`, and `public/dashboard-next.html` changed.

If something in this brief conflicts with the live site's CSS, the live site wins for tokens; this brief wins for layout and behavior.
