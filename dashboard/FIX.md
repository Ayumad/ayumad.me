# FIX — visual and state polish on the v2 dashboard

The first build passed 54/54 functional checks. This run fixes the design review findings. Do not rebuild the architecture; edit the existing `dashboard/src/**`.

## Do not touch

- `AGENTS.md`, `BRIEF.md`, `KICKOFF.md` — protected files, edits will block on approval. Leave them alone.
- `src/**`, `api/**`, `vercel.json`, `package.json`.
- Do not delete `public/dashboard.json` (it is now the snapshot data source).
- No new dependencies, fonts, images, shadows, or gradients.

## 1. Wall page 1 — the 60% void

`?mode=wall&page=1` currently has a status block at the top and a 2×4 KPI grid at the bottom, with a huge empty band between. Rebuild the page as three bands that fill 1080 px:

- **Top band (~240 px):** status word, clock, date, Mac/P520 uptime, and the highest-severity alert inline (the 14-container drift must be visible here, not only in the rail).
- **Middle band (fill):** the 8 KPI cells in a 4×2 grid that stretches to the available height. Values 64–72 px, labels 16–18 px, sub-labels 13–14 px. No empty band.
- **Bottom:** the alert rail stays.

Fix the status word font: explicitly `font-family: var(--mono)` so it never falls back to a serif. Same for the clock.

Check pages 2–5 for the same problem: every page must fill the stage at 1920×1080 with no dead band larger than ~80 px.

## 2. Global state semantics

One failed source is not a feed outage.

- `FEED DOWN` only when **no payload can be loaded at all**. With the embedded seed that is effectively never; do not show it.
- Per-source `stale` / `error` badges stay local to their section.
- `SEED` mode: pill `SEED`; footer/banner `DESIGN FIXTURE · not live data`; no `FEED DOWN`.
- `SNAPSHOT` mode: pill `SNAPSHOT · partial`; banner `snapshot · <age>`; no `FEED DOWN`.
- `LIVE` mode: pill `LIVE · partial`; no global banner.

## 3. Data loader — add the same-origin snapshot

`loadState()` order:

1. `https://ayumacmini.taila4a4a9.ts.net/dashboard.json` (live v1, 5 s timeout)
2. `/dashboard.json` (same-origin v1 snapshot; deployed with the site) → adapt with the same v1 adapter, label `SNAPSHOT`
3. embedded seed → label `SEED`

`public/dashboard.json` stays. This makes the real page show real data even when the tailnet URL is unreachable.

## 4. Desktop polish

- **Sparklines:** 7 vertical bars, 6×14 px, 2 px gap, cyan; a 0-run day is a 2 px muted stub. They must read at a glance, not look like dashes.
- **Row right column:** timestamp and status on one baseline, `white-space: nowrap`; grid `1fr 160px`; no two-line wrap.
- **Tags:** one style for `cron`, `interval`, `script`, model: 1 px border, 2 px radius, 10.5 px mono, same height. Remove the filled/outlined mismatch.
- **Contrast:** sub-labels use `--soft`, not `--muted`; minimum 11 px for labels, 12.5 px for row meta.
- **Disk card:** value and `14.1 / 228 GB` on one baseline, not value-left / detail-bottom.
- **Duplicate metric:** `JOBS ENABLED` appears in the hero and again as `ENABLED` in the automations stat strip. Keep the hero one; remove the duplicate from the strip (or vice versa).
- **Header nav:** tighten the gap to ~18 px; don't spread the tabs across the entire center.
- **Section meta:** give `hermes · 210ms · 28 jobs` a little breathing room; it must not look pinned to the border.

## 5. Mobile (390 px)

- Below 560 px: hero and section stat cards go to **one column** (or a 2-col grid with `minmax(150px, 1fr)` and shorter labels — no cramped 2-up).
- Nav becomes a horizontal scroll strip (`overflow-x: auto`, no wrap, `-webkit-overflow-scrolling: touch`), or a compact menu.
- Header actions ≥ 40 px tall.
- Alerts card renders as a list; kill the orphan `· overdue` separator.
- Base label 11 px, secondary 12 px, no clipping.

## 6. Verify

- `node scripts/build-dashboard.mjs` → `public/dashboard.html`, gzip ≤ 150 KB.
- Update the verify script (`~/.hermes/profiles/coder/cache/scratch/verify-dashboard.mjs`) so the seed state expects `DESIGN FIXTURE`, not `FEED DOWN`, and add a check that wall page 1 has no vertical gap > 100 px.
- Run the script; all checks pass.
- Re-shoot `dashboard/reference/build-desktop.png`, `build-mobile.png`, `build-wall.png`.
- Commit only `dashboard/**`, `scripts/build-dashboard.mjs`, `public/dashboard.html`, screenshots. Message: `dashboard: polish wall, states, mobile (glm-5.3)`.

Print a short report: what changed, test count, gzip size, screenshot paths.
