---
title: Obsidian RAG Assistant
slug: rag-assistant
summary: A planned private retrieval assistant for asking grounded questions about an Obsidian vault.
stage: in-progress
status_note: Not deployed · architecture in progress
year: 2026
stack: Python, Ollama, ChromaDB, Embeddings, Obsidian
order: 4
---

## Problem

The vault contains decisions, build logs, and project context that are useful only when they can be found. Keyword search is a good first tool, but it cannot always connect a current question to the right older note. A retrieval-augmented assistant could make those connections while keeping the source vault private.

## Approach

The project is being designed as a private, read-first system. A future pipeline would parse approved notes, create embeddings, retrieve relevant passages, and ask a local model to answer with source context. Ollama, ChromaDB, and an RTX 3060 are the current architectural reference points, not evidence that a public service exists.

## Architecture and workflow

The intended flow is ingestion, chunking, embedding, vector retrieval, model serving, and a small end-user interface. Each stage needs a clear contract: which notes are eligible, how updates are detected, what metadata travels with a chunk, and how an answer cites its sources. Read-only retrieval comes before any write-back capability so an incorrect answer cannot silently alter the canonical vault.

## Important decisions

Privacy is the primary constraint. Credentials, personal datasets, account information, and private operational details should never become a default corpus. The system also needs an explicit distinction between a retrieved fact, a model inference, and an unanswered question. Those requirements make the project slower than a demo, but more useful as infrastructure.

## Current result

Architecture and infrastructure work are underway. The vault has been migrated and its contracts are documented, but indexing, model serving, vector storage, and the end-user interface are **not deployed**. There is no public RAG endpoint, and this article does not imply one.

## Lessons

Retrieval quality starts with corpus boundaries and note ownership, not with a larger model. If the source set is noisy or stale, a fluent answer only hides the problem.

## Next steps

The next milestones are a privacy-safe indexing prototype, evaluation fixtures, local model serving, vector-store wiring, and a minimal read-only interface. Each milestone will be validated separately before the next one is treated as complete.

## Working detail

The first useful prototype is a repeatable corpus build that records which notes
were admitted, when they were indexed, how chunks were formed, and what
metadata was retained. Evaluation will start with known-answer questions:
retrieval should return the canonical note and enough context to resolve
ambiguity, while the model cites that context or says when evidence is missing.

The eventual read-only interface should make provenance visible by linking
supporting notes, showing the index build time, and making mismatches easy to
report. Ollama, ChromaDB, and the RTX 3060 remain architectural inputs until
the indexing pipeline, local model serving, vector storage, and interface have
been exercised together. That end-to-end validation is the bar for changing
the project’s lifecycle badge.
