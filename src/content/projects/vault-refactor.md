---
title: Vault Refactor
slug: vault-refactor
summary: A skills-first Obsidian vault refactor that makes canonical notes, history, and validation easier to maintain.
stage: in-progress
status_note: Personal system · active refactor
year: 2026
stack: Obsidian, Git, GitHub, Hermes
order: 2
---

## Problem

An archive can grow faster than its owner can understand it. The vault had active work, old experiments, operating instructions, and historical material mixed together. That made retrieval noisy and made it unclear which note should be updated when a project changed.

## Approach

The refactor treats the vault as a living system with explicit ownership. Canonical project notes describe the current state; dated session summaries preserve what changed and why; operational instructions explain how an agent should navigate the structure. Public-facing notes are selected deliberately rather than copied from private working logs.

## Architecture and workflow

The workflow starts with an audit, then repairs structure and plugin expectations, then validates links and frontmatter. Git provides history and a reversible trail for edits. Hermes can use the resulting structure, but it does not replace the vault’s canonical notes. A change is complete only when the note, its provenance, and the validation result agree.

The public website uses a curated projection of this system. It can borrow a project’s high-level problem, approach, and outcome without exposing local paths, credentials, private datasets, account information, or collaborator material. That separation lets the vault stay useful as a personal workspace while the site remains safe to publish.

## Important decisions

Canonical ownership matters more than folder cleverness. A note that says “this is the current state” is more valuable than a dozen unlabeled updates. The second decision is to preserve uncertainty: a roadmap item is not silently promoted to a shipped result because a related experiment exists.

## Current result

The vault’s core structure and instruction contracts are in place, with validation and repair work continuing. The public site now represents the refactor as an active project and links only to the safe, editorial outcome.

## Lessons

Knowledge management is an engineering discipline when agents depend on it. Clear boundaries, provenance, and tests reduce the cost of both human editing and automation.

## Next steps

Remaining work includes completing validation passes, tightening canonical note templates, and making the public projection easier to update without importing private context.

## Working detail

The refactor separates three kinds of truth. A canonical note answers “what is this and what is its current state?” A session summary answers “what changed during a particular working window?” An instruction file answers “how should a human or agent operate safely here?” Keeping those roles separate prevents a transient plan from overwriting a durable fact and prevents an automated summary from becoming the project’s only documentation.

Validation is intentionally structural before it is semantic. Frontmatter, duplicate titles, links, and governance errors can be checked consistently; judgment about whether a project is ready for public writing still belongs in an editorial pass. Git history provides a recovery path when an automated repair is too aggressive, and the public site consumes only the approved projection.

The result is less about a perfect folder tree than about a repeatable maintenance loop: audit, repair, validate, record provenance, then publish only what passes the privacy screen. That loop is what makes the vault useful to Hermes without making Hermes the owner of the vault.

The public projection is intentionally a separate publishing step. A project article may summarize a decision, link to a public journal entry, and state what is still private. It does not need to reproduce the note that inspired it. This keeps the vault’s useful detail available for personal retrieval while giving a reader a concise and privacy-safe account of the work.

The result is a system that can answer both “what changed?” and “what is safe to share?” without making either question depend on a remembered folder path. That is the practical definition of progress for this refactor.

It is also why the refactor belongs in the portfolio: the outcome is a maintainable publishing and retrieval boundary, not simply a rearranged set of folders.

Future automation can then operate against stable contracts instead of guessing which note or folder is current. That is the practical payoff of the work.

The refactor is active because those contracts are still being exercised and refined.

Each validation pass turns a little more of the vault’s implicit knowledge into something that can be safely reused.
