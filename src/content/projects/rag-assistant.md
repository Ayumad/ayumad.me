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

The first useful prototype is not a chat box. It is a repeatable corpus build that can answer which notes were admitted, when they were indexed, how chunks were formed, and what metadata came along for retrieval. Without that record, a plausible answer cannot be distinguished from a stale embedding or an accidental private document.

Evaluation will start with a small set of questions whose answers are already known. Retrieval should return the canonical note and enough surrounding context to resolve ambiguity; the model should cite that context and say when evidence is missing. Only after those checks work locally does a vector store become useful infrastructure. The end-user interface can remain read-only until permissions and source links are trustworthy.

The project is intentionally described as in progress even though several building blocks have names. Ollama, ChromaDB, and the RTX 3060 are architectural inputs. They are not a deployed product, and they do not grant permission to index the entire vault. The public article will move to deployed only when the pipeline, model serving, storage, and interface have all been exercised together.

The eventual interface should make provenance a first-class result. A useful answer would link to the note or notes that support it, show when the index was built, and make it easy to report a mismatch. That is more important than a polished chat shell. It also gives the project a measurable definition of done: a bounded corpus, repeatable retrieval, local serving, safe storage, and a read-only surface that can explain its evidence.

Until then, “architecture in progress” is the accurate result. Naming a library or a hardware target is useful planning context, but it is not a substitute for a tested end-to-end path.

That restraint protects the reader from a common portfolio mistake: mistaking a credible diagram for a working service.

It also keeps expectations clear for anyone who follows the project. The next public update should point to a reproducible local milestone, not merely announce that another component has been selected.

That is the bar for changing the article’s lifecycle badge.

Until then, the honest deliverable is a well-defined architecture and a safe sequence of experiments.
