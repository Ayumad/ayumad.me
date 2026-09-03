---
title: Homelab
slug: homelab
summary: A private Proxmox and ZFS foundation for local AI, storage, media, and experiments.
stage: in-progress
status_note: Private infrastructure · active build
year: 2026
stack: ThinkStation P520, Proxmox VE, ZFS, GPU passthrough, Docker
order: 3
---

## Problem

Local services are most useful when they are available, but experimentation is most useful when it is safe to break things. The homelab is the boundary between those goals: a place to run local AI, storage, media, and small services without coupling every experiment to a daily machine.

## Approach

The foundation is a Lenovo ThinkStation P520 running Proxmox with a ZFS storage pool. A dedicated VM has GPU passthrough configured for local workloads. Core services and experiments are kept conceptually separate so a failed container or driver change has a small blast radius.

## Architecture and workflow

Proxmox provides the host boundary, ZFS provides a durable storage layer, and virtual machines or containers provide workload boundaries. The GPU path is treated as infrastructure, not as an assumption that every service can use it. A change is tested in the smallest relevant guest, documented in a field note, and only then considered for a more permanent service.

This article intentionally omits private network addresses, credentials, service account details, and topology that would make the home installation less safe. The public [P520 GPU passthrough journal](/journal/gpu-passthrough-p520) covers the hardware lesson without turning the site into an operations manual.

## Important decisions

Separating experiments from the host is the key tradeoff. It adds a little management overhead, but it makes recovery and rollback understandable. The second decision is to keep local inference close to the data it serves while treating any future external integration as an explicit boundary.

## Current result

The P520, Proxmox foundation, ZFS pool, and GPU-passthrough VM are working. AI services, NAS refinement, and the broader service layer are still in progress. “Working” here means the infrastructure milestone is complete, not that every planned application has been deployed.

## Lessons

Infrastructure becomes easier to reason about when the host has fewer responsibilities. A homelab is not a list of hardware; it is a set of failure boundaries and recovery habits.

## Next steps

Next steps are service hardening, storage and backup documentation, and carefully staged local AI workloads. Public updates will stay at the architectural level.

## Working detail

The P520 is useful because it is not treated as one giant computer. Proxmox gives the host a narrow responsibility, ZFS makes the storage layer explicit, and guests provide a place to test a driver or service without turning a temporary experiment into a host-wide dependency. GPU passthrough is similarly a boundary: a workload must earn access to the card rather than assuming it is available to every container.

This arrangement changes the debugging question. Instead of asking why the entire homelab is “down,” I can ask whether the host, storage pool, guest, or one service is unhealthy. That makes documentation and recovery more practical. It also makes public writing safer: the architecture and lessons can be shared without publishing a home address, an internal route, or a credential.

The active build is therefore a platform project. The next application may be local AI, media, or storage automation, but each should fit the same failure and privacy boundaries before it becomes a permanent service.

The staged approach also keeps hardware changes legible. A passthrough test can be documented as an infrastructure milestone, while a model server or media service gets its own readiness check. That prevents a successful boot from being mistaken for an operational platform. It is a useful habit for any self-hosted system whose parts evolve at different speeds.

The same principle makes capacity decisions calmer. A future service can be measured against the host and guest boundaries it needs instead of being added because the machine happens to have spare resources. That keeps the lab a dependable platform while it grows.

It also creates a useful record for future articles: the public result can describe a stable boundary, while the private note can retain the operational detail needed to maintain it.

That split makes the lab a good companion to the public P520 journal: enough detail to explain the engineering decision, with the sensitive operational surface kept private.

The platform earns its place in the portfolio through those boundaries and the work they make possible.

As services are added, the same language will make it clear which layer changed and which recovery path still works.
