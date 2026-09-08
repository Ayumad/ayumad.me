---
title: Vault Refactor
slug: vault-refactor
summary: A skills-first Obsidian vault refactor that makes canonical notes, history, and validation easier to maintain.
stage: in-progress
status_note: Personal system · active refactor
year: 2026
stack: Obsidian, Git, GitHub, Hermes
order: 5
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

The refactor separates three kinds of truth: canonical notes describe current
state, session summaries preserve what changed, and instruction files define
safe operation. Structural checks cover frontmatter, duplicate titles, links,
and governance; deciding whether a project is ready for public writing remains
an editorial review.

The maintenance loop is audit, repair, validate, record provenance, then
publish only the approved projection. Future automation can work against those
stable contracts, while the public site summarizes outcomes without importing
private notes. The contracts are still being exercised, so the project remains
active.
