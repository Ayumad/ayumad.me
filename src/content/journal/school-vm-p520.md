---
title: An On-Demand School VM on the P520
slug: school-vm-p520
date: 2026-09-17
summary: Two classes this semester require Linux, and the instructions said VirtualBox on my laptop. I built a headless Ubuntu VM on the workstation instead — off by default, one command to start.
tags: Proxmox, Ubuntu, homelab
kind: article
status: published
---

Two of my classes this semester require Linux. CMPE 142 is Operating Systems, CMPE 148 is Computer Networks, and both came with the same install instructions. Download VirtualBox, download Ubuntu Desktop, give it 4 CPUs and 4 GB of RAM, allocate at least 25 GB of disk, and work inside that.

That works. I just didn't want my coursework living on my laptop.

I have a P520 workstation in the closet running Proxmox with 62 GB of RAM and a ZFS pool. It's on anyway for the NAS and the AI VM, so the school Linux box went there. It's the same machine from [the GPU passthrough writeup](/journal/gpu-passthrough-p520), minus the GPU, because this one doesn't need it.

## What the classes actually need

Both classes are terminal work, which made the decision easy.

CMPE 142's first programming project is the kernel modules chapter from the textbook. You compile `simple.c` against the running kernel, `insmod` it, check `dmesg`, `rmmod` it, and then build two modules that create `/proc` entries. That needs a real kernel and kernel headers that match it.

CMPE 148's first project is traffic capture. The assignment lists the six tools it expects in the box — `ping`, `traceroute`, `tcpdump`, `netstat`, `curl`, `nslookup` — and then asks for captures of DNS, HTTP, HTTPS, and ICMP traffic, with the TCP three-way handshake and the TLS handshake identified. The last part is broken-network traces: high latency, packet loss, and a wrong DNS answer.

There's no GUI anywhere in that list. So there's no GUI in the VM.

## What I built

A Proxmox VM running the Ubuntu 24.04 cloud image, not the Desktop ISO. Cloud images boot through cloud-init, so there's no installer to click through — the machine comes up configured.

| Setting | Value |
| --- | --- |
| OS | Ubuntu 24.04 LTS, cloud image |
| CPU / RAM | 4 vCPU / 6 GB |
| Disk | 40 GB on the ZFS SSD pool |
| Access | SSH keys only, over the tailnet |
| State | Off by default |

I matched the class doc at 4 vCPU. RAM went up to 6 GB and the disk to 40, because both are cheap here and a ZFS volume can only grow in one direction.

It runs headless, which is why it idles under 500 MB. And it's off by default — that took the most back and forth. The VM holds 6 GB of RAM when it runs, and I'm not touching it at 3 AM. So it sleeps until I ask:

```
$ school-vm-up
waiting for school-vm.... up.
Welcome to Ubuntu 24.04.5 LTS (GNU/Linux 6.8.0-139-generic x86_64)
```

Twenty seconds from cold to a shell. When I'm done, `school-vm-down` hands the RAM back.

<div class="fleet-chart" role="img" aria-label="Bar chart of host RAM actually used: 26 GiB with the AI VM running, 7.9 GiB with both VMs stopped">
  <div class="fleet-row"><span class="fleet-name">Host RAM used, AI VM running</span><span class="fleet-track"><span class="fleet-fill" style="width: 100%"></span></span><span class="fleet-value">26 GiB</span></div>
  <div class="fleet-row"><span class="fleet-name">Host RAM used, both VMs off</span><span class="fleet-track"><span class="fleet-fill" style="width: 30%"></span></span><span class="fleet-value">7.9 GiB</span></div>
</div>

Same machine, measured the same day. The disk stays reserved either way — that's how the ZFS volumes on this box work. The RAM comes back.

## Proving it before trusting it

I didn't want to discover the box couldn't build a kernel module halfway through the project, so I ran the assignments' toolchains first.

The module built on the first try. The Ubuntu cloud image ships with kernel headers already installed, which I didn't expect, so `make` worked with nothing added. `insmod` loaded it, `dmesg` showed the load line, `rmmod` showed the unload line. Two warnings about missing prototypes and a tainted-kernel notice from the unsigned module — both normal for out-of-tree modules.

On the network side I checked all six tools, then set up the two-endpoint harness the socket projects will need: a pair of network namespaces with a veth between them. A ping across that link comes back in 0.044 ms. Then I broke it on purpose with `tc netem`. 300 ms of configured latency measured out to 288 ms, and 40% packet loss killed half the pings. When the class asks for a trace of a bad network, I can produce one on demand.

The last thing was the backup. The P520 already runs a nightly `vzdump`, so the new VM was covered the day it was created. But an archive that has never been restored isn't a backup yet, so I restored one into a throwaway VM, booted it, checked the files, and deleted it.

## Things that bit me

- `qemu-guest-agent` installs as a static systemd unit on cloud images, so `systemctl enable --now` prints a warning and does nothing for the next boot. The agent runs fine until you reboot, and then the host's guest tools stop answering. Pinned it with a symlink.
- `pkill -f "tailscale serve"` killed my own SSH session. The pattern matched the shell running the script, so nothing after that line executed and the command looked like it succeeded.
- `tailscale serve` needs a one-time toggle in the tailnet admin before it serves anything, and until then it hangs instead of erroring. The first time, I piped its output through `tail` and lost the URL it printed.
- `dmesg` is root-only on Ubuntu now. The textbook says plain `dmesg`.
- The homelab watchdog counted only `.vma.zst` backups, so a fresh uncompressed backup read as 9.9 hours stale. Fixed the file glob.
- The class doc warns that powering the VM off instead of saving machine state loses your work. That's VirtualBox advice. This VM has a real disk, and shutting it down is exactly how it gives the RAM back.

## How I use it

`ssh school-vm` from the Macs, or VS Code's remote SSH when I want an editor. On the iPad, code-server runs in the browser — full VS Code, no client install, and it only listens on the tailnet address, so nothing is exposed to the internet.

Before each graded project I take a snapshot, so a wrecked VM rolls back instead of getting rebuilt.

## What's next

Not much, which is the point. A desktop is a one-flag change if a class ever asks for a GUI, and neither of these does. The quizzes that require Respondus LockDown Browser can't run on Linux at all — those stay on the Mac. The VM handles the work that needs a compiler.

Cost: nothing extra. The workstation was already on.
