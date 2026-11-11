---
title: Arch as a Daily Driver: Omarchy on Four Machines
slug: arch-daily-driver
date: 2025-11-04
summary: I use Omarchy on four machines for current packages and a shared Hyprland config, with occasional upgrade and kernel fixes.
tags: Arch Linux, Hyprland, Linux
kind: article
status: published
---

I run Arch-based systems on four machines now: a Framework 13, a Beelink SER8, a ThinkPad T480, and a Let's Note SV1. It started as tinkering and became the default.

The distro is Omarchy, DHH's opinionated Arch-based setup with Hyprland on top. Its default config means I spend less time ricing and more time using it.

## Current Packages and Hyprland

Rolling releases keep my packages current, which matters when the hardware is new. The Framework 13 and SER8 both have recent GPUs and kernel features that need a current kernel, and Arch has it the day it ships.

Hyprland is the tiling compositor, and it's fast and configurable. Omarchy's defaults give me workspaces, keybinds, and a bar without needing to be a hobby itself.

## Updates and Repairs

Things break occasionally, and it's almost always a partial upgrade or a kernel update that needs a rebuild. The fix is usually `pacman -Syu` and a reboot.

The pain points are DKMS modules after a kernel bump, Hyprland config changes between versions, and the occasional AUR package that needs manual intervention. None of it is fatal, but it isn't zero-maintenance.

1. Finish upgrades instead of postponing them indefinitely.
2. Read package news before changing three configuration files.
3. Check the kernel and module output after a reboot.

I reach for it even when I don't have to. Occasionally spending an evening fixing something is a fair trade for a system that's exactly how I want it.

## Daily Use

The compositor starts, windows tile, the bar works, and suspend and resume work. Battery life on the Framework is fine.

The T480 is my travel laptop, the Let's Note is the small one, and all four machines use the same config. The SER8 runs as an always-on box with Docker and a monitoring script, and it's been up for months.

If you want the same without the opinions, Omarchy is a good starting point. If you want zero maintenance, stay on something else.
