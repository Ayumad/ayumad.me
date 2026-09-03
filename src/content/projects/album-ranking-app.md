---
title: Album Ranking App
slug: album-ranking-app
summary: A planned social music app for ranking albums, discovering genres, and sharing taste with context.
stage: planned
status_note: Product concept · not started
year: 2026
stack: Product design, Elo ranking, Spotify integration, Web / mobile
order: 1
---

## Problem

Music recommendation tools are good at predicting a next listen, but less good at explaining a person’s taste. I want a space where an album ranking is both a game and a record: the result should show what changed, what the listener compared, and which corners of a genre map remain unexplored.

## Approach

The proposed app would adapt the site’s album-Elo experiments into a standalone social product. A listener could compare albums, build a ranked board, and browse curated genre groupings before seeing recommendations from friends or from adjacent parts of the map. Spotify completion signals could reduce manual logging, while the ranking itself would remain an intentional user action.

## Architecture and workflow

The future workflow has four pieces: an account and library boundary, a comparison and Elo service, a curated genre graph, and a dashboard that explains the ranking. A web-first version could establish the interaction before a mobile client is considered. Spotify integration would require an explicit permission and completion model; it is a proposed dependency, not a current connection.

## Important decisions

The app should optimize for reflection rather than an infinite feed. Curated genre relationships can provide useful structure, but they must be labeled as editorial context instead of objective truth. Social recommendations should be additive and inspectable, and private listening data should not become public by default.

## Current result

This is a planned project. The concept is informed by the music-ranking experiments on the site, but there is no standalone app, backend, account system, Spotify integration, or mobile release today.

## Lessons

A ranking becomes interesting when it preserves the comparison that produced it. The product will need to make that context visible without turning every listening decision into a chore.

## Next steps

The first milestone is a small web prototype for pairwise comparisons and an explainable Elo board. Product scope, privacy boundaries, and the shape of the genre map should be resolved before any integration or social layer is built.

## Working detail

The prototype should make one comparison feel complete. Show two albums, record the choice, update the provisional rating, and explain why the board moved. A small history of those comparisons is more valuable than a large catalog because it gives the listener a way to question the result. Genre groupings can then act as an invitation to explore rather than as a hidden classifier.

The product’s trust boundary needs to be decided early. A Spotify permission could help detect completion, but it should not silently publish a listening history. Social recommendations should be opt-in and attributable, and the app should work for a listener who never connects an external service. These are design constraints for the planned prototype, not current features.

The concept is deliberately smaller than a full streaming service. It does not need to host audio, replace a listener’s library, or solve every recommendation problem. A focused comparison loop, a transparent rating history, and a respectful sharing model would be enough to learn whether the idea helps people articulate taste. If that experiment is useful, the later dashboard and mobile client can be justified by evidence rather than assumed scope.
