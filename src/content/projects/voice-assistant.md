---
title: Voice Assistant
slug: voice-assistant
summary: A planned voice-first interface for Hermes using local or self-hosted speech tools.
stage: planned
status_note: Deferred · hardware dependency
year: 2026
stack: Raspberry Pi, Home Assistant Assist, Wake word, STT, TTS
order: 2
---

## Problem

Hermes is useful when a keyboard or phone is nearby, but some requests are better as a short spoken interaction. A local voice surface could make the agent feel present without sending every room conversation to a hosted assistant.

## Approach

The proposed system would pair a Raspberry Pi with a USB microphone and speaker, use Home Assistant Assist as the device-facing layer, and route a recognized request to Hermes. A wake-word detector, speech-to-text stage, agent call, and text-to-speech response would form the core loop. Local or self-hosted components are preferred so the system can be paused, inspected, and replaced independently.

## Architecture and workflow

The future pipeline is deliberately small: wake word → capture → transcription → Hermes request → response → speech. Home Assistant would provide device orchestration while Hermes remains the reasoning and memory boundary. The first version should be read-only for household actions until the transcription and confirmation behavior are trustworthy. No webhook or production voice endpoint exists today.

## Important decisions

The project is deferred because hardware and environment matter. A microphone, speaker, room placement, wake-word false positives, and dependency support all affect whether the experience is useful. Keeping those constraints explicit is better than presenting a diagram as if it were an installed system.

## Current result

This is a planned and deferred project. The Raspberry Pi/Home Assistant/Hermes direction is documented, but there is no deployed assistant, registered wake-word service, or public demo to operate.

## Lessons

Voice interfaces hide complexity behind a single sentence. A reliable system needs visible state, a clear listening boundary, and a way to recover when the transcript is wrong.

## Next steps

The project can resume once the audio hardware and dependency path are available. The first implementation should measure false activations, transcription quality, latency, and confirmation behavior before adding autonomous home actions.

## Working detail

The first useful experiment would be a single, observable round trip rather than a general-purpose smart speaker. The device should show when it is listening, expose the transcript, and ask for confirmation before a consequential action. Logs can measure wake-word false positives, speech-to-text confidence, end-to-end latency, and whether the spoken response was intelligible in the room.

Keeping Hermes as the reasoning boundary also limits scope. The voice device would capture and speak; it would not become a second memory system or a collection of hidden automations. That separation should make it possible to replace the wake-word, speech, or home-automation layer without rewriting the agent. Until the hardware and dependency path are available, this remains a forward-looking design.

The planned status is therefore useful information, not an apology. It tells a reader that the interaction model is being considered, that hardware and dependency constraints are unresolved, and that no public endpoint should be expected. A small, measured prototype can earn a different status later; the current page should remain a clear statement of intent.

The design can stay intentionally modest until those constraints clear. One room, one wake word, and one read-only request path would be enough to establish whether voice adds value to Hermes before the project expands. That experiment would produce the evidence needed to decide whether the concept belongs in the active portfolio or should remain a note. Until that experiment happens, the article stays deliberately specific about what is proposed and what is absent.
