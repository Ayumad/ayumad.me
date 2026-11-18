# AGENTS.md

## Active project: dashboard v2

Work only in:
- `dashboard/**`
- `scripts/build-dashboard.mjs`
- `public/dashboard-next.html` (generated)

Read in this order: `dashboard/BRIEF.md`, `dashboard/tokens.css`, `dashboard/fixtures/state.v2.json`, `dashboard/reference/ayumad-home.png`.

Build: `node scripts/build-dashboard.mjs` → `public/dashboard-next.html`.

Hard rules:
- Vanilla HTML/CSS/ES2022 only. No new npm packages, frameworks, webfonts, images, analytics, or extra network calls.
- Do not edit `src/**`, `api/**`, `vercel.json`, `package.json` dependencies, or any other page.
- Tokens only; no hard-coded colors outside `dashboard/tokens.css`.
- 1px borders, 2px radius max, no shadows/gradients/glows.
- Every panel needs stale, empty, and error states.
- Render only from the fixture/payload; missing key → `—`, never invent.
- `npm run validate` must pass before committing.
- Never `git add -A`: the repo has unrelated uncommitted changes. Stage only files in scope.
- Create/switch to branch `dashboard-v2` before the first commit.
- Commit after each session with the message named in `dashboard/BRIEF.md`.

Detailed local rules: `dashboard/AGENTS.md`.
