---
title: XY / Vector Renderer
slug: xy-vector-renderer
summary: A browser renderer for waveforms, vectors, particles, and CRT-like treatments in a deliberately small frame loop.
stage: deployed
status_note: Released · live renderer
year: 2026
stack: React, Canvas, Web Audio, ASCII, Motion
order: 5
live_url: /renderer
live_label: Open renderer
---

## Problem

The site’s visual language depends on signals that feel alive without becoming a distraction. A generic animation library can draw movement, but it does not explain the relationship between a waveform, a vector path, and a display surface. I wanted a renderer that could make those relationships visible in the browser and still behave well on a phone or a reduced-motion setup.

## Approach

The renderer treats a frame as a shared signal buffer. Oscilloscope traces, XY vectors, particles, dither, glitch, and CRT treatments consume that buffer through small adapters instead of each inventing its own animation state. The same idea powers the home instrument, project scene, and standalone Renderer page, with presentation choices layered on top of a stable source.

## Architecture and workflow

Inputs are sampled, normalized, and drawn into a bounded frame loop. Canvas handles the dense visual work; semantic controls and labels sit outside it so the experience remains accessible. The ASCII mode provides a text-forward rendering path, while dither and CRT modes add texture when the display supports it. Motion is paused or reduced when the user requests reduced motion, and offscreen scenes do not keep animating unnecessarily.

## Important decisions

The renderer favors a few adapters over a large abstraction. This keeps the code understandable and makes it possible to tune the visual response without changing every page. It also treats performance as part of the artwork: limiting work per frame, avoiding unbounded particles, and letting the browser reclaim offscreen work are more valuable than adding another effect.

## Current result

The standalone renderer is live at [/renderer](/renderer). The current site uses it for the oscilloscope and restrained page scenes; the project page documents the broader vector-rendering idea rather than implying that every experiment is a separate shipped product.

## Lessons

Visual consistency comes from shared constraints, not from repeating a color palette. Once every scene speaks the same signal language, a new treatment can be added without making the site feel like a collection of unrelated demos.

## Next steps

The renderer can grow through more input adapters, better profiling on lower-power mobile devices, and additional documented presets. Those are incremental extensions to a live system.

## Working detail

The shared frame buffer gives each adapter a common vocabulary: normalized points, intensity, phase, and time. A waveform can become a horizontal trace, an XY figure, or a particle field without changing the source’s meaning. Presentation adapters then add the site’s surface language—ASCII density, ordered dither, CRT persistence, or a restrained glitch—while keeping controls and labels outside the canvas.

That split also helps with accessibility and failure recovery. The canvas is allowed to be decorative when the user chooses a reduced mode, while the controls remain native inputs with readable names and values. If an audio source is unavailable, the renderer can keep drawing a deterministic signal rather than leaving the whole page blank. If a scene scrolls offscreen, its loop can pause and release work.

The renderer is intentionally not marketed as a hardware oscilloscope. It is a visual instrument for the site: useful for seeing relationships, tuning a treatment, and giving a project page a consistent signal, with the browser’s limits made explicit.

That honesty is visible in the controls. The page names the renderer mode, frequency, dimensions, and energy state instead of presenting a canvas with no explanation. It gives a reader enough information to reproduce a visual treatment and enough escape hatches to turn the effect down. The visual system can be expressive while still behaving like an interface rather than a screensaver.

The small frame loop is therefore both an implementation detail and a design constraint: every new visual idea has to earn its CPU time and its place in the signal vocabulary.

It is a useful constraint for the site as a whole. Effects can stay expressive, but they must remain legible, interruptible, and cheap enough to share with a reader on an ordinary phone.

That balance is the renderer’s shipped result.

It is enough to support the site’s current scenes while leaving a clear path for later adapters and performance work.

That is a deliberately bounded result, and it is already useful.
