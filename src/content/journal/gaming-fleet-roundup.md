---
title: Gaming Across My Fleet
slug: gaming-fleet-roundup
date: 2026-09-08
summary: Twelve machines that play games. Same games, published benchmark numbers, so I actually know which one to grab.
tags: Hardware, Gaming, Benchmarks
kind: article
status: published
---

I own twelve machines that can play games. Only three were bought as gaming machines — the rest just ended up that way. Since they overlap more than they should, I pulled together published benchmark numbers from Notebookcheck, TechSpot, GamersNexus, Tom's Hardware, and a few smaller review sites, and figured out where everything actually stands. The full cited breakdown lives in my vault; this is the readable version.

Here's the whole fleet on one scale. Creekwood is 100, everything else is a percentage of it:

```text
Creekwood (RTX 5080)         █████████████████████ 100
RX 9070 XT SFF               ████████████████████   85
RTX 4080 desktop             ███████████████████    84
Alienware m16                █████████████████      70
Zephyrus G14                 ████████████████       68
RX 9060 XT SFF               ████████████           52
ROG Flow Z13                 ███████████            48
Vivobook Pro 15              ██████████             44
Razer Blade Stealth 13       ██████                 28
ROG Ally                     ██████                 26
Steam Deck OLED              ███                    15
Retroid Nova                 █                      streaming box
```

The ranked table, with the resolution each machine targets and the framerate it holds there:

| Machine | GPU | Rel. speed | Resolution / target fps |
| --- | --- | --- | --- |
| [Creekwood](/gear/computers-creekwood) | RTX 5080 | 100 | 4K 240 Hz |
| [SFF 9070 XT](/gear/computers-sff-pc-ryzen-5-5600-radeon-rx-9070-xt) | RX 9070 XT | 85 | 4K 60 Hz · Sony Bravia |
| [12900K RTX 4080 desktop](/gear/computers-desktop-pc-core-i9-12900k-geforce-rtx-4080) | RTX 4080 | 84 | 1440p 165+ Hz |
| [Alienware m16](/gear/computers-dell-alienware-m16-ryzen-9-geforce-rtx-4080) | RTX 4080 175 W | 70 | 1600p 240 Hz / 1080p esports |
| [Zephyrus G14](/gear/computers-asus-rog-zephyrus-g14) | RTX 5070 Ti 110 W | 68 | 2.8K 120 Hz |
| [SFF 9060 XT](/gear/computers-sff-pc-ryzen-5-3600-radeon-rx-9060-xt) | RX 9060 XT 16 GB | 52 | 1080p 60–100 Hz |
| [ROG Flow Z13](/gear/computers-asus-rog-flow-z13-2025) | Radeon 8060S iGPU | 48 | 1600p 180 Hz / 1080p esports |
| [Vivobook Pro 15](/gear/computers-asus-vivobook-pro-15-oled-rtx-4050) | RTX 4050 | 44 | 2.8K 120 Hz |
| [Razer Blade Stealth 13](/gear/computers-razer-blade-stealth-13) | GTX 1650 Ti Max-Q | 28 | 1080p 120 Hz |
| [ROG Ally](/gear/gaming-asus-rog-ally) | Z1 Extreme | 26 | 1080p 120 Hz |
| [Steam Deck OLED](/gear/gaming-valve-steam-deck-oled) | custom RDNA 2 | 15 | 800p 90 Hz |
| [Retroid Nova](/gear/gaming-retroid-pocket-nova) *(on order)* | Android SoC | n/a | ~720p / 1080p stream |

## What if the top of the list was a 5090

I don't own one, but the numbers are public, so here's the same fleet re-based to a maxed 5090 build instead of Creekwood. Tom's Hardware's 2026 hierarchy puts the 5090 at 100 and the 5080 at 69.8 at 4K raster, which puts the 5090 build at ~143 on the scale above. Flip the baseline:

```text
RTX 5090 build (hypothetical)  ████████████████████ 100
Creekwood (RTX 5080)           ██████████████       70
RX 9070 XT SFF                 ████████████         59
RTX 4080 desktop               ████████████         59
Alienware m16                  ██████████           49
Zephyrus G14                   █████████            47
RX 9060 XT SFF                 ███████              36
ROG Flow Z13                   ███████              34
Vivobook Pro 15                ██████               31
Razer Blade Stealth 13         ████                 20
ROG Ally                       ████                 18
Steam Deck OLED                ██                   10
Retroid Nova                   █                     streaming box
```

That's a 43% jump over the 5080 at 4K — the biggest single gap in the whole list, bigger than the 5080-to-9070 XT spread. It only pays off with a matching CPU, though. Put a 5090 behind the 5800X3D and it just sits there bored in esports titles.

## The four desktops

Creekwood is the fastest thing I own and it's not close. RTX 5080 Founders Edition with a Ryzen 7 5800X3D, hooked to the 4K 240 Hz Odyssey OLED G8. Tom's Hardware's 31-game suite puts it at 81.9% of an RTX 4090 at 1080p, 76.7% at 1440p, 69.8% at 4K. That translates to: max settings, always, with DLSS reserved for path-traced Cyberpunk and games that are rude about it. It's the reference point for every other machine in this list.

The 12900K / RTX 4080 desktop is Creekwood-lite. TechSpot's Cyberpunk 2077 run on the 4080 averages 128 fps at 1440p. When it's home it sits basically even with the 9070 XT build — within a few percent across a whole suite.

The [SFF 9070 XT](/gear/computers-sff-pc-ryzen-5-5600-radeon-rx-9070-xt) is the living-room Steam machine: Ryzen 5 5600 and a PowerColor 9070 XT in a KXRORS S300 case, Bazzite, under the Sony Bravia, controller in the coffee table drawer. The numbers here are the fun ones. Clair Obscur: Expedition 33 runs 64 fps at 1440p on the Epic preset. Red Dead Redemption 2 does 83 fps at 4K Ultra. Forza Horizon 5 clears 200 fps at 1440p. The 5600 is the weak link — it holds the GPU back in high-FPS games, same story as Creekwood's AM4 platform. The GPU runs ahead of the CPU and that's the upgrade path.

The [SFF 9060 XT](/gear/computers-sff-pc-ryzen-5-3600-radeon-rx-9060-xt) is an RX 9060 XT 16 GB with a Ryzen 5 3600, in an NCASE M1. It's a 1080p box — 98 fps average across Tom's suite at 1080p — but the 16 GB of VRAM is why it stays worth owning. Textures last longer than the GPU does.

## The two laptops

The [Alienware m16](/gear/computers-dell-alienware-m16-ryzen-9-geforce-rtx-4080) is the big-screen option: RTX 4080 at 175 W, Ryzen 9 7845HX, 2560×1600 at 240 Hz. Notebookcheck's numbers say Cyberpunk 2077 runs 128 fps at 1080p ultra and 84.5 fps at QHD native. I bought it secondhand for $600 and replaced a motherboard fan, and it runs hot — it's a desk machine, not a lap machine. I grab it when I want a bigger screen than the G14.

The [Zephyrus G14](/gear/computers-asus-rog-zephyrus-g14) is my main portable. RTX 5070 Ti at 110 W, which is a real cap — the chip wants more but the case is thin. It still manages 170 fps in CS2 at its native 2.8K resolution, and path-traced Cyberpunk hits 100+ fps with DLSS 4 frame generation, which the m16 can't do. Raw raster goes to the m16 by about 15–20%. Everything with DLSS 4 goes to the G14.

## Tablets, handhelds, and the leftovers

The [ROG Flow Z13](/gear/computers-asus-rog-flow-z13-2025) is a tablet with a 16-core Strix Halo chip in it. The iGPU is Radeon 8060S, roughly an RTX 4060 laptop, and the CPU is the fastest in my whole fleet. Result: Cyberpunk 2077 at 75.6 fps on 1080p ultra, and CS2 at 384 fps on 1080p low — the framerates are a CPU flex more than a GPU flex. It docks to the TV via USB4 and disappears behind it.

The [Steam Deck OLED](/gear/gaming-valve-steam-deck-oled) is an 800p machine and it knows it. GamersNexus measured RDR2 at 53 fps, Cyberpunk at 44.6 fps with FSR, Baldur's Gate 3 at 23.9 fps — all at its native resolution. The catch: Valorant and Fortnite don't run on it at all. Kernel-level anti-cheat doesn't do Linux. That's the gap the Ally exists for.

The [ROG Ally](/gear/gaming-asus-rog-ally) is the Windows handheld: Z1 Extreme, 1080p at 120 Hz. It does the esports thing properly — around 162 fps in Valorant, 118 in CS2, 109 in Rocket League at 1080p with tuned settings. Demanding AAA drops it to 720–900p territory. It's technically redundant next to the Deck, so it's on the sell list, but on the days a Windows-only game exists, it's the one.

The [Retroid Nova](/gear/gaming-retroid-pocket-nova) is on order and there are no published benchmarks for it anywhere, which is fine — it's a Pokémon ROM hack machine and a Moonlight streaming screen for the real gaming hardware. It doesn't need to be fast; it needs to be comfortable.

The [Vivobook Pro 15](/gear/computers-asus-vivobook-pro-15-oled-rtx-4050) has an RTX 4050 and an OLED panel. As a 1080p box it's solid: CS2 at 127 fps on medium, Cyberpunk at 60+ on ultra, per the 4050's class.

The [Razer Blade Stealth 13](/gear/computers-razer-blade-stealth-13) is the oldest gamer here: GTX 1650 Ti Max-Q, four cores of Tiger Lake. Cyberpunk 2077 at 63 fps on 1080p low. Rocket League and Fortnite at comfortable framerates on medium. It plays its role — a small Windows laptop for light games — and it doesn't pretend to do more.

## Which one do I actually grab

| Situation | Machine |
| --- | --- |
| Desk, max settings, big screen | Creekwood |
| Couch, TV, controller | SFF 9070 XT |
| Travel, OLED, portable | Zephyrus G14 |
| Bigger laptop screen | Alienware m16 |
| Couch, handheld, SteamOS | Steam Deck OLED |
| Windows-only or esports handheld | ROG Ally |
| Tabletop or docked | ROG Flow Z13 |

A couple of honest gaps: Rocket League and Valorant don't have lab-published numbers for the desktop tier — they're so CPU-bound that review sites skip them — and TechPowerUp blocks bots, so the 5080's per-game table is still riding on the aggregate suite. The numbers that exist are all linked below.

Sources: [Tom's Hardware GPU hierarchy](https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html) · [TechSpot 9070 XT vs 5070](https://www.techspot.com/review/3168-geforce-rtx-5070-vs-radeon-rx-9070-xt/) · [TechSpot RTX 4080 review](https://www.techspot.com/review/2569-nvidia-geforce-rtx-4080/) · [GamersNexus Steam Deck OLED](https://gamersnexus.net/handheld-pcs/valve-goes-hard-steam-deck-oled-review-benchmarks-vs-asus-rog-ally-z1-extreme-deck-lcd) · [Notebookcheck m16 review](https://www.notebookcheck.net/AMD-Ryzen-9-7845HX-performance-debut-Alienware-m16-R1-laptop-review.742228.0.html) · [Notebookcheck G14 2025](https://www.notebookcheck.net/RTX-5070-Ti-laptop-GPU-almost-as-fast-as-RTX-5080-laptop-GPU-Asus-ROG-Zephyrus-G14-2025-review.1030284.0.html) · [Notebookcheck Flow Z13](https://www.notebookcheck.net/Asus-ROG-Flow-Z13-GZ302EA-Convertible-Review-AMD-s-Strix-Halo-GPU-is-neck-and-neck-with-the-RTX-4070-Laptop.963266.0.html) · [ultrabookreview G14](https://www.ultrabookreview.com/71435-asus-rog-zephyrus-g14-2025-review/) · [LaptopMedia G14](https://laptopmedia.com/gb/review/asus-rog-zephyrus-g14-ga403-ryzen-ai-300-review-rtx-5070-ti-oled-and-true-portability/) · [LaptopMedia Flow Z13](https://laptopmedia.com/review/asus-rog-flow-z13-gz302-review-the-radeon-8060s-challenges-the-rtx-4060/) · [PCWorld ROG Ally](https://d33gy59ovltp76.cloudfront.net/news/asus-rog-ally-review-z1-extreme-lighter-and-brighter) · [Notebookcheck GTX 1650 Ti Max-Q](https://www.notebookcheck.net/NVIDIA-GeForce-GTX-1650-Ti-Max-Q-GPU-Benchmarks-and-Specs.459210.0.html) · [Notebookcheck Nitro V 15 (RTX 4050)](https://www.notebookcheck.net/Acer-Nitro-V-15-ANV15-51-review-Budget-gaming-laptop-with-RTX-4050.794098.0.html)

Now I know the numbers, so the next game I buy gets matched to the right machine instead of whichever is closest.