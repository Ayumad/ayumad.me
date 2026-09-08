---
title: G14 Controls
slug: g14-controls
summary: Native Omarchy controls for an ASUS G14, with readable hardware state and keyboard-friendly actions.
stage: deployed
status_note: Released · public source
year: 2026
stack: QML, Quickshell, Omarchy, asusd, asusctl
order: 3
source_url: https://github.com/Ayumad/omarchy-g14-controls
source_label: Source on GitHub
---

## Problem

The ASUS G14 exposes useful controls through a mix of system services and vendor utilities, but those controls are not always easy to discover from a minimalist Linux desktop. I wanted a small, native-feeling panel for the actions I use most often without turning the laptop into a dashboard full of unrelated telemetry.

## Approach

G14 Controls is a Quickshell/QML surface for Omarchy. It keeps power profiles, keyboard backlight and Aura behavior, Slash lighting, GPU mode, and MUX state in one compact control flow. The panel reads the state that the system exposes, presents a clear action label, and leaves the underlying asusd/asusctl services responsible for hardware changes.

## Architecture and workflow

The UI is split into state display, action dispatch, and setup guidance. A first-run wizard checks the expected service boundary and explains what must be installed before controls can work. Once configured, the panel is navigable with the keyboard as well as a pointer. The design deliberately avoids inventing a second hardware daemon: it calls the supported Linux interfaces and reports when a capability is unavailable.

## Important decisions

Keeping the project native to Omarchy matters more than having every possible vendor option. A smaller surface is easier to audit and less likely to fight the compositor. The privilege boundary is another deliberate choice: the panel can request a supported system action, but it does not bundle credentials or embed machine-specific network assumptions. Installation remains an explicit user decision, and the repository is MIT licensed.

## Current result

The released source is public in the [omarchy-g14-controls repository](https://github.com/Ayumad/omarchy-g14-controls). The documented controls include status and power behavior, Aura and Slash lighting, GPU/MUX switching, setup guidance, and keyboard navigation. Compatibility still depends on the laptop’s firmware and service versions, so the repository’s setup notes are the source of truth for a particular machine.

## Lessons

Hardware UI benefits from being boring in the best way: show current state, make one change, and confirm what happened. Reusing the operating system’s service boundary also makes failures legible. A control panel should not imply that an unsupported firmware capability is available just because a toggle can be drawn.

## Next steps

Future work is mostly compatibility polish, clearer recovery states, and small improvements to the setup flow. The released repository is usable now; these are follow-up improvements rather than hidden dependencies.

## Working detail

Each control is designed around a visible state transition. Power, lighting, and
GPU/MUX actions report the state exposed by the service and communicate when
firmware or a reboot may be involved. The setup wizard checks the expected
Omarchy and ASUS service surface, points to supported packages, and explains a
missing capability instead of shipping a second daemon.

The repository README remains the machine-specific setup reference. The
released article stays focused on the documented control surface; compatibility
polish, recovery states, and setup-flow improvements are follow-up work rather
than hidden dependencies.
