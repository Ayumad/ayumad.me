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
- `npm run validate` — run every release check in sequence

## Editing content

Most site copy and structured content lives in:

- `src/siteContent.ts` — navigation, projects, showcase topics, systems, and links
- `src/nowData.ts` — the hand-maintained Now page
- `src/App.tsx` — page composition and shared interface behavior
- `src/styles.css` — themes, responsive layout, and visual system
- `resources.md` — complete design, content, architecture, and rebuild specification
- `renderer-plan.md` — copy-paste blueprint for rebuilding the homepage
  renderer as a dedicated audiovisual tool

The site uses hash routes so every section can be opened directly without
server-side routing configuration.

## Standalone renderer blueprint

The homepage instrument has a separate, self-contained implementation plan in
[`renderer-plan.md`](renderer-plan.md). It documents the exact 2D formulas,
authored 3D scenes, character rasterizer, five rendering modes, Web Audio
engine, guardrails, test matrix, and roadmap needed to build it as an
independent website.

## Deployment

Production is hosted on Vercel. The `main` branch is the production branch, and
Vercel builds the static `dist` output with `npm run build`.

No environment variables are required for Phase 1.

## Project status

Phase 1 is a static personal site. Spotify, Jellyfin, Steam, Goodreads, AI-ush,
the gear journal, and other live integrations are intentionally deferred.

Copyright remains with Ayush Madhukar. No open-source license is granted.
