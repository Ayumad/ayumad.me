# Codex kickoff — Ayumad Ops dashboard

Open Codex at the repo root: `~/workspace/ayumad.me`. Work on a new branch `dashboard-v2` and stage only the dashboard files — the repo has unrelated changes.

You are designing and building the Ayumad Ops dashboard. Read, in this order: `AGENTS.md`, `dashboard/BRIEF.md`, `dashboard/tokens.css`, `dashboard/fixtures/state.v2.json`. Look at `dashboard/reference/ayumad-home.png` and <https://ayumad.me> for the visual language.

The product: one operational picture of everything Ayush automates — Hermes cron jobs, launchd agents, the Proxmox P520, 11 guests, 49 containers, ZFS pools, backups, network, media, school, tasks. It renders in two modes from one HTML artifact:

- **Web** at `/dashboard` — interactive, dense, drill-down.
- **Wall** at `?mode=wall` — a 1920×1080 kiosk, no interaction, five rotating pages, readable from across a room.

This session is the **design pass**, not the full build. Do this and stop:

1. Write `dashboard/DESIGN.md`: the grid, type scale, spacing, component inventory, and the five wall compositions. One page, concrete.
2. Write `dashboard/src/base.css` and `dashboard/src/layout.css` from `dashboard/tokens.css`. Match the live site's 104px grid, 5px dot matrix, uppercase mono labels, 1px hairlines, 2px radius.
3. Build a `?specimen=1` page that renders every component — cell, row, bar, spark, matrix, pill, timeline, drawer, banner — in `good`, `warn`, `bad`, `stale`, `empty`, and `error` states, at web scale and wall scale.
4. Run `node scripts/build-dashboard.mjs` and show me the result. Do not build the full Overview page yet.

Then we iterate together in this session: I will comment on the specimen, you adjust, and only when the system is right do we move to the Overview and the remaining pages.

Hard constraints: no frameworks, no npm packages, no webfonts, no images, no shadows or gradients, no hard-coded colors outside `dashboard/tokens.css`. Build only from `dashboard/fixtures/state.v2.json`. Do not touch the rest of the repo.

Start with `dashboard/DESIGN.md` and the specimen.
