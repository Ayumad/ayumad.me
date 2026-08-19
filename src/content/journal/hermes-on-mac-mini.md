---
title: Why I Moved Hermes to a Mac Mini
slug: hermes-on-mac-mini
date: 2026-07-22
summary: Running one AI agent server instead of rebuilding on every device. The tradeoffs of headless macOS, Tailscale mesh, and always-on automation.
tags: Hermes, macOS, Tailscale
kind: article
status: published
---

Hermes used to live wherever I was working. Then I moved it to a Mac mini that never turns off, and everything got simpler.

The pitch was one always-on agent server instead of rebuilding context and skills on every machine. One home for the memory, the scheduled work, and the tools.

## The setup

A Mac mini on my desk at home, headless and joined to the Tailscale mesh. The web interface is managed by the operating system so it survives reboots, and I reach it from my phone through the same private network. Same URL, same agent, same memory.

It runs the daily loop: morning brief, interview prep, session journal, task dispatch, and memory consolidation. All of that used to be split across whatever machine was on at the time.

```text
  MANY DEVICES                    ONE BACKEND
  scattered context      →        Mac mini
  repeated setup          →        shared tools
  manual routines         →        scheduled work
                                  ↘ several clients
```

## Why headless macOS

macOS as the base means everything just works — no driver fights, sane power management, and it's a Unix under the hood so the tooling is familiar. Headless means I never think about a screen on it. SSH in, or use the web interface.

The tradeoff is that it's another always-on box. It draws power, it needs updates, and if it dies, the whole daily loop goes with it. That's the cost of centralizing.

## What it runs

- A web interface for the chat surface, managed as a background service.
- Scheduled briefs, prompts, interview prep, journal, and task dispatch.
- Mnemosyne, a local memory store with its own database and embeddings.
- Task synchronization so the same work is visible from the tools I already use.
- A phone client that reaches the same agent over the private mesh.

## The tradeoffs

Centralizing means one place to maintain instead of five. If I add a skill or change a scheduled routine, it's one edit, and it's everywhere. The downside is a single point of failure — no redundancy, and if the mesh is down, I'm down.

For a one-person setup, that trade is worth it. The Mac mini is quiet, small, and draws less than the alternative of running agents on every device I own.
