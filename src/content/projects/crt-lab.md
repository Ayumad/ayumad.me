---
title: CRT Lab
slug: crt-lab
summary: A local-first signal workstation for routing patterns, media, web pages, and emulation through an adjustable CRT display.
stage: deployed
status_note: Live V1 · active development
year: 2026
stack: Signal processing, Browser media, EmulatorJS, Local-first
order: 1
featured: true
live_url: https://crt-lab-xi.vercel.app/
live_label: Live V1
---

## Problem

Modern screens make it easy to view an image, but difficult to understand the signal underneath it. I wanted one place to compare generated patterns, photos, video, audio, browser pages, and emulation on a display that behaves like a real instrument. The project also needed to respect the source material: media should stay in the browser instead of being uploaded to a service.

## Approach

CRT Lab treats every input as a source bay. The current V1 exposes six bays for signals, images, video, audio, browser content, and emulation. Each bay feeds the same display pipeline, so the controls feel consistent whether the input is a calibration grid or a user-owned ROM. The interface keeps the source selection visible and reports errors at the point where they occur rather than hiding them behind a generic loading state.

## Architecture and workflow

The display is built as a small signal graph: source adapters produce frames or samples, a renderer applies geometry and phosphor behavior, and the presentation layer draws CRT or oscilloscope views. Presets bundle scanlines, bloom, curvature, tint, and geometry so a useful look can be recalled without re-tuning every slider. Aspect-ratio locking and fullscreen playback protect the relationship between the source and the simulated tube.

Browser media is deliberately treated as an unreliable boundary. Cross-origin rules, codec support, and autoplay policies are surfaced as constraints. Drag-and-drop, keyboard controls, and gamepad input provide alternate paths through the same workflow. Presets are stored locally, and source media is not sent to a remote upload endpoint.

## Important decisions

The most important choice was to keep the lab local-first. That makes privacy the default and lets the tool remain useful while offline, but it also means browser APIs and user hardware determine what can be displayed. A second decision was to build around a few understandable source adapters instead of a large plugin marketplace. This keeps the signal path inspectable and makes calibration bugs easier to reproduce.

## Current result

The public V1 is live at [crt-lab-xi.vercel.app](https://crt-lab-xi.vercel.app/). CRT and oscilloscope views, display presets, live geometry controls, search-first browser input, and the core source bays are working. Calibration and browser milestones are complete; emulator quality assurance, a broader preset library, and capture/documentation work remain active development.

## Lessons

Simulation feels better when it explains its compromises. A clear “this browser source cannot be sampled” message is more useful than pretending every URL is equivalent. The other lesson is that visual tools need a stable baseline: once a signal path is deterministic, style presets become experimentation instead of guesswork.

## Next steps

The next pass will improve emulator QA, add more documented presets, and make capture workflows easier to understand. Those are roadmap items, not claims about the shipped V1.

## Working detail

The source-bay model is also a testing strategy. A generated pattern can exercise geometry without involving a codec; a local image can test scaling and color; a browser source can test the security and timing boundary; and an emulator can test sustained frame delivery. When a change crosses those boundaries, the failure usually tells me which adapter or presentation layer needs attention.

The display presets are intentionally descriptive rather than nostalgic labels. A preset records the visible behavior—scanline density, bloom, curvature, tint, and geometry—so two people can discuss what changed. That makes the lab useful for calibration and design work, not just for producing a “retro” screenshot. The same discipline keeps the oscilloscope view honest: it is a different presentation of a signal, not a claim that the browser has become test equipment.

Local-first does introduce practical limits. Browser security can prevent sampling a remote page, and a user’s codec support may decide whether a video plays. Those are product constraints worth documenting because the tool is meant to help someone understand a signal, not hide the conditions under which it was generated.

The editorial layer follows the same rule. A case study can describe a completed calibration milestone and then name emulator QA as the next step. It should not collapse those into a single “fully supported” claim. That distinction keeps the public page useful to someone deciding whether to try the live V1 and keeps the roadmap honest for the next iteration.
