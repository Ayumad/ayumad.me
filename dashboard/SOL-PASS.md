# SOL PASS — Life dashboard redesign

**This file is authoritative for this pass.** The repo-root `AGENTS.md` and
`dashboard/AGENTS.md` contain stale instructions about a `public/dashboard-next.html`
and a `dashboard-v2` branch. Ignore those stale parts. Do **not** edit
`AGENTS.md`, `dashboard/AGENTS.md`, or `dashboard/BRIEF.md`.

Current build: `node scripts/build-dashboard.mjs` writes
`server/dashboard/overview.html` (life) and `server/dashboard/status.html` (ops).
Current verifier: `node dashboard/life/verify.mjs`.

## The problem

The current centerpiece is a 90-node / 542-link vault graph. It is impressive for
two seconds, then becomes a hairball. At 1920×1080 the labels crowd each other,
the node cloud is too dense to parse, and it does not answer the only questions a
wall dashboard must answer:

1. What am I doing now?
2. What is next / at risk?
3. Is anything on fire?
4. What should I touch next?

The rest of the page is a dense table: 52 tasks, long titles, many rows. It is
simultaneously too much and not enough hierarchy.

## Research: what actually works

Read the screenshots in `dashboard/reference/`:

- `sol-glance.png` — Glance. Asymmetric columns; tiny uppercase section labels;
  content floats with generous spacing and very few hard borders; color appears
  only when content needs it. High information density, low **visual** density.
- `sol-homepage.png` — Homepage. Bento grouping and status dots work; the flat
  card hierarchy and tiny metrics do not work at wall distance.
- `sol-current-wall.png` — the current page. It is the thing to beat.

Also studied (not all screenshots retained):

- **DAKboard / Apple StandBy / ambient displays:** very low density, huge type,
  one focal point, readable from across a room, background-free.
- **Obsidian Graph View / local graph:** the global graph becomes a hairball;
  the useful mode is **local graph at shallow depth**, with filters, fading and
  labels only where they matter. A wall should show the local graph, not 662 notes.
- **Nielsen Norman / UXPin dashboard principles:** hierarchy first; 5–7 chunks;
  remove competing focal points; a dashboard abandoned for complexity has failed.
- **Berkeley glanceable-display principles:** abstraction, distinct visuals,
  consistency, match expectations; motion must draw attention only when meaningful.

## Required direction

### 1. One glanceable composition

Restructure the life page around a clear hierarchy:

- **Hero:** time/date + the live focus line. The clock is still the largest thing,
  but focus is the first *meaningful* thing after it.
- **Centerpiece:** a **local constellation of 6–9 nodes maximum**, not the global
  90-node graph. It should be readable in under 2 seconds.
- **Support rails:** compact agenda, tasks, school, weather. Each rail shows only
  the next few items; more is a count, not another paragraph.
- **Footer:** one system pulse/health strip.

No scrolling at 1920×1080 or 390×844. No browser chrome. The wall is 1920×1080.

### 2. Replace the hairball with a meaningful local constellation

Choose one of these directions (or a stronger variant) and commit to it:

**A. Focus constellation (recommended).**
Center node = `NOW` / the current focus. Surround it with 7 always-labeled domain
hubs derived from real payload data: `SCHOOL`, `TASKS`, `HOMELAB`, `PROJECTS`,
`CALENDAR`, `VAULT`, and one personal/gear hub if useful. Each hub has:
- a visible name;
- a live count/state (e.g. `4 UPCOMING`, `1 OVERDUE`, `1 WARNING`);
- a ring/arc or small bar encoding its state;
- a thin line to the center only (plus at most 1–2 peer links if genuinely meaningful).

The active focus node is brighter and can move toward the center. The constellation
orbits slowly; node pulses are tied to real activity. Clicking/hovering reveals the
underlying item on web; the wall has no pointer.

**B. Orbital radar.**
Concentric rings = now / next / later; nodes = 5–7 items (current class, next class,
overdue task, next school deadline, one project, one homelab issue). This is also
acceptable if it is more legible than the constellation.

Do **not** render the global 90-node graph on the life page. If you want context,
use 24–36 unlabeled, very faint peripheral dots as texture — no labels, no edge
hairball. The full graph belongs in `/status` or a detail view later, not here.

The public projection has no note labels. Do not invent private titles. On public,
the domain labels are safe (`SCHOOL`, `TASKS`, `HOMELAB`, `PROJECTS`, `CALENDAR`,
`VAULT`) and values should be counts/aggregates only.

### 3. Make the whole surface breathe

- Time: live seconds; seconds bar; day progress.
- Focus: recalculate every 15s; update header + highlighted rows/domains; show a
  subtle progress ring for the current event/task window.
- Constellation: slow orbit/drift; pulses tied to live counts; active hub expands.
- Data: one small **live ticker** or sparkline that changes with real values
  (e.g. jobs active, services up, devices online). No random noise.
- All motion must remain calm at 6–10 feet and must respect
  `prefers-reduced-motion: reduce` (static frame, no rAF loop).

### 4. Cut the text, keep the meaning

- At most **3 tasks** in the rail. Truncate long task titles to a course/project +
  short action; no 2–3 line task paragraphs.
- At most **2 school items**, **3 agenda rows**, **3 week days**, **3 forecast days**.
- Use one-line labels and numbers. More items = `+N MORE`.
- No duplicated labels between the focus header and the rows.

### 5. Visual language

- Existing tokens only: `dashboard/tokens.css`; dark `#040707`, cyan `#48efd0`,
  violet `#777fc4`, amber/red only for warning/bad.
- Vanilla HTML/CSS/ES2022; no dependencies, frameworks, webfonts, external images.
- Hairlines, mono labels, 2px max radius. No CSS shadows, gradients, blur or glow.
  Canvas may use flat additive alpha/strokes for depth, but do not add blurred DOM
  effects.
- Keep the site's terminal/CAD character: coordinates, uppercase labels, precise
  numbers, restrained color.
- Every panel has a stale/empty/error state. Never render an invented number.

### 6. Data contract

Use the existing payload; no API changes. Current useful fields:
`now`, `calendar.events[]` (`time`, `end_time`, `summary`, `cal`, `sort`),
`tasks.items[]` (`title`, `list`, `due`, `overdue`),
`school.next[]`, `brain` (`nodes`, `links`, `top_hub`, `notes`),
`recent[]`, `journal[]`, `hermes`, `homelab`, `fleet`, `now`.
The page already has `IS_WALL`, `isPublic`, `computeFocus`, `BRAIN`, `AMBIENT`.
You may replace/rewrite `BRAIN` and `AMBIENT`; keep privacy behavior.

### 7. In-scope files

Allowed:
- `dashboard/life/index.html`
- `dashboard/life/life.css`
- `dashboard/life/life.js`
- `dashboard/life/verify.mjs` (test harness only)
- `dashboard/SOL-PASS.md` (append a short implementation/spec note)
- generated `server/dashboard/overview.html` via the build

Do not touch:
- `AGENTS.md`, `dashboard/AGENTS.md`, `dashboard/BRIEF.md`
- `src/**`, `api/**`, `server/**` except the generated overview
- `vercel.json`, `package.json`, dependencies
- any other page

### 8. Verification / definition of done

1. `node scripts/build-dashboard.mjs` succeeds.
2. `node dashboard/life/verify.mjs` at 1920×1080 and 390×844:
   - `scrollHeight === innerHeight` for both;
   - 0 console errors/page errors;
   - constellation renders and animates;
   - focus header text is correct for the current data;
   - public payload has no private titles/labels.
3. `npm run validate` passes.
4. Use the reference screenshots; if your runtime has an image-viewing tool, view
   `dashboard/reference/sol-current-wall.png`, `sol-glance.png`, `sol-homepage.png`
   and your new screenshots. Do a real visual pass, not only DOM metrics.
5. Append a concise **design rationale + node model + motion budget + final metrics**
   to `dashboard/SOL-PASS.md`.
6. Do not commit. Leave the branch dirty for Hermes to review and deploy.

## Success test

At 8–10 feet, a person should know in two seconds:
- current time;
- what Ayush is focused on now;
- the next hard deadline;
- whether the homelab/Hermes is healthy;
- the next 2–3 things to touch.
The screen should still feel alive when nothing is urgent: orbit, pulses, seconds,
and one live value changing.

## Implemented composition

The clock dominated the old wall while the current priority sat in the smallest
type. The note cloud competed with two-line queue items and made it hard to find
a useful next action. The new hero puts the focus title and deadline beside the
clock. The wall reads across from schedule to constellation to actions. The
phone stacks the action rails at full width and condenses the week to dates and
counts. The footer gives Hermes and homelab separate health readings.

The constellation has eight labeled nodes with seven spokes. NOW marks the
selected focus. Calendar shows today's event count. School shows upcoming
deadlines. Tasks shows the overdue count when present, otherwise open work.
Projects shows active projects, Vault shows total notes, Homelab shows its worst
reported condition, and Hermes shows active jobs or failing jobs. Marker arcs
indicate state, while the center ring measures elapsed time when the focus has
a known window. Pointer, touch, and keyboard reveal a domain detail. The public
view uses the time-of-day focus and aggregate details. Wall and signed-in views
can reveal a title or the context behind a warning.

The clock and day rail advance once per second. Focus updates every 15 seconds.
Markers drift a maximum of 3.5 px on the wall and 1.4 px on the phone on a
roughly 53-second cycle. A changed count, item, status, or focus triggers a
1.8-second pulse. Canvas paints are limited to about 21 per second. Background
tabs, stale data, and reduced motion stop the animation loop. The footer trend
keeps up to 12 distinct service samples from the existing five-minute poll.
The wall flags data stale after 15 minutes and web snapshots after eight hours.
A failed refresh retains the last successful reading and marks it stale.

### Final checks

| View | Viewport and document | Agenda / tasks / school / week / forecast | Labeled nodes | Console and page errors |
| --- | --- | --- | --- | --- |
| Wall | 1920 × 1080 | 3 / 3 / 2 / 3 / 3 | 8 | 0 |
| Signed in | 390 × 844 | 3 / 3 / 2 / 3 / 3 | 8 | 0 |
| Public | 1920 × 1080 | 0 / 0 / 0 / 3 / 3 | 8 | 0 |
| Public | 390 × 844 | 0 / 0 / 0 / 3 / 3 | 8 | 0 |

The verifier checks the evening fixture's overdue focus and 11:59 PM deadline,
current-event priority, mobile label bounds with a two-line focus title, the
production public projection and DOM, the reduced-motion frame, a service
sample change, and stale, empty, and offline states. The fixture reports Hermes
clear, one homelab warning, and 33 of 33 services up. Screenshots use a frozen
fixture clock and deterministic weather. The verifier prints their local paths.
