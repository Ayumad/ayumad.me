# TASK — build the v2 dashboard from scratch, end to end

This run replaces the existing `ayumad.me/dashboard` page completely. Treat the old dashboard as gone: do not reuse its markup, CSS, JS, or data shape. Start from a blank page.

## Read first

- `dashboard/BRIEF.md` — design, layout, components, model routing context.
- `dashboard/tokens.css` — the only color/type source.
- `dashboard/fixtures/state.v2.json` — full v2 sample payload (28 jobs, 49 containers, 11 guests, 21 peers, null/stale/error cases).
- `dashboard/reference/ayumad-home.png` and <https://ayumad.me> — visual language.
- `dashboard/KICKOFF.md` is obsolete for this run: **ignore its "stop after the specimen" instruction**. Build the whole dashboard.

## Deliverable

A single self-contained `public/dashboard.html`, built by `node scripts/build-dashboard.mjs` from `dashboard/src/**`, that:

1. Matches the live site's visual language (dark #040707, cyan #48efd0, 104px grid, 5px dot matrix, 1px hairlines, uppercase mono labels, 2px radius max, no shadows/gradients).
2. Has the web layout: header, hero KPIs, Automations, Homelab, Services, Media, Personal, Timeline. Use the components in `BRIEF.md`.
3. Has `?mode=wall`: five rotating pages at 1920×1080, 20 s each, alert rail, burn-in shift, stale banners. Cold-boots to data in under 2 s with no first-run dialogs.
4. Works at 1920×1080 and 390×844 with no horizontal scroll.
5. Has stale, empty, and error states for every panel.

## Data: live first, seed fallback, honest labels

There is no v2 collector yet. Implement a loader in `dashboard/src/app.js`:

```js
const LIVE = "https://ayumacmini.taila4a4a9.ts.net/dashboard.json"; // v1 payload, real data
const SEED = window.__DASHBOARD_SEED__; // fixture inlined by the build
```

- Try `LIVE` with `cache: "no-store"` and a 5 s timeout.
- On success, adapt the v1 payload to the v2 shape:
  - `hermes` → `surfaces.mac_mini.hermes`
  - `homelab` → `surfaces.p520`
  - `tasks`, `school`, `journal` → `surfaces.personal`
  - `fleet` → `surfaces.network.tailscale`
  - `now` → `surfaces.personal.listening`
  - `surfaces.docker_vm`, `surfaces.media`, `surfaces.external` and per-job cron rows are **not present** in v1. Mark them `pending: true` and render a muted `collector pending · v2 not wired` panel. Never substitute seed numbers for live data.
- On failure, use `SEED` and show a `SEED` pill.
- The header pill always states the source: `LIVE · partial`, `SEED`, or `STALE`.

Inline the fixture at build time as `window.__DASHBOARD_SEED__` (the build script already inlines `dashboard/src/**`; add a marker for the JSON or embed it directly). The page must work from `file://` with no network and still render the full design.

## Files

Allowed:
- `dashboard/src/**`
- `dashboard/DESIGN.md` (write it)
- `scripts/build-dashboard.mjs` (change output to `public/dashboard.html`; inline the fixture)
- `public/dashboard.html` (generated)

Forbidden:
- `src/**`, `api/**`, `vercel.json`, `package.json` dependencies, any other page.
- New npm packages, frameworks, webfonts, images, analytics.

## Cleanup (this is a replacement, not a merge)

- `public/dashboard.html` is overwritten by the build. No legacy copy.
- Delete `public/dashboard.json` after confirming no other page references it (`grep -rn "dashboard.json" src public --include=*.html --include=*.tsx --include=*.ts`).
- No old dashboard CSS/JS files should remain referenced.
- Do not touch the journal, home page, or any other route.

## Verify before committing

1. `node scripts/build-dashboard.mjs` → writes `public/dashboard.html`, gzip ≤ 150 KB, no errors.
2. `npm run validate` passes.
3. Serve `public/` locally and load `/dashboard.html`:
   - 1920×1080 and 390×844 screenshots saved to `dashboard/reference/build-desktop.png` and `dashboard/reference/build-mobile.png`.
   - Zero console errors.
   - `?mode=wall` rotates through all five pages; no overflow.
   - `?fixture=1` forces the seed for design review.
4. With the tailnet unreachable, the page still renders from seed and says `SEED`.
5. With the tailnet reachable, Hermes/P520/task numbers match the live payload and the pill says `LIVE · partial`.

## Commit

Stage only `dashboard/**`, `scripts/build-dashboard.mjs`, `public/dashboard.html`, and the two reference screenshots. Never `git add -A` — the repo has unrelated changes.

Commit message: `dashboard: rebuild v2 from scratch (glm-5.3)`

When done, print a short report: files changed, gzip size, screenshot paths, what is live vs pending.
