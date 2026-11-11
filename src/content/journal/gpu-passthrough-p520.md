---
title: GPU Passthrough on the P520: Passing an RTX 3060 to a Proxmox VM
slug: gpu-passthrough-p520
date: 2026-06-18
summary: How I passed an RTX 3060 through to a Debian VM on Proxmox and where I got stuck.
tags: Proxmox, GPU passthrough, Linux
kind: article
status: published
---

The P520 is a ThinkStation workstation with a Xeon W-2135, 64 GB of ECC RAM, and a ZFS pool, running Proxmox VE. The RTX 3060 12 GB is the best value part I own, with 12 GB of VRAM, CUDA, and a low price, and I needed to pass it through to a VM for local AI.

## The hardware

The card exposes graphics and HDMI/DisplayPort audio functions, and both have to go to the VM. Miss the audio function and you lose display audio, which you don't notice until you plug something into it.

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

On Intel, enabling IOMMU means setting the kernel parameter, updating the boot configuration, and rebooting. Then load the VFIO modules, bind the card to VFIO at boot using the vendor and device IDs, and blacklist nouveau so it doesn't claim the card before the VM can use it.

## The VM

The AI VM is a Debian guest with dedicated memory and CPU cores, backed by the local storage pool. The machine type cost me the most time: `pcie=1` and `x-vga=1` need `q35`, and with the default machine type QEMU exits with an error and the VM won't start.

I tried `qcow2` first, but Proxmox rejected it because LVM thin pools only take raw disks. Use `format=raw` or ZFS/dir storage, use the complete PCI address rather than the shortened address shown in some tools, and keep the guest agent enabled so the host can query the VM after boot.

## Driver install

The Debian install happened through the Proxmox console, followed by the compiler tools, DKMS, kernel headers, non-free repositories, and the NVIDIA driver. After a reboot, `nvidia-smi` showed the real card rather than a fallback device, and a PyTorch check confirmed CUDA was available, a tensor landed on `cuda:0`, and a matrix multiplication completed.

## What I'd do differently

I'd get the host onto the private mesh before starting, since my first setup used a jump host, which worked, but direct access would've made it simpler. I also kept trying to run commands through the Proxmox API, which is for management; use the console or bootstrap through a VM for shell commands.
