# Ayumad.me — Current Site Specification

Last updated: July 29, 2026

This is the current source of truth for Ayumad.me. It describes the finished
Phase 1 site, its content, visual system, interaction model, architecture, and
deployment. It is intentionally self-contained so a coding agent can use this
document alone to build a very similar personal website in one pass.

`Reference.md` is an older planning document. Where the two files disagree,
this document wins. In particular, the finished site does not use the “cozy
tech corner” tagline, Kirby art, room navigation, Tailwind, a database, or live
media integrations.

## 1. Outcome

Ayumad.me is a seven-route personal website for Ayush Madhukar. It is a map of
his interests and systems rather than a résumé. The result combines:

- a black-and-cyan technical interface;
- old-internet and terminal-like structure;
- live, code-rendered ASCII graphics;
- ordered dithering, scanlines, grids, phosphor glow, and hard borders;
- restrained motion inspired by TouchDesigner and customized Linux desktops;
- plain, concise writing without a branded AI personality;
- real content about local AI, Linux, servers, audio, cameras, and projects.

The dominant impression should be “personal instrument and technical notebook,”
not “startup landing page,” “generic portfolio template,” or “AI-generated
cyberpunk site.”

Current locations:

- Production: <https://ayumad-me.vercel.app/>
- Intended canonical domain: <https://ayumad.me/> (DNS still needs verification)
- Repository: <https://github.com/Ayumad/ayumad.me>
- Production branch: `main`

## 2. Identity and writing

### Person

- Name: Ayush Madhukar
- Location: Bay Area, California
- Education:
  - San José State — Computer Engineering
  - Foothill College — Computer Science
- Email: `hello@ayumad.me`
- GitHub: `https://github.com/ayumad`

### Voice

Write directly and specifically. Prefer an ordinary word over a stylized label.
Most interface labels should be one or two words: `Work`, `Projects`, `Systems`,
`Now`, `About`, `Contact`, `Shape`, `Scale`, `Motion`, `Multiply`, `Random`.

The prose should sound curious, practical, and hands-on. Ayush is interested in
what hardware and software can do after the defaults get out of the way. He
learns by setting things up, breaking them, comparing options, and fixing them.
Technology is a long-term personal interest, not merely a career theme.

Do:

- name real devices, software, and constraints;
- use first-person prose;
- explain why a project matters in practical terms;
- keep labels and navigation obvious;
- allow the visual system—not the copy—to carry the strangeness.

Do not:

- use “cozy tech corner”;
- invent edgy hacker jokes, fake command-line logs, or lore;
- use phrases such as “digital garden,” “tiny experiments,” or “transmission
  established” as personality filler;
- claim integrations or projects that do not exist;
- add LinkedIn or a résumé until real URLs are supplied;
- use AI-generated hero images or third-party character artwork.

## 3. Visual system

### Direction

The style draws from:

- TouchDesigner interfaces and audiovisual patching;
- Arch Linux and Hyprland desktop customization;
- ASCII Magic and Pixtube character-density rendering;
- oscilloscope music and vector synthesis;
- Content Architecture’s editorial/technical layouts;
- Midjourney’s dark, immersive interface density;
- old web pages, terminals, rack labels, schematics, and printed technical
  manuals.

Take inspiration from the systems and interaction patterns, not their assets.
All visible artwork should be built from code, text, CSS, or a local canvas.

### Dark palette

```css
--bg: #040707;
--surface: #091011;
--surface-2: #0e191a;
--text: #e5f4f2;
--soft: #9bb7b3;
--muted: #627d79;
--line: #294441;
--fine: #142624;
--cyan: #48efd0;
--secondary: #48efd0;
--violet: #777fc4;
--ink: #020606;
```

Black and cyan are the identity. Violet is an occasional supporting signal, not
a competing brand color. Do not reintroduce acid green, coral, or warm beige.

### Light palette

```css
--bg: #e6efed;
--surface: #f3f8f7;
--surface-2: #d4e2df;
--text: #071311;
--soft: #314b47;
--muted: #5d7470;
--line: #758e89;
--fine: #c0d1ce;
--cyan: #006f68;
--secondary: #006f68;
--violet: #50568d;
--ink: #f4fffd;
```

### Type

- Display and interface: system monospace stack:
  `"SFMono-Regular", "Cascadia Code", "Roboto Mono", Consolas, monospace`
- Body: `Inter, "Helvetica Neue", Helvetica, Arial, sans-serif`
- Major headings are uppercase, extremely bold, tightly tracked, and often use
  line heights below `0.9`.
- Body text stays readable, with roughly `1.6–1.8` line height.
- Labels use small uppercase monospace with restrained letter spacing.

### Geometry and surfaces

- Maximum content width: `1460px`.
- Desktop shell inset: `32px` each side.
- Use square corners and one-pixel rules. Avoid rounded cards and pills.
- Build layouts with visible grid columns and borders.
- Use `surface` colors sparingly against the near-black background.
- Interactive cyan elements may use a hard offset shadow, never a soft glass
  card shadow.
- Background texture combines a large 104px grid, tiny dot halftones, a violet
  dither wash, and a very faint animated character field.

### ASCII language

Use ASCII as information, not decoration pasted onto a page.

- Structural glyphs: `─ │ / \ + ┌ ┐ └ ┘ ├`
- Density ramp: ` .,:;+*#@`
- Texture ramp: `░▒▓█`
- Ordered dithering: 4×4 Bayer matrix
- Cyan phosphor glow should remain restrained and legible.
- Code-generated scenes should be deterministic and tied to page content.
- Static ASCII is acceptable for small diagrams, dividers, and the `AM`
  monogram. Large hero fields should be rendered.

### Global render modes

The header includes one native selector labeled `Renderer`. Its value changes
the rendering grammar across the entire site, including the homepage
oscilloscope, every route scene, the ambient canvas, surface texture, and
post-processing overlay.

| Value | Character conversion | Whole-site treatment |
| --- | --- | --- |
| `ASCII` | directional line glyphs and the standard density ramp | 104px technical grid, restrained cyan glow |
| `Dither` | ordered Bayer thresholds mapped to `░▒▓█` | 4px halftone field, harder contrast, no text bloom |
| `Glitch` | deterministic row displacement and sparse character corruption | cyan/violet channel split and intermittent scan bands |
| `Particles` | trace topology reduced to `· • ●` | denser point canvas, lighter surfaces, reduced background grid |
| `CRT` | smooth phosphor ramp with longer persistence | scanlines, vignette, bloom, modest contrast/saturation lift |

These are alternate render paths, not five color themes. Content, hierarchy,
controls, and cyan identity remain stable. Glitch movement is deterministic and
brief so text remains readable. CRT is implemented as a CSS post-process rather
than falsely presenting itself as a WebGL simulation.

## 4. Global structure

The site is a React single-page application using hash routes:

| Index | Label | Route |
| --- | --- | --- |
| 00 | Home | `#/` |
| 01 | Work | `#/showcase` |
| 02 | Projects | `#/projects` |
| 03 | Systems | `#/systems` |
| 04 | Now | `#/now` |
| 05 | About | `#/about` |
| 06 | Contact | `#/contact` |

Every route uses the same shell:

- sticky header;
- `AYUMAD.ME` wordmark with a cyan `▓` marker;
- indexed desktop navigation;
- native `ASCII / Dither / Glitch / Particles / CRT` renderer selector;
- icon-only dark/light control (`☼` and `◐`) with a clear accessible label;
- icon-only mobile menu (`≡` and `×`);
- skip link;
- route transition;
- global low-density canvas character field;
- violet dither wash;
- footer with cyan density strip, `AYUMAD.ME`, year, and email;
- styled not-found route and React error boundary.

Theme preference is stored in `localStorage` under `ayumad-theme`. The initial
theme is applied in the document head before React loads to prevent a flash.
Renderer preference is stored under `ayumad-renderer` and is bootstrapped in
the same document-head script. The active value is exposed as
`data-renderer` on the root element so CSS and code-rendered systems share one
state.

## 5. Home

### Composition

The first section is a large oscilloscope instrument paired with an introduction
panel. On desktop they sit side by side. At `900px` and below, the instrument
becomes full width and the introduction moves below it. A topic strip follows,
then a full navigation index and a current-focus block.

### Copy

Label: `Computer Engineering`

Heading: `Ayush Madhukar`

Introduction:

> I like finding out what hardware and software can do once the defaults get
> out of the way. Lately that means local AI, Proxmox, Linux, audio systems, and
> cameras.

Buttons: `Projects`, `About`

Topics: `AI + Notes`, `Servers`, `Audio`, `Linux`

Location: `Bay Area, California`

Current focus:

- Label: `Current`
- Title: `Hermes`
- Text: “Moving Hermes onto a Mac mini so my other devices can use the same
  tools and memory over Tailscale.”
- Link: `Now`

### Interactive ASCII oscilloscope

This is a working browser instrument, not a video or canned text animation.

Available shape buttons:

| Shape | Generator | Locked straight-on geometry |
| --- | --- | --- |
| Line | Lissajous | exact 1:1 diagonal |
| Circle | Lissajous | unit circle, 1:1 at 90° |
| Eight | Lissajous | exact 2:1 figure eight |
| Knot | Lissajous | exact 3:2 knot at 90° |
| Rose | Polar rose | pure five-petal rose |
| Star | Radial polygon | regular five-point star |
| Polygon | Polygon interpolation | exact regular hexagon |
| Orbit | Hypotrochoid | 5:3 hypocycloid |

Controls:

- Eight visible geometric shape buttons replace a hidden preset menu. Every
  selection restores a curated, straight-on silhouette and resets its rotation
  clock, scale, and motion defaults. Frequency and multiplier remain unchanged.
- `Hz`: selects chromatic equal-tempered notes from D1 (36.71 Hz) through A3
  (220 Hz). The range input operates in semitone steps, automatically snaps
  every pointer/keyboard change to an exact note frequency, and displays both
  note name and Hz value.
- `Scale`: 70–100%. The higher floor keeps the shape visually present.
- `Motion`: 0–100%. It controls the speed of a bright trace head traveling
  around the fixed outline; it never changes the shape coordinates.
- `Multiply`: 1×, 2×, 4×, or 8×. Copies are traversed within one base cycle, so
  2× emphasizes one octave above the base frequency, 4× emphasizes two
  octaves, and 8× emphasizes three.
- `Pause` / `Run`: stops or resumes geometric motion.
- `Random`: chooses one of the eight locked silhouettes, a safe 84–98% scale,
  one of five restrained motion values, and a multiplier. It never randomizes
  ratio, phase, form, or rotation, and it preserves the current note.
- `Audio off` / `Audio on`: explicit stereo output switch.
- Pause/run, Random, and Audio are shown as custom monochrome CSS icons rather
  than text. Each icon-only button retains a descriptive accessible name and
  native title tooltip.

Ratio, phase, form, rotation, and stage dragging are intentionally not exposed.
Those values define the authored identity of each shape; removing them prevents
high-density, folded results that no longer read as the selected silhouette.

Renderer:

- Parameterized vector functions generate X/Y samples.
- Around 1,900 samples are rasterized into a responsive character grid.
- Orientation selects `─`, `│`, `/`, or `\`; crossings use `+`.
- Lower-intensity persistence uses the density ramp and a 4×4 Bayer threshold.
- The trace decays between frames for phosphor persistence.
- Grid dimensions and font size derive from the available render area.
- Plot coordinates use almost the complete stage (`0.495` of each half-axis),
  so the drawing reaches the scope edges instead of sitting in the center.
- Large jumps between multiplied copies are treated as blanked flyback paths on
  the ASCII display, keeping the visible shapes separate.
- Physical character cells are taller than they are wide. The plot applies a
  measured horizontal correction from the active grid’s cell dimensions so a
  mathematical circle appears circular rather than as a wide ellipse.
- Motion moves a brightness highlight around the locked outline without
  changing phase, form, rotation, or scale, so animation cannot bend or smear a
  standard shape.
- Rendering is capped near 20 FPS.
- The global renderer mode changes the trace conversion itself:
  `ASCII` uses orientation, `Dither` uses ordered block density, `Glitch`
  displaces scan rows, `Particles` sparsifies the trace into point glyphs, and
  `CRT` extends persistence and uses a smooth phosphor ramp.

Audio:

- Audio is muted by default.
- No `AudioContext` is created until the user explicitly enables it.
- The same parametric geometry used for the screen is sampled into X and Y
  channels.
- A discrete Fourier transform creates 48-harmonic `PeriodicWave` data for each
  channel from 512 samples.
- X is routed to the left stereo channel and Y to the right using
  `ChannelMergerNode`.
- The fundamental frequency follows the `Hz` control.
- Copy multiplication is part of the sampled path, so its octave-rich audio and
  on-screen multiplicity come from the same data rather than separate effects.
- Audio geometry stays identical to the authored visual geometry and updates
  only when a real shape, scale, frequency, or multiplier value changes.
- Master gain is intentionally low (`0.018`) and fades in/out to avoid abrupt
  output.
- Muting suspends the audio context after the fade.

This is intentionally a browser-sized vector synthesizer, not a full clone of
OsciStudio. It does not import OBJ/SVG/G-code, expose live coding, drive lasers,
record files, or implement a timeline editor.

## 6. Work

Route heading:

- Index: `01`
- Title: `Work`
- Description: “The three areas I keep coming back to.”

The header ASCII scene is generated live and combines three simultaneous
signals: Notes → Hermes traffic, a P520 load meter, and an animated audio wave.

Topics:

### AI + Notes

- Label: `Tools`
- Summary: “I am setting up Hermes to run from one Mac mini and connect from my
  other devices over Tailscale. The next step is tying it into my notes without
  exposing the private parts of the vault.”
- Tags: `Hermes`, `Tailscale`, `Obsidian`, `Local models`
- Diagram: desktop, laptop, and iPad converge through VPN on the Mac mini and
  Hermes.

### Homelab

- Label: `Server`
- Summary: “My ThinkStation P520 runs Proxmox. I use it for storage, local AI,
  media, and services, with the important parts separated from whatever I am
  testing that week.”
- Tags: `ThinkStation P520`, `Proxmox + ZFS`, `GPU passthrough`, `Docker / LXC`
- Diagram: P520 branches into a 4TB ZFS pool, GPU VM, and service containers.

### Audio

- Label: `Listening`
- Summary: “I keep separate desktop and living-room 2.1 systems, compare
  headphones and IEMs, and spend a lot of time getting placement, crossover,
  and EQ right.”
- Tags: `WiiM Ultra + ZA3`, `KEF Q150`, `Kube 12b / SB-1000 Pro`,
  `Dusk / Daybreak / Zero:RED`
- Diagram: desktop and room signal chains.

The rows alternate their text/diagram composition. Do not convert these into
generic cards.

## 7. Projects

Route heading:

- Index: `02`
- Title: `Projects`
- Description: “Selected software, hardware, and research projects.”

The header scene is a generated project/build timeline. Completed projects have
solid status points; active projects use a rotating character; a dithered scan
line moves through the build list.

Project rows include an index, status, year, large title, summary, stack tags,
and a native expandable `details` story.

### Owlbot

- Status: completed
- Year: 2023
- Summary: “An AI chatbot built to help Foothill College students find their
  way.”
- Story: “Owlbot handles common questions about admissions, financial aid,
  course registration, and campus resources. The interesting problem was not
  only matching questions—it was translating a sprawling institutional
  knowledge base into answers students could actually use.”
- Stack: `Python`, `NLP`, `FAQ matching`

### DeluluBot

- Status: completed
- Year: 2023
- Summary: “An emotion-aware chatbot built during CalHacks 10.0.”
- Story: “We built DeluluBot at CalHacks 10.0. It detects sentiment and changes
  its response style. It was a short hackathon build and an early test of how
  much tone changes the way a chatbot feels to use.”
- Stack: `Python`, `Sentiment analysis`, `CalHacks`

### Audio Visualization

- Status: completed
- Year: 2024
- Summary: “Cymatics and machine learning turned into a visual study of sound.”
- Story: “I combined Chladni-style pattern generation with machine learning to
  make audio visible. The project let me work on signal processing, computer
  vision, and music in the same place.”
- Stack: `Python`, `TensorFlow`, `Audio processing`

### Homelab Build

- Status: in progress
- Year: Now
- Summary: “A P520 running Proxmox for storage, local AI, media, and services.”
- Story: “The ThinkStation P520 has a 4TB ZFS pool and a GPU-passthrough VM. I
  am separating core services from the Docker experiments so I can change one
  part without taking everything else down.”
- Stack: `Proxmox VE`, `ZFS`, `GPU passthrough`, `Docker`

### Hermes Remote

- Status: in progress
- Year: Now
- Summary: “One Hermes server on a Mac mini, available from the rest of my
  devices.”
- Story: “I am moving Hermes off each client and onto a headless Mac mini.
  Desktop and mobile clients connect through Tailscale, so the tools and memory
  live in one place instead of being rebuilt on every machine.”
- Stack: `Hermes`, `Tailscale`, `macOS`, `Remote clients`

Future/archive panel:

- Listening history
- Film log
- Game activity
- Reading log
- Gear notes
- Project archive

Every item is visibly labeled `Planned`.

## 8. Systems

Route heading:

- Index: `03`
- Title: `Systems`
- Description: “The machines, software, and audio systems I actually use.”

The generated header scene shows P520, Mac mini, clients, and audio nodes with
packets moving through LAN and Tailscale paths.

Layers:

### L1 — AI

- Description: “One agent backend, several clients, and my own notes when they
  are useful.”
- Flow: `notes → tools → model → client`
- Items: `Hermes server`, `Tailscale clients`, `OpenRouter + local models`,
  `Obsidian retrieval`

### L2 — Hardware

- Description: “New and old machines, each set up for a specific job.”
- Flow: `machine → operating system → job`
- Items:
  - `P520 / Proxmox`
  - `Mac mini / Hermes`
  - `RTX 5080 desktop / 4K OLED`
  - `Zephyrus G14 / RTX 5070 Ti`
  - `CF-SV1 / Arch + X220t / NixOS`
  - `X-T4 / 18–55 + X100VI`

### L3 — Audio

- Description: “Two speaker systems plus the headphones and IEMs I compare
  between them.”
- Flow: `source → DAC → amp → room`
- Items:
  - `Desktop: WiiM / ZA3 / Q150 / SB-1000 Pro`
  - `Living room: RX-V677 / Q150 / Kube 12b`
  - `FiiO K13 R2R`
  - `Dusk / Daybreak / Zero:RED`

### L4 — Knowledge

- Description: “Notes that turn one-off troubleshooting into something I can
  reuse.”
- Flow: `question → test → note → reuse`
- Items: `Obsidian vault`, `Build plans`, `Astro field notes`, `Public writeups`

The page ends with a full-cyan band connecting `Knowledge · AI · Hardware ·
Audio`.

## 9. Now

Route heading:

- Index: `04`
- Title: `Now`
- Description: “What I am working on and learning.”
- Updated: July 29, 2026

The header scene is a generated process monitor with four running tasks,
spinners, and a moving queue cursor.

Entries:

1. `Building` — `Hermes Server`
   - “Running Hermes from a headless Mac mini so the rest of my devices can
     connect to one backend.”
   - `Mac mini · Hermes · Tailscale · remote clients`
2. `Learning` — `Custom Linux`
   - “Building my own Arch and Hyprland setup on a Panasonic Let's Note, then
     using the X220t to learn NixOS.”
   - `Arch · Hyprland · NixOS · old ThinkPads`
3. `Tuning` — `Two 2.1 Systems`
   - “Working on speaker placement, crossover, and room correction at my desk
     and in the living room.”
   - `Q150 · SB-1000 Pro · Kube 12b · WiiM`
4. `Designing` — `Ayumad.me`
   - “Turning this site into an accurate index of what I use, what I build, and
     what I am learning.”
   - `TypeScript · motion · dither · ASCII`

The content lives in a dedicated data file so routine updates do not require
editing page composition.

## 10. About

Route heading:

- Index: `05`
- Title: `About`
- Description: “Computer Engineering student based in the Bay Area.”

The generated header scene traces a path from emulators to Foothill to SJSU,
then branches from the Bay Area into Linux, audio, cameras, and servers.

Story:

> I got into technology through jailbreaking devices and running emulators. I
> liked seeing a device do something it was not supposed to do, and I still
> approach new hardware the same way.

> Most of my projects start with a practical question. Can this old workstation
> become a useful server? Can one Mac mini run an AI agent for every device? Can
> I make an Arch install feel exactly how I want? I learn by setting it up,
> breaking something, and fixing it.

> I study Computer Engineering at San José State and previously studied Computer
> Science at Foothill. Outside class, technology is still my main hobby: Linux,
> audio, cameras, old hardware, game streaming, and whatever I am trying to
> configure that week.

Profile panel:

- hand-built block-letter `AM` monogram;
- `Ayush Madhukar`;
- `Bay Area, California`.

Skills:

`Python`, `C++`, `TypeScript`, `React`, `Linux`, `Proxmox`, `ZFS`, `Docker`,
`Tailscale`

Interests:

`Local AI`, `Self-hosting`, `Audio`, `Linux`, `Photography`,
`Astrophotography`, `Retro Hardware`, `Handhelds`

## 11. Contact

Route heading:

- Index: `06`
- Title: `Contact`
- Description: “Email and GitHub are the best ways to reach me.”

The generated header scene sends an envelope packet from `YOU` to `AYUMAD` and
shows a changing transmit counter and acknowledgement state.

The page also includes a large cyan density field and two large link panels:

- Email — `hello@ayumad.me`
- GitHub — `@ayumad`

Do not add placeholder social accounts.

## 12. Generated route scenes

All six subpage heading scenes use one shared renderer and a fixed 48×22
character buffer. A mode-specific post-processing pass converts that meaningful
source frame without changing the scene’s content. Common primitives include:

- point placement;
- text writing;
- Bresenham-style line drawing;
- labeled boxes;
- points moving along a path;
- sparse deterministic dither.

Each page has separate scene logic:

| Scene | Meaning |
| --- | --- |
| Work | note traffic, P520 load, audio waveform |
| Projects | build timeline and status scan |
| Systems | physical/service topology and packets |
| Now | active process table and queue |
| About | learning path and interest branches |
| Contact | mail transport and acknowledgement |

Scenes update around 12.5 FPS, pause when the document is hidden, and render a
stable frame when the user prefers reduced motion.

Mode conversion follows the same grammar as the homepage: Dither maps geometry
to ordered block density, Glitch shifts deterministic bands, Particles reduces
connections to points, and CRT adds sparse phosphor ghosts while CSS supplies
scanlines and vignette. Labels and data remain legible through every conversion.

## 13. Motion and texture

- `motion/react` handles route entrances and restrained row hover/scroll
  movement.
- The background particle canvas renders a sparse character-density field at
  roughly 8 FPS.
- The canvas changes glyph set, density, cell size, color, and scan displacement
  with the global renderer. Particles is deliberately denser; CRT is larger and
  softer; Dither uses block glyphs; Glitch uses offset symbol bands.
- A fixed, non-interactive CSS post-process layer supplies mode-wide halftone,
  chromatic displacement, particle topology, or CRT scanline/vignette effects.
- Canvas DPR is capped at `1.25`.
- Particles are non-interactive and disappear entirely under reduced motion.
- All animation loops listen for `visibilitychange`.
- The global reduced-motion stylesheet reduces transitions and animations to a
  near-instant duration.
- No animation should block reading, steal focus, or change content order.

## 14. Responsive behavior

Breakpoints:

- `1120px`: compact header and content grids; large rows begin stacking.
- `900px`: mobile navigation activates; the homepage instrument becomes
  full-width above the introduction; project/system layouts simplify.
- `650px`: narrow phone layout with 10px shell gutters, stacked page headings,
  two-column oscilloscope controls, single-column content, and touch-sized
  buttons.

Requirements:

- no horizontal page overflow at 320px;
- minimum practical touch target around 44px;
- ASCII must scale or crop inside its own bounded panel, never expand the page;
- content order must remain logical without CSS;
- homepage scope should stay large enough to manipulate on a phone;
- the dense control bank may use two columns on mobile, but labels remain
  visible.

## 15. Accessibility

- Semantic `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`.
- Visible skip link on focus.
- Global cyan `:focus-visible` outline.
- Current navigation link uses `aria-current="page"`.
- Mobile menu exposes `aria-expanded`, `aria-controls`, and closes on Escape.
- Theme and menu icons have descriptive labels and titles.
- The renderer is a labeled native select, retains keyboard behavior, and
  persists without changing document meaning.
- Decorative ASCII, particles, and textures use `aria-hidden`.
- The oscilloscope figure has a descriptive hidden caption.
- Oscilloscope controls use real labels, inputs, outputs, and button states.
- Every exposed adjustment has a native keyboard-accessible control.
- Audio state uses `aria-pressed` and begins off.
- Native `details`/`summary` powers project expansion.
- External GitHub links use `rel="noreferrer"`.
- Reduced motion is respected in Motion, canvas, ASCII scenes, and the
  oscilloscope.

## 16. SEO and document metadata

- Per-route title and description are updated when the hash route changes.
- Canonical URL is updated to `https://ayumad.me/#/route`.
- Base HTML includes author, theme color, Open Graph, and X/Twitter metadata.
- Local `favicon.png` and `og.png`; no hotlinked artwork.
- The 128×128 favicon uses a near-black field, cyan pixel `A`, sparse
  right-edge density trail, and dark clipped corner rules. It must remain
  recognizable when reduced to 16×16 and should be cache-busted when replaced.
- `robots.txt` allows crawling.
- `sitemap.xml` lists the canonical root.
- A styled 404 exists for unknown hash routes.
- Vercel adds immutable caching for hashed assets plus `nosniff` and strict
  referrer headers.

## 17. Technical architecture

Stack:

- React 19
- TypeScript 5.9
- Vite 8
- Motion 12 through `motion/react`
- Vitest 4
- Testing Library
- ESLint 10
- Plain CSS variables and custom CSS; no Tailwind
- Web Audio API
- Canvas 2D

There is no router dependency. A small hash-path hook listens for
`hashchange`, and a local link component emits `#/path` URLs.

File map:

| File | Responsibility |
| --- | --- |
| `src/main.tsx` | React root and error boundary |
| `src/App.tsx` | shell, routing, page composition, theme, metadata |
| `src/siteContent.ts` | typed navigation, work, projects, systems, about, links |
| `src/nowData.ts` | hand-maintained Now entries and update date |
| `src/AsciiOscilloscope.tsx` | homepage vector renderer, controls, Fourier audio |
| `src/AsciiScene.tsx` | six generated subpage heading scenes |
| `src/ParticleField.tsx` | low-density background canvas |
| `src/renderMode.ts` | typed mode list, validator, and shared React context |
| `src/styles.css` | tokens, layout, textures, route styles, breakpoints |
| `src/App.test.tsx` | routes, content, theme, renderer, menu, controls, generated scenes |
| `index.html` | base SEO, theme/renderer bootstrap, favicon and social metadata |
| `public/og.png` | deterministic social preview |
| `public/favicon.png` | local favicon |
| `public/robots.txt` | crawl policy |
| `public/sitemap.xml` | canonical root |
| `vercel.json` | build output and security/cache headers |

Typed content models:

- `NavItem`
- `ShowcaseTopic`
- `Project`
- `SystemLayer`
- `NowEntry`
- `SocialLink`
- `HomeContent`
- `AboutContent`

Project status is restricted to:

```ts
type ProjectStatus = "completed" | "in-progress" | "planned";
```

## 18. Validation and release

Required release command:

```bash
npm run validate
```

It runs, in order:

1. TypeScript checking
2. ESLint
3. Vitest
4. production build

Current automated coverage checks:

- homepage renderer exists and emits a substantial character frame;
- all oscilloscope controls have correct default state;
- curated shape resets, frequency, scale, motion, multiplier, pause, and safe
  random interactions;
- circle output stays physically proportional after monospace cell-aspect
  correction;
- every route and primary heading;
- all six generated route scenes;
- project details and system inventory;
- unknown-route handling;
- theme persistence;
- all five renderer values, persistence, and route-scene conversion;
- mobile menu open, close, and Escape behavior.

Release flow:

1. branch from `main` as `agent/<description>`;
2. commit only the intended files;
3. push and open a pull request;
4. wait for Vercel preview success;
5. merge to `main`;
6. verify local and remote commit SHAs match;
7. verify Vercel deployed the exact merged commit and the public URL serves the
   new hashed assets.

No environment variables, credentials, database, serverless functions, or
public API integrations are required.

## 19. Maintenance

Common edits:

- Routine current-status update: edit `src/nowData.ts`.
- Project, system, bio, contact, or navigation update: edit
  `src/siteContent.ts`.
- Page structure: edit `src/App.tsx`.
- Theme/layout: edit `src/styles.css`.
- Renderer choices/context: edit `src/renderMode.ts`; conversion behavior lives
  in the oscilloscope, route-scene, particle, and CSS files together.
- Homepage instrument: edit `src/AsciiOscilloscope.tsx`.
- Subpage animation: edit the matching renderer in `src/AsciiScene.tsx`.
- Route metadata: edit `pageMeta` in `src/siteContent.ts`.

When adding a new route:

1. add its navigation item and metadata;
2. add a route branch in `App.tsx`;
3. build a meaningful generated scene rather than reusing another route’s art;
4. add responsive rules;
5. add an automated route/scene assertion;
6. update the sitemap if real non-hash URLs are introduced.

## 20. Deferred work

Phase 1 intentionally does not include:

- Spotify listening data;
- Jellyfin or film logs;
- Steam activity;
- Goodreads or reading history;
- AI-ush or a public chatbot;
- blog CMS;
- gear journal;
- project archive;
- authentication;
- persistence;
- serverless endpoints.

These ideas may appear as clearly labeled future work, but should not be
simulated with fake data.

## 21. One-shot rebuild prompt

Copy the following block into a coding agent when rebuilding from scratch:

```text
Build a production-ready personal website for Ayush Madhukar using React 19,
Vite, TypeScript, Motion, and custom CSS. Use this document as the only source
of truth.

Create hash routes for Home, Work, Projects, Systems, Now, About, and Contact,
plus a styled not-found route. Implement a shared sticky indexed navigation,
icon-based persistent dark/light theme, a persistent native global renderer
selector, accessible mobile menu, skip link, footer, route metadata, error
boundary, local favicon/social card hooks, robots.txt, sitemap.xml, and Vercel
configuration.

The aesthetic must be black and cyan, editorial, technical, old-internet, and
ASCII-led, with influence from TouchDesigner, Arch/Hyprland customization,
ASCII density rendering, and oscilloscope music. Use the exact tokens, content,
page inventory, labels, and voice in this specification. Use square corners,
one-pixel grid rules, oversized monospace headings, readable sans-serif body
copy, ordered dither, scanlines, halftones, and restrained phosphor glow. Do not
use Tailwind, rounded SaaS cards, gradients as generic decoration, AI-generated
hero imagery, third-party character art, fake terminal jokes, or the phrase
“cozy tech corner.”

Build the homepage around a large code-rendered ASCII XY oscilloscope
instrument. Present Line, Circle, Eight, Knot, Rose, Star, Polygon, and Orbit as
visible shape buttons; include a D1–A3 frequency slider quantized to chromatic
equal-tempered notes with note-name/Hz readout, scale, motion, and
1×/2×/4×/8× multiplier controls; pause/run; curated random combinations; and
optional stereo Web Audio muted by default. Lock ratio, phase, form, and base
rotation inside each authored preset rather than exposing them. Each shape
button must reset to a recognizable straight-on silhouette. Compensate for the
physical width/height ratio of monospace character cells so circles, regular
polygons, stars, and Lissajous figures render with standard proportions.
Motion must move a brightness highlight around the fixed outline without
changing any geometry. Random may select
only a shape, safe 84–98% scale, restrained motion value, and multiplier; it
must never generate arbitrary geometry. Multiplying copies must traverse the
geometry multiple times per base cycle so the visible multiplication also
creates octave-rich audio. Generate left and right audio from the same
parametric X/Y geometry using PeriodicWave/Fourier synthesis. Use a responsive
character grid, orientation-aware glyphs, a Bayer dither matrix, phosphor
persistence, near-full-panel plotting, a capped frame rate, hidden-tab pausing,
and reduced-motion support. Render pause/run, randomize, and audio state as
cohesive monochrome CSS icons with accessible labels and title tooltips.

Offer ASCII, Dither, Glitch, Particles, and CRT modes. Treat them as global
rendering grammars, not palette presets. One selection must change the
oscilloscope’s character conversion, all generated subpage scenes, the ambient
canvas, and a restrained whole-page post-process while leaving content and
layout stable. Persist the choice in localStorage, apply it before React loads,
and keep the black/cyan identity in every mode. Dither uses ordered `░▒▓█`
density; Glitch uses deterministic row displacement and brief cyan/violet
splits; Particles uses sparse point topology; CRT uses extended phosphor
persistence plus CSS scanlines, vignette, and bloom. Disable moving glitch
effects for reduced motion.

Give each subpage a different code-rendered ASCII heading scene tied to its
content: Work signal multiplexing, Projects build timeline, Systems network
packets, Now process monitor, About education/interests graph, and Contact mail
transmission. Do not reuse one generic animation.

Store editable content in typed data modules. Keep Now content in its own file.
Use native semantic elements, clear focus states, keyboard equivalents for
every exposed instrument control, aria states for menu/theme/audio, and
decorative hiding for ASCII. Support 320px phones through wide desktops without
horizontal overflow.

Implement automated tests for all routes, unknown-route handling, theme
persistence, renderer persistence/conversion, mobile-menu keyboard behavior,
project expansion/content, homepage instrument controls, and all generated
scenes. Add scripts for typecheck, lint, test, build, and a combined validate
command. Do not add a database, authentication, API credentials, or live
integrations.
```

## 22. References

Design and interaction references:

- Content Architecture: <https://www.contentarchitecture.dev/>
- Midjourney home: <https://www.midjourney.com/home>
- ASCII Magic: <https://www.ascii-magic.com/>
- Pixtube: <https://pixtube.komm64.com/>
- TouchDesigner: <https://derivative.ca/>
- Motion for React: <https://motion.dev/docs/react>

Oscilloscope and audio references:

- OsciStudio feature overview:
  <https://www.oscilloscopemusic.com/software/oscistudio/>
- Free Oscilloscope application and playback controls:
  <https://www.oscilloscopemusic.com/software/oscilloscope/>
- Oscilloscope music X/Y signal explanation:
  <https://oscilloscopemusic.com/info/about/>
- W3C Web Audio specification:
  <https://www.w3.org/TR/webaudio-1.0/>

The site borrows concepts—parameterized geometry, stereo X/Y routing, vector
preview, timelines/processes, and density-based rasterization—but does not copy
proprietary interface assets or source code.
