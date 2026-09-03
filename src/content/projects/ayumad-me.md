---
title: Ayumad.me
slug: ayumad-me
summary: A personal site that treats projects, field notes, gear, and experiments as one navigable system.
stage: deployed
status_note: Live · public site
year: 2026
stack: React, TypeScript, Vite, Motion, Markdown
order: 4
featured: true
live_url: https://ayumad.me/
live_label: Visit site
source_url: https://github.com/Ayumad/ayumad.me
source_label: Source on GitHub
---

## Problem

The site started as a collection of pages that knew about one another only through navigation labels. Projects were thin records, the “now” material repeated information, and a reader could not tell whether a link represented a shipped tool, an active experiment, or an idea. The design language was strong, but the information model was not carrying its weight.

## Approach

Ayumad.me is built as a personal operating map. The home page introduces the person and the current signal; Projects explains the work; Journal holds edited field notes; Gear records the hardware context; About provides background and contact. The site keeps the visual system restrained—dark surfaces, cyan/lime signals, monospace labels, and motion that yields to reduced-motion preferences—so content remains the focus.

## Architecture and workflow

The app is a React/Vite single-page site with clean routes. Journal and project articles are Markdown-backed and parsed into typed content at build time. Shared layout components handle navigation, metadata, theme, renderer choice, and responsive behavior. The ASCII renderer is a visual layer, not a second source of truth: pages still work as semantic HTML with keyboard and touch access.

Projects now use explicit lifecycle stages and full-card links. That makes the list scannable while keeping each article available for the decisions and lessons behind a build. Public contact links are sourced from the About content, and production deploys are verified from the published site rather than inferred from a local build.

## Important decisions

Content ownership lives close to the content. A typed parser can reject malformed frontmatter or duplicate slugs before a deploy. Clean redirects preserve old bookmarks. The site also applies a privacy screen: private vault details, credentials, addresses, and collaborator-only work stay out of public articles even when they informed the writing.

## Current result

The site is live at [ayumad.me](https://ayumad.me/), with public Projects, Journal, Gear, About, and Renderer routes. The current portfolio is organized into deployed, in-progress, and planned work, and the article pages expose a compact facts area plus relevant internal, live, and source links.

## Lessons

A portfolio is a product with editorial infrastructure. A polished card cannot compensate for ambiguous status or a dead route. Typed content, canonical links, and a short privacy checklist create more trust than another decorative section.

## Next steps

Future work will continue to improve article depth, renderer performance, and publishing checks as new builds earn a public outcome. The architecture is intentionally ready for that growth without reintroducing duplicate project records.

## Working detail

The site’s route model is intentionally boring. A project card points to one canonical slug, the article loader validates that slug at build time, and old paths redirect instead of generating a second record. That is especially important for a personal portfolio: a broken bookmark or two competing “current” descriptions can make a small project look abandoned when it is simply represented twice.

The content pipeline mirrors the visual language. Frontmatter supplies the short facts that belong in a scan—stage, year, stack, and availability—while Markdown carries the longer argument. The page can therefore show a status badge without reducing the story to a marketing sentence. Journal articles and project articles share the same typography, but their metadata and purpose remain distinct.

The site is also a test of progressive enhancement. Motion can be reduced, the renderer can switch to text, and each card remains a semantic link. The contact links are deliberately repeated on the home and About surfaces because they are part of the site’s utility, not decoration. Production checks verify the published routes and hashed assets after a push so “works locally” is not the final definition of done.

The portfolio overhaul extends that idea to editorial maintenance. The article files are ordinary Markdown, so a future update can be reviewed as prose and frontmatter in a pull request. The parser owns the invariants, the page owns the presentation, and the vault remains background evidence rather than an accidental publishing source. That division should make the next twelve articles easier to keep current than the old duplicated records.

It also gives the site a durable publishing rhythm: build something, document the evidence, decide what is public, and then give it one canonical route. The portfolio is healthier when that rhythm is visible to a reader.
