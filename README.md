# Ayumad.me

Projects and notes by Ayush Madhukar across AI, audio, hardware, notes,
servers, Linux, and self-hosted systems.

The site is intentionally more notebook than résumé. Its visual system uses
hand-built character fields, density ramps, ordered dither, hard grid lines,
oversized monospace type, and restrained motion.

No AI-generated imagery ships with the site. The visible artwork is composed
from type, CSS, canvas glyphs, and hand-built ASCII; the social card uses the
same deterministic graphic language.

## Prerequisites

- Node.js 22.x
- npm
- GitHub CLI (`gh`) for repository and pull-request operations
- Vercel CLI (`vercel`) for project linking and manual previews/deployments

## Quick Start

```bash
npm install
npm run dev
```

The development site runs at `http://localhost:3000`.

If you use `nvm`, run `nvm use` first; `.nvmrc` pins the tested Node.js
version. Use `npm ci` instead of `npm install` in clean checkouts and CI so the
exact dependency lockfile is respected.

## Useful commands

- `npm run dev` — start the development server
- `npm run build` — type-check and create a production build
- `npm run preview` — preview the production build
- `npm run typecheck` — run TypeScript without building
- `npm run lint` — run ESLint
- `npm test` — run the automated test suite
- `npm run validate` — run every release check in sequence
- `npm run spotify:auth` — authorize Spotify locally and create an ignored credential file
- `npm run spotify:push-env` — securely add those credentials to Vercel production
- `npm run deploy:preview` — validate, then create a Vercel preview
- `npm run deploy` — validate, then deploy the checked workspace to production

## Editing content

Most site copy and structured content lives in:

- `src/siteContent.ts` — navigation, projects, showcase topics, systems, gear, and links
- `src/content/blog/*.md` — validated public Blog articles
- `src/nowData.ts` — the hand-maintained current-work section on Projects
- `src/App.tsx` — page composition and shared interface behavior
- `src/styles.css` — themes, responsive layout, and visual system
- `resume/Ayush-Madhukar-Resume.docx` — editable résumé source
- `public/ayush-madhukar-resume.pdf` — public résumé linked from Contact and the footer
- `resources.md` — complete design, content, architecture, and rebuild specification
- `renderer-plan.md` — copy-paste blueprint for rebuilding the homepage
  renderer as a dedicated audiovisual tool

The site uses clean path routes such as `/blog` and `/projects/hermes`.
Vercel rewrites unknown paths to the Vite entry point so every section can be
opened directly and refreshed without losing the route.

The Obsidian vault and Google Drive are editorial sources only. Neither is
read during local builds or Vercel deployments; public material must be
reviewed and copied into this repository deliberately.

## Standalone renderer blueprint

The homepage instrument has a separate, self-contained implementation plan in
[`renderer-plan.md`](renderer-plan.md). It documents the exact 2D formulas,
authored 3D scenes, character rasterizer, five rendering modes, Web Audio
engine, guardrails, test matrix, and roadmap needed to build it as an
independent website.

## Deployment

Production is hosted on Vercel. The `main` branch is the production branch, and
Vercel builds the static `dist` output with `npm run build`.

The static site has no required environment variables. Live Spotify activity
uses three server-only variables:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`

Create a Spotify Web API app, add
`http://127.0.0.1:8888/callback` as its redirect URI, and run
`npm run spotify:auth`. The helper performs the authorization-code flow and
writes the result to the gitignored `.env.spotify.local` file. It does not put
credentials in source code or print the refresh token. Run
`npm run spotify:push-env`, then `npm run deploy`, to activate the feed in
production. Reauthorize when Spotify's refresh token expires or access is
revoked.

For a new machine, authenticate and link the services once:

```bash
gh auth login
vercel login
vercel link
```

Normal work should happen on a branch and go through a pull request. GitHub
Actions runs `npm run validate` for every pull request and every push to
`main`. Vercel creates preview deployments for branches and deploys production
after changes reach `main`.

At the end of a completed change, use `npm run deploy`. It refuses to deploy if
type checks, linting, tests, or the production build fail. This provides a
reliable manual production path in addition to the automatic deployment that
runs whenever `main` changes.

## Project status

The Contact page supports live Spotify listening activity with graceful
recent-track and offline states. IMDb, MyAnimeList, Steam, Goodreads, Jellyfin,
AI-ush, the gear journal, and other live integrations remain planned.

Copyright remains with Ayush Madhukar. No open-source license is granted.
