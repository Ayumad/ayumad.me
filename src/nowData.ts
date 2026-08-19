import type { NowEntry } from "./siteContent";

export const nowUpdated = "August 19, 2026";

export const nowEntries: NowEntry[] = [
  {
    label: "Refactoring",
    marker: "01",
    title: "My Obsidian Vault",
    description:
      "Cleaning up the vault structure, restoring the plugin stack, and keeping the active knowledge layer separate from historical material.",
    detail: "Obsidian · Git · agent-defined structure",
  },
  {
    label: "Building",
    marker: "02",
    title: "Hermes Agent",
    description:
      "Running Hermes from a headless Mac mini with scheduled briefs, prompts, session notes, and multi-model routing.",
    detail: "Mac mini · Mnemosyne · Tailscale · OpenCode Go",
  },
  {
    label: "Deploying",
    marker: "03",
    title: "RAG Assistant",
    description:
      "Indexing the Obsidian vault so Hermes can answer questions from my own notes without exposing private material.",
    detail: "Python · RAG · Embeddings · Obsidian",
  },
  {
    label: "Learning",
    marker: "04",
    title: "Custom Linux",
    description:
      "Tuning an Arch-based setup for daily use while learning a more declarative approach on a second machine.",
    detail: "Omarchy · Arch · NixOS · Hyprland",
  },
  {
    label: "Tuning",
    marker: "05",
    title: "Two 2.1 Systems",
    description:
      "Working on speaker placement, crossover, and room correction at my desk and in the living room.",
    detail: "Q150 · SB-1000 Pro · Kube 12b · WiiM",
  },
  {
    label: "Designing",
    marker: "06",
    title: "Ayumad.me",
    description:
      "Turning the site into an accurate index of what I use, what I build, and what I am learning.",
    detail: "TypeScript · motion · dither · ASCII",
  },
  {
    label: "Researching",
    marker: "07",
    title: "Voice Assistant",
    description:
      "Exploring wake-word detection, local speech-to-text, and text-to-speech for a future Hermes interface.",
    detail: "Whisper · Piper · wake word · local inference",
  },
];
