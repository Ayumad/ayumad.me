import type { NowEntry } from "./siteContent";

export const nowUpdated = "August 7, 2026";

export const nowEntries: NowEntry[] = [
  {
    label: "Refactoring",
    marker: "01",
    title: "My Obsidian Vault",
    description:
      "Audited the whole vault and found the plugin stack missing, 72% of it sitting in archives, and stale skill paths. Now treating the vault itself as a project — plugins restored, wired to a private git repo, recovery zips verified, and the goal is a vault with no archives at all because git history is the backup.",
    detail: "Obsidian · Git · 1,281 notes · self-managing",
  },
  {
    label: "Building",
    marker: "02",
    title: "Hermes Agent",
    description:
      "Running Hermes from a headless Mac mini with 15 cron jobs — morning briefs, interview prep, session journals, question prompts, and a two-way Apple Reminders ↔ Google Tasks sync. Multi-model routing between Mimo V2.5, Kimi K3, and DeepSeek depending on how hard the task is.",
    detail: "Mac mini · Mnemosyne · Tailscale · OpenCode Go",
  },
  {
    label: "Deploying",
    marker: "03",
    title: "RAG Assistant",
    description:
      "Indexing the Obsidian vault so Hermes can answer questions from my own notes. The pipeline is done, deployment is pending. The point: pull context from the vault without exposing the private parts to a model.",
    detail: "Python · RAG · Embeddings · Obsidian",
  },
  {
    label: "Learning",
    marker: "04",
    title: "Custom Linux",
    description:
      "Running Omarchy on the Panasonic Let's Note — an Arch + Hyprland setup I've tuned until it feels right — and using the X220t to learn NixOS rebuilds. Different philosophies, same habit: push the defaults until they break.",
    detail: "Omarchy · Arch · NixOS · Let's Note",
  },
  {
    label: "Tuning",
    marker: "05",
    title: "Two 2.1 Systems",
    description:
      "Speaker placement, crossover, and room correction at my desk and in the living room. Desktop chain: WiiM Ultra → ZA3 → Q150 + SB-1000 Pro. Living room: RX-V677 → Q150 + Kube 12b.",
    detail: "Q150 · SB-1000 Pro · Kube 12b · WiiM",
  },
  {
    label: "Designing",
    marker: "06",
    title: "Ayumad.me",
    description:
      "Turning this site into an accurate index of what I use, what I build, and what I'm learning — gear sourced from the vault loadout, a nightly journal page, and this iteration's vault refactor writeup on the way.",
    detail: "TypeScript · motion · dither · ASCII",
  },
  {
    label: "Researching",
    marker: "07",
    title: "Voice Assistant",
    description:
      "Exploring wake-word detection, local STT with Whisper, and TTS with Piper. The constraint: no cloud APIs for the core loop. Everything local or self-hosted.",
    detail: "Whisper · Piper · Wake word · Local inference",
  },
];
