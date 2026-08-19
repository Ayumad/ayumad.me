---
title: Why I Moved Hermes to a Mac Mini
slug: hermes-on-mac-mini
date: 2026-07-22
summary: What changed when I moved one personal AI agent onto a small always-on server.
tags: Hermes, macOS, Tailscale
kind: article
status: published
---

Hermes used to live wherever I was working. Moving it onto one small always-on computer made the system easier to reason about.

The important change was not the hardware. It was giving memory, tools, and scheduled work one home instead of rebuilding them on every device.

## The trade

```text
  before       many machines, repeated setup, scattered context
  after        one backend, shared tools, several clients
```

Centralizing means one place to maintain. A skill or configuration change can be made once and used everywhere. The cost is a single point of failure and another device that needs updates.

The setup stays private to my devices, and I can reach it from the clients I already use. That is more useful to me than having a clever demo that only works from one laptop.

For a one-person system, the trade is worth it: a quiet box, a stable home for the agent, and less duplicated setup.
