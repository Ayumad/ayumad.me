---
title: Running Arch as a Daily Driver
slug: arch-daily-driver
date: 2025-11-04
summary: What it actually takes to use Arch Linux day-to-day — Hyprland, rolling releases, and the things that break vs. the things that just work.
tags: Arch Linux, Hyprland, Linux
kind: article
status: published
---

I run Arch-based systems on four machines now: a Framework 13, a Beelink SER8, a ThinkPad T480, and a Let's Note SV1. It started as a tinkering thing and turned into the default.

The distro is Omarchy — DHH's opinionated Arch-based setup with Hyprland on top. It's Arch under the hood with a good default config, which means I spend less time ricing and more time using.

## Why Arch, why Hyprland

Rolling releases mean I always have current packages, which matters when the hardware is new. The Framework 13 and the SER8 both have recent GPUs and kernel features that need a current kernel, and Arch has it the day it ships.

Hyprland is the tiling compositor. It's fast, configurable, and the defaults in Omarchy are sensible — workspaces, keybinds, a bar — without needing to be a hobby itself.

## What breaks

The honest answer: things break occasionally, and it's almost always a partial upgrade or a kernel update that needs a rebuild. The fix is usually `pacman -Syu` and a reboot.

The known pain points: DKMS modules after a kernel bump, Hyprland config changes between versions, and the occasional AUR package that needs a manual intervention. None of it is fatal. It's just not zero-maintenance.

1. Finish upgrades instead of postponing them indefinitely.
2. Read package news before changing three configuration files.
3. Check the kernel and module output after a reboot.

## What just works

The daily stuff is boring in the good way. The compositor starts, windows tile, the bar works, suspend and resume work, and the battery life on the Framework is fine.

The SER8 runs as an always-on box with Docker and a monitoring script. It's been up for months. The T480 is the travel laptop, and the Let's Note is the small one — all the same config, which is the whole point of using the same distro everywhere.

## The daily driver test

The real test is whether I reach for it when I don't have to. I do. Arch as a daily driver means accepting that occasionally you'll spend an evening fixing something — and deciding that's a fair trade for a system that's exactly how I want it.

If you want the same without the opinions, Omarchy is a good starting point. If you want zero maintenance, stay on something else. Both are legitimate.
