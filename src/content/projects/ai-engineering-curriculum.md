---
title: AI Engineering Curriculum
slug: ai-engineering-curriculum
summary: A source-checked, practical map from language-model fundamentals to reliable agent systems.
stage: deployed
status_note: Public curriculum · continuously updated
year: 2026
stack: Markdown, Obsidian, LLMs, Inference, Agents, Reliability
order: 2
live_url: /ai/
live_label: Read curriculum
source_url: https://github.com/Ayumad/AI-Engineering-Curriculum
source_label: Source on GitHub
---

## Problem

AI engineering is often presented as a sequence of disconnected tutorials. That makes it hard to tell which concepts are foundational, which tools are interchangeable, and which operational concerns only appear after a prototype is already in production. I wanted a curriculum that behaves like a map: each topic should explain what it enables, what it depends on, and where the sharp edges are.

## Approach

The curriculum is organized into twelve progressive sections, moving from language-model and inference fundamentals through agents, retrieval, evaluation, reliability, and operations. Every section is written as a set of small Markdown notes rather than a single linear textbook. That makes it readable in Obsidian, searchable from the public mirror, and easy to revise when a model or library changes.

Source checking is part of the writing workflow. Claims are tied back to papers, official documentation, or a clearly marked practical interpretation. A tool recommendation is kept separate from a durable concept so the structure survives a change in vendors. Examples are intentionally concrete, but they avoid pretending that a code snippet is a complete production architecture.

## Architecture and workflow

The source repository is the canonical editing surface. A build step produces the public `/ai/` reading experience, with navigation that lets a reader move between prerequisites, applied patterns, and operational follow-through. The public mirror is an encrypted static application; the encryption protects the published presentation, not a promise that private vault material is included. The site only exposes the curated curriculum content.

## Important decisions

The curriculum favors decision points over product catalogs. For example, retrieval is explained as a set of indexing and evaluation choices before a specific vector database is introduced. Likewise, agents are described through tools, state, permissions, and failure handling rather than through one framework’s API. This keeps the material useful to someone building locally, in a hosted environment, or with a different model provider.

## Current result

The public curriculum is live at [/ai/](/ai/) and the source is available in the [AI-Engineering-Curriculum repository](https://github.com/Ayumad/AI-Engineering-Curriculum). The foundational and applied sections are published, with ongoing edits adding examples and tightening citations. New material is still editorial work; it should not be read as a claim that every technique has been deployed in a production system.

## Lessons

An explicit information architecture is a technical feature. It prevents a reader from confusing “interesting” with “required,” and it makes maintenance possible when the surrounding ecosystem moves quickly. The other lesson is to mark uncertainty: a useful curriculum shows where evidence ends and a local experiment begins.

## Next steps

Future revisions will add more evaluation recipes, operational checklists, and cross-links between the curriculum and relevant build notes. The public source remains the best place to follow those changes.

## Working detail

The twelve-section shape is intentionally not a promise that every reader should move at one speed. A practitioner can enter through inference or retrieval, follow the links back to prerequisites, and then jump forward to evaluation or operations once a prototype exists. Each section has a “why this exists” question, a vocabulary boundary, and a short list of failure modes. That editorial scaffolding is what turns a pile of notes into a usable curriculum.

Examples are written to reveal interfaces. A retrieval example names the corpus and the evaluation question before discussing a vector store. An agent example names the tools and write boundary before discussing orchestration. An operations example names the receipt or metric that would prove a routine ran. These patterns are intentionally portable across providers and local deployments.

The public mirror is a presentation layer, not a dump of the Obsidian vault. The source repository and the published app contain only the curated curriculum. Personal project notes may inform an example, but private context is not silently folded into a lesson. That separation is part of the curriculum’s reliability story: readers should know which statements are general evidence and which are local observations.

The writing process benefits from the same status discipline used on the portfolio. A published section has a stable reading path and checked sources; a draft idea stays a draft until its evidence and examples are ready. When a library changes, the durable concept can remain while the implementation note is revised. That is a small but important defense against a curriculum becoming a time capsule of yesterday’s API.
