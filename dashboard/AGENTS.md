# AGENTS.md — dashboard scope

Open Codex at the repo root (`~/workspace/ayumad.me`); the root `AGENTS.md` is the entry point. This file is the detailed reference. All paths are repo-root relative.

## Read first

1. `dashboard/BRIEF.md` — the design and behavior contract.
2. `dashboard/tokens.css` — the only color/type source of truth.
3. `dashboard/fixtures/state.v2.json` — the data contract. Build against this file.
4. `dashboard/reference/ayumad-home.png` and <https://ayumad.me> — visual language.

## Scope

Allowed:
- `dashboard/**`
- `scripts/build-dashboard.mjs`
- `public/dashboard-next.html` (generated)

Not allowed:
- `src/**`, `api/**`, `vercel.json`, `package.json` dependencies, any other public page.
- New npm packages, frameworks, webfonts, images, analytics, or network calls other than the dashboard JSON endpoints.

## Build

```bash
node scripts/build-dashboard.mjs
```

Writes `public/dashboard-next.html`. The build inlines `dashboard/src/*.css` and `dashboard/src/*.js` into one file. Missing files are skipped with a warning, so the project builds from day one.

## Rules

- Vanilla HTML/CSS/ES2022. No dependencies.
- Tokens only: no hard-coded hex outside `dashboard/tokens.css`.
- 1px borders, 2px radius max, no shadows/gradients/glows.
- Cyan = live/healthy/focus; violet = second data series only; amber/red = warn/bad only.
- Every panel needs stale, empty, and error states. Never render a blank panel.
- Render only from the payload. Missing key → `—`, never invent a value.
- `npm run validate` must pass before any commit.
- Never `git add -A`; stage only `dashboard/**`, `scripts/build-dashboard.mjs`, and `public/dashboard-next.html`. The repo has unrelated changes.
- Branch: `dashboard-v2` for the first commit.
- Commit after each session with the message named in `dashboard/BRIEF.md`.

## Verification

- Open `public/dashboard-next.html` at 1920×1080 and 390×844.
- Zero console errors.
- `?specimen=1` renders every component in every state.
- `?mode=wall` rotates pages and survives a cold load with no first-run dialogs.
