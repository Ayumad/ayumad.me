# Ayumad.me

Projects and notes by Ayush Madhukar across AI, audio, hardware, notes,
servers, Linux, and self-hosted systems.

The site is intentionally more notebook than résumé. Its public sections are
Home, Projects, Gear, Journal, and About. Taste is part of About, with its live
listening data still available at the section anchor. Its visual system uses
hand-built character fields, density ramps, ordered dither, hard grid lines,
oversized monospace type, and restrained motion.

No AI-generated imagery ships with the site. The visible artwork is composed
from type, CSS, canvas glyphs, and hand-built ASCII; the social card uses the
same deterministic graphic language.

## Prerequisites

- Node.js `>=22.13.0`
- npm

## Quick Start

```bash
npm install
npm run dev
```

The development site runs at `http://localhost:3000`.

## Useful commands

- `npm run dev` — start the development server
- `npm run build` — type-check and create a production build
- `npm run preview` — preview the production build
- `npm run typecheck` — run TypeScript without building
- `npm run lint` — run ESLint
- `npm test` — run the automated test suite
- `npm run check:public-boundary` — verify private session-log files are absent
- `npm run validate` — run every release check in sequence

## Editing content

Most site copy and structured content lives in:

- `src/siteContent.ts` — navigation, home, gear, about, and links
- `src/projectContent.ts` — typed Markdown loader, frontmatter validation, and lifecycle grouping
- `src/content/projects/*.md` — one evidence-based article per curated project
- `src/content/journal/*.md` — curated public articles with validated frontmatter
- `docs/owner-inventory-checklist.md` — internal gear verification checklist;
  it is not exported by the site build
- `src/App.tsx` — route composition and shared interface behavior
- `src/styles.css` — themes, responsive layout, and visual system
- `resources.md` — complete design, content, architecture, and rebuild specification
- `renderer-plan.md` — copy-paste blueprint for rebuilding the homepage
  renderer as a dedicated audiovisual tool

Project frontmatter requires `title`, `slug`, `summary`, `stage`, `status_note`,
`year`, `stack`, and `order`. Stages are `deployed`, `in-progress`, or `planned`;
duplicate slugs and invalid stages fail the build. Planned articles must keep
future behavior in the future tense. Keep private vault details and
collaborator-only work out of public Markdown.

The site uses clean browser routes. Vercel rewrites unknown frontend paths to
the Vite entry point while preserving the existing `/api/*` endpoints and
legacy hash links are migrated on load.

## Standalone renderer blueprint

The homepage instrument has a separate, self-contained implementation plan in
[`renderer-plan.md`](renderer-plan.md). It documents the exact 2D formulas,
authored 3D scenes, character rasterizer, five rendering modes, Web Audio
engine, guardrails, test matrix, and roadmap needed to build it as an
independent website.

## Deployment

Production is hosted on Vercel. The `main` branch is the production branch, and
Vercel builds the static `dist` output with `npm run build`.

The static build requires no environment variables. The live Taste/Spotify
endpoints require `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and
`SPOTIFY_REFRESH_TOKEN`; configure those values in the deployment environment
when live listening data is enabled. Keep the values in a local
`.env.spotify.local` file for scripts and never commit that file.

The album-rating maintenance loop is operator-driven: run `npm run spotify:detect`,
confirm that its Telegram delivery succeeded, then use the album name or ID
from the prompt with `npm run spotify:rate -- <album> <score>`. Run the full
validation suite, commit the updated `data/elo.json` and prompt ledgers, and
push them so Vercel can publish the board. A failed detector run retains its
pending queue and must be retried.

## Project status

Phase 1 is a static personal site with a small set of live Taste/Spotify
endpoints. The public Journal is curated at build time; private session logs
and unpublished drafts are not exported.

Copyright remains with Ayush Madhukar. No open-source license is granted.
