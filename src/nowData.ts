import type { NowEntry } from "./siteContent";

export const nowUpdated = "July 29, 2026";

export const nowEntries: NowEntry[] = [
  {
    label: "Building",
    marker: "01",
    title: "Homelab",
    description:
      "Turning a ThinkStation P520 into a home for local AI, media, storage, and services.",
    detail: "Proxmox · ZFS · GPU passthrough · Debian",
  },
  {
    label: "Learning",
    marker: "02",
    title: "Local AI",
    description:
      "Exploring retrieval, memory, and agent workflows using my own notes and systems.",
    detail: "RAG · local LLMs · Obsidian · Computer Engineering",
  },
  {
    label: "Tuning",
    marker: "03",
    title: "Audio Chain",
    description:
      "Comparing DACs, amplifiers, EQ curves, and room behavior.",
    detail: "EQ · DAC/amps · measurement · listening",
  },
  {
    label: "Designing",
    marker: "04",
    title: "Ayumad.me",
    description:
      "Building this site as a visual index of projects, systems, notes, and experiments.",
    detail: "TypeScript · motion · dither · ASCII",
  },
];
