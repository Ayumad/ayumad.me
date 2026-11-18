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
- `npm run validate` — run every release check in sequence

## Editing content

Most site copy and structured content lives in:

- `src/siteContent.ts` — navigation, home, gear, about, and links
- `src/projectContent.ts` — typed Markdown loader, frontmatter validation, and lifecycle grouping
- `src/content/projects/*.md` — one evidence-based article per curated project
- `src/content/journal/*.md` — curated public articles with validated frontmatter
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

The production build prerenders public routes with route-specific metadata and
generates the sitemap. Vercel serves the static 404 page for missing paths and
redirects legacy clean URLs. The browser migrates legacy hash links.

## Standalone renderer blueprint

The homepage instrument has a separate, self-contained implementation plan in
[`renderer-plan.md`](renderer-plan.md). It documents the exact 2D formulas,
authored 3D scenes, character rasterizer, five rendering modes, Web Audio
engine, guardrails, test matrix, and roadmap needed to build it as an
independent website.

## Deployment

Production is hosted on Vercel. The `main` branch is the production branch, and
Vercel builds the static `dist` output with `npm run build`.

Spotify requires the server credentials listed in `.env.example`. Spotify and
the dashboard remain optional in a local frontend preview.

### Owner dashboard

`/dashboard` is an owner-only area with no signup endpoint. Vercel checks the
configured username and scrypt password hash at sign-in. It serves private
HTML and data through `api/dashboard.ts`, using an eight-hour signed cookie.
Keep the password hash, session secret, and snapshot key in Vercel environment
variables scoped to Production. Password and session-secret rotation revoke
existing sessions. Apply a project Firewall rate limit to the sign-in POST and
the direct dashboard API POST before exposing the login publicly.

Historical plaintext snapshots may still exist in repository history. The
publisher only writes an encrypted snapshot and a public summary with fixed
numeric fields. Do not put detailed dashboard data under `public/`.

The scheduled publisher can run `scripts/publish-dashboard.sh` with the private
local snapshot, a private file containing a 32-byte hex key, and a dedicated
bare checkout with a writable Git remote. It pushes only the encrypted snapshot
and the allowlisted public summary. The snapshot key must match the Vercel
environment variable. The dashboard prefers the rolling Tailnet feed when
reachable and falls back to the authenticated encrypted snapshot off Tailnet.

## Project status

Phase 1 is a static personal site with a small set of live Taste/Spotify
endpoints. The public Journal is curated at build time; private session logs
and unpublished drafts are not exported.

Copyright remains with Ayush Madhukar. No open-source license is granted.
