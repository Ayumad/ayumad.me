import type { NowEntry } from "./siteContent";

export const nowUpdated = "July 29, 2026";

export const nowEntries: NowEntry[] = [
  {
    label: "Building",
    marker: "01",
    title: "A homelab that feels like my own cloud",
    description:
      "Turning a ThinkStation P520 into a quiet, understandable home for local AI, media, storage, and services I can actually own.",
    detail: "Proxmox · ZFS · GPU passthrough · Debian",
  },
  {
    label: "Learning",
    marker: "02",
    title: "How useful local AI becomes personal",
    description:
      "Exploring retrieval, memory, and agent workflows that make models work with the notes and systems I already use.",
    detail: "RAG · local LLMs · Obsidian · Computer Engineering",
  },
  {
    label: "Tuning",
    marker: "03",
    title: "The last ten percent of an audio chain",
    description:
      "Comparing DACs, amplifiers, EQ curves, and room behavior until the small details stop feeling abstract.",
    detail: "EQ · DAC/amps · measurement · listening",
  },
  {
    label: "Designing",
    marker: "04",
    title: "This small corner of the internet",
    description:
      "Shaping Ayumad.me into a public map of projects, systems, notes, and experiments—not a résumé wearing a nicer shirt.",
    detail: "TypeScript · motion · dither · words",
  },
];
