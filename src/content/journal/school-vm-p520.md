---
title: A School VM on the P520: Headless Ubuntu for Two Linux Classes
slug: school-vm-p520
date: 2026-09-17
summary: I built a headless Ubuntu VM for two Linux classes on the P520, off by default and one command from a shell.
tags: Proxmox, Ubuntu, homelab
kind: article
status: published
---

Two of my classes this semester require Linux, CMPE 142 for Operating Systems and CMPE 148 for Computer Networks, and both came with the same install instructions. Download VirtualBox, download Ubuntu Desktop, give it 4 CPUs and 4 GB of RAM, allocate at least 25 GB of disk, and work inside that. That works, I just didn't want my coursework living on my laptop.

I have a P520 workstation in the closet running Proxmox with 62 GB of RAM and a ZFS pool, and it's on anyway for the NAS and the AI VM, so the school Linux box went there. It's the same machine from [the GPU passthrough writeup](/journal/gpu-passthrough-p520), minus the GPU, because this one doesn't need it. It cost nothing extra, the workstation was already on.

## What the classes actually need

Both classes are terminal work. CMPE 142's first programming project is the kernel modules chapter from the textbook, where you compile `simple.c` against the running kernel, `insmod` it, check `dmesg`, `rmmod` it, and then build two modules that create `/proc` entries. That needs a real kernel and kernel headers that match it.

CMPE 148's first project is traffic capture, and the assignment lists six tools it expects in the box: `ping`, `traceroute`, `tcpdump`, `netstat`, `curl`, `nslookup`. It asks for captures of DNS, HTTP, HTTPS, and ICMP traffic, with the TCP three-way handshake and the TLS handshake identified. The last part is broken-network traces: high latency, packet loss, and a wrong DNS answer. There's no GUI anywhere in that list, so there's no GUI in the VM.

## What I built

I used the Ubuntu 24.04 cloud image for the Proxmox VM. Cloud images boot through cloud-init, so there's no installer to click through, the machine comes up configured.

| Setting | Value |
| --- | --- |
| OS | Ubuntu 24.04 LTS, cloud image |
| CPU / RAM | 4 vCPU / 6 GB |
| Disk | 40 GB on the ZFS SSD pool |
| Access | SSH keys only, over the tailnet |
| State | Off by default |

I matched the class doc at 4 vCPU, with RAM up to 6 GB and disk to 40 GB because both are cheap here and a ZFS volume can only grow in one direction. The disk stays reserved either way.

It runs headless and idles under 500 MB, but the VM holds 6 GB of RAM when it runs, and I'm not touching it at 3 AM. It's off by default, so it sleeps until I ask:

```text
$ school-vm-up
waiting for school-vm.... up.
Welcome to Ubuntu 24.04.5 LTS (GNU/Linux 6.8.0-139-generic x86_64)
```

It's twenty seconds from cold to a shell. When I'm done, `school-vm-down` hands the RAM back.

<div class="fleet-chart" role="img" aria-label="Bar chart of host RAM actually used: 26 GiB with the AI VM running, 7.9 GiB with both VMs stopped">
  <div class="fleet-row"><span class="fleet-name">Host RAM used, AI VM running</span><span class="fleet-track"><span class="fleet-fill" style="width: 100%"></span></span><span class="fleet-value">26 GiB</span></div>
  <div class="fleet-row"><span class="fleet-name">Host RAM used, both VMs off</span><span class="fleet-track"><span class="fleet-fill" style="width: 30%"></span></span><span class="fleet-value">7.9 GiB</span></div>
</div>

Same machine, measured the same day. The disk stays reserved either way, which is how the ZFS volumes on this box work. The RAM comes back.

## Proving it before trusting it

I didn't want to discover the box couldn't build a kernel module halfway through the project, so I ran the assignments' toolchains first. The module built on the first try, the Ubuntu cloud image ships with kernel headers already installed, so `make` worked with nothing added. `insmod` loaded it, `dmesg` showed the load line, and `rmmod` showed the unload line. There were two warnings about missing prototypes and a tainted-kernel notice from the unsigned module, both normal for out-of-tree modules.

On the network side I checked all six tools, then set up the two-endpoint harness the socket projects will need: a pair of network namespaces with a veth between them. A ping across that link came back in 0.044 ms before I broke it on purpose with `tc netem`. 300 ms of configured latency measured out to 288 ms, and 40% packet loss killed half the pings. When the class asks for a trace of a bad network, I can produce one on demand.

The P520 already runs a nightly `vzdump`, so the new VM was covered the day it was created. I restored one backup into a throwaway VM, booted it, checked the files, and deleted it.

## Things that bit me

- `qemu-guest-agent` installs as a static systemd unit on cloud images, so `systemctl enable --now` prints a warning and does nothing for the next boot. The agent runs until you reboot, then the host's guest tools stop answering, so I pinned it with a symlink.
- `pkill -f "tailscale serve"` killed my own SSH session because the pattern matched the shell running the script. Nothing after that line executed, and the command looked like it succeeded.
- `tailscale serve` needs a one-time toggle in the tailnet admin before it serves anything, and until then it hangs instead of erroring. The first time, I piped its output through `tail` and lost the URL it printed.
- `dmesg` is root-only on Ubuntu now, the textbook says plain `dmesg`.
- The homelab watchdog counted only `.vma.zst` backups, so a fresh uncompressed backup read as 9.9 hours stale. I fixed the file glob.
- The class doc warns that powering the VM off instead of saving machine state loses your work, which is VirtualBox advice. This VM has a real disk, and shutting it down is how it gives the RAM back.

## How I use it

I use `ssh school-vm` from the Macs, or VS Code's remote SSH when I want an editor. On the iPad, code-server runs in the browser with full VS Code and no client install, and it only listens on the tailnet address, so nothing is exposed to the internet. Before each graded project I take a snapshot, so a wrecked VM rolls back instead of getting rebuilt.

A desktop is a one-flag change if a class ever asks for a GUI, and neither of these does. The quizzes that require Respondus LockDown Browser can't run on Linux at all, those stay on the Mac.
