---
title: Hermes Agent
slug: hermes-agent
summary: A private operations agent for briefs, memory, scheduled work, and multi-model routing.
stage: in-progress
status_note: Operational privately · active development
year: 2026
stack: Hermes, Mnemosyne, Tailscale, OpenCode Go, Telegram
order: 1
featured: true
---

## Problem

AI tooling is easy to start and hard to keep coherent. Every device can become another chat window, another prompt history, and another place where a useful decision disappears. Hermes is an attempt to give daily operations one durable backend while keeping the interfaces lightweight and the private context under my control.

## Approach

Hermes runs on a headless Mac mini and exposes a small set of useful surfaces: a WebUI, Telegram, and clients connected through a private mesh. It combines morning briefs, interview preparation, session journals, scheduled automations, and persistent memory through Mnemosyne. Daily Brief is part of this article because it is a Hermes subsystem, not a separate product.

## Architecture and workflow

The workflow has three layers. Routines turn recurring needs into explicit jobs. Memory supplies relevant context when a task needs continuity. Model routing chooses an appropriate model for a routine, a complex reasoning step, or a fallback. The agent can write a session summary and schedule the next action, but the surrounding vault and account permissions remain the authority for what is private or allowed.

The useful design constraint is one backend with several clients. A phone can request a brief, a browser can inspect a result, and an automated job can close out a day without each surface building its own memory system. Jobs are designed to be observable and interruptible; a scheduled message is not treated as proof that every downstream action succeeded.

## Important decisions

Hermes is intentionally private infrastructure. The public article describes the shape of the system, not authentication details, network addresses, account names, or private prompts. It also distinguishes an operational routine from a roadmap idea. A capability is only called shipped when it has been exercised in the current setup; everything else stays a next step.

## Current result

Hermes is operational privately and actively changing. Briefs, memory, routing, Telegram/WebUI access, and scheduled workflows are the working center of gravity. There is no public hosted Hermes endpoint, and the site does not claim one.

## Lessons

The hard part of an agent is not adding another model. It is making context, permissions, and failure states legible enough that a human can trust the next action. A small routine that can be inspected beats an ambitious autonomous loop that cannot explain itself.

## Next steps

The next work is reliability: clearer job receipts, safer write boundaries, better evaluation of memory recall, and more deliberate handoffs between routine and complex models. Daily Brief improvements belong here as part of that system.

## Working detail

Hermes is most useful at the seams between routines. A morning brief can collect context, but a session journal needs to preserve what was actually decided. A memory lookup can find an old preference, but a write-back should still be deliberate. The system therefore treats each job as a small contract with inputs, tools, output, and a receipt. That makes it possible to inspect a failure without replaying an entire day.

The multi-model design is about economics and failure handling as much as capability. Routine work can use a light model, a difficult synthesis can request stronger reasoning, and a fallback can keep a tool-heavy task from stalling when a provider is unavailable. Routing is an explicit decision that can be tested, not a hidden prompt trick. The same principle applies to clients: Telegram and WebUI are surfaces for the backend, not independent sources of truth.

The private boundary is part of the product. Hermes can be connected to a personal vault because the vault’s visibility and write rules are explicit. A public description can explain that shape without exposing a token, host address, account identifier, or private prompt. That is the standard future integrations must meet.

The agent is also an exercise in choosing where not to automate. A routine can prepare a brief or collect a session note, but a sensitive change should still have a human-visible confirmation. A memory system can suggest context, but the canonical vault note remains the place where a durable fact is edited. Those boundaries make the system slower in a few moments and more dependable over a long week.

That is the standard I use for calling a Hermes routine operational: it has a repeatable trigger, an observable result, and a known place to inspect or correct the output.
