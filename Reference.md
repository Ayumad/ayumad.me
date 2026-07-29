# Ayumad.me — Master Build Prompt

> Copy-paste this into Claude, Codex, or any coding agent to one-shot the personal website rebuild.

---

## Who I Am

**Ayush Madhukar**
- Computer Engineering student at San José State University (SJSU)
- Previously earned an associate degree in Computer Science at Foothill College
- Bay Area based
- Email: hello@ayumad.me
- GitHub: github.com/ayumad (update with your actual username)

**Bio (for the About page):**
Ayush Madhukar is a Computer Engineering student in the Bay Area who treats technology as both an engineering discipline and a personal creative medium. He is drawn to systems that are personal, modular, understandable, and expressive.

**Personal voice:** He's always been interested in technology and finding the capabilities and limits of things. Since he was young he was figuring out how to jailbreak devices and run emulators — stuff that isn't supposed to be possible — and it always genuinely excites him. New technology never really ceases to amaze him, and because of that he feels like it will be a lifelong passion, whether relevant career-wise or not. Unlike others, technology is his main hobby. He loves collecting interesting technology and figuring out how to utilize it in interesting ways.

**Durable patterns:**
- Goes beneath surface-level use to understand the full technical stack
- Connects hardware, software, creative work, and lived experience
- Enjoys building systems that make abstract information interactive
- Values local ownership, customization, practical utility, and emotional awareness
- Learns through hands-on experimentation, comparison, and troubleshooting
- Frequently teaches, mentors, organizes, or translates technical ideas for others

---

## The Vision

A site that feels like a **map of Ayush — not a résumé**. Part showcase, notebook, gear journal, project archive, blog, and public knowledge layer. Visually dynamic with live data integrations. The tagline is: **"Ayush's cozy tech corner — AI, audio, hardware, notes, servers, Linux, and tiny experiments."**

**Key design principle:** Not just a résumé. It's a living, breathing reflection of who he is and what he builds. Cozy, minimal, content-focused with playful pixel-art accents. Should feel alive, not like a static brochure.

**Inspiration references:**
- midjourney.com/home (interactive, room-like navigation)
- henryheffernan.com (clean personal site)
- Pokémon-style controls and theming (game-inspired navigation)
- Room-like navigation where you walk around and click different areas

---

## Current State

- **Live at:** https://ayumad-me.vercel.app/ (ayumad.me DNS may need reconfiguration)
- **Framework:** React 19 + Vite
- **Routing:** Client-side hash-based (`#/path`)
- **Theme:** Dark/light with localStorage persistence
- **Styling:** CSS variables (Tailwind-ish utility classes, no Tailwind)
- **Deployment:** Vercel with @vercel/analytics
- **Design elements:** Kirby pixel-art panel, ASCII star field decoration

### Pages currently live (7 pages):
| Page | Current Content |
|------|----------------|
| **Home** | Quick-map landing with icon tiles to all sections, Kirby pixel-art panel, ASCII star header |
| **Showcase** | 3 topic cards: AI + notes (RAG/Obsidian), Homelab (Proxmox/storage), Audio (chains/music tech) |
| **Projects** | 4 project cards: Owlbot, DeluluBot, Audio Visualization, Homelab build — plus "future pages" teaser |
| **Systems** | 4 system layers: AI, Hardware, Audio, Knowledge — each with description + item list |
| **Now** | 4 status items: Building, Learning, Tuning, Designing |
| **About** | Full bio: SJSU Computer Engineering, Foothill CC, skills, interests |
| **Contact** | Email link (mailto:hello@ayumad.me), GitHub/LinkedIn/Resume marked "coming soon" |

---

## Tech Stack (Target)

- **Framework:** React 19 + Vite (keep current stack)
- **Routing:** React Router or wouter with hash-based routing
- **Styling:** Tailwind CSS (upgrade from current CSS variables) or keep CSS variables if preferred
- **Animations:** Framer Motion for page transitions, scroll animations, hover effects
- **Deployment:** Vercel (already configured)
- **Database:** PostgreSQL or SQLite (for integration data — Spotify history, movie logs, etc.)
- **API layer:** Serverless functions on Vercel for API routes (Spotify OAuth, Steam API, etc.)

---

## Pages to Build

### 1. Home (Landing)
- ASCII star field header animation
- "Ayush's cozy tech corner" tagline
- Quick-map with icon tiles linking to all sections
- Kirby pixel-art panel (currently using Reddit-hosted image)
- **Make it feel like entering a room** — the first impression should be warm and inviting

### 2. Showcase
- Topic cards that link to deep-dive pages:
  - **AI + Notes** — RAG assistant, Obsidian workflows, local LLMs
  - **Homelab** — Proxmox, storage, GPU passthrough, self-hosted services
  - **Audio** — DAC/amp chains, EQ tuning, music tech, audio visualization
- Each card should have a compelling visual and brief description

### 3. Projects
- Project cards with status indicators:
  - **Owlbot** — Foothill College chatbot (completed)
  - **DeluluBot** — CalHacks 10.0 emotion AI (completed)
  - **Audio Visualization** — Chladni patterns + ML (completed)
  - **Homelab Build** — Proxmox + local AI (in progress)
- "Future pages" teaser panel for:
  - Project archive (all past projects)
  - Gear journal (from loadout inventory)
  - AI-ush lab (AI chatbot trained on Ayush)

### 4. Systems
- 4 system layers with descriptions and item lists:
  - **AI Layer** — RAG, local LLMs, prompt workflows, Hermes agent
  - **Hardware Layer** — P520 homelab, GPU planning, servers
  - **Audio Layer** — DAC/amp chains, EQ, music production
  - **Knowledge Layer** — Obsidian vault, daily briefs, Mnemosyne memory

### 5. Now
- 4 status items showing what Ayush is currently doing:
  - **Building** — current active projects
  - **Learning** — what he's studying/reading
  - **Tuning** — audio/hardware optimization
  - **Designing** — creative work in progress
- Should be easy to update (could pull from a simple JSON file or CMS)

### 6. About
- Full bio (use the bio text from above)
- Education: SJSU Computer Engineering, Foothill CC Computer Science
- Skills: Python, C++, React, Linux, TensorFlow, PyTorch, Proxmox, ZFS
- Interests: AI, audio, homelab, retro gaming, photography, creative coding
- Location: Bay Area, CA

### 7. Contact
- Email: hello@ayumad.me (mailto link)
- GitHub: github.com/ayumad (link)
- LinkedIn: (add your LinkedIn URL)
- Resume: (PDF download link or page)

---

## Live Integrations (Phase 2+)

### Spotify Integration
- **Top Songs/Albums of the Week** widget (auto-updating)
- **Now Playing** real-time widget
- **Elo-based album ranking** — after listening to a full album, get prompted via Telegram to rate it. Albums get Elo scores and appear on a leaderboard
- **Listening history + genre breakdown** page
- **Cron job** to refresh data every 1-6 hours

### IMDb + Jellyfin Integration
- Auto-log movies watched via Jellyfin (detect >90% watched)
- Sync to IMDb watchlist/ratings (via OMDB API)
- Review prompts via Telegram after watching
- Movie journal page on website
- Database for watch history

### Steam Integration
- **Currently Playing** widget
- **Achievement showcase**
- **Game library + playtime display**
- **Recent activity feed**
- Cache layer to avoid rate limits

### Goodreads Integration
- **Currently Reading** widget
- Reading history with ratings
- Book reviews on website
- Reading stats (books/year, pages, genres)
- Note: Goodreads API is deprecated — use RSS feeds or manual entry

---

## Integration Architecture---

## Project Details for Cards/Pages

### Owlbot
- **What:** AI chatbot for Foothill College students
- **Stack:** Python, NLP, FAQ matching
- **Status:** Completed
- **Story:** Built to help students navigate college resources. Handles common questions about admissions, financial aid, course registration.

### DeluluBot
- **What:** Emotion-aware AI chatbot
- **Stack:** Python, sentiment analysis, CalHacks 10.0
- **Status:** Completed
- **Story:** Built at CalHacks 10.0 hackathon. Detects emotional tone and adjusts responses accordingly. Explores the boundary between AI empathy and genuine understanding.

### Audio Visualization Project
- **What:** Cymatics + machine learning visualization
- **Stack:** Python, TensorFlow, audio processing
- **Status:** Completed
- **Story:** Combines Chladni pattern generation with ML to create visual representations of sound. Bridges physics, music, and computer vision.

### Homelab Build
- **What:** Proxmox-based homelab with GPU passthrough
- **Stack:** Proxmox VE, ZFS, NVIDIA RTX 3060, Debian
- **Status:** In progress
- **Story:** Building a personal server stack for local AI inference, media serving, and self-hosted services. P520 workstation with 4TB storage pool, GPU passthrough for Ollama, and Docker-based services.

---

## Implementation Priorities

1. **Phase 1: Visual Overhaul** (15-25 hours)
   - Audit current design, keep what works
   - Add Framer Motion animations
   - Improve typography and spacing
   - Mobile responsiveness audit
   - Make it feel alive

2. **Phase 2: Spotify Integration** (12-18 hours)
   - Easiest API, good first integration
   - OAuth2 flow
   - Now Playing widget
   - Top tracks/albums display
   - Elo ranking system

3. **Phase 3: IMDb + Jellyfin** (15-25 hours)
   - Requires Jellyfin setup
   - Auto-logging movies
   - Review prompts via Telegram

4. **Phase 4: Steam Integration** (8-12 hours)
   - Straightforward API
   - Game library + achievements

5. **Phase 5: Goodreads** (10-15 hours)
   - Trickiest API (deprecated)
   - RSS or manual entry fallback

6. **Phase 6: Remaining Pages** (10-15 hours)
   - Now page (auto-updated)
   - Project archive
   - Gear journal
   - Blog/writeups

7. **Phase 7: AI-ush Lab** (10-15 hours)
   - Depends on RAG assistant
   - Chat interface
   - Public knowledge only

---

## Key Decisions Already Made

| Decision | Rationale |
|----------|-----------|
| Domain: Ayumad.me | Already owned |
| Hosting: Vercel | Already configured |
| Framework: React + Vite | Current stack, working well |
| Not just a résumé | Map of Ayush, not a CV |
| AI-ush concept | Fun, personal, disclosed as AI |
| Elo for album rankings | Gamified, personal, fun |
| Jellyfin → IMDb pipeline | Automatic tracking, no manual entry |
| Goodreads via RSS/manual | Official API deprecated |

---

## Constraints

- **Budget-conscious:** Prefer free tiers and self-hosted solutions
- **Privacy:** No private vault notes on public site. AI-ush only uses public knowledge
- **Maintenance:** Integrations should be low-maintenance once set up
- **Mobile-first:** Must work well on phones
- **Fast:** Static site + serverless functions, no heavy backend
- **Accessible:** Proper semantic HTML, alt text, keyboard navigation

---

## Deployment

- **Repo:** Create new repo or update existing
- **Vercel:** Connect to GitHub, auto-deploy on push
- **Domain:** Configure ayumad.me DNS to point to Vercel
- **Environment variables:** Spotify client ID/secret, Steam API key, etc.
- **Database:** Vercel Postgres or Turso (SQLite) for integration data

---

## Notes for the Agent

1. Start with Phase 1 (visual overhaul) before adding integrations
2. Keep the existing React + Vite stack — don't rewrite from scratch
3. The current site has good content structure — enhance it, don't replace it
4. Test mobile responsiveness throughout, not just at the end
5. Use TypeScript for type safety
6. Add proper error boundaries and loading states
7. Implement proper SEO meta tags for each page
8. Add Open Graph tags for social sharing
9. Consider adding a sitemap.xml
10. The site should be maintainable by Ayush after you leave — keep it simple

---

**Estimated total effort:** 80-130 hours over 2-4 months
**Start with:** Phase 1 (Visual Overhaul) → Phase 2 (Spotify) → iterate

---

*This prompt was compiled from Ayush's vault notes, project roadmaps, design preferences, and past conversations. Last updated: 2026-07-29.*


That's the full thing. Also saved to `~/Desktop/ayumad-me-build-prompt.md` if you want the file.