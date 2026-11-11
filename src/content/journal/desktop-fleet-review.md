---
title: My Desktop Fleet: What I Use and What I'd Change
slug: desktop-fleet-review
date: 2026-07-28
summary: I own five desktop PCs for gaming and self-hosting, and two are currently at a friend's house.
tags: Hardware, Desktops, Gaming
kind: article
status: published
---

I own five desktop PCs, and I've stopped trying to justify it. I use one every day, one lives under the TV as a Steam machine, one is a server that never turns off, and two are at a friend's house.

## The main one

Creekwood is the machine I'd keep if I could only keep one, with a Ryzen 7 5800X3D, RTX 5080 Founders Edition and 64 GB of DDR4. It has two 2 TB NVMe drives, a 4 TB SATA SSD, and 8 TB of HDD for stuff that doesn't need to be fast.

It's hooked up to a Samsung Odyssey OLED G8 at 4K, 240 Hz, which pushes the 5080 pretty hard. Most games run well with DLSS on, though path tracing in Cyberpunk is where it starts hiccuping. DLSS Quality plus lowering the path trace samples fixes most of it.

The CPU is the only real ceiling, and while the 5800X3D is the best AM4 has, the platform is old, with no DDR5 or PCIe 5.0. At 4K it barely matters, so I'm not rushing to AM5.

## Where everything lives

```text
  [ MAIN DESK ]        Creekwood          RTX 5080 / 4K OLED
  [ LIVING ROOM ]      SFF 9070 XT        Steam machine under the TV
  [ CLOSET ]           P520               Proxmox server, always on
  [ LENT OUT ]         12900K prebuilt    DDR5 spare
  [ LENT OUT ]         SFF 9060 XT        the budget SFF
```

## The one under the TV

The SFF under the TV is a Ryzen 5 5600 with a PowerColor RX 9070 XT Reaper in a KXRORS S300 case, running Bazzite. It's basically a console, with Steam on boot and a controller.

I picked the 9070 XT because it was the most powerful card that fit the case without costing FE 5080/5090 money. The 5600 holds it back in CPU-heavy games, which is why my first upgrade is a drop-in 5700X3D.

## The one that never turns off

The P520 is a ThinkStation workstation with a Xeon W-2135, 64 GB of ECC RAM and about 16.5 TB of raw storage in a ZFS pool. It runs Proxmox and everything self-hosted, including NAS, media and VMs.

The RTX 3060 in it is the best value part I own, with 12 GB of VRAM, CUDA and a low price. It's the always-on AI card, and it'll run the RAG assistant over my notes. As a gaming machine it'd be terrible, but as a server it's exactly right, and it's my only always-on infrastructure, so it matters more than any of the gaming rigs.

## The two I don't see

The Gigabyte prebuilt has an i9-12900K, RTX 4080 and 32 GB of DDR5, making it my only DDR5 system with the most powerful CPU I own, and it's lent out. When it comes back it's either a second high-end rig or I sell it while it still holds value, since Creekwood already does that job.

The other loaner is the budget SFF, with a Ryzen 5 3600 and a Gigabyte RX 9060 XT 16 GB that I got for $282.91 during an Amazon resale event. That's RDNA 4 with 16 GB of VRAM for less than most 8 GB cards go for used. The rest of the build is the weak half, but as a 1080p Bazzite box it's the right machine to lend out.

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

I have three high-end gaming machines, and two of them are sitting at a friend's house. That's redundant.

1. Put a 5700X3D in the living room SFF, the best upgrade per dollar I can do, and it takes 15 minutes.
2. Do the same for the budget SFF when it comes back, plus 32 GB of RAM, fixing both weak points for about $250.
3. Sell the 12900K prebuilt when it returns, while the resale window is still open, since Creekwood already covers that tier.
4. Leave the P520 alone. It's fine.
