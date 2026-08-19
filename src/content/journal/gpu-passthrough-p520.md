---
title: GPU Passthrough on the P520
slug: gpu-passthrough-p520
date: 2026-06-18
summary: How I got an RTX 3060 passed through to a Proxmox VM — IOMMU groups, kernel parameters, and the mistakes I made along the way.
tags: Proxmox, GPU passthrough, Linux
kind: article
status: published
---

The P520 is a ThinkStation workstation with a Xeon W-2135, 64 GB of ECC RAM, and a ZFS pool, running Proxmox VE. The RTX 3060 12 GB in it is the best value part I own — 12 GB of VRAM, CUDA, and cheap. The whole point of it is local AI, which means the GPU had to get through to a VM.

That took longer than it should have. Most of the time went into things I didn't know to check upfront.

## The hardware

The card exposes both a graphics function and an audio function for HDMI/DisplayPort. Both have to go to the VM. Miss the audio function and you lose display audio, which you don't notice until you plug something into it.

| Component | Spec |
| --- | --- |
| Machine | Lenovo ThinkStation P520 |
| CPU | Xeon W-2135, 6C/12T |
| RAM | 64 GB DDR4 ECC |
| GPU | RTX 3060 12 GB |
| Boot | 512 GB NVMe |
| VM storage | 4 TB SATA SSD thin pool |
| NAS | 3× 4 TB HDD ZFS RAIDZ |
| Host | Proxmox VE |

## Host setup

IOMMU first. On Intel that means enabling the kernel parameter, updating the boot configuration, and rebooting. Then load the VFIO modules and bind the card to VFIO at boot using the vendor and device IDs. Finally, blacklist nouveau so it does not claim the card before the virtual machine can use it.

The order matters. If you skip verifying IOMMU groups after reboot, you'll chase ghosts later.

## The VM

The AI VM is a Debian guest with dedicated memory and CPU cores, backed by the local storage pool. Machine type `q35` is required for PCIe passthrough, and it was the mistake that cost me the most time.

- `q35` is not optional. `pcie=1` and `x-vga=1` need it. With the default machine type, QEMU exits with an error and the VM will not start. It looks like the GPU is the problem when it is actually the machine type.
- LVM thin pools only take raw disks. I tried `qcow2` first; Proxmox rejected it. Use `format=raw` or use ZFS/dir storage.
- Use the complete PCI address rather than the shortened address shown in some tools. The VM configuration is picky.
- Keep the guest agent enabled so the host can query the VM after boot.

## Driver install

The Debian install happened through the Proxmox console, followed by the compiler tools, DKMS, kernel headers, non-free repositories, and the NVIDIA driver. After a reboot, `nvidia-smi` showed the real card rather than a fallback device.

A PyTorch check confirmed it was actual hardware: CUDA was available, a tensor landed on `cuda:0`, and a matrix multiplication completed. If the driver reports the card's memory and serial information, the passthrough is real.

## What I'd do differently

Get the host onto the private mesh before starting. My first setup used a jump host, which worked, but direct access would have made the whole thing simpler.

Also, the Proxmox API is for management, not arbitrary shell execution. I kept trying to run commands through it. Use the console or bootstrap through a VM instead.
