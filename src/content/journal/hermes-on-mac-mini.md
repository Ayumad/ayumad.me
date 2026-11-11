---
title: Hermes on a Mac Mini: Headless macOS and Always-On Automation
slug: hermes-on-mac-mini
date: 2026-07-22
summary: I moved Hermes to an always-on Mac mini to keep context, skills, and scheduled work in one place.
tags: Hermes, macOS, Tailscale
kind: article
status: published
---

Hermes used to live wherever I was working, then I moved it to a Mac mini that never turns off. It gave me one home for memory, scheduled work, and tools instead of rebuilding context and skills on every machine.

## The setup

The Mac mini sits on my desk at home, headless and joined to the Tailscale mesh. The operating system manages the web interface so it survives reboots, and I reach it from my phone through the same private network.

```text
  MANY DEVICES                    ONE BACKEND
  scattered context      →        Mac mini
  repeated setup          →        shared tools
  manual routines         →        scheduled work
                                  ↘ several clients
```

## Why headless macOS

With macOS, I don't have driver fights, power management works, and the Unix tooling is familiar. I never think about a screen on it, I SSH in or use the web interface.

## What it runs

It runs the morning brief, prompts, interview prep, session journal, task dispatch, and memory consolidation, which used to be split across whatever machine was on. Mnemosyne stores memory locally with its own database and embeddings, and task synchronization keeps the same work visible in the tools I already use.

## The tradeoffs

I've got one place to maintain instead of five, and adding a skill or changing a scheduled routine takes one edit. For a one-person setup, that trade is worth it. The Mac mini is quiet, small, and draws less power than running agents on every device I own.

It still needs updates, and if it dies, the whole daily loop goes with it. There's no redundancy, and if the mesh is down, I'm down.
