---
title: Rating My Desktop Fleet
slug: desktop-fleet-review
date: 2026-07-28
summary: I have five desktop PCs. Here's what each one is for, how good it actually is, and what I'd change.
tags: Hardware, Desktops, Gaming
kind: article
status: published
---

I own five desktop PCs. That sounds like a lot, but they all do different things, and honestly I've stopped trying to justify it.

One is the machine I actually use every day. One lives under the TV as a Steam machine. One is a server that never turns off. Two are at a friend's house right now. Here's what each one is for, how good it actually is, and what I'd change.

## The main one

Creekwood is the machine I'd keep if I could only keep one. Ryzen 7 5800X3D, RTX 5080 Founders Edition, 64 GB of DDR4. Storage is good: two 2 TB NVMe drives, a 4 TB SATA SSD, and 8 TB of HDD for stuff that doesn't need to be fast.

It's hooked up to a Samsung Odyssey OLED G8 — 4K, 240 Hz. That pushes the 5080 pretty hard. Most games run well with DLSS on. Path tracing in Cyberpunk is where it starts hiccuping, but that's just what 4K path tracing costs on any GPU right now. DLSS Quality plus lowering the path trace samples fixes most of it.

The CPU is the only real ceiling. The 5800X3D is the best AM4 has, but AM4 is old — no DDR5, no PCIe 5.0. At 4K it barely matters, so I'm not rushing to AM5.

## Where everything lives

```text
  [ MAIN DESK ]        Creekwood          RTX 5080 / 4K OLED
  [ LIVING ROOM ]      SFF 9070 XT        Steam machine under the TV
  [ CLOSET ]           P520               Proxmox server, always on
  [ LENT OUT ]         12900K prebuilt    DDR5 spare
  [ LENT OUT ]         SFF 9060 XT        the budget SFF
```

## The one under the TV

The SFF under the TV is a Ryzen 5 5600 with a PowerColor RX 9070 XT Reaper in a KXRORS S300 case, running Bazzite. It's basically a console. Steam on boot, controller, done.

I picked the 9070 XT because it was the most powerful card that fit the case without costing FE 5080/5090 money. That was the whole point — max GPU within the size limit. The 5600 is the weak link though. It holds the 9070 XT back in CPU-heavy games, which is why my first upgrade is a drop-in 5700X3D. Cheap and easy.

## The one that never turns off

The P520 is a ThinkStation workstation: Xeon W-2135, 64 GB of ECC RAM, about 16.5 TB of raw storage in a ZFS pool. It runs Proxmox and everything self-hosted — NAS, media, VMs.

The RTX 3060 in it is the best value part I own. 12 GB of VRAM, CUDA, and cheap. It's the always-on AI card and it'll run the RAG assistant over my notes. As a gaming machine it'd be terrible. As a server it's exactly right, and it's the only always-on infrastructure I have, so it matters more than any of the gaming rigs.

## The two I don't see

The Gigabyte prebuilt — i9-12900K, RTX 4080, 32 GB DDR5 — is my only DDR5 system and the most powerful CPU I own, and it's lent out. When it comes back it's either a second high-end rig or I sell it while it still holds value. Creekwood already does that job.

The other loaner is the budget SFF: Ryzen 5 3600 with a Gigabyte RX 9060 XT 16 GB that I got for $282.91 during an Amazon resale event. That GPU is a steal — RDNA 4 with 16 GB of VRAM for less than most 8 GB cards go for used. The rest of the build is the weak half, but as a 1080p Bazzite box it's perfect. It's the right machine to lend out.

## How they rate

```text
  BUILD RATINGS, OUT OF 10
  ─────────────────────────────
  Creekwood         ██████████░░  8/10
  12900K prebuilt   ██████████░░  8/10
  SFF 9070 XT       █████████░░░  7/10
  SFF 9060 XT       ██████░░░░░░  6/10
  P520 (as server)  ██████████░░  8/10

  IMPORTANCE TO ME
  ─────────────────────────────
  P520              9/10   always-on infrastructure
  Creekwood         9/10   the main machine
  SFF 9070 XT       8/10   daily living-room gaming
  12900K prebuilt   6/10   great, but redundant
  SFF 9060 XT       5/10   the loaner
```

## What I'd actually change

Honestly? I have three high-end gaming machines and two of them are just sitting at a friend's house. That's redundant. If I was smarter with my money:

1. 5700X3D in the living room SFF. Best upgrade per dollar I can do, and it takes 15 minutes.
2. Same for the budget SFF when it comes back, plus 32 GB of RAM. Fixes both weak points for about $250.
3. Sell the 12900K prebuilt when it returns. The resale window is now, and Creekwood already covers that tier.
4. Leave the P520 alone. It's fine.

## Bottom line

Every machine has a job and none of them overlap. The main rig games at 4K. The SFF is the console under the TV. The P520 keeps everything running. The two loaners are backups and goodwill.

I'd own fewer if I could do it over, but the ones I'd keep are the ones doing the most important work.
