---
title: GPU Passthrough on a Proxmox Server
slug: gpu-passthrough-p520
date: 2026-06-18
summary: The checks that mattered when passing a graphics card through to a Linux virtual machine.
tags: Proxmox, GPU passthrough, Linux
kind: article
status: published
---

GPU passthrough looks like a graphics-driver problem until it suddenly becomes a virtual-machine configuration problem. The reliable path was to verify each layer in order.

## The checklist

| Layer | Question |
| --- | --- |
| Firmware | Is IOMMU enabled? |
| Host | Is the card in a usable IOMMU group? |
| Binding | Did VFIO claim every required function? |
| VM | Is PCIe enabled and is the machine type compatible? |
| Guest | Does the driver see the real hardware? |

The display device and its audio function both need to be considered. Forgetting the second function can produce a system that appears to work until audio or display handoff is tested.

## What cost me time

I tried to fix the guest before proving the host was ready. That led to a lot of reinstalling and very little information. The better sequence is: confirm IOMMU, confirm binding, boot a minimal guest, then install the driver.

The most useful final check was a small compute test inside the guest. It proved that the VM was using the actual card rather than a fallback path.
